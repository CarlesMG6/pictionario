"use client";

import { useMemo } from 'react';
import { CATEGORY_COLORS } from '../../utils/CategoryWords';
import { getCategoryIconTexture } from './categoryTexture';
import { roundedCylinderGeometry } from './geometry';
import { CLAY, PALETTE } from './palette';

export const TILE_RADIUS = 1;
const TILE_HEIGHT = 0.34;
const BASE_RADIUS = 1.2;
const BASE_HEIGHT = 0.16;

// Una casilla: disco de color de categoría sobre un anillo crema que lo levanta
// del suelo, con el logo de la categoría impreso en la cara superior.
export default function PathTile({ category, position = [0, 0, 0], rotation = 0 }) {
  const tileGeometry = useMemo(
    () => roundedCylinderGeometry({ radius: TILE_RADIUS, height: TILE_HEIGHT, corner: 0.1 }),
    [],
  );
  const baseGeometry = useMemo(
    () => roundedCylinderGeometry({ radius: BASE_RADIUS, height: BASE_HEIGHT, corner: 0.06 }),
    [],
  );
  const icon = useMemo(() => getCategoryIconTexture(category), [category]);
  const color = CATEGORY_COLORS[category] || '#cccccc';

  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={baseGeometry} position-y={BASE_HEIGHT / 2} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.cream} {...CLAY} />
      </mesh>
      <mesh geometry={tileGeometry} position-y={BASE_HEIGHT + TILE_HEIGHT / 2} castShadow receiveShadow>
        <meshStandardMaterial color={color} {...CLAY} />
      </mesh>
      {icon && (
        <mesh rotation-x={-Math.PI / 2} position-y={BASE_HEIGHT + TILE_HEIGHT + 0.004}>
          <planeGeometry args={[TILE_RADIUS * 1.3, TILE_RADIUS * 1.3]} />
          {/* El logo se ilumina como el resto: si fuese unlit "flotaría" sobre la arcilla. */}
          <meshStandardMaterial map={icon} transparent depthWrite={false} {...CLAY} />
        </mesh>
      )}
    </group>
  );
}
