"use client";

import React, { useEffect, useState } from 'react';
import { db } from '../../../../firebaseClient.js';
import { GameLogic } from '../../../../utils/GameLogic';
import { doc, onSnapshot } from 'firebase/firestore';
import { CATEGORY_WORDS } from '../../../../utils/CategoryWords';
import { updateDoc } from 'firebase/firestore';
import { FaArrowsRotate } from "react-icons/fa6";

export default function PlayPage({ params }) {
  // Compatibilidad futura: unwrap params si es un Promise
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const { room_id, team_id } = resolvedParams;
  const [teams, setTeams] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [showWord, setShowWord] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuccess = async () => {
    if (!room_id) return;
    setIsProcessing(true);
    console.log('/play -> Acierto en la ronda');
    await GameLogic.success(room_id);
    setShowStartRound(false);
    setShowWord(false);
    setIsProcessing(false);
  };
  const handleFail = async () => {
    if (!room_id) return;
    setIsProcessing(true);
    console.log('/play -> Fallo en la ronda');
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

  // Lógica de UI según current_phase
  if (gameState.current_phase === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <h1 className="text-6xl font-extrabold text-primary">Pictionario</h1>
      </div>
    );
  }

  if (gameState.current_phase === 'dice') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        {isMyTurn ? (
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-xl text-2xl font-bold shadow-lg"
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
          <div className="text-xl text-muted-foreground">Esperando a que el equipo tire el dado...</div>
        )}
      </div>
    );
  }

  // Si NO es mi turno y estamos en play/timer_starts/timer_running/timer_stopped: solo palabra y ojo
  if (!isMyTurn && ["play", "timer_starts", "timer_running", "timer_stopped"].includes(gameState.current_phase)) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen p-8 max-w-sm m-auto">
        <WordWithEye showWord={showWord} setShowWord={setShowWord} isProcessing={isProcessing} gameState={gameState} isMyTurn={isMyTurn} currentTeam={currentTeam} />
      </div>
    );
  }

  // Es mi turno y fase = play: palabra+ojo+empezar ronda + regenerar palabra
  if (isMyTurn && gameState.current_phase === 'play') {
    // Botón para regenerar palabra
    const handleRegenerateWord = async () => {
      if (!gameState.current_category) return;
      const words = CATEGORY_WORDS[gameState.current_category] || CATEGORY_WORDS['all'] || [];
      // Evitar la palabra actual
      const filtered = words.filter(w => w !== gameState.current_word);
      const newWord = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : gameState.current_word;
      await updateDoc(doc(db, 'game_state', room_id), { current_word: newWord });
    };
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 max-w-sm m-auto">
        <WordWithEye showWord={showWord} setShowWord={setShowWord} isProcessing={isProcessing} gameState={gameState} isMyTurn={isMyTurn} currentTeam={currentTeam} />
        <div className="flex gap-4 mt-6 w-full">
          <button
            className="px-6 py-3 bg-card rounded-lg text-lg font-bold hover:bg-card-hover"
            onClick={handleRegenerateWord}
            disabled={isProcessing}
          >
            <FaArrowsRotate />
          </button>
          <button
            className="flex-1 px-6 py-3 bg-primary text-background rounded-lg text-lg font-bold hover:bg-primary-hover"
            onClick={async () => {
              setIsProcessing(true);
              await GameLogic.startRound(room_id, team_id);
              setIsProcessing(false);
            }}
            disabled={isProcessing}
          >
            Empezar
          </button>
        </div>
      </div>
    );
  }

  // Es mi turno y fase = timer_starts o timer_running: palabra+ojo+parar temporizador
  if (isMyTurn && ["timer_starts", "timer_running"].includes(gameState.current_phase)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 max-w-sm m-auto">
        <WordWithEye showWord={showWord} setShowWord={setShowWord} isProcessing={isProcessing} gameState={gameState} isMyTurn={isMyTurn} currentTeam={currentTeam} />
        <div className="flex gap-4 mt-6 w-full">
          <button
          className="w-full mt-6 px-6 py-3 bg-red-600 text-white rounded-lg text-lg font-bold hover:bg-red-700"
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
      </div>
    );
  }

  // Es mi turno y fase = timer_stopped: palabra+ojo+acierto/fallo
  if (isMyTurn && gameState.current_phase === 'timer_stopped') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 max-w-sm m-auto">
        <WordWithEye showWord={showWord} setShowWord={setShowWord} isProcessing={isProcessing} gameState={gameState} isMyTurn={isMyTurn} currentTeam={currentTeam} />
        <div className="flex gap-4 mt-6 w-full">
          <button
            className=" flex-1 bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-red-700"
            onClick={handleFail}
            disabled={isProcessing}
          >
            ❌ Fallo
          </button>
          <button
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-green-700"
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
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="mb-1 text-base text-gray-600 font-medium w-full">
        {isMyTurn
          ? <>¡Es tu turno! {gameState.all_play ? <span className="ml-2 text-green-600 font-bold">¡pero juegan todos los equipos!</span> : null}</>
          : currentTeam
            ? <>Es turno de <span className="font-bold text-blue-700">{currentTeam.name}</span>{gameState.all_play ? <span className="ml-2 text-green-600 font-bold">¡pero juegan todos los equipos!</span> : null}</>
            : 'Es turno de otro equipo'}
      </div>
      <div className="flex flex-row gap-8 items-center w-full">
        <div className="border border-border rounded-lg p-8 bg-card shadow text-2xl min-w-[220px] min-h-[80px] flex items-center justify-center flex-1">
          {showWord
            ? (gameState.current_word ? <span className="text-foreground">{gameState.current_word}</span> : <span className="italic text-muted-foreground">(Sin palabra)</span>)
            : <span className="italic text-muted-foreground">Palabra oculta</span>}
        </div>
        <button
          className="ml-4 p-2 bg-primary/10 rounded-full border border-border hover:bg-primary/20"
          onClick={() => setShowWord((v) => !v)}
          aria-label={showWord ? 'Ocultar palabra' : 'Mostrar palabra'}
          disabled={isProcessing}
        >
          {showWord ? (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path className='stroke-primary stroke-2' d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3" className='stroke-primary stroke-2'/></svg>
          ) : (
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path className='stroke-primary stroke-2' d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z"/><circle cx="12" cy="12" r="3" className='stroke-primary fill-primary stroke-2'/></svg>
          )}
        </button>
      </div>
    </div>
  );
}
