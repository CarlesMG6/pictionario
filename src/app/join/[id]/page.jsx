"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseClient.js';
import { GameLogic } from '../../../utils/GameLogic';
import {
  STAGES,
  configOf,
  findRoomByCode,
  forgetSeat,
  isLeader,
  joinSeat,
  pickAnimal,
  recallSeat,
  rememberSeat,
  setStage,
  updateConfig,
  updateSeat,
} from '../../../utils/RoomLogic';
import PhoneLobbyScreen from '../../../components/lobby/PhoneLobbyScreen';
import NoticeScreen, { NoticeButton } from '../../../components/ui/NoticeScreen';
import TeamAvatar from '../../../components/play/TeamAvatar';
import { teamColor } from '../../../components/hud/teamColors';

// El móvil. Entrar ya no es rellenar un formulario: se coge hueco al abrir el
// QR y a partir de ahí esta página es el mando de la sala —los controles solo
// los monta P1— hasta que la partida empieza y se pasa el testigo a /play.

export default function JoinPage({ params }) {
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  return <JoinClient code={resolvedParams.id} />;
}

function JoinClient({ code }) {
  const router = useRouter();
  const [roomUuid, setRoomUuid] = useState(null);
  const [room, setRoom] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [status, setStatus] = useState('entrando');
  const [busy, setBusy] = useState(false);
  const [pickTeamId, setPickTeamId] = useState(null);

  // Coger hueco es la única acción que no puede repetirse: en desarrollo React
  // monta los efectos dos veces, y sin esta promesa compartida la segunda
  // pasada dejaría un equipo fantasma en la sala.
  const bootstrap = useRef(null);

  useEffect(() => {
    if (!code || code.length !== 6) {
      router.replace('/');
      return undefined;
    }

    if (!bootstrap.current) bootstrap.current = enterRoom(code);
    let unsub = null;
    let alive = true;

    bootstrap.current.then((entry) => {
      if (!alive) return;
      if (!entry) {
        setStatus('sin-sala');
        return;
      }
      setRoomUuid(entry.roomId);
      setTeamId(entry.teamId);
      setStatus(entry.status);
      unsub = onSnapshot(doc(db, 'rooms', entry.roomId), (snap) => {
        if (snap.exists()) setRoom(snap.data());
      });
    });

    return () => {
      alive = false;
      if (unsub) unsub();
    };
  }, [code, router]);

  const teams = Array.isArray(room?.teams) ? room.teams : [];
  const stage = room?.stage || (room?.playing ? STAGES.PLAYING : STAGES.LOBBY);
  const myIndex = teams.findIndex((team) => team.id === teamId);
  const me = myIndex >= 0 ? teams[myIndex] : null;

  // Cuando la partida arranca, el móvil deja de ser el mando de la sala.
  useEffect(() => {
    if (stage === STAGES.PLAYING && roomUuid && teamId && myIndex >= 0) {
      router.replace(`/play/${roomUuid}/${teamId}`);
    }
  }, [stage, roomUuid, teamId, myIndex, router]);

  const run = (action) => async () => {
    if (busy || !roomUuid) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  if (status === 'sin-sala') {
    return <Notice title="No hay ninguna sala con ese código" action="Volver" onAction={() => router.replace('/')} />;
  }

  if (status === 'llena') {
    return <Notice title="La sala está llena" caption="Caben ocho equipos" action="Volver" onAction={() => router.replace('/')} />;
  }

  if (!room || status === 'entrando') {
    return <Notice title="Entrando en la sala…" />;
  }

  // Llegar con la partida ya empezada: no hay hueco nuevo que coger, se elige
  // a qué equipo de los que juegan pertenece este teléfono.
  if (stage === STAGES.PLAYING && !me) {
    return (
      <TeamPicker
        teams={teams}
        selected={pickTeamId}
        onSelect={setPickTeamId}
        onConfirm={() => {
          if (!pickTeamId) return;
          rememberSeat(roomUuid, pickTeamId);
          router.replace(`/play/${roomUuid}/${pickTeamId}`);
        }}
      />
    );
  }

  // El hueco ha desaparecido de la sala mientras se esperaba.
  if (!me) {
    return (
      <Notice
        title="Te has quedado fuera de la sala"
        action="Entrar otra vez"
        onAction={async () => {
          forgetSeat(roomUuid);
          const seat = await joinSeat(roomUuid);
          if (seat) {
            rememberSeat(roomUuid, seat);
            setTeamId(seat);
          }
        }}
      />
    );
  }

  return (
    <PhoneLobbyScreen
      stage={stage}
      teams={teams}
      me={me}
      myIndex={myIndex}
      isLeader={isLeader(teams, teamId)}
      config={configOf(room)}
      busy={busy}
      onContinue={run(() => setStage(roomUuid, STAGES.SETUP))}
      // Cada toque se guarda en el momento: es lo que convierte la pantalla
      // grande en un espejo de lo que P1 está haciendo con el dedo.
      onConfig={(patch) => updateConfig(roomUuid, patch)}
      onToRoster={run(() => setStage(roomUuid, STAGES.ROSTER))}
      onPick={(choice) => pickAnimal(roomUuid, teamId, choice.icon, choice.label)}
      onName={(name) => updateSeat(roomUuid, teamId, { name })}
      onReady={(ready) => updateSeat(roomUuid, teamId, { ready })}
      onStart={run(() => GameLogic.startGame(roomUuid))}
    />
  );
}

// Buscar la sala, recuperar el hueco de este teléfono si ya tenía uno y, si no,
// coger uno nuevo. `?nuevo` fuerza hueco nuevo, que es la única forma de tener
// dos equipos en el mismo navegador al probar.
async function enterRoom(code) {
  const found = await findRoomByCode(code);
  if (!found) return null;

  const teams = Array.isArray(found.data.teams) ? found.data.teams : [];
  const stage = found.data.stage || (found.data.playing ? STAGES.PLAYING : STAGES.LOBBY);
  const fresh = typeof window !== 'undefined' && window.location.search.includes('nuevo');

  const remembered = fresh ? null : recallSeat(found.id);
  if (remembered && teams.some((team) => team.id === remembered)) {
    return { roomId: found.id, teamId: remembered, status: 'dentro' };
  }

  if (stage === STAGES.PLAYING) {
    return { roomId: found.id, teamId: null, status: 'dentro' };
  }

  const seat = await joinSeat(found.id);
  if (!seat) return { roomId: found.id, teamId: null, status: 'llena' };
  rememberSeat(found.id, seat);
  return { roomId: found.id, teamId: seat, status: 'dentro' };
}

// Los avisos de la sala comparten pantalla con el 404 y con el error: es la
// misma situación desde el punto de vista de quien mira el móvil.
function Notice({ title, caption, action, onAction }) {
  return (
    <NoticeScreen title={title} caption={caption}>
      {action && (
        <NoticeButton primary onClick={onAction}>
          {action}
        </NoticeButton>
      )}
    </NoticeScreen>
  );
}

function TeamPicker({ teams, selected, onSelect, onConfirm }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4 p-6"
      style={{ background: 'linear-gradient(180deg, #6fcdf2 0%, #a6e1f7 46%, #cdeeff 74%)' }}
    >
      <div className="gp-panel flex w-full max-w-sm flex-col gap-4 p-5">
        <div className="gp-label text-center text-lg">¿Qué equipo eres?</div>

        <div className="flex flex-col gap-2.5">
          {teams.map((team, index) => (
            <button
              key={team.id}
              type="button"
              onClick={() => onSelect(team.id)}
              className="flex items-center gap-3 rounded-lg border-[3px] px-3 py-2"
              style={{
                borderColor: selected === team.id ? 'var(--w-ink)' : 'rgba(35,34,43,0.22)',
                background: selected === team.id ? '#fff6df' : '#fff',
              }}
            >
              <TeamAvatar team={team} color={teamColor(index)} size={38} />
              <span className="gp-label flex-1 truncate text-left text-[0.95rem]">{team.name}</span>
            </button>
          ))}
        </div>

        {selected && (
          <button
            type="button"
            onClick={onConfirm}
            className="gp-button w-full py-3.5"
            style={{ background: 'var(--w-gold)', color: 'var(--w-ink)' }}
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}
