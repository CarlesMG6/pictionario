"use client";

import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseClient.js';
import { pickWord, DEFAULT_DIFFICULTY } from '../utils/CategoryWords';
import { GameLogic } from '../utils/GameLogic';

export const ROLL_ANIMATION_MS = 2200;
const RESULT_HOLD_MS = 3000;
const MOVE_DELAY_MS = 1000;

const MAX_USED_WORDS = 400;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const rememberWord = (used, word) => {
  if (!word) return Array.isArray(used) ? used : [];
  const next = [...(Array.isArray(used) ? used : []), word];
  return next.length > MAX_USED_WORDS ? next.slice(-MAX_USED_WORDS) : next;
};

// Orquesta la fase 'dice_rolling': tira el dado, mantiene el modal mientras dura
// la animación, mueve la ficha y deja la partida en 'play' con palabra nueva.
export function useDiceRoll(room_id, phase, boardRef) {
  const [value, setValue] = useState(null);
  const [rolling, setRolling] = useState(false);

  // Una sola tirada por entrada en la fase: sin esto, cualquier re-render (o el
  // doble montaje de StrictMode) dispararía una segunda.
  const handledRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (phase !== 'dice_rolling' || !room_id) {
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      const roomRef = doc(db, 'rooms', room_id);
      const stateRef = doc(db, 'game_state', room_id);

      const roomSnap = await getDoc(roomRef);
      const teams = Array.isArray(roomSnap.data()?.teams) ? [...roomSnap.data().teams] : [];
      const difficulty = roomSnap.data()?.difficulty || DEFAULT_DIFFICULTY;
      const stateSnap = await getDoc(stateRef);
      const usedWords = stateSnap.data()?.used_words;
      const teamId = stateSnap.data()?.current_turn_team;
      const teamIndex = teams.findIndex((t) => t.id === teamId);
      if (teamIndex === -1) {
        console.error('[useDiceRoll] Equipo del turno no encontrado en la sala:', teamId);
        return;
      }

      const rolled = GameLogic.rollDice();
      if (mountedRef.current) {
        setValue(rolled);
        setRolling(true);
      }

      // El resultado se publica nada más salir: el móvil que ha lanzado tiene
      // el dado dando vueltas y lo necesita para pararlo sobre la misma cara
      // que la pantalla grande. El resto del turno se escribe al final.
      await updateDoc(stateRef, { dice_value: rolled });

      await wait(ROLL_ANIMATION_MS + RESULT_HOLD_MS);
      if (mountedRef.current) setRolling(false);
      await wait(MOVE_DELAY_MS);

      const newPosition = GameLogic.calculateTeamPosition(
        teams[teamIndex].position,
        rolled,
        boardRef.current.length,
      );
      teams[teamIndex] = { ...teams[teamIndex], position: newPosition };
      await updateDoc(roomRef, { teams });

      const category = boardRef.current[newPosition];
      const word = pickWord(category, difficulty, usedWords);
      const allPlay = GameLogic.shouldAllPlay(category);

      await updateDoc(stateRef, {
        current_phase: 'play',
        current_category: category,
        current_word: word,
        dice_value: rolled,
        all_play: allPlay,
        used_words: rememberWord(usedWords, word),
      });
    })();
  }, [phase, room_id, boardRef]);

  return { value, rolling };
}
