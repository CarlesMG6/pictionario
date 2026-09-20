"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { makeIslandShape } from '../../game/islandShape';
import { scatterOnIsland } from '../../game/scatter';
import { ISLAND_TOP } from '../../game/worldConstants';
import GameWorld from './GameWorld';
import Island from './Island';
import Palm from './Palm';
import Plants from './Plants';
import Rock from './Rock';
import Tile, { BASE_RADIUS, TILE_TOP } from './Tile';
import { getLetterTexture } from './letterTexture';

const WORD = 'PICTIONARIO';
const SEED = 20260917;

// Separación entre casillas, curvatura del arco y hueco entre filas. Los tres
// valores están en unidades del mundo, las mismas que usa el tablero.
const SPACING = 2.55;
const ARC = 0.16;
const ROW_GAP = 3.2;
const MARGIN = 2.4;
const CANOPY_REACH = 5.5;
const ISLAND_RADIUS = 14;

// Un color de categoría por letra. Es el mismo reparto que hace el camino de
// una partida: colores saturados sobre la arcilla apagada del mundo.
const LETTER_COLORS = [
  '#ef4444', '#fbbf24', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6',
  '#fb923c', '#0ea5e9', '#84cc16', '#14b8a6', '#6366f1',
];

function layoutTitle(cols) {
  const rows = [];
  for (let i = 0; i < WORD.length; i += cols) rows.push(WORD.slice(i, i + cols));

  const letters = [];
  let index = 0;
  rows.forEach((row, r) => {
    const mid = (row.length - 1) / 2;
    const rowZ = (r - (rows.length - 1) / 2) * ROW_GAP;
    for (let c = 0; c < row.length; c++) {
      const offset = c - mid;
      letters.push({
        char: row[c],
        color: LETTER_COLORS[index % LETTER_COLORS.length],
        // El arco acerca los extremos a la cámara, que en picado los baja en
        // pantalla: la misma curva del boceto, resuelta en el plano del suelo.
        position: [offset * SPACING, ISLAND_TOP, rowZ + offset * offset * ARC],
        rotation: offset * 0.055,
      });
      index++;
    }
  });

  return letters;
}

// Encuadra el título ocupando el ancho disponible, sea cual sea la pantalla:
// con FOV fijo, la única variable es la distancia. Se recalcula al
// redimensionar, que es cuando cambia también el número de filas.
function TitleCamera({ letters, elevationDeg }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const tanHalfW = Math.max(Math.tan((camera.fov * Math.PI) / 180 / 2) * aspect, 0.05);
    const elevation = (elevationDeg * Math.PI) / 180;

    // Las casillas de los extremos están adelantadas por el arco, así que
    // quedan más cerca de la cámara y ocupan más pantalla. Fijar el encuadre
    // solo por su X las dejaba cortadas: hay que resolver la distancia
    // casilla a casilla y quedarse con la que las mete todas.
    const distance = letters.reduce((needed, letter) => {
      const [x, , z] = letter.position;
      const half = Math.abs(x) + BASE_RADIUS + MARGIN;
      return Math.max(needed, half / tanHalfW + z * Math.cos(elevation));
    }, 0);
    const d = Math.min(150, Math.max(26, distance));

    camera.position.set(0, Math.sin(elevation) * d, Math.cos(elevation) * d);
    camera.lookAt(0, TILE_TOP, 0);
    camera.updateProjectionMatrix();
  }, [camera, size, letters, elevationDeg]);

  return null;
}

// Balanceo lento del título. Muy corto a propósito: es una portada, no una
// atracción, y con las letras a trece unidades del centro un grado ya se nota.
function Sway({ children }) {
  const ref = useRef(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.22) * 0.05;
    ref.current.position.y = Math.sin(t * 0.5) * 0.07;
  });

  return <group ref={ref}>{children}</group>;
}

export default function TitleWorld() {
  const width = useViewportWidth();
  const narrow = width < 720;
  const cols = narrow ? 6 : WORD.length;
  // En apaisado, un picado corto deja ver el mundo y el título aún se lee. En
  // vertical el encuadre se va lejos y sobra mar: mirando más desde arriba la
  // isla llena la pantalla y además la letra, que está tumbada, sale recta.
  const elevation = narrow ? 46 : 34;
  const letters = useMemo(() => layoutTitle(cols), [cols]);

  const island = useMemo(
    () => ({
      shape: makeIslandShape({ seed: SEED, radius: ISLAND_RADIUS, wobble: 0.22, meadows: 3 }),
      position: [0, 0, 0],
    }),
    [],
  );

  // Rocas, palmeras y matas se reparten con el mismo sembrador que el mapa, y
  // esquivan las casillas del título igual que allí esquivan las del camino.
  const props = useMemo(() => {
    // Una palmera mide tres metros y medio, y con la cámara en picado su copa
    // cae sobre lo que tiene delante y detrás. Así que la zona vetada no son
    // las casillas sino una banda: cada letra veta también el punto de delante
    // y el de detrás, o el título acaba con una hoja encima.
    const band = letters.flatMap(({ position: [x, y, z] }) => [
      [x, y, z], [x, y, z - CANOPY_REACH], [x, y, z + CANOPY_REACH],
    ]);
    const palms = scatterOnIsland({
      island, count: 5, seed: SEED + 29, margin: 3.6,
      avoid: band, avoidRadius: 4.6, minSpacing: 7,
    });
    const rocks = scatterOnIsland({
      island, count: 7, seed: SEED + 11, margin: 3.2,
      avoid: [...band, ...palms], avoidRadius: 4, minSpacing: 5,
    });
    const plants = scatterOnIsland({
      island, count: 26, seed: SEED + 47, margin: 2.2,
      avoid: [...letters.map((letter) => letter.position), ...rocks, ...palms],
      avoidRadius: 2.4, minSpacing: 1.9,
    });
    return { rocks, palms, plants };
  }, [island, letters]);

  return (
    <GameWorld islands={[island]} target={[0, TILE_TOP, 0]}>
      <TitleCamera letters={letters} elevationDeg={elevation} />

      <Island shape={island.shape} position={island.position} />

      {props.rocks.map((position, i) => (
        <Rock
          key={`rock-${i}`}
          seed={SEED + i * 13}
          position={[position[0], ISLAND_TOP, position[2]]}
          scale={0.8 + (i % 3) * 0.25}
          count={3}
        />
      ))}

      {props.palms.map((position, i) => (
        <Palm
          key={`palm-${i}`}
          position={[position[0], ISLAND_TOP, position[2]]}
          rotation={i * 1.9}
          scale={0.9 + (i % 2) * 0.2}
        />
      ))}

      <Plants
        items={props.plants.map((position, i) => ({
          variant: i % 4,
          position: [position[0], ISLAND_TOP, position[2]],
          rotation: i * 0.9,
          scale: 0.8 + ((i * 7) % 5) * 0.12,
          tone: i,
        }))}
      />

      <Sway>
        {letters.map((letter, i) => (
          <Tile
            key={`${letter.char}-${i}`}
            color={letter.color}
            decal={getLetterTexture(letter.char)}
            position={letter.position}
            rotation={letter.rotation}
          />
        ))}
      </Sway>
    </GameWorld>
  );
}

// El ancho decide cuántas filas tiene el título, y hace falta antes de montar
// el canvas: `useThree` solo existe dentro de él.
function useViewportWidth() {
  const [width, setWidth] = useState(1280);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}
