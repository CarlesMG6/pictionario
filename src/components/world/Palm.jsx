"use client";

import { useMemo } from 'react';
import { taperedCylinderGeometry } from './geometry';
import { CLAY, PALETTE } from './palette';

export default function Palm({ position, rotation = 0, scale = 1 }) {
  const trunk = useMemo(
    () => taperedCylinderGeometry({ bottomRadius: 0.26, topRadius: 0.16, height: 3.4, corner: 0.1 }),
    [],
  );

  return (
    <group position={position} rotation-y={rotation} scale={scale}>
      <mesh geometry={trunk} position-y={1.7} rotation-z={0.09} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.wood} {...CLAY} />
      </mesh>
      <group position={[0.3, 3.4, 0]}>
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <group key={i} rotation-y={a}>
              <mesh position={[0.85, -0.12, 0]} rotation-z={-0.32} scale={[1.5, 0.16, 0.62]} castShadow>
                <sphereGeometry args={[1, 16, 12]} />
                <meshStandardMaterial color={i % 2 ? PALETTE.foliage : PALETTE.foliageShade} {...CLAY} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}
