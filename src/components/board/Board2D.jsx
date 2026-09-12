"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CATEGORY_COLORS } from '../../utils/CategoryWords';

const COLS = 9;
const ROWS_PER_ZIGZAG = 1;
const CELL_SIZE = 88;
const PIECE_SIZE = 48;

// Posición de una casilla en el recorrido en forma de S.
function getSBoardPosition(index, cols = COLS, rowsPerZigzag = ROWS_PER_ZIGZAG) {
  const blockSize = cols + rowsPerZigzag;
  const block = Math.floor(index / blockSize);
  const inBlock = index % blockSize;
  let x = 0;
  let y = 0;
  if (inBlock < cols) {
    y = block * (rowsPerZigzag + 1);
    x = (block % 2 === 0) ? inBlock : (cols - 1 - inBlock);
  } else {
    const down = inBlock - cols + 1;
    y = block * (rowsPerZigzag + 1) + down;
    x = (block % 2 === 0) ? (cols - 1) : 0;
  }
  return { x, y };
}

// Reparto en esquinas cuando varias fichas comparten casilla.
const PIECE_OFFSETS = [
  { x: 0, y: 0 },
  { x: CELL_SIZE - PIECE_SIZE, y: 0 },
  { x: 0, y: CELL_SIZE - PIECE_SIZE },
  { x: CELL_SIZE - PIECE_SIZE, y: CELL_SIZE - PIECE_SIZE },
];

export default function Board2D({ board, teams, diceRolling, diceValue, phase, currentTeamId }) {
  const [visualPositions, setVisualPositions] = useState([]);
  const animationTimeoutRef = useRef();

  // Mientras el dado está en pantalla la ficha no se mueve: espera a que cierre.
  useEffect(() => {
    if (diceRolling) return;
    setVisualPositions(teams.map((t) => t.position || 0));
  }, [teams, diceRolling]);

  // Resincroniza si la posición real se ha ido lejos (por ejemplo tras recargar).
  useEffect(() => {
    if (!teams || teams.length === 0) return;
    setVisualPositions((prev) => {
      const updated = { ...prev };
      teams.forEach((team) => {
        if (updated[team.id] === undefined || Math.abs(updated[team.id] - team.position) > 6) {
          updated[team.id] = team.position;
        }
      });
      return updated;
    });
  }, [teams]);

  // Anima el salto a la casilla nueva en cuanto se cierra el modal del dado.
  useEffect(() => {
    if (!diceRolling && diceValue && phase === 'play') {
      const team = teams.find((t) => t.id === currentTeamId);
      if (!team) return;
      setVisualPositions((prev) => ({ ...prev, [currentTeamId]: prev[currentTeamId] ?? team.position }));
      animationTimeoutRef.current = setTimeout(() => {
        setVisualPositions((prev) => ({ ...prev, [currentTeamId]: team.position }));
      }, 50);
      return () => clearTimeout(animationTimeoutRef.current);
    }
  }, [diceRolling, diceValue, phase, teams, currentTeamId]);

  if (!board || board.length === 0) return <div>Cargando tablero...</div>;

  const maxY = board.reduce((acc, _, i) => Math.max(acc, getSBoardPosition(i).y), 0);

  // Agrupar fichas por casilla para poder repartirlas dentro de ella.
  const teamsByCell = {};
  teams.forEach((team, idx) => {
    const pos = visualPositions[idx] ?? team.position ?? 0;
    if (!teamsByCell[pos]) teamsByCell[pos] = [];
    teamsByCell[pos].push({ ...team, visualIdx: idx });
  });

  return (
    <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-2xl">
      <div
        className="relative rounded-lg"
        style={{
          width: `${COLS * CELL_SIZE}px`,
          height: `${(maxY + 1) * CELL_SIZE}px`,
          margin: 'auto',
        }}
      >
        {board.map((cat, i) => {
          const { x, y } = getSBoardPosition(i);
          return (
            <div
              key={i}
              className="absolute rounded flex items-center justify-center text-base font-bold border shadow"
              style={{
                left: `${x * CELL_SIZE}px`,
                top: `${y * CELL_SIZE}px`,
                width: `${CELL_SIZE - 2}px`,
                height: `${CELL_SIZE - 2}px`,
                background: CATEGORY_COLORS[cat] || '#eee',
                borderColor: CATEGORY_COLORS[cat] || '#eee',
                zIndex: 1,
              }}
            >
              {i + 1}
            </div>
          );
        })}

        {Object.entries(teamsByCell).map(([posStr, teamsInCell]) => {
          const pos = getSBoardPosition(Number(posStr));
          return teamsInCell.map((team, idx) => {
            const offset = teamsInCell.length === 1
              ? { x: (CELL_SIZE - PIECE_SIZE) / 2, y: (CELL_SIZE - PIECE_SIZE) / 2 }
              : (PIECE_OFFSETS[idx] || PIECE_OFFSETS[0]);
            return (
              <div
                key={team.id}
                className="absolute team-piece-anim"
                style={{
                  left: `${pos.x * CELL_SIZE + offset.x}px`,
                  top: `${pos.y * CELL_SIZE + offset.y}px`,
                  zIndex: 2,
                  transition: 'left 0.7s cubic-bezier(.4,1.6,.4,1), top 0.7s cubic-bezier(.4,1.6,.4,1)',
                }}
              >
                <Image
                  src={team.icon_url || '/vercel.svg'}
                  alt="icono"
                  width={PIECE_SIZE}
                  height={PIECE_SIZE}
                  className="shadow-xl"
                />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
