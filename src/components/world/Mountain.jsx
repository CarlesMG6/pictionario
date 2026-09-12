"use client";

import { useMemo } from 'react';
import { Color } from 'three';
import { makeIslandShape } from '../../game/islandShape';
import { loftedBlobGeometry } from './geometry';
import { CLAY, PALETTE } from './palette';

const c = (hex) => new Color(hex);

// Perfil del relieve, de la cumbre a la base. `t` es la altura normalizada y
// gobierna tanto el contorno como la inclinación del macizo.
//
// Los pares de anillos a alturas casi iguales con un salto grande de escala son
// las repisas: sin ellos la silueta sale cónica.
const PROFILE = [
  { t: 1, scale: 0.06, y: 1, color: PALETTE.rockDeep },
  { t: 0.95, scale: 0.17, y: 0.94, color: PALETTE.rockDeep },
  { t: 0.92, scale: 0.24, y: 0.91, color: PALETTE.rockShade },
  { t: 0.78, scale: 0.33, y: 0.76, color: PALETTE.rockShade },
  { t: 0.66, scale: 0.4, y: 0.64, color: PALETTE.rockShade },
  { t: 0.64, scale: 0.51, y: 0.62, color: PALETTE.rock },
  { t: 0.48, scale: 0.59, y: 0.47, color: PALETTE.rock },
  { t: 0.36, scale: 0.7, y: 0.35, color: PALETTE.rock },
  { t: 0.34, scale: 0.81, y: 0.33, color: PALETTE.foliageShade },
  { t: 0.22, scale: 0.87, y: 0.22, color: PALETTE.foliageShade },
  { t: 0.12, scale: 0.93, y: 0.12, color: PALETTE.foliage },
  { t: 0, scale: 1, y: -0.3, color: PALETTE.foliageShade },
];

export default function Mountain({ shape, height = 6.5, position = [0, 0, 0] }) {
  const geometry = useMemo(() => {
    // Tres contornos distintos que se interpolan con la altura. Cambiarlos de
    // golpe entre bandas dejaba una arista visible dando la vuelta al monte.
    const { seed, radius } = shape;
    const bands = [
      shape,
      makeIslandShape({ seed: seed * 17 + 3, radius, wobble: 0.44, meadows: 0 }),
      makeIslandShape({ seed: seed * 53 + 11, radius, wobble: 0.56, meadows: 0 }),
    ];

    const contourAt = (t) => {
      const k = Math.min(1.999, Math.max(0, t) * 2);
      const i = Math.floor(k);
      const f = k - i;
      return (theta) => bands[i].radiusAt(theta) * (1 - f) + bands[i + 1].radiusAt(theta) * f;
    };

    const lean = [radius * 0.18, -radius * 0.12];

    return loftedBlobGeometry({
      radiusAt: bands[0].radiusAt,
      radialSegments: 88,
      rings: PROFILE.map((r) => ({
        scale: r.scale,
        y: r.y * height,
        color: c(r.color),
        radiusAt: contourAt(r.t),
        center: [lean[0] * r.t, lean[1] * r.t],
      })),
    });
  }, [shape, height]);

  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshStandardMaterial vertexColors {...CLAY} />
    </mesh>
  );
}
