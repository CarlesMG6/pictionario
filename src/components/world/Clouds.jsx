"use client";

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CLAY, PALETTE } from './palette';

// Racimos de esferas mates: la nube plana y cuadriculada de la referencia LEGO
// traducida al acabado redondeado.
const PUFFS = [
  [0, 0, 0, 1],
  [1.1, -0.25, 0.2, 0.75],
  [-1.15, -0.2, -0.15, 0.8],
  [0.45, 0.45, -0.3, 0.62],
  [-0.5, 0.3, 0.35, 0.55],
];

function Cloud({ position, scale, drift }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * 0.03 + drift) * 6;
    }
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {PUFFS.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 20, 16]} />
          <meshStandardMaterial color={PALETTE.cloud} roughness={1} metalness={CLAY.metalness} />
        </mesh>
      ))}
    </group>
  );
}

export default function Clouds({ count = 14 }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + i * 0.7;
        const radius = 185 + ((i * 37) % 70);
        return {
          position: [Math.cos(angle) * radius, 26 + ((i * 13) % 22), Math.sin(angle) * radius],
          scale: 9 + ((i * 7) % 6),
          drift: i * 1.3,
        };
      }),
    [count],
  );

  return clouds.map((c, i) => <Cloud key={i} {...c} />);
}
