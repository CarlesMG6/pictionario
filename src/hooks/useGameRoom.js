"use client";

import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseClient.js';
import { buildBoard } from '../game/board';

// Suscribe la pantalla del host a la sala y al estado de la partida.
// Además del estado reactivo devuelve `boardRef`, pensado para leer el tablero
// desde secuencias asíncronas (la tirada de dado) sin arrastrar closures viejas.
export function useGameRoom(room_id) {
  const [gameState, setGameState] = useState(null);
  const [teams, setTeams] = useState([]);
  const [board, setBoard] = useState([]);
  const [roomConfig, setRoomConfig] = useState(null);
  const boardRef = useRef([]);

  useEffect(() => {
    if (!room_id) return;

    const unsubState = onSnapshot(doc(db, 'game_state', room_id), (snap) => {
      setGameState(snap.exists() ? snap.data() : null);
    });

    const unsubRoom = onSnapshot(doc(db, 'rooms', room_id), (snap) => {
      const data = snap.data();
      if (data?.categories && data?.duration) {
        const boardArr = buildBoard(data.categories, data.duration);
        setBoard(boardArr);
        boardRef.current = boardArr;
      }
      setTeams(Array.isArray(data?.teams) ? data.teams : []);
      setRoomConfig(data);
    });

    return () => {
      unsubState();
      unsubRoom();
    };
  }, [room_id]);

  // Al terminar la partida la sala deja de estar "jugando" para que el host
  // pueda volver a configurarla.
  const phase = gameState?.current_phase;
  useEffect(() => {
    if (phase === 'end' && room_id) {
      updateDoc(doc(db, 'rooms', room_id), { playing: false });
    }
  }, [phase, room_id]);

  return { gameState, teams, board, boardRef, roomConfig };
}
