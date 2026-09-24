"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebaseClient.js';
import { GameLogic } from '../../../../utils/GameLogic';
import { pickWord, DEFAULT_DIFFICULTY } from '../../../../utils/CategoryWords';
import { STAGES, isLeader, rememberSeat } from '../../../../utils/RoomLogic';
import { teamColor } from '../../../../components/hud/teamColors';
import PlayerFrame from '../../../../components/play/PlayerFrame';
import PlayerStage from '../../../../components/play/PlayerStage';

const MAX_USED_WORDS = 400;
const DEFAULT_ROUND_TIME = 45;

// Cuenta atrás local. El reloj lo lleva el host, pero el móvil no necesita
// sincronizarse con él para enseñar los segundos: arranca cuando ve entrar la
// fase, y el final autorizado sigue siendo el cambio de fase que escribe el
// host. Así no hay desfases de reloj entre dispositivos que arreglar.
function useCountdownFrom(active, from) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!active) {
      setValue(from);
      return undefined;
    }
    let remaining = from;
    setValue(remaining);
    const id = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      setValue(remaining);
      if (remaining === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [active, from]);

  return value;
}

// El móvil solo trae los datos y ejecuta las acciones; la pantalla entera vive
// en PlayerStage, que es puro y se puede revisar en /play-lab.
export default function PlayPage({ params }) {
  // Compatibilidad futura: unwrap params si es un Promise.
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const { room_id, team_id } = resolvedParams;
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [busy, setBusy] = useState(false);
  // Palabras vistas en este turno, en orden. Solo la toca el móvil del turno,
  // que es el único que puede cambiarla, así que no hace falta guardarla en
  // Firestore: es historial de navegación, no estado de la partida.
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!room_id) return undefined;
    const unsubState = onSnapshot(doc(db, 'game_state', room_id), (snap) => {
      setGameState(snap.exists() ? snap.data() : null);
    });
    const unsubRoom = onSnapshot(doc(db, 'rooms', room_id), (snap) => {
      const data = snap.data();
      setTeams(Array.isArray(data?.teams) ? data.teams : []);
      setRoom(data || null);
    });
    return () => {
      unsubState();
      unsubRoom();
    };
  }, [room_id]);

  // Si la sala vuelve a la configuración —«nueva partida»— este teléfono vuelve
  // a ser el mando de la sala, no el de la partida.
  const stage = room?.stage;
  useEffect(() => {
    if (stage && stage !== STAGES.PLAYING && room?.code) {
      // Se vuelve al mismo equipo con el que se estaba jugando, pase lo que
      // pase con lo que hubiera guardado el navegador.
      rememberSeat(room_id, team_id);
      router.replace(`/join/${room.code}`);
    }
  }, [stage, room?.code, room_id, team_id, router]);

  const word = gameState?.current_word;

  // Una palabra que no está en el historial es una palabra de otro turno: el
  // historial empieza de cero con ella.
  useEffect(() => {
    if (!word) return;
    setHistory((previous) => (previous.includes(word) ? previous : [word]));
  }, [word]);

  const phase = gameState?.current_phase;
  const roundTime = typeof room?.round_time === 'number' ? room.round_time : DEFAULT_ROUND_TIME;
  // La dificultad la manda la sala, que es de donde la leen el host y el resto
  // de repartos. `game_state` solo guarda la copia del momento de empezar: si
  // las dos se desincronizaran, este móvil repartiría palabras de una
  // dificultad distinta a la del resto de la partida.
  const difficulty = room?.difficulty || gameState?.difficulty || DEFAULT_DIFFICULTY;

  const myIndex = teams.findIndex((t) => t.id === team_id);
  const turnIndex = teams.findIndex((t) => t.id === gameState?.current_turn_team);
  const winnerIndex = teams.findIndex((t) => t.id === gameState?.winner_team);

  const cursor = history.indexOf(word);

  const preCount = useCountdownFrom(phase === 'timer_starts', 3);
  const roundLeft = useCountdownFrom(phase === 'timer_running', roundTime);

  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  // Deslizar la carta: a la derecha reparte, a la izquierda deshace.
  const slide = (direction) =>
    run(async () => {
      if (!gameState?.current_category) return;
      const stateRef = doc(db, 'game_state', room_id);

      if (direction === 'prev') {
        if (cursor <= 0) return;
        await updateDoc(stateRef, { current_word: history[cursor - 1] });
        return;
      }

      // Si se había vuelto atrás, «siguiente» recupera lo que ya había delante
      // en vez de sortear otra palabra.
      if (cursor >= 0 && cursor < history.length - 1) {
        await updateDoc(stateRef, { current_word: history[cursor + 1] });
        return;
      }

      const used = Array.isArray(gameState.used_words) ? gameState.used_words : [];
      const next = pickWord(gameState.current_category, difficulty, used);
      if (!next || next === word) return;
      setHistory((previous) => [...previous, next]);
      await updateDoc(stateRef, {
        current_word: next,
        used_words: [...used, next].slice(-MAX_USED_WORDS),
      });
    });

  // Al lanzar se borra el valor anterior: así el dado del móvil sabe que tiene
  // que seguir girando hasta que el host publique el nuevo.
  const throwDice = () =>
    run(() =>
      updateDoc(doc(db, 'game_state', room_id), {
        current_phase: 'dice_rolling',
        dice_value: null,
      }),
    );

  return (
    <PlayerFrame
      myTeam={myIndex >= 0 ? teams[myIndex] : null}
      myColor={teamColor(Math.max(0, myIndex))}
      turnColor={gameState ? teamColor(Math.max(0, turnIndex)) : '#23222b'}
    >
      <PlayerStage
        phase={room_id && team_id && gameState ? phase : null}
        word={word}
        categoryKey={gameState?.current_category}
        diceValue={gameState?.dice_value}
        activeTeam={turnIndex >= 0 ? teams[turnIndex] : null}
        turnColor={teamColor(Math.max(0, turnIndex))}
        isMyTurn={Boolean(gameState) && gameState.current_turn_team === team_id}
        allPlay={Boolean(gameState?.all_play)}
        busy={busy}
        canGoBack={cursor > 0}
        seconds={phase === 'timer_stopped' ? 0 : roundLeft}
        duration={roundTime}
        preCount={preCount}
        winner={winnerIndex >= 0 ? teams[winnerIndex] : null}
        winnerColor={teamColor(Math.max(0, winnerIndex))}
        place={(gameState?.ranking || []).indexOf(team_id) + 1}
        isLeader={isLeader(teams, team_id)}
        onNewGame={() => run(() => GameLogic.backToSetup(room_id))}
        onSlide={slide}
        onStart={() => run(() => GameLogic.startRound(room_id, team_id))}
        onSuccess={() => run(() => GameLogic.success(room_id))}
        onFail={() => run(() => GameLogic.fail(room_id))}
        onThrow={throwDice}
      />
    </PlayerFrame>
  );
}
