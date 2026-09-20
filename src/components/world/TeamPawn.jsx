"use client";

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { roundedCylinderGeometry } from './geometry';
import { CLAY, PALETTE } from './palette';
import AnimalFigure from './AnimalFigure';
import { useMotionState } from './motionState';

// Tiempo que tarda la ficha en saltar de una casilla a la siguiente. El salto
// es por casilla, no por tirada: una tirada de 6 se ve recorrer las seis.
const STEP_SECONDS = 0.34;
const HOP_HEIGHT = 0.95;
const SLOT_RADIUS = 0.42;
const TAU = Math.PI * 2;

const lerp = (a, b, t) => a + (b - a) * t;

// Ficha de equipo: la criatura sobre una peana del color del equipo. El animal
// distingue de un vistazo, y la peana es lo que ata la figura a su tarjeta del
// HUD, que lleva el mismo color.
export default function TeamPawn({ id, tiles, tileIndex, species, color, slot = 0, slotCount = 1 }) {
  const group = useRef();
  const animated = useRef(tileIndex);
  const motion = useMotionState();

  const base = useMemo(
    () => roundedCylinderGeometry({ radius: 0.42, height: 0.12, corner: 0.045, radialSegments: 28 }),
    [],
  );

  // Varias fichas en la misma casilla se reparten alrededor de su centro.
  const offset = useMemo(() => {
    if (slotCount <= 1) return [0, 0];
    const angle = (slot / slotCount) * TAU;
    return [Math.cos(angle) * SLOT_RADIUS, Math.sin(angle) * SLOT_RADIUS];
  }, [slot, slotCount]);

  // Si la ficha desaparece a media zancada, la cámara no puede quedarse
  // siguiendo a un fantasma.
  useEffect(
    () => () => {
      motion?.current.movers.delete(id);
      motion?.current.spots.delete(id);
    },
    [id, motion],
  );

  useFrame((state, delta) => {
    if (!group.current || tiles.length === 0) return;

    const target = Math.max(0, Math.min(tileIndex, tiles.length - 1));
    const from = animated.current;
    const moving = Math.abs(target - from) > 1e-4;

    if (moving) {
      const direction = Math.sign(target - from);
      const next = from + (direction * delta) / STEP_SECONDS;
      animated.current = direction > 0 ? Math.min(next, target) : Math.max(next, target);
    }

    const index = Math.floor(animated.current);
    const fraction = animated.current - index;
    const current = tiles[Math.max(0, Math.min(index, tiles.length - 1))];
    const next = tiles[Math.max(0, Math.min(index + 1, tiles.length - 1))] || current;

    const x = lerp(current.position[0], next.position[0], fraction) + offset[0];
    const z = lerp(current.position[2], next.position[2], fraction) + offset[1];
    const ground = lerp(current.position[1], next.position[1], fraction);

    // Arco de salto mientras avanza; un balanceo mínimo cuando está parada, para
    // que no se lea como un objeto del decorado.
    const hop = moving
      ? Math.sin(fraction * Math.PI) * HOP_HEIGHT
      : Math.sin(state.clock.elapsedTime * 1.6 + slot) * 0.035;

    group.current.position.set(x, ground + hop, z);

    if (moving) {
      const dx = next.position[0] - current.position[0];
      const dz = next.position[2] - current.position[2];
      if (dx || dz) group.current.rotation.y = Math.atan2(dx, dz);
    }

    // La posición se publica siempre, se mueva o no: es de donde saca la cámara
    // a dónde mirar mientras el equipo del turno espera su palabra.
    motion?.current.spots.set(id, [x, ground + 0.6, z]);
    if (moving) motion?.current.movers.set(id, [x, ground + 0.6, z]);
    else motion?.current.movers.delete(id);
  });

  return (
    <group ref={group}>
      <mesh geometry={base} position-y={0.06} castShadow receiveShadow>
        <meshStandardMaterial color={color} {...CLAY} />
      </mesh>
      <mesh geometry={base} position-y={0.135} scale={[0.82, 0.4, 0.82]} castShadow>
        <meshStandardMaterial color={PALETTE.cream} {...CLAY} />
      </mesh>
      <group position-y={0.16}>
        <AnimalFigure species={species} scale={0.95} />
      </group>
    </group>
  );
}
