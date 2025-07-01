"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '../../../firebaseClient.js';
import { collection, addDoc, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy, arrayUnion } from 'firebase/firestore';

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

function getRandomIcon(currentIcon) {
  let filtered = ICONS;
  if (currentIcon) filtered = ICONS.filter(i => i !== currentIcon);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function JoinPage({ params }) {
  const id = params.id;
  const router = useRouter();
  const [icon, setIcon] = useState(() => getRandomIcon());
  const [teamName, setTeamName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [teamId, setTeamId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [roomUuid, setRoomUuid] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [expelled, setExpelled] = useState(false);

  useEffect(() => {
    if (!id || id.length !== 6) {
      router.replace('/');
      return;
    }
    let unsubRoom = null;
    async function fetchRoomAndSubscribe() {
      // Buscar la sala por código (campo 'code')
      const roomsQuery = query(collection(db, 'rooms'), where('code', '==', id));
      const roomsSnap = await getDocs(roomsQuery);
      if (roomsSnap.empty) return;
      const roomDoc = roomsSnap.docs[0];
      const roomUuid = roomDoc.id;
      setRoomUuid(roomUuid);
      // Suscribirse al documento de la sala
      unsubRoom = onSnapshot(doc(db, 'rooms', roomUuid), (roomSnap) => {
        const data = roomSnap.data();
        setTeams(Array.isArray(data?.teams) ? data.teams : []);
        // Si playing es true y el equipo ya está confirmado, redirigir
        if (data?.playing && confirmed && teamId) {
          router.replace(`/play/${roomUuid}/${teamId}`);
        }
        // Si el equipo actual no está en la lista, ha sido expulsado
        if (confirmed && teamId && (!data?.teams || !data.teams.some(t => t.id === teamId))) {
          setExpelled(true);
          setTimeout(() => {
            router.replace('/');
          }, 2000);
        }
      });
    }
    fetchRoomAndSubscribe();
    return () => {
      if (unsubRoom) unsubRoom();
    };
  }, [id, router, confirmed, teamId]);

  const handleAddMember = () => {
    const name = memberInput.trim();
    if (name && !members.includes(name)) {
      setMembers([...members, name]);
      setMemberInput('');
    }
  };

  const handleMemberInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleMemberInputBlur = () => {
    handleAddMember();
  };

  const handleRemoveMember = (name) => {
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
    const roomsQuery = query(collection(db, 'rooms'), where('code', '==', id));
    const roomsSnap = await getDocs(roomsQuery);
    if (roomsSnap.empty) {
      setError('No se ha encontrado la sala.');
      return;
    }
    const roomDoc = roomsSnap.docs[0];
    const roomId = roomDoc.id;
    // Crear el equipo como objeto
    const newTeam = {
      name: teamName,
      icon_url: icon,
      position: 0,
      members: members,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    };
    try {
      // Añadir el equipo al array 'teams' del documento de la sala
      await updateDoc(doc(db, 'rooms', roomId), {
        teams: arrayUnion(newTeam)
      });
      // Guardar el id del equipo en localStorage y en estado para esta ventana
      localStorage.setItem(`team_id_${roomId}`, newTeam.id);
      setTeamId(newTeam.id);
      setConfirmed(true);
    } catch (e) {
      setError('Error al registrar el equipo.');
      return;
    }
  };

  // Editar equipo tras confirmar
  const handleEdit = () => {
    setEditMode(true);
  };

  // Guardar cambios de edición
  const handleUpdate = async () => {
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
    const roomsQuery = query(collection(db, 'rooms'), where('code', '==', id));
    const roomsSnap = await getDocs(roomsQuery);
    if (roomsSnap.empty) {
      setError('No se ha encontrado la sala.');
      return;
    }
    const roomDoc = roomsSnap.docs[0];
    const roomId = roomDoc.id;
    // Actualizar el equipo en el array de teams
    const roomSnap = await getDoc(doc(db, 'rooms', roomId));
    const data = roomSnap.data();
    const teamsArr = Array.isArray(data?.teams) ? data.teams : [];
    const updatedTeams = teamsArr.map(t => t.id === teamId ? { ...t, name: teamName, icon_url: icon, members } : t);
    await updateDoc(doc(db, 'rooms', roomId), { teams: updatedTeams });
    setEditMode(false);
  };

  if (expelled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-8 flex flex-col items-center w-full max-w-md">
          <div className="text-2xl font-bold mb-4 text-center text-red-700 dark:text-red-400">Has sido expulsado de la sala.</div>
        </div>
      </div>
    );
  }

  if (confirmed && !editMode) {
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
          <button
            className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
            onClick={handleEdit}
            type="button"
          >
            Editar datos
          </button>
        </div>
      </div>
    );
  }

  // Si está en modo edición tras confirmar
  if (confirmed && editMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow p-8 flex flex-col items-center w-full max-w-md">
          <div className="text-2xl font-bold mb-4 text-center text-blue-700 dark:text-blue-400">Edita los datos del equipo</div>
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
            onClick={handleUpdate}
            type="button"
          >
            Confirmar cambios
          </button>
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

export default JoinPage;
