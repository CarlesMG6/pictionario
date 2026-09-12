import { CatmullRomCurve3, Vector3 } from 'three';
import { makeRandom } from './islandShape';
import { DECK_LIFT } from './worldConstants';

const PLANK_SPACING = 0.48;


// Reparte las casillas a lo largo de una curva suave y marca cuáles caen sobre
// agua. Esas llevan pasarela debajo, de forma que el recorrido cruza de isla a
// isla sin interrumpirse: la casilla va encima del puente. En los tramos de
// tierra, en cambio, el camino se marca con un sendero de guijarros.
export function buildPathLayout({
  controlPoints,
  tileCount,
  islands,
  surfaceY = 0,
  margin = 1.6,
  seed = 1,
}) {
  const curve = new CatmullRomCurve3(
    controlPoints.map(([x, z]) => new Vector3(x, surfaceY, z)),
    false,
    'catmullrom',
    0.5,
  );

  const onLand = (x, z) =>
    islands.some((island) =>
      island.shape.contains(x - island.position[0], z - island.position[2], margin),
    );

  const sample = (t) => {
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    return {
      position: [point.x, surfaceY, point.z],
      rotation: Math.atan2(tangent.x, tangent.z),
      onWater: !onLand(point.x, point.z),
    };
  };

  const tiles = Array.from({ length: tileCount }, (_, i) => {
    const s = sample(tileCount === 1 ? 0 : i / (tileCount - 1));
    return {
      index: i,
      ...s,
      // Las casillas sobre agua se apoyan en los tablones, no en el agua.
      position: [s.position[0], surfaceY + (s.onWater ? DECK_LIFT : 0), s.position[2]],
    };
  });

  // Los tablones se muestrean mucho más fino que las casillas para que la
  // pasarela sea continua y no una fila de islotes bajo cada disco.
  const steps = Math.ceil(curve.getLength() / PLANK_SPACING);
  const random = makeRandom(seed);
  const deck = [];
  const trail = [];

  for (let i = 0; i <= steps; i++) {
    const s = sample(i / steps);

    if (s.onWater) {
      deck.push({ ...s, step: i });
      continue;
    }

    if (i % 2 !== 0) continue;
    // Perpendicular al avance: los guijarros bordean el camino en vez de
    // quedar debajo de las casillas.
    const perpX = Math.cos(s.rotation);
    const perpZ = -Math.sin(s.rotation);
    const pebbles = 1 + Math.floor(random() * 2);
    for (let k = 0; k < pebbles; k++) {
      const side = random() < 0.5 ? -1 : 1;
      const lateral = side * (1.25 + random() * 0.75);
      trail.push({
        position: [s.position[0] + perpX * lateral, surfaceY, s.position[2] + perpZ * lateral],
        scale: 0.1 + random() * 0.14,
        rotation: random() * Math.PI * 2,
      });
    }
  }

  return { curve, tiles, deck, trail };
}
