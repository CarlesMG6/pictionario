"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from '../../../firebaseClient.js';
import { collection, addDoc, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy, arrayUnion } from 'firebase/firestore';
import Image from "next/image";
import { CATEGORY_WORDS, CATEGORIES, CATEGORY_COLORS } from '../../../utils/CategoryWords';
import { GameLogic } from "../../../utils/GameLogic";
import Dice3D from "../../../components/Dice3D";
import "../../../components/Dice3D.css";
import { useRouter } from 'next/navigation';

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

  // Estado para mostrar el modal de animación de dado (debe ir antes de cualquier useEffect que lo use)
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [diceValue, setDiceValue] = useState(null);

  // Temporizador para la ronda
  const [timer, setTimer] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef();

  // Sonidos para avisos
  const beepAudio = typeof window !== 'undefined' ? new Audio('/Audio/timer-ticks.mp3') : null;
  const endAudio = typeof window !== 'undefined' ? new Audio('/Audio/timer-alarm.mp3') : null;
  const beepTimes = [5];
  const [lastBeep, setLastBeep] = useState(null);

    // --- MODAL QR ---
  const [showQrModal, setShowQrModal] = useState(false);


    // Set playing=false when game ends
  useEffect(() => {
    if (gameState?.current_phase === 'end' && room_id) {
      updateDoc(doc(db, 'rooms', room_id), { playing: false });
    }
  }, [gameState?.current_phase, room_id]);
  
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
    if (gameState?.current_phase !== 'timer_starts' && gameState?.current_phase !== 'timer_running' && gameState?.current_phase !== 'timer_stopped') {
      clearInterval(timerRef.current);
      setTimerRunning(false);
    }
  }, [gameState?.current_phase]);

  async function getTeamsArray(room_id) {
    const roomSnap = await getDoc(doc(db, 'rooms', room_id));
    const roomData = roomSnap.data();
    return Array.isArray(roomData?.teams) ? [...roomData.teams] : [];
  }

  async function updateTeamPosition(teamsArray, teamIndex, newPosition) {
    teamsArray[teamIndex] = { ...teamsArray[teamIndex], position: newPosition };
    await updateDoc(doc(db, 'rooms', room_id), { teams: teamsArray });
  }

  useEffect(() => {
    if (!room_id) return;
    // Suscripción a game_state
    const unsubState = onSnapshot(doc(db, 'game_state', room_id), async (docSnap) => {
      const state = docSnap.exists() ? docSnap.data() : null;
      setGameState(state);
      // Lógica de tirada de dado automática si la fase es 'dice_rolling'
      if (state && state.current_phase === 'dice_rolling') {
        // 1. Obtener equipos
        const teamsArray = await getTeamsArray(room_id);
        const teamId = state.current_turn_team;
        const teamIndex = teamsArray.findIndex(t => t.id === teamId);
        if (teamIndex === -1) {
          console.error('No se ha podido encontrar el equipo actual en la lista de equipos:', teamId);
        }

        // 2. Tirar el dado (pero mostrar animación antes de usar el valor)
        const value = GameLogic.rollDice();
        setDiceValue(value);
        setShowDiceModal(true);
        // Esperar a que termine la animación (ej: 2.2s) + 2s extra para mostrar el resultado
        await new Promise(res => setTimeout(res, 2200 + 3000));
        setShowDiceModal(false);

        await new Promise(res => setTimeout(res, 1000));
        // 3. Actualizar posición del equipo
        let newPosition = GameLogic.calculateTeamPosition(
          teamsArray[teamIndex].position,
          value,
          boardRef.current.length
        );
        updateTeamPosition(teamsArray, teamIndex, newPosition);

        // 4. Calcular categoría y palabra
        const category = boardRef.current[newPosition];
        function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        const word = getRandomElement(CATEGORY_WORDS[category] || CATEGORY_WORDS['all']);

        // 5. Calcular all_play
        const allPlay = GameLogic.shouldAllPlay(category);
        
        // 6. Actualizar game_state en Firestore
        console.log(`[host_play] Tirada de dado: equipo ${teamId}, valor ${value}, nueva posición ${newPosition}, categoría ${category}, palabra ${word}, all_play: ${allPlay}`);
        await updateDoc(doc(db, 'game_state', room_id), {
          current_phase: 'play',
          current_category: category,
          current_word: word,
          dice_value: value,
          all_play: allPlay,
        });
        // La animación de movimiento se dispara tras cerrar el modal (ver useEffect abajo)
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

  // Sincroniza visualPositions con teams al cargar equipos o tras cerrar el modal del dado
  useEffect(() => {
    // Si el modal de dado está abierto, no actualices visualPositions (espera a que se cierre)
    if (showDiceModal) return;
    // Cuando cambia teams, actualiza visualPositions para animar la pieza
    setVisualPositions(teams.map(t => t.position || 0));
  }, [teams, showDiceModal]);

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

  // Estado para posiciones visuales de las piezas
  const [visualPositions, setVisualPositions] = useState([]); // Posiciones visuales para animación
  const animationTimeoutRef = useRef();

  // Sincronizar visualPositions con la posición real al cargar equipos o tras animación
  useEffect(() => {
    if (!teams || teams.length === 0) return;
    setVisualPositions((prev) => {
      const updated = { ...prev };
      teams.forEach((team) => {
        // Si no existe, o si la posición real cambió por recarga, sincroniza
        if (updated[team.id] === undefined || Math.abs(updated[team.id] - team.position) > 6) {
          updated[team.id] = team.position;
        }
      });
      return updated;
    });
  }, [teams]);

  // Animar movimiento de pieza tras cerrar el modal del dado
  useEffect(() => {
    if (!showDiceModal && diceValue && gameState?.current_phase === 'play') {
      // Buscar equipo activo y su nueva posición
      const teamId = gameState.current_turn_team;
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      setVisualPositions((prev) => ({ ...prev, [teamId]: prev[teamId] ?? team.position })); // Asegura valor inicial
      // Animar desde la posición anterior a la nueva
      animationTimeoutRef.current = setTimeout(() => {
        setVisualPositions((prev) => ({ ...prev, [teamId]: team.position }));
      }, 50); // Pequeño delay para asegurar render
      // Limpiar timeout si cambia
      return () => clearTimeout(animationTimeoutRef.current);
    }
  }, [showDiceModal, diceValue, gameState?.current_phase, teams]);

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
    // Agrupar equipos por casilla (para offsets visuales)
    const teamsByCell = {};
    teams.forEach((team, idx) => {
      // Usar visualPositions para la posición visual
      const pos = visualPositions[idx] ?? team.position ?? 0;
      if (!teamsByCell[pos]) teamsByCell[pos] = [];
      teamsByCell[pos].push({ ...team, visualIdx: idx });
    });
    // Esquinas para hasta 4 equipos en la misma casilla
    const pieceOffsets = [
      { x: 0, y: 0 }, // top-left
      { x: cellSize - pieceSize, y: 0 }, // top-right
      { x: 0, y: cellSize - pieceSize }, // bottom-left
      { x: cellSize - pieceSize, y: cellSize - pieceSize }, // bottom-right
    ];
    return (
      <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-2xl">
        <div
          className="relative rounded-lg"
          style={{
            width: `${cols * cellSize}px`,
            height: `${(maxY + 1) * cellSize}px`,
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
                  width: `${cellSize-2}px`,
                  height: `${cellSize-2}px`,
                  background: CATEGORY_COLORS[cat] || "#eee",
                  borderColor:  CATEGORY_COLORS[cat] || "#eee",
                  strokeWidth: 0,
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
              let offset = { x: 0, y: 0 };
              if (teamsInCell.length === 1) {
                // Centrar la única pieza
                offset = { x: (cellSize - pieceSize) / 2, y: (cellSize - pieceSize) / 2 };
              } else {
                // Repartir en esquinas
                offset = pieceOffsets[idx] || pieceOffsets[0];
              }
              return (
                <div
                  key={team.id}
                  className="absolute team-piece-anim"
                  style={{
                    left: `${pos.x * cellSize + offset.x}px`,
                    top: `${pos.y * cellSize + offset.y}px`,
                    zIndex: 2,
                    transition: 'left 0.7s cubic-bezier(.4,1.6,.4,1), top 0.7s cubic-bezier(.4,1.6,.4,1)',
                  }}
                >
                  <Image
                    src={team.icon_url || "/vercel.svg"}
                    alt="icono"
                    width={pieceSize}
                    height={pieceSize}
                    className="shadow-xl"
                  />
                </div>
              );
            });
          })}
        </div>
      </div>
    );
  };

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
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
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
        <path d={bgArc} className="stroke-14 stroke-secondary" fill="none" strokeLinecap="round" />
        {/* Progreso */}
        {percent > 0 && (
          <path d={progArc} className="stroke-10 stroke-primary" fill="none" strokeLinecap="round" />
        )}
      </svg>
    );
  }


  // MODAL FIN DE PARTIDA
  const showEndModal = gameState?.current_phase === 'end';
  const rankingTeams = showEndModal
    ? (gameState?.ranking || []).map(id => teams.find(t => t.id === id)).filter(Boolean)
    : [];
  const medals = ['🥇', '🥈', '🥉'];

  const router = useRouter();

  // Mostrar modal mientras la fase sea timer_starts, timer_running o timer_stopped
  const showTimerModal = ["timer_starts", "timer_running", "timer_stopped"].includes(gameState?.current_phase);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 text-center">
        <h1 className="text-7xl font-bold tracking-tighter font-sans" style={{ fontFamily: 'Inter, Arial, sans-serif', letterSpacing: '-0.05em' }}>Pictionario</h1>
      </header>
      <main className="flex flex-1 flex-row w-11/12 mx-auto gap-2 p-2 items-center">
        {/* Columna izquierda: Categoría actual + Equipos */}
        <aside className="w-[320px] min-w-[220px] flex flex-col items-stretch gap-8">
          <div className="bg-card rounded-lg shadow p-6 text-center mb-2">
            {gameState?.all_play && (
              <div className="text-lg text-accent font-bold mb-1">¡Todos juegan!</div>
            )}
            <div className="text-lg text-muted-foreground mb-2">Categoría actual</div>
            <div className="text-2xl font-bold mb-2" style={{ color: CATEGORY_COLORS[gameState?.current_category] }}>
              {CATEGORIES.find(cat => cat.key === gameState?.current_category)?.label || '-'}
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-muted-foreground mb-4">Equipos</h2>
            <div className="flex flex-col gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`flex flex-row items-center gap-3 px-4 py-2 rounded border bg-card border-border relative ${gameState?.current_turn_team === team.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <Image
                    src={team.icon_url || "/vercel.svg"}
                    alt="icono"
                    width={32}
                    height={32}
                  />
                  <div>
                    <div className="font-bold text-lg text-primary">{team.name}</div>
                    {team.members && (
                      <div className="text-sm text-muted-foreground mt-1">
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
        <section className="flex-1 flex flex-col">
          {board.length === 0 ? <div>Cargando tablero...</div> :
            <div className="flex items-center justify-center w-full">
              {renderBoard()}
            </div>
          }
          {/* Animación dado */}
          {diceRolling.teamId && (
            <div className="mt-6 text-3xl font-bold animate-bounce">🎲 {diceRolling.value}</div>
          )}
        </section>
        {/* Columna derecha: Listado de categorías */}
        <aside className="w-[260px] min-w-[180px] flex flex-col items-stretch gap-8">
          {roomConfig?.categories && Array.isArray(roomConfig.categories) && (
            <div className="flex flex-col gap-2 mt-4">
              <div className="text-lg font-bold text-muted-foreground mb-1">Categorías</div>
              {CATEGORIES.filter(cat => roomConfig.categories.includes(cat.key)).map(cat => (
                <div key={cat.key} className="flex items-center px-3 py-2 rounded-lg shadow text-base font-semibold" style={{ background: cat.color || 'var(--card)', color: '#222' }}>
                  {cat.label}
                </div>
              ))}
            </div>
          )}
        </aside>

      </main>
      {/* MODAL TEMPORIZADOR */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
          <div className="bg-card rounded-2xl shadow-2xl p-10 flex flex-col items-center relative min-w-[320px] min-h-[320px]">
            {gameState?.current_phase === 'timer_starts' && countdown > 0 ? (
              <div className="flex flex-col items-center justify-center">
                <div className="text-7xl font-extrabold text-primary mb-2">{countdown > 0 ? countdown : '¡YA!'}</div>
                <div className="text-lg text-muted-foreground">Preparados para la ronda...</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <CircularProgress value={timer} max={typeof roomConfig?.round_time === 'number' ? roomConfig.round_time : 45} />
                  <span className="absolute text-4xl text-primary">{formatTimer(timer || 0)}</span>
                </div>
                <div className="text-lg text-muted-foreground mt-4 shadow-2xl">
                  {gameState?.current_phase === 'timer_stopped' ? '¡Se acabó!' : '¡Tiempo en marcha!'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL ANIMACIÓN DADO */}
      {showDiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
          <div className="bg-success rounded-2xl shadow-2xl p-10 flex flex-col items-center relative min-w-[320px] min-h-[320px]">
            <Dice3D value={diceValue} animate />
            <div className="mt-4 text-2xl font-bold">¡Tirando el dado!</div>
          </div>
        </div>
      )}
      {/* MODAL FIN DE PARTIDA */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
          <div className="bg-card rounded-2xl shadow-2xl p-16 flex flex-col items-center relative min-w-[340px] min-h-[340px]">
            <div className="text-4xl font-extrabold text-success mb-4">¡Enhorabuena!</div>
            <div className="text-xl font-bold mb-6 text-foreground">El equipo ganador es:</div>
            <div className="flex flex-col items-center gap-3 mb-8 relative">
                <Image src={teams.find(t => t.id === gameState.winner_team)?.icon_url || '/vercel.svg'} alt="icono ganador" width={64} height={64} />
              <span className="text-2xl font-bold text-accent">{teams.find(t => t.id === gameState.winner_team)?.name}</span>
            </div>
            <div className="w-full max-w-xs mx-auto">
              <div className="text-lg font-semibold mb-2 text-muted-foreground">Clasificación final</div>
              <div className="flex flex-col gap-2 mb-8">
                {rankingTeams.map((team, idx) => (
                  <div key={team.id} className="flex items-center gap-4 p-2 rounded-lg bg-muted">
                    <span className="text-2xl">{medals[idx] || ''}</span>
                    <Image src={team.icon_url || '/vercel.svg'} alt="icono" width={32} height={32} />
                    <span className="font-bold text-lg text-foreground">{team.name}</span>
                    <span className="ml-auto text-muted-foreground">#{idx + 1}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-row gap-4 mt-4 w-full justify-center">
                <button
                  className="bg-muted hover:bg-muted-hover text-foreground font-semibold py-2 px-4 rounded transition-colors text-base"
                  type="button"
                  onClick={() => alert('Estadísticas próximamente')}
                >
                  Estadísticas de la partida
                </button>
                <button
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2 px-4 rounded transition-colors text-base"
                  type="button"
                  onClick={async () => {
                    // Recupera el code de la sala y redirige usando el code, no el id interno
                    const roomSnap = await getDoc(doc(db, 'rooms', room_id));
                    const roomData = roomSnap.data();
                    if (roomData?.code) {
                      router.push(`/host/${roomData.code}`);
                    } else {
                      alert('No se pudo recuperar el código de la sala.');
                    }
                  }}
                >
                  Nueva Partida
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* FOOTER QR/NORMAS */}
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center py-6">
        <button
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-base"
          onClick={() => window.open('/rules', '_blank')}
          type="button"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Normas del juego
        </button>
        <button
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-base"
          onClick={() => setShowQrModal(true)}
          type="button"
        >
          <Image aria-hidden src="/window.svg" alt="QR icon" width={16} height={16} />
          Unirse a la partida
        </button>
      </footer>

      {/* MODAL QR INVITACIÓN */}
      {showQrModal && roomConfig?.code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
          <div className="bg-card rounded-2xl shadow-2xl p-10 flex flex-col items-center relative min-w-[320px] min-h-[320px]">
            <button
              className="absolute top-4 right-4 text-2xl text-muted-foreground hover:text-primary"
              onClick={() => setShowQrModal(false)}
              aria-label="Cerrar"
              type="button"
            >
              ×
            </button>
            <div className="text-2xl font-bold mb-6 text-center">Únete a la partida</div>
            <div className="mb-2 text-center text-muted-foreground">Entra en <span className="font-semibold">pictionario.vercel.app</span> e introduce este código:</div>
            <div className="text-5xl font-extrabold text-primary mb-6 text-center tracking-widest">{roomConfig.code}</div>
            <div className="mb-2 text-center text-muted-foreground">O escanea este QR:</div>
            <QRCode url={`https://pictionario.vercel.app/join/${roomConfig.code}`} size={160} />
          </div>
        </div>
      )}
    </div>
  );
}
