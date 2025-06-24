"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/supabaseClient';

const ICONS = [
  '/player-icons/bird2.png',
  '/player-icons/cat2.png',
  '/player-icons/crab2.png',
  '/player-icons/deer2.png',
  '/player-icons/dolphin2.png',
  '/player-icons/dragon2.png',
  '/player-icons/elephant2.png',
  '/player-icons/fish2.png',
  '/player-icons/monkey2.png',
  '/player-icons/otter2.png',
  '/player-icons/shrimp2.png',
  '/player-icons/space-cat2.png',
  '/player-icons/squid2.png',
  '/player-icons/unicorn2.png',
];

function getRandomIcon(currentIcon?: string) {
  let filtered = ICONS;
  if (currentIcon) filtered = ICONS.filter(i => i !== currentIcon);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Definir un tipo Team mínimo para tipar correctamente
interface Team {
  id: string;
  name: string;
  icon_url?: string;
  members?: string[] | string;
  position?: number;
}

export default function JoinPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [icon, setIcon] = useState(() => getRandomIcon());
  const [teamName, setTeamName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!id || id.length !== 6) {
      router.replace('/');
    }
  }, [id, router]);

  const handleAddMember = () => {
    const name = memberInput.trim();
    if (name && !members.includes(name)) {
      setMembers([...members, name]);
      setMemberInput('');
    }
  };

  const handleMemberInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleMemberInputBlur = () => {
    handleAddMember();
  };

  const handleRemoveMember = (name: string) => {
    setMembers(members.filter(m => m !== name));
  };

  const handleConfirm = async () => {
    if (!teamName.trim()) {
      setError('Introduce un nombre de equipo.');
      return;
    }
    if (members.length === 0) {
      setError('Introduce al menos un miembro.');
      return;
    }
    setError('');
    // Buscar la sala por código para obtener el room_id (uuid)
    const { data: room, error: roomError } = await supabase.from('rooms').select('id').eq('code', id).single();
    if (roomError || !room) {
      setError('No se ha encontrado la sala.');
      return;
    }
    // Insertar el equipo en la tabla teams
    const { data: inserted, error: teamError } = await supabase.from('teams').insert([
      {
        room_id: room.id,
        name: teamName,
        icon_url: icon,
        position: 0,
      }
    ]).select();
    if (teamError || !inserted || !inserted[0]) {
      setError('Error al registrar el equipo.');
      return;
    }
    // Guardar el id del equipo en localStorage y en estado para esta ventana
    localStorage.setItem(`team_id_${room.id}`, inserted[0].id);
    setTeamId(inserted[0].id);
    // Lanzar evento realtime team_join
    await supabase.channel(`room-${room.id}`)
      .send({ type: 'broadcast', event: 'team_join', payload: { team: teamName } });
    setConfirmed(true);
  };

  React.useEffect(() => {
    let roomUuid: string | null = null;
    let channel: any = null;
    let mounted = true;
    async function subscribeMatchStarts() {
      const { data: room } = await supabase.from('rooms').select('id').eq('code', id).single();
      if (!room) return;
      roomUuid = room.id;
      channel = supabase
        .channel(`room-${roomUuid}`)
        .on('broadcast', { event: 'match_starts' }, async () => {
          // Prioriza el teamId de esta ventana, si existe
          const myTeamId = teamId || localStorage.getItem(`team_id_${roomUuid}`);
          if (myTeamId) {
            router.push(`/play/${roomUuid}/${myTeamId}`);
          }
        })
        .subscribe();
    }
    subscribeMatchStarts();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [id, router, teamId]);

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-8 flex flex-col items-center w-full max-w-md">
          <div className="text-2xl font-bold mb-4 text-center text-green-700 dark:text-green-400">Todo preparado, esperando que comience la partida</div>
          <div className="mb-6 flex flex-col items-center">
            <div className="rounded-full border-4 border-blue-400 bg-white dark:bg-neutral-900 flex items-center justify-center mb-2" style={{ width: 112, height: 112, padding: 8 }}>
              <Image src={icon} alt="icono equipo" width={96} height={96} className="object-contain" />
            </div>
            <div className="font-bold text-xl mb-1">{teamName}</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {members.map(name => (
                <span key={name} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-8 flex flex-col items-center w-full max-w-md">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="rounded-full border-4 border-blue-400 bg-white dark:bg-neutral-900 flex items-center justify-center" style={{ width: 112, height: 112, padding: 8 }}>
            <Image src={icon} alt="icono equipo" width={96} height={96} className="object-contain" />
          </div>
          <button
            className="absolute bottom-0 right-0 bg-white dark:bg-neutral-800 rounded-full p-2 shadow hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-300 dark:border-neutral-700"
            onClick={() => setIcon(getRandomIcon(icon))}
            type="button"
            aria-label="Cambiar icono"
          >
            {/* Icono de reiniciar */}
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-3.6-7.2" />
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
            </svg>
          </button>
        </div>
        <div className="w-full mb-4">
          <label className="block font-medium mb-1">Nombre del equipo</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="Introduce el nombre del equipo"
            maxLength={32}
          />
        </div>
        <div className="w-full mb-4">
          <label className="block font-medium mb-1">Miembros</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={memberInput}
              onChange={e => setMemberInput(e.target.value)}
              onKeyDown={handleMemberInputKeyDown}
              onBlur={handleMemberInputBlur}
              placeholder="Añade un miembro y pulsa +"
              maxLength={24}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
              type="button"
              onClick={handleAddMember}
              aria-label="Añadir miembro"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {members.map(name => (
              <span key={name} className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
                {name}
                <button
                  className="ml-1 text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveMember(name)}
                  type="button"
                  aria-label="Eliminar miembro"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-lg mt-4"
          onClick={handleConfirm}
          type="button"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
