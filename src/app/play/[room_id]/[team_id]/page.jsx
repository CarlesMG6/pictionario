"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient.js';
import { GameLogic } from '../../../../utils/GameLogic';
import Image from 'next/image';

export default function PlayPage({ params }) {
  // Compatibilidad futura: unwrap params si es un Promise
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const { room_id, team_id } = resolvedParams;
  const [teams, setTeams] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWord, setShowWord] = useState(false);
  const [showStartRound, setShowStartRound] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Función para cargar el estado de la partida y equipos
  const fetchGameState = async () => {
    if (!room_id) return;
    setLoading(true);
    const { data: state } = await supabase.from('game_state').select('*').eq('room_id', room_id).single();
    setGameState(state);
    const { data: teamList } = await supabase.from('teams').select('*').eq('room_id', room_id);
    setTeams(teamList || []);
    setLoading(false);
  };

  const handleSuccess = async () => {
    if (!room_id) return;
    setIsProcessing(true);
    await supabase.channel(`room-${room_id}`)
      .send({ type: 'broadcast', event: 'stop_timer', payload: { result: 'success', team_id } });
    await GameLogic.success(room_id);
    // Recuperar el nuevo estado y actualizar gameState
    const { data: state } = await supabase.from('game_state').select('*').eq('room_id', room_id).single();
    setGameState(state);
    setIsProcessing(false);
  };
  const handleFail = async () => {
    if (!room_id) return;
    setIsProcessing(true);
    await supabase.channel(`room-${room_id}`)
      .send({ type: 'broadcast', event: 'stop_timer', payload: { result: 'fail', team_id } });
    await GameLogic.fail(room_id);
    // Recuperar el nuevo estado y actualizar gameState
    const { data: state } = await supabase.from('game_state').select('*').eq('room_id', room_id).single();
    setGameState(state);
    setIsProcessing(false);
  };

  useEffect(() => {
    fetchGameState();
    const channel = supabase
      .channel(`room-${room_id}`)
      .on('broadcast', { event: 'update_match' }, async () => {
        console.log('Recibiendo evento update_match');
        setShowWord(false);
        setShowStartRound(false);
        setIsProcessing(false);
        await fetchGameState();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line
  }, [room_id]);

  // Esperar a que los params estén listos
  if (!room_id || !team_id) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (loading || !gameState) {
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

  if (gameState.current_phase === 'play') {
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
            {/* Icono de ojo */}
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
              await supabase.channel(`room-${room_id}`)
                .send({ type: 'broadcast', event: 'start_timer', payload: { team_id } });
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

  if (gameState.current_phase === 'dice') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">Tirar el dado</h1>
        {isMyTurn ? (
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg"
            onClick={async () => {
              setIsProcessing(true);
              console.log('Tirando el dado...');
              await supabase.channel(`room-${room_id}`)
                .send({ type: 'broadcast', event: 'roll_dice', payload: { team_id } });
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

  const renderTeams = () => {
    return (
      <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
        {teams.map(team => {
          const isTurn = gameState.current_turn_team === team.id;
          const isWinner = gameState.winning_team === team.id;
          return (
            <div
              key={team.id}
              className={`border-l-4 pl-4 py-2 ${isTurn ? 'border-blue-500' : 'border-transparent'} ${isWinner ? 'bg-green-50' : ''}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">{team.name}</span>
                {isWinner && <span className="text-sm text-green-700 font-medium">¡Ganador!</span>}
              </div>
              <div className="flex gap-2 mt-1">
                <div className="text-sm text-gray-500">
                  {isTurn ? 'Tu turno' : 'Turno de otro equipo'}
                </div>
                {gameState.current_phase === 'dice' && (
                  <div className="text-sm font-medium">
                    {team.id === gameState.dice_result?.team_id ? `Resultado: ${gameState.dice_result.value}` : 'Esperando dado...'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Sala: {room_id}</h1>
      {isMyTurn ? (
        <div className="text-2xl text-green-700 font-semibold">¡Es tu turno!</div>
      ) : (
        <div className="text-2xl text-blue-700 font-semibold">
          Es turno de: {currentTeam ? (
            <span className="inline-flex items-center gap-2">
              {currentTeam.icon_url && (
                <Image src={currentTeam.icon_url} alt="icono" className="inline w-8 h-8 rounded-full border" width={32} height={32} />
              )}
              <span>{currentTeam.name}</span>
            </span>
          ) : 'otro equipo'}
        </div>
      )}
      {renderTeams()}
    </div>
  );
}
