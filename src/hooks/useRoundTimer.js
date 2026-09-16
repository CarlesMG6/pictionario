"use client";

import { useEffect, useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseClient.js';

const DEFAULT_ROUND_TIME = 45;
const BEEP_AT = [5];

export const TIMER_PHASES = ['timer_starts', 'timer_running', 'timer_stopped'];

// Cuenta atrás de la ronda, con sus avisos sonoros y las transiciones de fase
// que dispara en Firestore: timer_starts -> timer_running -> timer_stopped.
export function useRoundTimer(room_id, phase, roundTime) {
  const [timer, setTimer] = useState(null);
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const intervalRef = useRef();
  // Espejo del temporizador para el tic: el descuento no puede vivir dentro del
  // actualizador de estado, que React invoca dos veces en desarrollo.
  const timerValueRef = useRef(null);
  const countdownRef = useRef();
  const lastBeepRef = useRef(null);
  const beepRef = useRef(null);
  const alarmRef = useRef(null);

  const duration = typeof roundTime === 'number' ? roundTime : DEFAULT_ROUND_TIME;

  // Un único Audio por sonido: antes se instanciaban en cada render.
  useEffect(() => {
    beepRef.current = new Audio('/Audio/timer-ticks.mp3');
    alarmRef.current = new Audio('/Audio/timer-alarm.mp3');
  }, []);

  function play(audio) {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  // Avisos sonoros.
  useEffect(() => {
    if (phase !== 'timer_running' || timer === null) return;
    if (BEEP_AT.includes(timer) && lastBeepRef.current !== timer) {
      lastBeepRef.current = timer;
      play(beepRef.current);
    }
    if (timer === 0) play(alarmRef.current);
  }, [timer, phase]);

  // Cuenta atrás previa (3, 2, 1) y arranque de la ronda. Van juntas a
  // propósito: antes el arranque escribía 'timer_running' en Firestore en
  // cuanto entraba la fase, así que el 3-2-1 no llegaba a verse nunca. Ahora la
  // partida no avanza hasta que la cuenta llega a cero.
  //
  // El contador va en una variable local y no en el actualizador de estado
  // porque dentro del actualizador no puede haber efectos: React lo invoca dos
  // veces en desarrollo y se escribiría el cambio de fase por duplicado.
  useEffect(() => {
    if (phase !== 'timer_starts') {
      setCountdown(3);
      clearInterval(countdownRef.current);
      return undefined;
    }

    let remaining = 3;
    setCountdown(remaining);
    setTimer(duration);
    timerValueRef.current = duration;
    lastBeepRef.current = null;

    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        setRunning(true);
        updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_running' });
      }
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [phase, duration, room_id]);

  // Tic de la ronda.
  useEffect(() => {
    if (phase !== 'timer_running' || !running) return () => clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const next = Math.max(0, (timerValueRef.current ?? duration) - 1);
      timerValueRef.current = next;
      setTimer(next);
      if (next === 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_stopped' });
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [phase, running, duration, room_id]);

  // Fuera de las fases de temporizador, parar.
  useEffect(() => {
    if (!TIMER_PHASES.includes(phase)) {
      clearInterval(intervalRef.current);
      setRunning(false);
    }
  }, [phase]);

  return { timer, countdown, duration, visible: TIMER_PHASES.includes(phase) };
}
