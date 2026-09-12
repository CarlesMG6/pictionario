"use client";

import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { buildPlantGeometries } from './plantGeometry';
import { CLAY, PALETTE } from './palette';

const GREENS = [PALETTE.foliage, PALETTE.foliageLight, PALETTE.foliageShade];

// Matas repartidas por el mapa. Se agrupan por variante para que cada una sea
// una sola llamada de dibujo, con color y escala por instancia.
export default function Plants({ items }) {
  const geometries = useMemo(() => buildPlantGeometries(), []);

  return (
    <>
      {geometries.map((geometry, variant) => {
        const group = items.filter((item) => item.variant === variant);
        if (group.length === 0) return null;
        return (
          <Instances key={variant} geometry={geometry} limit={Math.max(1, group.length)} castShadow receiveShadow>
            <meshStandardMaterial {...CLAY} />
            {group.map((item, i) => (
              <Instance
                key={i}
                position={item.position}
                rotation-y={item.rotation}
                scale={item.scale}
                color={GREENS[item.tone % GREENS.length]}
              />
            ))}
          </Instances>
        );
      })}
    </>
  );
}
