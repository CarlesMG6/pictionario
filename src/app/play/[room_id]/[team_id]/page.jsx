"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../../../firebaseClient.js';
import { GameLogic } from '../../../../utils/GameLogic';
import Image from 'next/image';
import { doc, onSnapshot } from 'firebase/firestore';

export default function PlayPage({ params }) {
  // Compatibilidad futura: unwrap params si es un Promise
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const { room_id, team_id } = resolvedParams;
  const [teams, setTeams] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [showWord, setShowWord] = useState(false);
  const [showStartRound, setShowStartRound] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuccess = async () => {
    if (!room_id) return;
    setIsProcessing(true);
    await GameLogic.success(room_id);
    setShowStartRound(false);
    setShowWord(false);
    setIsProcessing(false);
  };
  const handleFail = async () => {
    if (!room_id) return;
    setIsProcessing(true);
    console.log('Fallo en la ronda');
    await GameLogic.fail(room_id);
    setShowStartRound(false);
    setShowWord(false);
    setIsProcessing(false);
  };

  useEffect(() => {
    if (!room_id) return;
    // Suscripción a game_state
    const unsubState = onSnapshot(doc(db, 'game_state', room_id), (docSnap) => {
      setGameState(docSnap.exists() ? docSnap.data() : null);
    });
    // Suscripción a equipos embebidos en la sala
    const unsubRoom = onSnapshot(doc(db, 'rooms', room_id), (docSnap) => {
      const data = docSnap.data();
      setTeams(Array.isArray(data?.teams) ? data.teams : []);
    });
    return () => {
      unsubState();
      unsubRoom();
    };
  }, [room_id]);

  // Esperar a que los params estén listos
  if (!room_id || !team_id) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!gameState) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!gameState.is_active) {
    return <div className="flex items-center justify-center min-h-screen">La partida ha terminado.</div>;
  }

  const currentTeam = teams.find(t => t.id === gameState.current_turn_team);
  const isMyTurn = gameState.current_turn_team == team_id;
  const isAllPlay = gameState.is_all_play;

  // Lógica de UI según current_phase
  if (gameState.current_phase === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-6xl font-extrabold text-blue-700">Pictionario</h1>
      </div>
    );
  }
/*
  if ((gameState.current_phase === 'timer_starts' || gameState.current_phase === 'timer_running') && isMyTurn) {
    // Solo el equipo al que le toca ve el botón de parar temporizador
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">¡Ronda en marcha!</h1>
        <button
          className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg text-lg font-bold hover:bg-red-700"
          onClick={async () => {
            setIsProcessing(true);
            await import('firebase/firestore').then(({ updateDoc, doc }) =>
              updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_stopped' })
            );
            setIsProcessing(false);
          }}
          disabled={isProcessing}
        >
          Parar temporizador
        </button>
      </div>
    );
  }
*/
  /*if (gameState.current_phase === 'play' || gameState.current_phase === 'timer_stopped') {
    const canControl = isMyTurn || isAllPlay;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="flex flex-row gap-8 items-center">
          <div className="border rounded-lg p-8 bg-white shadow text-2xl min-w-[220px] min-h-[80px] flex items-center justify-center">
            {showWord
              ? (gameState.current_word ? gameState.current_word : <span className="italic text-gray-400">(Sin palabra)</span>)
              : <span className="italic text-gray-400">Palabra oculta</span>}
          </div>
          <button
            className="ml-4 p-2 bg-blue-100 rounded-full border hover:bg-blue-200"
            onClick={() => {
              if (!showWord) setShowWord(true);
              else setShowWord(false);
              setShowStartRound(showWord);
            }}
            aria-label="Mostrar/Ocultar palabra"
            disabled={isProcessing}
          >
            {showWord ? (
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
            ) : (
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="2" fill="#2563eb"/></svg>
            )}
          </button>
        </div>
        {canControl && showStartRound && (
          <button
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700"
            onClick={async () => {
              setIsProcessing(true);
              await GameLogic.startRound(room_id, team_id);
              setIsProcessing(false);
            }}
            disabled={isProcessing}
          >
            Empezar ronda
          </button>
        )}
        {canControl && showStartRound && (
          <div className="flex gap-6 mt-8">
            <button
              className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-red-700"
              onClick={handleFail}
              disabled={isProcessing}
            >
              ❌ Fallo
            </button>
            <button
              className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-green-700"
              onClick={handleSuccess}
              disabled={isProcessing}
            >
              ✅ Acierto
            </button>
          </div>
        )}
      </div>
    );
  }
  */

  if (gameState.current_phase === 'dice') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">Tirar el dado</h1>
        {isMyTurn ? (
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg"
            onClick={async () => {
              setIsProcessing(true);
              // Cambiar la fase a 'dice_rolling' en game_state
              await import('firebase/firestore').then(({ updateDoc, doc }) =>
                updateDoc(doc(db, 'game_state', room_id), { current_phase: 'dice_rolling' })
              );
              setIsProcessing(false);
            }}
            disabled={isProcessing}
          >
            🎲 Tirar dado
          </button>
        ) : (
          <div className="text-xl text-gray-700">Esperando a que el equipo tire el dado...</div>
        )}
      </div>
    );
  }

  // Si NO es mi turno y estamos en play/timer_starts/timer_running/timer_stopped: solo palabra y ojo
  if (!isMyTurn && ["play", "timer_starts", "timer_running", "timer_stopped"].includes(gameState.current_phase)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <WordWithEye showWord={showWord} setShowWord={setShowWord} isProcessing={isProcessing} gameState={gameState} isMyTurn={isMyTurn} currentTeam={currentTeam} />
      </div>
    );
  }

  // Es mi turno y fase = play: palabra+ojo+empezar ronda
  if (isMyTurn && gameState.current_phase === 'play') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <WordWithEye showWord={showWord} setShowWord={setShowWord} isProcessing={isProcessing} gameState={gameState} isMyTurn={isMyTurn} currentTeam={currentTeam} />
        <button
          className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700"
          onClick={async () => {
            setIsProcessing(true);
            await GameLogic.startRound(room_id, team_id);
            setIsProcessing(false);
          }}
          disabled={isProcessing}
        >
          Empezar ronda
        </button>
      </div>
    );
  }

  // Es mi turno y fase = timer_starts o timer_running: palabra+ojo+parar temporizador
  if (isMyTurn && ["timer_starts", "timer_running"].includes(gameState.current_phase)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <WordWithEye showWord={showWord} setShowWord={setShowWord} isProcessing={isProcessing} gameState={gameState} isMyTurn={isMyTurn} currentTeam={currentTeam} />
        <button
          className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg text-lg font-bold hover:bg-red-700"
          onClick={async () => {
            setIsProcessing(true);
            await import('firebase/firestore').then(({ updateDoc, doc }) =>
              updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_stopped' })
            );
            setIsProcessing(false);
          }}
          disabled={isProcessing}
        >
          Parar temporizador
        </button>
      </div>
    );
  }

  // Es mi turno y fase = timer_stopped: palabra+ojo+acierto/fallo
  if (isMyTurn && gameState.current_phase === 'timer_stopped') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <WordWithEye showWord={showWord} setShowWord={setShowWord} isProcessing={isProcessing} gameState={gameState} isMyTurn={isMyTurn} currentTeam={currentTeam} />
        <div className="flex gap-6 mt-8">
          <button
            className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-red-700"
            onClick={handleFail}
            disabled={isProcessing}
          >
            ❌ Fallo
          </button>
          <button
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-green-700"
            onClick={handleSuccess}
            disabled={isProcessing}
          >
            ✅ Acierto
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Componente para mostrar la palabra y el botón de ojo
function WordWithEye({ showWord, setShowWord, isProcessing, gameState, isMyTurn, currentTeam }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="mb-1 text-base text-gray-600 font-medium w-full">
        {isMyTurn
          ? <>¡Es tu turno! {gameState.all_play ? <span className="ml-2 text-green-600 font-bold">¡pero juegan todos los equipos!</span> : null}</>
          : currentTeam
            ? <>Es turno de <span className="font-bold text-blue-700">{currentTeam.name}</span>{gameState.all_play ? <span className="ml-2 text-green-600 font-bold">¡pero juegan todos los equipos!</span> : null}</>
            : 'Es turno de otro equipo'}
      </div>
      <div className="flex flex-row gap-8 items-center">
        <div className="border rounded-lg p-8 bg-white shadow text-2xl min-w-[220px] min-h-[80px] flex items-center justify-center">
          {showWord
            ? (gameState.current_word ? <span className="text-gray-800">{gameState.current_word}</span> : <span className="italic text-gray-800">(Sin palabra)</span>)
            : <span className="italic text-gray-500">Palabra oculta</span>}
        </div>
        <button
          className="ml-4 p-2 bg-blue-100 rounded-full border hover:bg-blue-200"
          onClick={() => setShowWord((v) => !v)}
          aria-label={showWord ? 'Ocultar palabra' : 'Mostrar palabra'}
          disabled={isProcessing}
        >
          {showWord ? (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="2"/></svg>
          ) : (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3" stroke="#2563eb" strokeWidth="2" fill="#2563eb"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}
