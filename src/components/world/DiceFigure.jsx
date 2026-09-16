"use client";

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { SphereGeometry } from 'three';
import { CLAY, PALETTE } from './palette';

// El dado, con el mismo lenguaje que el resto del mundo: arcilla mate, bisel
// constante y cero texturas. Los puntos no van pintados sino hundidos —
// esferas metidas en la cara— para que la oclusión y la luz rasante los
// marquen igual que marcan los cantos de las casillas.
//
// Caras opuestas suman 7, como en un dado real: 1 arriba, 6 abajo, 3 en +X,
// 4 en -X, 2 en +Z y 5 en -Z. Ese reparto es el que usa FACE_UP en DiceRoll
// para dejar arriba el valor que ha salido.
export const DICE_SIZE = 1.15;

const HALF = DICE_SIZE / 2;
const PIP_RADIUS = DICE_SIZE * 0.088;
const PIP_SPREAD = DICE_SIZE * 0.245;
// Hundido: el centro de la esfera queda por dentro de la cara, así que solo
// asoma la calota y el punto se lee como un agujero, no como una pelota.
const PIP_SINK = PIP_RADIUS * 0.45;

const FACES = [
  { value: 1, n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { value: 6, n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { value: 3, n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { value: 4, n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { value: 2, n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { value: 5, n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
];

const LAYOUT = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
  6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
};

function pipPositions() {
  const out = [];
  for (const face of FACES) {
    const depth = HALF - PIP_SINK;
    for (const [a, b] of LAYOUT[face.value]) {
      out.push([
        face.n[0] * depth + face.u[0] * a * PIP_SPREAD + face.v[0] * b * PIP_SPREAD,
        face.n[1] * depth + face.u[1] * a * PIP_SPREAD + face.v[1] * b * PIP_SPREAD,
        face.n[2] * depth + face.u[2] * a * PIP_SPREAD + face.v[2] * b * PIP_SPREAD,
      ]);
    }
  }
  return out;
}

export default function DiceFigure() {
  const pips = useMemo(pipPositions, []);
  const pipGeometry = useMemo(() => new SphereGeometry(PIP_RADIUS, 18, 14), []);

  return (
    <group>
      <RoundedBox
        args={[DICE_SIZE, DICE_SIZE, DICE_SIZE]}
        radius={DICE_SIZE * 0.12}
        smoothness={5}
        creaseAngle={0.5}
      >
        <meshStandardMaterial color={PALETTE.cream} {...CLAY} />
      </RoundedBox>

      {pips.map((position, i) => (
        <mesh key={i} geometry={pipGeometry} position={position}>
          <meshStandardMaterial color="#23222b" roughness={0.62} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
