"use client";


import { db } from '../../../firebaseClient.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { CATEGORY_WORDS, CATEGORIES } from '../../../utils/CategoryWords';
import { useRef } from 'react';
import { IoQrCode } from "react-icons/io5";

// QR code generation (simple, no external dependency)
function QRCode({ url, size = 128 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!url || !ref.current) return;
    import('qrcode').then(QR => {
      QR.toCanvas(ref.current, url, { width: size, margin: 1, color: { dark: '#000', light: '#fff' } });
    });
  }, [url, size]);
  return <canvas ref={ref} width={size} height={size} style={{ background: '#fff', borderRadius: 4, boxShadow: '0 2px 8px #0001' }} />;
}


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
  const [startAttempted, setStartAttempted] = useState(false);
  const [startError, setStartError] = useState("");

  // Cargar datos de configuración y equipos al entrar (si existen en BBDD)
  useEffect(() => {
    if (!id || id.length !== 6) {
      router.replace('/');
      return;
    }
    let unsubRoom = null;
    let unsubGameState = null;
    async function fetchRoomAndConfig() {
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
        // Si hay configuración previa, cargarla
        if (data?.duration) setDuration(data.duration);
        if (typeof data?.round_time === 'number' || typeof data?.round_time === 'string') setRoundTime(String(data.round_time));
        if (Array.isArray(data?.categories)) {
          // Convertir array de categorías a objeto para los checkboxes
          const catObj = {};
          Object.keys(CATEGORY_WORDS).forEach(key => { catObj[key] = data.categories.includes(key); });
          setCategories(catObj);
        }
      });
      // Suscribirse a game_state para cargar la última configuración si existe
      unsubGameState = onSnapshot(doc(db, 'game_state', roomUuid), (gameSnap) => {
        const g = gameSnap.data();
        if (g) {
          // Si hay duración/categorías en game_state, usarlas como fallback
          if (g.duration) setDuration(g.duration);
          if (g.round_time) setRoundTime(String(g.round_time));
          if (g.categories && Array.isArray(g.categories)) {
            const catObj = {};
            Object.keys(CATEGORY_WORDS).forEach(key => { catObj[key] = g.categories.includes(key); });
            setCategories(catObj);
          }
        }
      });
    }
    fetchRoomAndConfig();
    return () => {
      if (unsubRoom) unsubRoom();
      if (unsubGameState) unsubGameState();
    };
  }, [id, router]);

  // Nuevo efecto: si hay error de equipos y ya hay 2 o más, limpiar error
  useEffect(() => {
    if (startAttempted && startError && teams.length >= 2) {
      setStartError("");
    }
  }, [teams, startAttempted, startError]);

  const handleCategoryToggle = (key) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartGame = async () => {
    setStartAttempted(true);
    if (teams.length < 2) {
      setStartError("Deben haber al menos 2 equipos para empezar la partida.");
      return;
    } else {
      setStartError("");
    }
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
    let teamList = Array.isArray(roomData?.teams) ? roomData.teams : [];
    // Fijar position: 0 a todos los equipos
    teamList = teamList.map(t => ({ ...t, position: 0 }));
    await updateDoc(doc(db, 'rooms', room_id), { teams: teamList });
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

  // Eliminar equipo
  const handleRemoveTeam = async (teamId) => {
    // Buscar la sala por código (campo 'code')
    const roomsQuery = query(collection(db, 'rooms'), where('code', '==', id));
    const roomsSnap = await getDocs(roomsQuery);
    if (roomsSnap.empty) return;
    const roomDoc = roomsSnap.docs[0];
    const roomUuid = roomDoc.id;
    // Obtener equipos actuales
    const roomSnap = await getDoc(doc(db, 'rooms', roomUuid));
    const data = roomSnap.data();
    const newTeams = (Array.isArray(data?.teams) ? data.teams : []).filter(t => t.id !== teamId);
    await updateDoc(doc(db, 'rooms', roomUuid), { teams: newTeams });
  };

  // Componente de icono QR y popover
function QrWithPopover({ url }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center">
      <button
        className="p-2 rounded-full bg-card border border-border hover:bg-primary/10 transition-colors"
        title="Mostrar QR para unirse"
        onClick={() => setOpen(v => !v)}
        aria-label="Mostrar QR"
        type="button"
      >
        <IoQrCode size={24} />
      </button>
      {open && (
        <div className="absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 bg-card border border-border rounded-xl shadow-xl p-4 flex flex-col items-center animate-fade-in">
          <QRCode url={url} size={140} />
        </div>
      )}
    </div>
  );
}

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background text-foreground">
      <div className="flex flex-row items-center gap-4 mb-10">
        <div className="flex flex-col items-center">
          <h1 className="text-7xl font-extrabold text-center text-primary mb-0">{id}</h1>
          <p className="text-xl text-center mt-2">
            Accede a <span className="font-bold">pictionario.vercel.app</span> e introduce este código
          </p>
        </div>
        {/* Botón QR a la derecha */}
        <QrWithPopover url={`https://pictionario.vercel.app/join/${id}`} />
      </div>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">
        {/* Columna equipos */}
        <div className={`bg-card rounded-lg shadow p-6 flex flex-col min-w-[260px] w-1/3 ${startAttempted && startError ? 'border-2 border-destructive' : 'border border-border'}`}>
          <h2 className="text-2xl text-foreground font-semibold mb-4">Equipos</h2>
          {startAttempted && startError && (
            <div className="mb-4 text-destructive font-bold text-center animate-pulse">
              {startError}
            </div>
          )}
          <div className="flex flex-col gap-4 mb-6 ">
            {teams.map((team, idx) => (
              <div key={team.id || team.name || idx} className={`flex items-center gap-4 px-4 py-2 rounded-xl border border-border bg-background ${startAttempted && startError ? 'ring-2 ring-destructive' : ''}`}>
                <Image src={team.icon_url || '/vercel.svg'} alt="icono equipo" width={32} height={32} />
                <div>
                  <div className="font-bold text-lg text-primary">{team.name}</div>
                  {team.members ? (
                    <div className="text-sm text-muted-foreground">{Array.isArray(team.members) ? team.members.join(', ') : team.members}</div>
                  ) : null}
                </div>
                <button
                  className="ml-auto text-destructive hover:text-destructive-hover font-bold px-2 py-1 rounded"
                  onClick={() => handleRemoveTeam(team.id)}
                  title="Eliminar equipo"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="mt-auto w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 rounded transition-colors text-lg" 
            onClick={e => { handleStartGame(e) }}>
            Empezar partida
          </button>
        </div>
        {/* Columna configuración */}
        <div className="w-2/3 bg-card rounded-lg shadow p-6 min-w-[260px] border border-border">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Configuración</h2>
          <form className="flex flex-col gap-6">
            <div className='flex flex-row w-full gap-4'>
              <div className='flex-1'>
                <label className="block font-medium mb-1">Duración de la partida</label>
                <select
                  className="w-full border border-border rounded-xl px-3 py-2.5 bg-background text-foreground"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                >
                  <option value="corta">Corta</option>
                  <option value="media">Media</option>
                  <option value="larga">Larga</option>
                </select>
              </div>
              <div className='flex-1'>
                <label className="flex font-medium mb-1">Tiempo por ronda (segundos)</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  className="w-full border border-border rounded-xl px-3 py-2 bg-background text-foreground"
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
            </div>
            <div>
              <label className="block font-base text-lg mb-2">Categorías</label>
              <div className="grid grid-cols-4 gap-4 mt-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const selected = !!categories[cat.key];
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.key)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 select-none
                        ${selected ? 'border-2 border-primary ring-2 ring-primary/30' : 'border-2 border-background hover:border-primary/50'}`}
                      style={{ minHeight: 90 }}
                      tabIndex={0}
                    >
                      {Icon && <Icon size={28} className={selected ? 'text-primary' : 'text-muted-foreground'} />}
                      <span className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{cat.label}</span>
                    </button>
                  );
                })}
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
