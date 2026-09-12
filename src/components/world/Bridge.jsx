"use client";

import { useMemo } from 'react';
import { makeRandom } from '../../game/islandShape';
import { plankGeometry, taperedCylinderGeometry } from './geometry';
import { CLAY, PALETTE } from './palette';

export const PLANK_THICKNESS = 0.2;
const DECK_WIDTH = 2.7; // lo bastante ancho para que quepa una casilla encima
const POST_EVERY = 6;
const VARIANTS = 8;

// Pasarela de tablones sobre pilotes, construida a partir de los tramos del
// camino que quedan sobre agua: aparece sola allí donde el recorrido sale de
// una isla y desaparece al llegar a la siguiente.
//
// Nada aquí es regular. Se generan unos pocos tablones distintos —cada uno con
// sus cuatro esquinas movidas— y al colocarlos se les añade desplazamiento
// lateral, giro y un punto de alabeo. Repetir una caja perfecta delataba la
// malla al instante.
export default function Bridge({ deck, y }) {
  const planks = useMemo(() => {
    const random = makeRandom(4242);
    const jitter = (amount) => (random() * 2 - 1) * amount;

    return Array.from({ length: VARIANTS }, () => {
      const halfLength = (DECK_WIDTH + jitter(0.45)) / 2;
      const halfWidth = (0.58 + jitter(0.09)) / 2;
      return plankGeometry({
        thickness: PLANK_THICKNESS,
        corners: [
          [-halfLength + jitter(0.14), -halfWidth + jitter(0.05)],
          [halfLength + jitter(0.14), -halfWidth + jitter(0.05)],
          [halfLength + jitter(0.14), halfWidth + jitter(0.05)],
          [-halfLength + jitter(0.14), halfWidth + jitter(0.05)],
        ],
      });
    });
  }, []);

  const post = useMemo(
    () =>
      taperedCylinderGeometry({
        bottomRadius: 0.2,
        topRadius: 0.26,
        height: 3,
        corner: 0.08,
        radialSegments: 20,
      }),
    [],
  );

  const placements = useMemo(() => {
    const random = makeRandom(97);
    return deck.map((plank) => ({
      variant: Math.floor(random() * VARIANTS),
      shift: (random() * 2 - 1) * 0.24,
      yaw: (random() * 2 - 1) * 0.11,
      roll: (random() * 2 - 1) * 0.05,
      lift: (random() * 2 - 1) * 0.025,
    }));
  }, [deck]);

  return (
    <group>
      {deck.map((plank, i) => {
        const p = placements[i];
        return (
          <group
            key={plank.step}
            position={[plank.position[0], y + p.lift, plank.position[2]]}
            rotation-y={plank.rotation + p.yaw}
          >
            <mesh
              geometry={planks[p.variant]}
              position-x={p.shift}
              rotation-z={p.roll}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={i % 2 ? PALETTE.wood : PALETTE.woodShade} {...CLAY} />
            </mesh>
            {plank.step % POST_EVERY === 0 && (
              <>
                <mesh geometry={post} position={[DECK_WIDTH / 2 - 0.15, -1.6, 0]} castShadow receiveShadow>
                  <meshStandardMaterial color={PALETTE.woodShade} {...CLAY} />
                </mesh>
                <mesh geometry={post} position={[-DECK_WIDTH / 2 + 0.15, -1.6, 0]} castShadow receiveShadow>
                  <meshStandardMaterial color={PALETTE.woodShade} {...CLAY} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
