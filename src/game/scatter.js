import { makeRandom } from './islandShape';

// Reparte puntos dentro del contorno de una isla. Por construcción nada puede
// quedar flotando sobre el agua: se rechaza cualquier posición que no esté
// dentro del contorno con margen suficiente.
export function scatterOnIsland({
  island,
  count,
  seed = 1,
  margin = 1.8,
  avoid = [],
  avoidRadius = 2.4,
  minSpacing = 1.7,
  maxTries = 600,
}) {
  const random = makeRandom(seed);
  const reach = island.shape.radius * 1.35;
  const points = [];

  for (let tries = 0; tries < maxTries && points.length < count; tries++) {
    const x = (random() * 2 - 1) * reach;
    const z = (random() * 2 - 1) * reach;
    if (!island.shape.contains(x, z, margin)) continue;

    const wx = x + island.position[0];
    const wz = z + island.position[2];
    if (avoid.some(([ax, , az]) => Math.hypot(wx - ax, wz - az) < avoidRadius)) continue;
    if (points.some(([px, , pz]) => Math.hypot(wx - px, wz - pz) < minSpacing)) continue;

    points.push([wx, 0, wz]);
  }

  return points;
}

// ¿Cabe entero el contorno de `shape`, centrado en `center`, dentro de la isla?
// Se comprueba punto a punto del contorno, no con un círculo equivalente: un
// contorno irregular es mucho más ancho en unas direcciones que en otras y
// tratarlo como círculo de su radio máximo desperdicia casi la mitad del sitio.
export function shapeFitsInside({ shape, center, island, margin = 0, samples = 48 }) {
  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * Math.PI * 2;
    const r = shape.radiusAt(theta);
    const x = center[0] + Math.cos(theta) * r - island.position[0];
    const z = center[2] + Math.sin(theta) * r - island.position[2];
    if (!island.shape.contains(x, z, margin)) return false;
  }
  return true;
}

// Separación real entre el contorno de `shape` centrado en `center` y un punto:
// se mide el radio de la forma justo en la dirección de ese punto.
export function shapeGapTo({ shape, center, point }) {
  const dx = point[0] - center[0];
  const dz = point[2] - center[2];
  return Math.hypot(dx, dz) - shape.radiusAt(Math.atan2(dz, dx));
}

// Coloca una forma grande (un accidente del terreno) en la isla, maximizando la
// separación a todo lo que hay que respetar. Devuelve null si no hay ningún
// sitio válido: nunca un punto de consolación, porque un accidente mal colocado
// pisa el tablero.
export function placeShape({
  shape,
  island,
  avoid = [],
  margin = 1,
  clearance = 2,
  seed = 1,
  samples = 900,
  // Fracción del radio de la isla dentro de la que se busca. Acotarlo empuja
  // los accidentes hacia el interior, que es donde la referencia los pone.
  reachFactor = 1.35,
}) {
  const random = makeRandom(seed);
  const reach = island.shape.radius * reachFactor;
  let best = null;
  let bestGap = -Infinity;

  for (let i = 0; i < samples; i++) {
    const center = [
      (random() * 2 - 1) * reach + island.position[0],
      0,
      (random() * 2 - 1) * reach + island.position[2],
    ];

    if (!shapeFitsInside({ shape, center, island, margin })) continue;

    let worst = Infinity;
    for (const point of avoid) worst = Math.min(worst, shapeGapTo({ shape, center, point }));
    if (worst < clearance) continue;

    if (worst > bestGap) {
      bestGap = worst;
      best = center;
    }
  }

  return best ? { position: best, clearance: bestGap } : null;
}

// Separación real entre los contornos de dos islas: se muestrea el perímetro de
// cada una contra la otra. Aproximarlo con círculos de radio máximo separa las
// islas casi medio radio de más por lado, y ese exceso se convierte en agua.
export function contourGap(a, b, samples = 64) {
  const TAU = Math.PI * 2;
  let min = Infinity;

  const probe = (from, to) => {
    for (let i = 0; i < samples; i++) {
      const theta = (i / samples) * TAU;
      const x = from.position[0] + Math.cos(theta) * from.shape.radiusAt(theta);
      const z = from.position[2] + Math.sin(theta) * from.shape.radiusAt(theta);
      const dx = x - to.position[0];
      const dz = z - to.position[2];
      min = Math.min(min, Math.hypot(dx, dz) - to.shape.radiusAt(Math.atan2(dz, dx)));
    }
  };

  probe(a, b);
  probe(b, a);
  return min;
}
