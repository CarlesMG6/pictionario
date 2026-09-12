"use client";

import { useMemo } from 'react';
import { Color } from 'three';
import { ISLAND_TOP, SLOPE_DEG } from '../../game/worldConstants';
import { loftedBlobGeometry, slopeRings } from './geometry';
import { CLAY, PALETTE } from './palette';

export const SEA_LEVEL = 0;

const GRASS_HEIGHT = 0.3;
const RUN = 1 / Math.tan((SLOPE_DEG * Math.PI) / 180);

const c = (hex) => new Color(hex);

// Isla de contorno irregular. El borde no cae vertical: baja desde la meseta
// hacia el mar con un talud tendido de ~20 grados que se sigue hundiendo bajo
// el agua, igual que una playa de verdad.
export default function Island({ shape, position = [0, 0, 0] }) {
  const sand = useMemo(
    () =>
      loftedBlobGeometry({
        radiusAt: shape.radiusAt,
        rings: slopeRings({
          topY: ISLAND_TOP,
          depth: 1.1,
          slopeDeg: SLOPE_DEG,
          steps: 5,
          colors: [c(PALETTE.sand), c(PALETTE.sand), c(PALETTE.sandShade), c(PALETTE.sandWet), c(PALETTE.sandWet)],
        }),
      }),
    [shape],
  );

  const grass = useMemo(
    () =>
      shape.meadows.map((m) =>
        loftedBlobGeometry({
          radiusAt: m.shape.radiusAt,
          radialSegments: 64,
          // makeIslandShape ya ha encogido la mancha lo necesario para que
          // quepa dentro del contorno de la isla: aplicamos ese factor aquí.
          rings: [
            { y: ISLAND_TOP + GRASS_HEIGHT, scale: m.scale, offset: 0, color: c(PALETTE.foliageLight) },
            { y: ISLAND_TOP + GRASS_HEIGHT * 0.45, scale: m.scale, offset: GRASS_HEIGHT * 0.55 * RUN, color: c(PALETTE.foliage) },
            { y: ISLAND_TOP - 0.06, scale: m.scale, offset: (GRASS_HEIGHT + 0.06) * RUN, color: c(PALETTE.foliageShade) },
          ],
        }),
      ),
    [shape],
  );

  return (
    <group position={position}>
      <mesh geometry={sand} castShadow receiveShadow>
        <meshStandardMaterial vertexColors {...CLAY} />
      </mesh>
      {grass.map((geometry, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={[shape.meadows[i].center[0], 0, shape.meadows[i].center[1]]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial vertexColors {...CLAY} />
        </mesh>
      ))}
    </group>
  );
}
