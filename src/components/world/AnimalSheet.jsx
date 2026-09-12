"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { ANIMALS } from '../../game/animals';
import AnimalFigure from './AnimalFigure';
import { roundedCylinderGeometry } from './geometry';
import { CLAY, PALETTE } from './palette';
import { useMemo } from 'react';

const COLUMNS = 5;
const SPACING = 2.1;

// Hoja de personajes: las catorce criaturas en rejilla, para poder juzgarlas y
// corregirlas de una pasada en vez de ir buscándolas por el tablero.
export default function AnimalSheet() {
  const species = Object.keys(ANIMALS);
  const rows = Math.ceil(species.length / COLUMNS);
  const base = useMemo(
    () => roundedCylinderGeometry({ radius: 0.55, height: 0.12, corner: 0.045, radialSegments: 28 }),
    [],
  );

  const width = (COLUMNS - 1) * SPACING;
  const depth = (rows - 1) * SPACING;

  return (
    <div className="fixed inset-0 bg-[#dff1fb]">
      <Canvas
        shadows="variance"
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        camera={{ position: [0, 9, 12], fov: 32, near: 0.1, far: 100 }}
      >
        <color attach="background" args={['#dff1fb']} />
        <hemisphereLight args={['#bfe9ff', '#f0cf9c', 0.8]} />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[6, 12, 8]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-radius={5}
          shadow-blurSamples={16}
          shadow-normalBias={0.03}
        />

        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={PALETTE.sand} {...CLAY} />
        </mesh>

        <group position={[-width / 2, 0, -depth / 2]}>
          {species.map((key, i) => (
            <group
              key={key}
              position={[(i % COLUMNS) * SPACING, 0, Math.floor(i / COLUMNS) * SPACING]}
            >
              <mesh geometry={base} position-y={0.06} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.cream} {...CLAY} />
              </mesh>
              <group position-y={0.12}>
                <AnimalFigure species={key} />
              </group>
            </group>
          ))}
        </group>

        <OrbitControls makeDefault target={[0, 0.6, 0]} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap justify-center gap-x-6 gap-y-1 p-3 text-xs text-slate-700">
        {species.map((key) => (
          <span key={key} className="gp-label">
            {key}
          </span>
        ))}
      </div>
    </div>
  );
}
