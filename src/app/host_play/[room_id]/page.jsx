"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from '../../../firebaseClient.js';
import { collection, addDoc, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy, arrayUnion } from 'firebase/firestore';
import Image from "next/image";
import { CATEGORY_WORDS } from '../../../utils/CategoryWords';

const CATEGORIES = [
  { key: 'all', label: 'Todos juegan' },
  { key: 'person', label: 'Persona, animal o lugar' },
  { key: 'object', label: 'Objeto' },
  { key: 'action', label: 'Acción' },
  { key: 'difficulty', label: 'Dificultad' },
  { key: 'movies', label: 'Películas o series' },
];

// Colores por categoría
const CATEGORY_COLORS = {
  all: "#fbbf24", // amarillo
  object: "#60a5fa", // azul
  person: "#f87171", // rojo
  action: "#34d399", // verde
  movies: "#a78bfa", // violeta
  difficulty: "#f472b6", // rosa
};

const BOARD_SIZES = {
  corta: 23,
  media: 39,
  larga: 55,
};

export default function HostPlayPage({ params }) {
  // Compatibilidad futura: unwrap params si es un Promise
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const { room_id } = resolvedParams;
  const [teams, setTeams] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [board, setBoard] = useState([]);
  const boardRef = useRef([]); // <-- referencia siempre actualizada
  const [diceRolling, setDiceRolling] = useState({
    teamId: null,
    value: null,
  });
  const [roomConfig, setRoomConfig] = useState(null);

  // Temporizador para la ronda
  const [timer, setTimer] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef();

  // Sonidos para avisos
  const beepAudio = typeof window !== 'undefined' ? new Audio('/Audio/timer-ticks.mp3') : null;
  const endAudio = typeof window !== 'undefined' ? new Audio('/Audio/timer-alarm.mp3') : null;
  const beepTimes = [5];
  const [lastBeep, setLastBeep] = useState(null);

  // Efecto: avisos sonoros en el temporizador
  useEffect(() => {
    if (gameState?.current_phase === 'timer_running' && timer !== null && beepTimes.includes(timer) && timer !== lastBeep) {
      setLastBeep(timer);
      if (beepAudio) beepAudio.play();
    }
    if (gameState?.current_phase === 'timer_running' && timer === 0 && endAudio) {
      endAudio.play();
    }
  }, [timer, gameState?.current_phase]);

  // Efecto: cuando la fase es 'timer_starts', setea 'timer_running' y el tiempo inicial
  useEffect(() => {
    if (gameState?.current_phase === 'timer_starts' && !timerRunning) {
      const duration = typeof roomConfig?.round_time === 'number' ? roomConfig.round_time : 45;
      setTimer(duration);
      setTimerRunning(true);
      setLastBeep(null);
      updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_running' });
    }
  }, [gameState?.current_phase, roomConfig?.round_time]);

  // Efecto: cuando la fase es 'timer_running', cuenta atrás local
  useEffect(() => {
    if (gameState?.current_phase === 'timer_running' && timerRunning && timer !== null && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev === 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_stopped' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState?.current_phase, timerRunning, timer]);

  // Si la fase deja de ser 'timer_starts', 'timer_running' detener temporizador
  useEffect(() => {
    if (gameState?.current_phase !== 'timer_starts' && gameState?.current_phase !== 'timer_running'  && gameState?.current_phase !== 'timer_stopped') {
      clearInterval(timerRef.current);
      setTimerRunning(false);
    }
  }, [gameState?.current_phase]);

  // Cargar datos
  const fetchData = async () => {
    // Obtener datos de game_state
    const { data: state } = await db
      .from("game_state")
      .select("*")
      .eq("room_id", room_id)
      .single();
    setGameState(state);
    // Obtener datos de teams
    const { data: teamList } = await db
      .from("teams")
      .select("*")
      .eq("room_id", room_id)
      .order("position");
    setTeams(teamList || []);
    // Obtener duración y categorías desde rooms
    const { data: roomData } = await db
      .from("rooms")
      .select("duration, categories")
      .eq("id", room_id)
      .single();
    if (roomData && roomData.categories && roomData.duration) {
      const categories = roomData.categories;
      const size = BOARD_SIZES[roomData.duration] || BOARD_SIZES.media;
      // Rellenar tablero alternando categorías
      console.log("[host_play] Cargando tablero con categorías:", categories, "y tamaño:", size);
      let catArr = Array.isArray(categories) ? categories : Object.keys(categories);
      console.log("[host_play] Categorías obtenidas:", catArr);
      if (catArr.length === 0) catArr = ["all"];
      const boardArr = Array.from({ length: size }, (_, i) => catArr[i % catArr.length]);
      console.log("[host_play] Tablero generado:", boardArr);
      setBoard(boardArr);
      boardRef.current = boardArr; // <-- mantener referencia actualizada
    }
    // Categoría actual
    if (state && state.current_category) {
      setCategoryLabel(state.current_category);
    } else {
      setCategoryLabel("");
    }
  };

  useEffect(() => {
    if (!room_id) return;
    // Suscripción a game_state
    const unsubState = onSnapshot(doc(db, 'game_state', room_id), async (docSnap) => {
      const state = docSnap.exists() ? docSnap.data() : null;
      setGameState(state);
      // Lógica de tirada de dado automática si la fase es 'dice_rolling'
      if (state && state.current_phase === 'dice_rolling') {
        // Solo el host ejecuta la lógica
        // 1. Tirar dado
        const value = Math.floor(Math.random() * 6) + 1;
        // 2. Actualizar posición del equipo
        const teamId = state.current_turn_team;
        // Obtener equipos actuales
        const roomSnap = await getDoc(doc(db, 'rooms', room_id));
        const roomData = roomSnap.data();
        let teamsArr = Array.isArray(roomData?.teams) ? [...roomData.teams] : [];
        const teamIdx = teamsArr.findIndex(t => t.id === teamId);
        if (teamIdx !== -1) {
          const oldPos = teamsArr[teamIdx].position || 0;
          const boardLength = boardRef.current.length;
          let newPos;
          if (oldPos + value > boardLength - 1) {
            // Rebote: calcula la posición rebotando desde la meta
            newPos = (boardLength - 1) * 2 - (oldPos + value);
            if (newPos < 0) newPos = 0; // Por si acaso
          } else {
            newPos = oldPos + value;
          }
          teamsArr[teamIdx] = { ...teamsArr[teamIdx], position: newPos };
          // 3. Calcular categoría y palabra
          const category = boardRef.current[newPos];
          // Palabra aleatoria (puedes usar GameLogic si lo prefieres)
          function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
          const word = getRandomElement(CATEGORY_WORDS[category] || CATEGORY_WORDS['all']);
          // 4. Calcular all_play (1/3 de probabilidad si la categoría no es 'all')
          let allPlay = false;
          if (category !== 'all') {
            allPlay = Math.random() < (1/3);
          }
          // 5. Actualizar teams y game_state en Firestore
          await updateDoc(doc(db, 'rooms', room_id), { teams: teamsArr });
          console.log(`[host_play] Tirada de dado: equipo ${teamId}, valor ${value}, nueva posición ${newPos}, categoría ${category}, palabra ${word}, all_play: ${allPlay}`);
          await updateDoc(doc(db, 'game_state', room_id), {
            current_phase: 'play',
            current_category: category,
            current_word: word,
            dice_value: value,
            all_play: allPlay,
          });
        }
      }
    });
    // Suscripción a configuración de sala y equipos embebidos
    const unsubRoom = onSnapshot(doc(db, 'rooms', room_id), (docSnap) => {
      const data = docSnap.data();
      if (data && data.categories && data.duration) {
        const categories = data.categories;
        const size = BOARD_SIZES[data.duration] || BOARD_SIZES.media;
        let catArr = Array.isArray(categories) ? categories : Object.keys(categories);
        if (catArr.length === 0) catArr = ["all"];
        const boardArr = Array.from({ length: size }, (_, i) => catArr[i % catArr.length]);
        setBoard(boardArr);
        boardRef.current = boardArr;
      }
      // Actualizar equipos desde el array embebido
      setTeams(Array.isArray(data?.teams) ? data.teams : []);
      // Guardar round_time de rooms
      setRoomConfig(data);
    });
    return () => {
      unsubState();
      unsubRoom();
    };
  }, [room_id]);

  // Lógica para tirar dado
  /*const handleRollDice = async (teamId: string) => {
    const value = Math.floor(Math.random() * 6) + 1;
    setDiceRolling({ teamId, value });
    // Actualizar posición en teams
    const team = teams.find((t) => t.id === teamId);
    const newPos = Math.min((team?.position || 0) + value, boardRef.current.length - 1);
    await supabase.from("teams").update({ position: newPos }).eq("id", teamId);
    // Calcular categoría y palabra
    const category = boardRef.current[newPos];
    // Aquí deberías obtener una palabra aleatoria de la categoría (puedes usar GameLogic)
    // ...
    // Actualizar game_state
    await supabase
      .from("game_state")
      .update({
        current_category: category,
        current_word: "(palabra aleatoria)", // TODO: integrar GameLogic
        current_phase: "play",
        dice_value: value,
      })
      .eq("room_id", room_id);
    // Lanzar evento
    await supabase.channel(`room-${room_id}`).send({
      type: "broadcast",
      event: "roll_dice",
      payload: { team_id: teamId, value },
    });
    await supabase.channel(`room-${room_id}`).send({ type: "broadcast", event: "update_match", payload: {} });
  };
*/

  // Calcula la posición visual de una casilla en el tablero en forma de S
  function getSBoardPosition(index, cols = 7, rowsPerZigzag = 2) {
    // Cada "zigzag" es un bloque de (cols + rowsPerZigzag) casillas
    const blockSize = cols + rowsPerZigzag;
    const block = Math.floor(index / blockSize);
    const inBlock = index % blockSize;
    let x = 0, y = 0;
    if (inBlock < cols) {
      // Horizontal (derecha o izquierda)
      y = block * (rowsPerZigzag + 1);
      x = (block % 2 === 0) ? inBlock : (cols - 1 - inBlock);
    } else {
      // Vertical (bajada)
      const down = inBlock - cols + 1;
      y = block * (rowsPerZigzag + 1) + down;
      x = (block % 2 === 0) ? (cols - 1) : 0;
    }
    return { x, y };
  }

  // Render tablero en forma de S
  const renderBoard = () => {
    const cols = 9;
    const rowsPerZigzag = 1;
    const cellSize = 88; // Aumentado
    const pieceSize = 48; // Aumentado
    const boardPadding = 24; // Un poco más de margen
    // Calcular el tamaño del grid
    let maxY = 0;
    board.forEach((_, i) => {
      const pos = getSBoardPosition(i, cols, rowsPerZigzag);
      if (pos.y > maxY) maxY = pos.y;
    });
    // Agrupar equipos por casilla
    const teamsByCell = {};
    teams.forEach((team) => {
      const pos = team.position || 0;
      if (!teamsByCell[pos]) teamsByCell[pos] = [];
      teamsByCell[pos].push(team);
    });
    // Esquinas para hasta 4 equipos en la misma casilla
    const pieceOffsets = [
      { x: 0, y: 0 }, // top-left
      { x: cellSize - pieceSize, y: 0 }, // top-right
      { x: 0, y: cellSize - pieceSize }, // bottom-left
      { x: cellSize - pieceSize, y: cellSize - pieceSize }, // bottom-right
    ];
    return (
      <div
        className="relative bg-white rounded-lg"
        style={{
          width: `${cols * cellSize + boardPadding * 2}px`,
          height: `${(maxY + 1) * cellSize + boardPadding * 2}px`,
          margin: 'auto',
        }}
      >
        {/* Casillas */}
        {board.map((cat, i) => {
          const { x, y } = getSBoardPosition(i, cols, rowsPerZigzag);
          return (
            <div
              key={i}
              className="absolute w-16 h-16 rounded flex items-center justify-center text-base font-bold border shadow"
              style={{
                left: `${x * cellSize}px`,
                top: `${y * cellSize}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                background: CATEGORY_COLORS[cat] || "#eee",
                borderColor: "#fff",
                zIndex: 1,
              }}
            >
              {i + 1}
            </div>
          );
        })}
        {/* Piezas de equipos */}
        {Object.entries(teamsByCell).map(([posStr, teamsInCell]) => {
          const pos = getSBoardPosition(Number(posStr), cols, rowsPerZigzag);
          return teamsInCell.map((team, idx) => {
            // Si hay más de 4 equipos, se superponen en la esquina superior izquierda
            const offset = pieceOffsets[idx] || pieceOffsets[0];
            return (
              <div
                key={team.id}
                className="absolute"
                style={{
                  left: `${pos.x * cellSize + offset.x + (cellSize - pieceSize) / 2 * (pieceOffsets[idx] ? 0 : 1)}px`,
                  top: `${pos.y * cellSize + offset.y + (cellSize - pieceSize) / 2 * (pieceOffsets[idx] ? 0 : 1)}px`,
                  zIndex: 2,
                }}
              >
                <Image
                  src={team.icon_url || "/vercel.svg"}
                  alt="icono"
                  width={pieceSize}
                  height={pieceSize}
                  className="rounded-full border-2 border-black bg-white"
                />
              </div>
            );
          });
        })}
      </div>
    );
  };

  // Render equipos
  const renderTeams = () => (
    <div className="flex flex-col gap-4">
      {teams.map((team) => (
        <div
          key={team.id}
          className={`flex items-center gap-2 p-2 rounded ${
            gameState?.current_turn_team === team.id ? "bg-blue-100 border-l-4 border-blue-500" : ""
          }`}
        >
          <Image
            src={team.icon_url || "/vercel.svg"}
            alt="icono"
            width={28}
            height={28}
            className="rounded-full"
          />
          <span className="font-bold">{team.name}</span>
          {team.members && (
            <span className="text-xs text-gray-500 ml-2">
              {Array.isArray(team.members) ? team.members.join(", ") : team.members}
            </span>
          )}
          {gameState?.current_turn_team === team.id && (
            <span className="ml-2 text-blue-600 font-bold">(Turno)</span>
          )}
        </div>
      ))}
    </div>
  );

  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef();

  // Mostrar modal y cuenta atrás al detectar timer_starts
  useEffect(() => {
    if (gameState?.current_phase === 'timer_starts') {
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            clearInterval(countdownRef.current);
            setCountdown(0);
            // El temporizador real se inicia en el otro efecto (timer_running)
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(3);
      clearInterval(countdownRef.current);
    }
    return () => clearInterval(countdownRef.current);
  }, [gameState?.current_phase]);

  // Formato mm:ss
  function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Componente SVG de barra de progreso circular (75%)
  function CircularProgress({ value, max }) {
    const percent = Math.max(0, Math.min(1, value / max));
    // 75% de círculo: ángulo de 270º (de -225º a 45º)
    const r = 70, cx = 80, cy = 80;
    const full = 270; // grados
    const startAngle = -225;
    const endAngle = startAngle + full * percent;
    // Calcula el arco SVG para 75% de círculo
    function describeArc(cx, cy, r, startAngle, endAngle) {
      const start = polarToCartesian(cx, cy, r, endAngle);
      const end = polarToCartesian(cx, cy, r, startAngle);
      const arcSweep = endAngle - startAngle <= 180 ? 0 : 1;
      return [
        "M", start.x, start.y,
        "A", r, r, 0, arcSweep, 0, end.x, end.y
      ].join(" ");
    }
    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    }
    // Arco de fondo (gris, 75%)
    const bgArc = describeArc(cx, cy, r, -225, 45);
    // Arco de progreso (rojo, 75% proporcional)
    const progArc = describeArc(cx, cy, r, -225, -225 + full * percent);
    return (
      <svg width="160" height="160">
        {/* Fondo gris 75% */}
        <path d={bgArc} stroke="#e5e7eb" strokeWidth="14" fill="none" strokeLinecap="round" />
        {/* Progreso */}
        {percent > 0 && (
          <path d={progArc} stroke="#ef4444" strokeWidth="14" fill="none" strokeLinecap="round" />
        )}
      </svg>
    );
  }

  // Mostrar modal mientras la fase sea timer_starts, timer_running o timer_stopped
  const showTimerModal = ["timer_starts", "timer_running", "timer_stopped"].includes(gameState?.current_phase);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 text-center">
        <h1 className="text-7xl font-bold tracking-tighter font-sans" style={{ fontFamily: 'Inter, Arial, sans-serif', letterSpacing: '-0.05em' }}>Pictionario</h1>
      </header>
      <main className="flex flex-1 flex-row w-11/12 mx-auto gap-2 p-2">
        {/* Columna izquierda: Categoría actual + Equipos */}
        <aside className="w-[320px] min-w-[220px] flex flex-col items-stretch gap-8">
          <div className="bg-white rounded-lg shadow p-6 text-center mb-2">
            {gameState?.all_play && (
              <div className="text-lg text-green-600 font-bold mb-1">¡Todos juegan!</div>
            )}
            <div className="text-lg text-gray-500 mb-2">Categoría actual</div>
            <div className="text-2xl font-bold mb-2" style={{ color: CATEGORY_COLORS[gameState?.current_category] }}>{gameState?.current_category || '-'}</div>
          </div>
          {/* Listado vertical de categorías habilitadas debajo del recuadro de categoría actual */}
          {roomConfig?.categories && Array.isArray(roomConfig.categories) && (
            <div className="flex flex-col gap-2 mt-4">
              <div className="text-base font-bold text-gray-700 mb-1">Categorías</div>
              {CATEGORIES.filter(cat => roomConfig.categories.includes(cat.key)).map(cat => (
                <div key={cat.key} className="flex items-center px-3 py-2 rounded-lg shadow text-base font-semibold" style={{ background: CATEGORY_COLORS[cat.key] || '#eee', color: '#222' }}>
                  {cat.label}
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold mb-4">Equipos</h2>
            <div className="flex flex-col gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-start gap-3 p-3 rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 relative"
                  style={{ borderLeft: gameState?.current_turn_team === team.id ? '8px solid #2563eb' : '8px solid transparent' }}
                >
                  <Image
                    src={team.icon_url || "/vercel.svg"}
                    alt="icono"
                    width={32}
                    height={32}
                    className="mt-1 rounded-full"
                  />
                  <div>
                    <div className="font-bold text-lg">{team.name}</div>
                    {team.members && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {Array.isArray(team.members) ? team.members.join(', ') : team.members}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
        {/* Columna central: Tablero */}
        <section className="flex-1 flex flex-col items-center justify-center">
          {board.length === 0 ? <div>Cargando tablero...</div> :
            <div className="flex items-center justify-center w-full h-full">
              {renderBoard()}
            </div>
          }
          {/* Animación dado */}
          {diceRolling.teamId && (
            <div className="mt-6 text-3xl font-bold animate-bounce">🎲 {diceRolling.value}</div>
          )}
        </section>
      </main>
      {/* MODAL TEMPORIZADOR */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center relative min-w-[320px] min-h-[320px]">
            {gameState?.current_phase === 'timer_starts' && countdown > 0 ? (
              <div className="flex flex-col items-center justify-center">
                <div className="text-7xl font-extrabold text-blue-700 mb-2">{countdown > 0 ? countdown : '¡YA!'}</div>
                <div className="text-lg text-gray-700">Preparados para la ronda...</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <CircularProgress value={timer} max={typeof roomConfig?.round_time === 'number' ? roomConfig.round_time : 45} />
                  <span className="absolute text-4xl text-red-600">{formatTimer(timer || 0)}</span>
                </div>
                <div className="text-lg text-gray-700 mt-4">
                  {gameState?.current_phase === 'timer_stopped' ? '¡Se acabó!' : '¡Tiempo en marcha!'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
