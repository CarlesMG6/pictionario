"use client";

import { roundedCylinderGeometry } from './geometry';
import { CLAY, PALETTE } from './palette';

export const TILE_RADIUS = 1;
export const TILE_HEIGHT = 0.34;
export const BASE_RADIUS = 1.2;
export const BASE_HEIGHT = 0.16;
export const TILE_TOP = BASE_HEIGHT + TILE_HEIGHT;

// Las dos revoluciones son idénticas en todas las casillas del juego, así que
// se construyen una vez y se comparten: el tablero de una partida larga son 35
// casillas, y el título de la portada otras once.
let cached = null;

export function tileGeometries() {
  if (!cached) {
    cached = {
      tile: roundedCylinderGeometry({ radius: TILE_RADIUS, height: TILE_HEIGHT, corner: 0.1 }),
      base: roundedCylinderGeometry({ radius: BASE_RADIUS, height: BASE_HEIGHT, corner: 0.06 }),
    };
  }
  return cached;
}

// La pieza de la que están hechas todas las casillas: disco de color sobre un
// anillo crema que lo levanta del suelo, con una calca impresa en la cara
// superior. El tablero le pone el icono de la categoría y la portada una letra,
// pero el modelo es el mismo — por eso vive aquí y no dentro de `PathTile`.
export default function Tile({
  color = '#cccccc',
  decal = null,
  decalScale = 1.3,
  position = [0, 0, 0],
  rotation = 0,
}) {
  const geometry = tileGeometries();

  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={geometry.base} position-y={BASE_HEIGHT / 2} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.cream} {...CLAY} />
      </mesh>
      <mesh geometry={geometry.tile} position-y={BASE_HEIGHT + TILE_HEIGHT / 2} castShadow receiveShadow>
        <meshStandardMaterial color={color} {...CLAY} />
      </mesh>
      {decal && (
        <mesh rotation-x={-Math.PI / 2} position-y={TILE_TOP + 0.004}>
          <planeGeometry args={[TILE_RADIUS * decalScale, TILE_RADIUS * decalScale]} />
          {/* La calca se ilumina como el resto: si fuese unlit "flotaría" sobre la arcilla. */}
          <meshStandardMaterial map={decal} transparent depthWrite={false} {...CLAY} />
        </mesh>
      )}
    </group>
  );
}
