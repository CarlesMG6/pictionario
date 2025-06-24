"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/supabaseClient";
import Image from "next/image";

// Colores por categoría
const CATEGORY_COLORS: Record<string, string> = {
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

export default function HostPlayPage({ params }: { params: Promise<{ room_id: string }> }) {
  const { room_id } = React.use(params);
  const [teams, setTeams] = useState<any[]>([]);
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<string[]>([]);
  const boardRef = useRef<string[]>([]); // <-- referencia siempre actualizada
  const [categoryLabel, setCategoryLabel] = useState<string>("");
  const [diceRolling, setDiceRolling] = useState<{ teamId: string | null; value: number | null }>({
    teamId: null,
    value: null,
  });

  // Cargar datos
  const fetchData = async () => {
    setLoading(true);
    // Obtener datos de game_state
    const { data: state } = await supabase
      .from("game_state")
      .select("*")
      .eq("room_id", room_id)
      .single();
    setGameState(state);
    // Obtener datos de teams
    const { data: teamList } = await supabase
      .from("teams")
      .select("*")
      .eq("room_id", room_id)
      .order("position");
    setTeams(teamList || []);
    // Obtener duración y categorías desde rooms
    const { data: roomData } = await supabase
      .from("rooms")
      .select("duration, categories")
      .eq("id", room_id)
      .single();
    if (roomData && roomData.categories && roomData.duration) {
      const categories = roomData.categories;
      const size = BOARD_SIZES[roomData.duration as 'corta' | 'media' | 'larga'] || BOARD_SIZES.media;
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
    setLoading(false);
  };

  useEffect(() => {
    if (!room_id) return;
    fetchData();
    const channel = supabase
      .channel(`room-${room_id}`)
      .on("broadcast", { event: "update_match" }, () => {
        console.log("[host_play] update_match recibido");
        fetchData();
      })
      .on("broadcast", { event: "roll_dice" }, async (payload) => {
        console.log("[host_play] roll_dice recibido:", payload);
        // Esperar a que fetchData termine y obtener el estado actualizado
        await fetchData();
        // Obtener el estado actualizado directamente de la BBDD
        const { data: updatedState } = await supabase
          .from("game_state")
          .select("*")
          .eq("room_id", room_id)
          .single();
        const teamId = updatedState?.current_turn_team || null;
        const value = Math.floor(Math.random() * 6) + 1;
        console.log("[host_play] Mostrando dado (estado actualizado):", { teamId, value, updatedState });
        setDiceRolling({ teamId, value });
        setTimeout(() => setDiceRolling({ teamId: null, value: null }), 2000);
        // --- ACTUALIZAR ESTADO DE JUEGO TRAS TIRAR DADO ---
        // Calcular nueva posición (asegurar que nunca es < 0)
        // Buscar el equipo en la lista actualizada de la BBDD
        const { data: updatedTeams } = await supabase
          .from("teams")
          .select("*")
          .eq("room_id", room_id);
        const team = updatedTeams?.find((t) => t.id === teamId);
        if (!team) {
          console.error("[host_play] No se encontró el equipo para avanzar la ficha", { teamId, updatedTeams });
          return;
        }
        console.log("[host_play] Equipo encontrado:", team);
        const currentPos = Math.max(0, team.position || 0);
        console.log("[host_play] Posición actual:", currentPos, "Valor del dado:", value);
        const newPos = Math.max(0, Math.min(currentPos + value, boardRef.current.length - 1));
        console.log("board.length:", boardRef.current.length, "Board:", boardRef.current);
        console.log("[host_play] Nueva posición calculada:", newPos);
        await supabase.from("teams").update({ position: newPos }).eq("id", teamId);
        // Calcular categoría y palabra
        const category = boardRef.current[newPos];
        // Palabras por categoría (puedes mover esto a un util si lo prefieres)
        const CATEGORY_WORDS: Record<string, string[]> = {
          all: ['sol', 'casa', 'perro', 'gato', 'árbol', 'pelota', 'libro', 'avión', 'mar', 'luz'],
          object: ['mesa', 'silla', 'teléfono', 'cuchara', 'puerta', 'reloj', 'coche', 'vaso', 'llave', 'cama'],
          person: ['doctor', 'bombero', 'profesor', 'niño', 'abuelo', 'mujer', 'hombre', 'rey', 'reina', 'policía'],
          action: ['correr', 'saltar', 'bailar', 'leer', 'escribir', 'cantar', 'nadar', 'dibujar', 'cocinar', 'jugar'],
          movies: ['Titanic', 'Matrix', 'Avatar', 'Shrek', 'Frozen', 'Rocky', 'Gladiator', 'Coco', 'Up', 'Toy Story'],
        };
        function getRandomElement<T>(arr: T[]): T {
          return arr[Math.floor(Math.random() * arr.length)];
        }
        const word = getRandomElement(CATEGORY_WORDS[category] || CATEGORY_WORDS['all']);
        // Actualizar game_state
        await supabase
          .from("game_state")
          .update({
            current_category: category,
            current_word: word,
            current_phase: "play",
          })
          .eq("room_id", room_id);
        // Lanzar evento para sincronizar
        await supabase.channel(`room-${room_id}`).send({ type: "broadcast", event: "update_match", payload: {} });
        // Refrescar datos locales tras actualizar el estado y la posición
        await fetchData();
      })
      .subscribe((status) => {
        console.log("[host_play] Canal suscrito, status:", status);
      });
    console.log("[host_play] Canal creado y suscrito a eventos");
    return () => {
      supabase.removeChannel(channel);
      console.log("[host_play] Canal eliminado");
    };
    // eslint-disable-next-line
  }, [room_id]);

  // Lógica para tirar dado
  const handleRollDice = async (teamId: string) => {
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

  // Calcula la posición visual de una casilla en el tablero en forma de S
  function getSBoardPosition(index: number, cols = 7, rowsPerZigzag = 2) {
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
    const cols = 7;
    const rowsPerZigzag = 1;
    const cellSize = 64; // Tamaño de casilla aumentado
    const pieceSize = 36; // Tamaño de la pieza
    const boardPadding = 16; // Margen interior blanco
    // Calcular el tamaño del grid
    let maxY = 0;
    board.forEach((_, i) => {
      const pos = getSBoardPosition(i, cols, rowsPerZigzag);
      if (pos.y > maxY) maxY = pos.y;
    });
    // Agrupar equipos por casilla
    const teamsByCell: Record<number, any[]> = {};
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
        className="relative  bg-white rounded-lg"
        style={{
          width: `${cols * cellSize + boardPadding * 2}px`,
          height: `${(maxY + 1) * cellSize + boardPadding * 2}px`,
          padding: `${boardPadding}px`,
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
      <header className="py-6 bg-white shadow text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-blue-700">Pictionario</h1>
      </header>
      <main className="flex flex-1 flex-row w-full max-w-7xl mx-auto gap-6 p-6">
        {/* Columna izquierda: Equipos */}
        <aside className="w-1/5 min-w-[200px] flex flex-col items-start">{renderTeams()}</aside>
        {/* Columna central: Tablero */}
        <section className="flex-1 flex flex-col items-center">
          {loading ? <div>Cargando tablero...</div> : renderBoard()}
          {/* Animación dado */}
          {diceRolling.teamId && (
            <div className="mt-6 text-3xl font-bold animate-bounce">🎲 {diceRolling.value}</div>
          )}
        </section>
        {/* Columna derecha: Categoría actual */}
        <aside className="w-1/5 min-w-[200px] flex flex-col items-center justify-center">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-lg text-gray-500 mb-2">Categoría actual</div>
            <div
              className="text-2xl font-bold"
              style={{ color: CATEGORY_COLORS[categoryLabel] }}
            >
              {categoryLabel || "-"}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
