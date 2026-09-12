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

  // Arranque: fija el tiempo y pasa la partida a 'timer_running'.
  useEffect(() => {
    if (phase === 'timer_starts' && !running) {
      setTimer(duration);
      setRunning(true);
      lastBeepRef.current = null;
      updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_running' });
    }
  }, [phase, duration]);

  // Cuenta atrás previa (3, 2, 1).
  useEffect(() => {
    if (phase === 'timer_starts') {
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(3);
      clearInterval(countdownRef.current);
    }
    return () => clearInterval(countdownRef.current);
  }, [phase]);

  // Tic de la ronda.
  useEffect(() => {
    if (phase === 'timer_running' && running && timer !== null && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_stopped' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase, running, timer]);

  // Fuera de las fases de temporizador, parar.
  useEffect(() => {
    if (!TIMER_PHASES.includes(phase)) {
      clearInterval(intervalRef.current);
      setRunning(false);
    }
  }, [phase]);

  return { timer, countdown, duration, visible: TIMER_PHASES.includes(phase) };
}
