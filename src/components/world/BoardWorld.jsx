"use client";

import { useMemo } from 'react';
import { buildWorld, worldBounds } from '../../game/worldGenerator';
import GameWorld from './GameWorld';
import WorldScene from './WorldScene';

// El mundo de la partida. Se genera aquí, en cliente, porque solo aquí se
// dibuja: hacerlo en el servidor sería trabajo tirado.
export default function BoardWorld({ seed, board, teams, focusId = null }) {
  // `board` es un array nuevo en cada snapshot de Firestore, así que la
  // dependencia va por su contenido y no por su identidad: si no, el mundo se
  // regeneraría en cada actualización de la sala.
  const boardKey = board.join('|');
  const world = useMemo(
    () => buildWorld({ seed, board }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, boardKey],
  );
  const bounds = useMemo(() => worldBounds(world), [world]);

  return (
    <GameWorld islands={world.islands} bounds={bounds} focusId={focusId}>
      <WorldScene world={world} teams={teams} />
    </GameWorld>
  );
}
