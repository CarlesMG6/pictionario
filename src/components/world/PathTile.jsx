"use client";

import { useMemo } from 'react';
import { CATEGORY_COLORS } from '../../utils/CategoryWords';
import { getCategoryIconTexture } from './categoryTexture';
import Tile from './Tile';

export { TILE_RADIUS } from './Tile';

// Una casilla del camino: la pieza de `Tile` con el color y el icono de su
// categoría.
export default function PathTile({ category, position = [0, 0, 0], rotation = 0 }) {
  const icon = useMemo(() => getCategoryIconTexture(category), [category]);

  return (
    <Tile
      color={CATEGORY_COLORS[category] || '#cccccc'}
      decal={icon}
      position={position}
      rotation={rotation}
    />
  );
}
