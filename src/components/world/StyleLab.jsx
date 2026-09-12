"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { buildBoard } from '../../game/board';
import { buildWorld, worldBounds } from '../../game/worldGenerator';
import GameWorld, { LOOK } from './GameWorld';
import WorldScene from './WorldScene';

const SAMPLE_CATEGORIES = ['person', 'object', 'action', 'movies', 'food', 'animal'];

const DEMO_TEAMS = [
  { id: 'a', color: '#ef4444', species: 'cat' },
  { id: 'b', color: '#3b82f6', species: 'dolphin' },
  { id: 'c', color: '#22c55e', species: 'dragon' },
];

// Cadencia de la simulación: una tirada, el tiempo que tarda la ficha en
// recorrerla, y un rato parado para que se vea la cámara orbitando.
const DEMO_INTERVAL_MS = 9000;

// Ruta de validación. No forma parte del juego: existe para poder iterar la
// estética y el generador sin tocar la partida.
//
//   ?seed=12&duration=larga        mundo y tamaño de tablero
//   ?demo=0                        congela las fichas
//   ?rig=0                         devuelve el control manual de cámara
//   ?aoIntensity=14&shadowRadius=3 cualquier clave de LOOK
export default function StyleLab() {
  const params = useSearchParams();

  const seed = Number(params.get('seed')) || 7;
  const duration = params.get('duration') || 'media';
  const demo = params.get('demo') !== '0';
  const rig = params.get('rig') !== '0';

  const world = useMemo(
    () => buildWorld({ seed, board: buildBoard(SAMPLE_CATEGORIES, duration) }),
    [seed, duration],
  );

  const bounds = useMemo(() => worldBounds(world), [world]);
  const lastTile = world.layout.tiles.length - 1;

  const [teams, setTeams] = useState(() => DEMO_TEAMS.map((team) => ({ ...team, position: 0 })));

  // Reinicia las fichas cuando cambia el mundo: las posiciones del mundo
  // anterior no significan nada en el nuevo.
  useEffect(() => {
    setTeams(DEMO_TEAMS.map((team) => ({ ...team, position: 0 })));
  }, [seed, duration]);

  // Simulación de tiradas, solo para ver la cámara trabajar.
  useEffect(() => {
    if (!demo) return undefined;
    let turn = 0;
    const timer = setInterval(() => {
      const index = turn % DEMO_TEAMS.length;
      turn += 1;
      setTeams((previous) =>
        previous.map((team, i) => {
          if (i !== index) return team;
          const roll = 1 + Math.floor(Math.random() * 6);
          const next = team.position + roll;
          return { ...team, position: next > lastTile ? lastTile * 2 - next : next };
        }),
      );
    }, DEMO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [demo, lastTile]);

  const vec = (name, fallback) => {
    const raw = params.get(name);
    if (!raw) return fallback;
    const parts = raw.split(',').map(Number);
    return parts.length === 3 && parts.every((n) => !Number.isNaN(n)) ? parts : fallback;
  };

  const look = {};
  for (const key of Object.keys(LOOK)) {
    const raw = params.get(key);
    if (raw !== null && raw !== '' && !Number.isNaN(Number(raw))) look[key] = Number(raw);
  }

  const manualDistance = bounds.span * 1.5 + 25;

  return (
    <div className="fixed inset-0">
      <GameWorld
        controls={!rig}
        look={look}
        islands={world.islands}
        bounds={rig ? bounds : null}
        target={vec('look', [bounds.center[0], 0.6, bounds.center[2]])}
        cameraPosition={vec('cam', [
          bounds.center[0] + manualDistance * 0.62,
          manualDistance * 0.62,
          bounds.center[2] + manualDistance * 0.62,
        ])}
      >
        <WorldScene world={world} teams={teams} />
      </GameWorld>

      <div className="pointer-events-none absolute left-4 top-4 max-w-[46rem] rounded-xl bg-black/45 px-4 py-2 text-xs text-white backdrop-blur">
        <div className="font-semibold">Laboratorio de mundo</div>
        <div className="opacity-80">
          {rig ? 'cámara automática · ?rig=0 para controlarla a mano' : 'arrastra para orbitar · rueda para zoom'}
        </div>
        <div className="mt-1">
          semilla <span className="font-semibold">{seed}</span> · duración{' '}
          <span className="font-semibold">{duration}</span> · {world.layout.tiles.length} casillas ·{' '}
          {world.islands.length} islas · {world.landmarks.filter(Boolean).length} accidentes · escala{' '}
          {world.scale.toFixed(2)}
        </div>
        <div className="mt-1">
          {teams.map((team) => (
            <span key={team.id} className="mr-3">
              <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: team.color }} />{' '}
              casilla {team.position + 1}
            </span>
          ))}
        </div>
        <div className="mt-1 opacity-60">
          {Object.entries({ ...LOOK, ...look })
            .map(([k, v]) => `${k}=${v}`)
            .join('  ')}
        </div>
      </div>
    </div>
  );
}
