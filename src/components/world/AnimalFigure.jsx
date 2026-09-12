"use client";

import { useMemo } from 'react';
import { SphereGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ANIMALS } from '../../game/animals';
import { taperedCylinderGeometry } from './geometry';
import { CLAY } from './palette';

// Las mallas se cachean por especie: las comparten los peones del tablero y los
// retratos del HUD, y se reconstruyen una sola vez por partida.
const cache = new Map();

function buildPart(part, mirrored) {
  let geometry;

  if (part.shape === 'cone') {
    const [bottom, top, height] = part.size;
    geometry = taperedCylinderGeometry({
      bottomRadius: Math.max(bottom, 0.004),
      topRadius: Math.max(top, 0.004),
      height,
      corner: Math.min(bottom, top, height * 0.3) * 0.6,
      radialSegments: 14,
      cornerSegments: 3,
    });
  } else {
    geometry = new SphereGeometry(1, 16, 12);
    geometry.scale(...part.size);
  }

  // La copia reflejada invierte los giros en Y y Z; el de X es el mismo eje del
  // espejo y se queda igual.
  const [rotX = 0, rotY = 0, rotZ = 0] = part.rot || [];
  if (rotX) geometry.rotateX(rotX);
  if (rotY) geometry.rotateY(mirrored ? -rotY : rotY);
  if (rotZ) geometry.rotateZ(mirrored ? -rotZ : rotZ);

  const [x = 0, y = 0, z = 0] = part.at || [];
  geometry.translate(mirrored ? -x : x, y, z);
  return geometry;
}

// Devuelve una malla por color: un animal son una decena larga de piezas, y
// dibujarlas sueltas multiplicaría las llamadas de dibujo por cada equipo.
export function buildAnimalGeometries(speciesKey) {
  if (cache.has(speciesKey)) return cache.get(speciesKey);

  const species = ANIMALS[speciesKey] || ANIMALS.cat;
  const groups = new Map();

  for (const part of species.parts) {
    const pieces = groups.get(part.color) || [];
    pieces.push(buildPart(part, false));
    if (part.mirror) pieces.push(buildPart(part, true));
    groups.set(part.color, pieces);
  }

  const built = [...groups.entries()].map(([key, pieces]) => {
    const geometry = mergeGeometries(pieces);
    geometry.computeVertexNormals();
    const swatch = species.palette[key];
    return {
      key,
      geometry,
      material: typeof swatch === 'string' ? { color: swatch } : swatch,
    };
  });

  cache.set(speciesKey, built);
  return built;
}

export default function AnimalFigure({ species, scale = 1 }) {
  const groups = useMemo(() => buildAnimalGeometries(species), [species]);

  return (
    <group scale={scale}>
      {groups.map((group) => (
        <mesh key={group.key} geometry={group.geometry} castShadow receiveShadow>
          <meshStandardMaterial {...CLAY} {...group.material} />
        </mesh>
      ))}
    </group>
  );
}
