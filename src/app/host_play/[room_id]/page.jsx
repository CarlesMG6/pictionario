"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from '../../../firebaseClient.js';
import { collection, addDoc, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy, arrayUnion } from 'firebase/firestore';
import Image from "next/image";

// Colores por categoría
const CATEGORY_COLORS = {
  all: "#fbbf24", // amarillo
  object: "#60a5fa", // azul
  person: "#f87171", // rojo
  action: "#34d399", // verde
  movies: "#a78bfa", // violeta
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
          const newPos = Math.min(oldPos + value, boardRef.current.length - 1);
          teamsArr[teamIdx] = { ...teamsArr[teamIdx], position: newPos };
          // 3. Calcular categoría y palabra
          const category = boardRef.current[newPos];
          // Palabra aleatoria (puedes usar GameLogic si lo prefieres)
          const CATEGORY_WORDS = {
            all: ['sol', 'casa', 'perro', 'gato', 'árbol', 'pelota', 'libro', 'avión', 'mar', 'luz'],
            object: ['mesa', 'silla', 'teléfono', 'cuchara', 'puerta', 'reloj', 'coche', 'vaso', 'llave', 'cama'],
            person: ['doctor', 'bombero', 'profesor', 'niño', 'abuelo', 'mujer', 'hombre', 'rey', 'reina', 'policía'],
            action: ['correr', 'saltar', 'bailar', 'leer', 'escribir', 'cantar', 'nadar', 'dibujar', 'cocinar', 'jugar'],
            movies: ['Titanic', 'Matrix', 'Avatar', 'Shrek', 'Frozen', 'Rocky', 'Gladiator', 'Coco', 'Up', 'Toy Story'],
          };
          function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
          const word = getRandomElement(CATEGORY_WORDS[category] || CATEGORY_WORDS['all']);
          // 4. Actualizar teams y game_state en Firestore
          await updateDoc(doc(db, 'rooms', room_id), { teams: teamsArr });
          await updateDoc(doc(db, 'game_state', room_id), {
            current_phase: 'play',
            current_category: category,
            current_word: word,
            dice_value: value,
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
    teams.forEach(team => {
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 text-center">
        <h1 className="text-7xl font-bold tracking-tighter font-sans" style={{ fontFamily: 'Inter, Arial, sans-serif', letterSpacing: '-0.05em' }}>Pictionario</h1>
      </header>
      <main className="flex flex-1 flex-row w-11/12 mx-auto gap-2 p-2">
        {/* Columna izquierda: Categoría actual + Equipos */}
        <aside className="w-[320px] min-w-[220px] flex flex-col items-stretch gap-8">
          <div className="bg-white rounded-lg shadow p-6 text-center mb-2">
            <div className="text-lg text-gray-500 mb-2">Categoría actual</div>
            <div
              className="text-2xl font-bold"
              style={{ color: CATEGORY_COLORS[gameState?.current_category] }}
            >
              {gameState?.current_category || "-"}
            </div>
            {gameState?.current_word && gameState?.current_phase == 'dice' &&(
              <div className="mt-4 text-lg text-gray-700">
                <span className="font-semibold">Palabra:</span> {gameState.current_word}
              </div>
            )}
          </div>
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
    </div>
  );
}
