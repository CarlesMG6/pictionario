"use client";

import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { buildPebbleGeometry } from './plantGeometry';
import { CLAY, PALETTE } from './palette';

// Sendero: guijarros de arena más oscura bordeando el camino en los tramos de
// tierra, donde no hay pasarela que marque por dónde va el recorrido.
export default function Trail({ pebbles }) {
  const geometry = useMemo(() => buildPebbleGeometry(), []);
  if (pebbles.length === 0) return null;

  return (
    <Instances geometry={geometry} limit={pebbles.length} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.sandPebble} {...CLAY} />
      {pebbles.map((pebble, i) => (
        <Instance
          key={i}
          position={[pebble.position[0], pebble.position[1] + pebble.scale * 0.3, pebble.position[2]]}
          rotation-y={pebble.rotation}
          scale={pebble.scale}
        />
      ))}
    </Instances>
  );
}
