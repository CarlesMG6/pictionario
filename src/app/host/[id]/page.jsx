"use client";

import { db } from '../../../firebaseClient.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy, arrayUnion } from 'firebase/firestore';
import { CATEGORY_WORDS } from '../../../utils/CategoryWords';

function HostClient({ id }) {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [duration, setDuration] = useState('media');
  const [roundTime, setRoundTime] = useState('45');
  const [categories, setCategories] = useState({
    all: true,
    person: true,
    object: true,
    action: true,
    difficulty: false,
    movies: false,
  });

  useEffect(() => {
    if (!id || id.length !== 6) {
      router.replace('/');
      return;
    }
    let unsubRoom = null;
    async function fetchRoomAndTeams() {
      // Buscar la sala por código (campo 'code')
      const roomsQuery = query(collection(db, 'rooms'), where('code', '==', id));
      const roomsSnap = await getDocs(roomsQuery);
      if (roomsSnap.empty) return;
      const roomDoc = roomsSnap.docs[0];
      const roomUuid = roomDoc.id;
      // Suscribirse al documento de la sala
      unsubRoom = onSnapshot(doc(db, 'rooms', roomUuid), (roomSnap) => {
        const data = roomSnap.data();
        setTeams(Array.isArray(data?.teams) ? data.teams : []);
      });
    }
    fetchRoomAndTeams();
    return () => {
      if (unsubRoom) unsubRoom();
    };
  }, [id, router]);

  const handleCategoryToggle = (key) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartGame = async () => {
    // Buscar la sala por código (campo 'code')
    const roomsQuery = query(collection(db, 'rooms'), where('code', '==', id));
    const roomsSnap = await getDocs(roomsQuery);
    if (roomsSnap.empty) return;
    const roomDoc = roomsSnap.docs[0];
    const room_id = roomDoc.id;
    // Cuando se use selectedCategories, filtrar solo por claves válidas:
    const validCategoryKeys = Object.keys(CATEGORY_WORDS);
    const selectedCategories = Object.keys(categories).filter((key) => categories[key] && validCategoryKeys.includes(key));
    await updateDoc(doc(db, 'rooms', room_id), {
      duration,
      round_time: parseInt(roundTime, 10),
      categories: selectedCategories,
      playing: true
    });
    // Obtener equipos desde el array de la sala
    const roomSnap = await getDoc(doc(db, 'rooms', room_id));
    const roomData = roomSnap.data();
    const teamList = Array.isArray(roomData?.teams) ? roomData.teams : [];
    let firstTeamId = null;
    if (teamList && teamList.length > 0) {
      const randomIdx = Math.floor(Math.random() * teamList.length);
      firstTeamId = teamList[randomIdx].id;
    }
    // Generar categoría y palabra inicial
    let initialCategory = "all";
    if (selectedCategories.length > 0) {
      initialCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
    }
    function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    const initialWord = getRandomElement(CATEGORY_WORDS[initialCategory] || CATEGORY_WORDS['all']);
    // Crear estado de juego
    await setDoc(doc(db, 'game_state', room_id), {
      room_id,
      current_turn_team: firstTeamId,
      current_phase: 'play',
      current_word: initialWord,
      current_category: initialCategory,
      dice_value: null,
      is_active: true
    });
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
                  {team.members ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">{Array.isArray(team.members) ? team.members.join(', ') : team.members}</div>
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
                onChange={e => setDuration(e.target.value)}
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
                onChange={e => setRoundTime(e.target.value)}
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
                {Object.keys(CATEGORY_WORDS).map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!categories[key]}
                      onChange={() => handleCategoryToggle(key)}
                    />
                    <span>{key}</span>
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

export default function Page({ params }) {
  return <HostClient id={params.id} />;
}
