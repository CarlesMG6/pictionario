"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/supabaseClient';

const CATEGORIES = [
  { key: 'all', label: 'Todos Juegan' },
  { key: 'object', label: 'Objeto' },
  { key: 'person', label: 'Persona animal o lugar' },
  { key: 'action', label: 'Acción' },
  { key: 'movies', label: 'Películas o series' },
];

interface Team {
  id: string;
  name: string;
  icon_url?: string;
  participants?: string[] | string;
}

export default function ClientHostPage({ id }: { id: string }) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [duration, setDuration] = useState<'corta' | 'media' | 'larga'>('media');
  const [roundTime, setRoundTime] = useState<string>('45');
  const [categories, setCategories] = useState<Record<string, boolean>>({
    all: true,
    object: true,
    person: true,
    action: true,
    movies: false,
  });

  useEffect(() => {
    if (!id || id.length !== 6) {
      router.replace('/');
      return;
    }
    let roomUuid: string | null = null;
    let channel: any = null;
    async function fetchRoomAndTeams() {
      const { data: room } = await supabase.from('rooms').select('id').eq('code', id).single();
      if (!room) return;
      roomUuid = room.id;
      const { data: teamList } = await supabase.from('teams').select('*').eq('room_id', roomUuid).order('position');
      setTeams(teamList || []);
      if (!channel) {
        channel = supabase
          .channel(`room-${roomUuid}`)
          .on('broadcast', { event: 'team_join' }, async () => {
            const { data: updatedTeams } = await supabase.from('teams').select('*').eq('room_id', roomUuid).order('position');
            setTeams(updatedTeams || []);
          })
          .subscribe();
      }
    }
    fetchRoomAndTeams();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [id, router]);

  const handleCategoryToggle = (key: string) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartGame = async () => {
    const { data: room, error: roomError } = await supabase.from('rooms').select('id').eq('code', id).single();
    if (roomError || !room) return;
    const room_id = room.id;
    const selectedCategories = Object.keys(categories).filter(key => categories[key]);
    await supabase.from('rooms').update({
      duration,
      round_time: parseInt(roundTime, 10),
      categories: selectedCategories
    }).eq('id', room_id);
    const { data: teamList } = await supabase.from('teams').select('id').eq('room_id', room_id).order('position');
    let firstTeamId = null;
    if (teamList && teamList.length > 0) {
      const randomIdx = Math.floor(Math.random() * teamList.length);
      firstTeamId = teamList[randomIdx].id;
    }
    await supabase.from('game_state').insert([
      {
        room_id,
        current_turn_team: firstTeamId,
        current_phase: 'play',
        current_word: null,
        dice_value: null,
        is_active: true
      }
    ]);
    await supabase.channel(`room-${room_id}`)
      .send({ type: 'broadcast', event: 'match_starts', payload: {} });
    router.push(`/host_play/${room_id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-7xl font-extrabold mb-4 text-center">{id}</h1>
      <p className="text-xl text-center mb-10">
        Accede a <span className="font-bold">pictionario.com</span> e introduce este código
      </p>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        {/* Columna equipos */}
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-lg shadow p-6 flex flex-col min-w-[260px]">
          <h2 className="text-2xl font-semibold mb-4">Equipos</h2>
          <div className="flex flex-col gap-4 mb-6">
            {teams.map((team, idx) => (
              <div key={team.id || team.name || idx} className="flex items-start gap-3 p-3 rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                <Image src={team.icon_url || '/vercel.svg'} alt="icono equipo" width={32} height={32} className="mt-1" />
                <div>
                  <div className="font-bold text-lg">{team.name}</div>
                  {team.participants ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">{Array.isArray(team.participants) ? team.participants.join(', ') : team.participants}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-lg" onClick={handleStartGame}>
            Empezar partida
          </button>
        </div>
        {/* Columna configuración */}
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-lg shadow p-6 min-w-[260px]">
          <h2 className="text-2xl font-semibold mb-4">Configuración</h2>
          <form className="flex flex-col gap-6">
            <div>
              <label className="block font-medium mb-1">Duración de la partida</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={duration}
                onChange={e => setDuration(e.target.value as any)}
              >
                <option value="corta">Corta</option>
                <option value="media">Media</option>
                <option value="larga">Larga</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Tiempo por ronda (segundos)</label>
              <input
                type="number"
                min={0}
                max={120}
                className="w-full border rounded px-3 py-2"
                value={roundTime}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "") {
                    setRoundTime("");
                  } else {
                    let num = parseInt(val, 10);
                    if (isNaN(num)) num = 0;
                    if (num < 0) num = 0;
                    if (num > 120) num = 120;
                    setRoundTime(num.toString());
                  }
                }}
                onBlur={() => {
                  if (roundTime === "" || isNaN(Number(roundTime))) {
                    setRoundTime("45");
                  }
                }}
                placeholder="45"
              />
            </div>
            <div>
              <label className="block font-medium mb-2">Categorías habilitadas</label>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map(cat => (
                  <label key={cat.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!categories[cat.key]}
                      onChange={() => handleCategoryToggle(cat.key)}
                    />
                    <span>{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}