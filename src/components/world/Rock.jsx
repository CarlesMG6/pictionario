"use client";

import { useMemo } from 'react';
import { Color } from 'three';
import { makeIslandShape } from '../../game/islandShape';
import { loftedBlobGeometry } from './geometry';
import { CLAY, PALETTE } from './palette';

const c = (hex) => new Color(hex);

// Bloque de roca: el mismo lofting que las islas pero corto y con el contorno
// muy irregular, para que las caras se lean como planos de fractura redondeados
// en vez de como un cilindro.
function Boulder({ seed, size, position, rotation }) {
  const geometry = useMemo(() => {
    const shape = makeIslandShape({ seed, radius: size, wobble: 0.34, meadows: 0 });
    return loftedBlobGeometry({
      radiusAt: shape.radiusAt,
      radialSegments: 40,
      rings: [
        { scale: 0.18, y: size * 1.35, color: c(PALETTE.rock) },
        { scale: 0.58, y: size * 1.05, color: c(PALETTE.rock) },
        { scale: 0.88, y: size * 0.6, color: c(PALETTE.rockShade) },
        { scale: 1, y: size * 0.22, color: c(PALETTE.rockShade) },
        { scale: 0.96, y: -size * 0.2, color: c(PALETTE.rockDeep) },
      ],
    });
  }, [seed, size]);

  return (
    <mesh geometry={geometry} position={position} rotation-y={rotation} castShadow receiveShadow>
      <meshStandardMaterial vertexColors {...CLAY} />
    </mesh>
  );
}

export default function Rock({ seed = 1, position = [0, 0, 0], scale = 1, count = 3 }) {
  const boulders = useMemo(() => 
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + seed;
      const dist = i === 0 ? 0 : 0.7 + (i % 2) * 0.35;
      return {
        seed: seed * 131 + i * 17,
        size: i === 0 ? 0.95 : 0.4 + ((i * 7) % 3) * 0.14,
        position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        rotation: angle * 1.7,
      };
    }), [seed, count]);

  return (
    <group position={position} scale={scale}>
      {boulders.map((b, i) => (
        <Boulder key={i} seed={b.seed} size={b.size} position={b.position} rotation={b.rotation} />
      ))}
    </group>
  );
}
