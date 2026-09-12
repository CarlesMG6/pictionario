import { makeIslandShape, makeRandom } from './islandShape';
import { buildPathLayout } from './pathLayout';
import { contourGap, placeShape, scatterOnIsland, shapeGapTo } from './scatter';
import { ISLAND_TOP } from './worldConstants';

// Se guarda en la sala al crearla. Si el generador cambia de forma que mueva
// las casillas, hay que subirla y decidir qué hacer con las salas antiguas:
// una partida en curso no puede cambiar de mapa a mitad.
export const WORLD_VERSION = 1;

// Separación entre centros de casilla. El disco mide 1.2 de radio, así que por
// debajo de ~2.8 empiezan a tocarse.
const TILE_SPACING = 3.4;
const TILES_PER_ISLAND = 9;
const MAX_ISLANDS = 8;

// Aire mínimo entre la falda de un accidente del terreno y el disco de una
// casilla. Es la garantía que el generador no puede romper.
const LANDMARK_CLEARANCE = 2.2;

const TAU = Math.PI * 2;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const angularGap = (a, b) => Math.abs(wrapAngle(a - b));

// --- Islas -----------------------------------------------------------------

// Las islas se encadenan: cada una sale de la anterior con un giro suave, de
// modo que el archipiélago serpentea y el camino lo puede recorrer de punta a
// punta sin volver sobre sus pasos.
function layIslands({ random, tileCount, scale, seed }) {
  const count = Math.min(MAX_ISLANDS, Math.max(2, Math.round(tileCount / TILES_PER_ISLAND)));
  const islands = [];
  let heading = random() * TAU;
  let side = random() < 0.5 ? 1 : -1;

  for (let i = 0; i < count; i++) {
    const radius = (7.5 + random() * 4.5) * scale;
    const shape = makeIslandShape({
      seed: seed * 31 + i * 617 + 5,
      radius,
      wobble: 0.2 + random() * 0.1,
      meadows: 1 + Math.floor(random() * 2),
    });

    if (i === 0) {
      islands.push({ position: [0, 0, 0], shape });
      continue;
    }

    const previous = islands[i - 1];
    let placed = null;

    for (let tries = 0; tries < 30 && !placed; tries++) {
      const candidateHeading = heading + side * (0.6 + random() * 0.95);
      const gap = (6 + random() * 6) * scale;
      // El vano se mide entre contornos reales en la dirección de avance, que
      // es justo por donde va a cruzar el puente.
      const distance =
        previous.shape.radiusAt(candidateHeading) +
        shape.radiusAt(candidateHeading + Math.PI) +
        gap;
      const position = [
        previous.position[0] + Math.cos(candidateHeading) * distance,
        0,
        previous.position[2] + Math.sin(candidateHeading) * distance,
      ];

      // No basta con separarse de la anterior: el rumbo puede doblar sobre una
      // isla ya colocada y solaparla.
      const candidate = { position, shape };
      const clear = islands.every((other) => contourGap(candidate, other) > 4 * scale);

      if (clear) {
        placed = candidate;
        heading = candidateHeading;
        side = -side;
      }
    }

    // Si no hay rumbo válido, el archipiélago se queda con las islas que caben.
    if (!placed) break;
    islands.push(placed);
  }

  return islands;
}

// Por dónde entra y sale el camino de cada isla: hacia la anterior y hacia la
// siguiente. Se conocen antes de trazar nada, así que los accidentes ya pueden
// colocarse lejos de las puertas.
function islandGates(islands) {
  return islands.map((island, i) => {
    const previous = islands[i - 1];
    const next = islands[i + 1];
    const angleTo = (other) =>
      Math.atan2(other.position[2] - island.position[2], other.position[0] - island.position[0]);

    const toPrevious = previous ? angleTo(previous) : null;
    const toNext = next ? angleTo(next) : null;

    return {
      entry: toPrevious !== null ? toPrevious : toNext + Math.PI,
      exit: toNext !== null ? toNext : toPrevious + Math.PI,
    };
  });
}

// --- Accidentes del terreno ------------------------------------------------

// Se colocan antes de trazar el camino, para que este los pueda rodear. La
// última isla lleva siempre el suyo: es la meta.
function placeLandmarks({ islands, gates, random, scale, seed }) {
  return islands.map((island, i) => {
    const isGoal = i === islands.length - 1;
    if (!isGoal && random() > 0.5) return null;

    const gate = gates[i];
    const gatePoints = [gate.entry, gate.exit].map((angle) => [
      island.position[0] + Math.cos(angle) * island.shape.radiusAt(angle) * 0.9,
      0,
      island.position[2] + Math.sin(angle) * island.shape.radiusAt(angle) * 0.9,
    ]);

    const largest = island.shape.radius * (isGoal ? 0.46 : 0.38);
    for (let radius = largest; radius >= island.shape.radius * 0.16; radius -= 0.35 * scale) {
      const shape = makeIslandShape({
        seed: seed * 97 + i * 313 + 11,
        radius,
        wobble: 0.28,
        meadows: 0,
      });
      const spot = placeShape({
        shape,
        island,
        avoid: gatePoints,
        margin: 1.2 * scale,
        clearance: 2.5 * scale,
        seed: seed * 13 + i * 71,
        reachFactor: 0.45,
      });

      if (spot) {
        return {
          shape,
          height: radius * 1.9,
          position: [spot.position[0], ISLAND_TOP - 0.25, spot.position[2]],
          goal: isGoal,
        };
      }
    }

    return null;
  });
}

// --- Trazado ---------------------------------------------------------------

// Waypoints del camino dentro de una isla: entra por su puerta, serpentea y
// sale por la otra. Cuando hay un accidente, se recorre la isla por el lado que
// más se aleja de él.
function islandWaypoints({ island, gate, landmark, random, isLast }) {
  const { position, shape } = island;
  const pointAt = (angle, factor) => [
    position[0] + Math.cos(angle) * shape.radiusAt(angle) * factor,
    position[2] + Math.sin(angle) * shape.radiusAt(angle) * factor,
  ];

  const points = [pointAt(gate.entry, 0.92)];

  let sweep = wrapAngle(gate.exit - gate.entry);
  if (Math.abs(sweep) < 0.001) sweep = Math.PI;

  if (landmark) {
    const landmarkAngle = Math.atan2(
      landmark.position[2] - position[2],
      landmark.position[0] - position[0],
    );
    const alternative = sweep - Math.sign(sweep) * TAU;
    const midOf = (s) => gate.entry + s / 2;
    if (angularGap(midOf(alternative), landmarkAngle) > angularGap(midOf(sweep), landmarkAngle)) {
      sweep = alternative;
    }
  }

  const steps = 3 + Math.floor(random() * 2);
  for (let j = 1; j <= steps; j++) {
    const angle = gate.entry + sweep * (j / (steps + 1));
    points.push(pointAt(angle, 0.62 + random() * 0.2));
  }

  if (isLast && landmark) {
    // El recorrido muere al pie del accidente de la última isla: es la meta, y
    // conviene que se lea como tal.
    //
    // El punto se mide desde el centro del accidente, no desde el de la isla:
    // cuando el accidente cae cerca del centro de la isla, medirlo desde ahí da
    // una distancia negativa y la última casilla acaba encima de él.
    const previous = points[points.length - 1];
    const approach = Math.atan2(
      previous[1] - landmark.position[2],
      previous[0] - landmark.position[0],
    );
    const reach = landmark.shape.radiusAt(approach) + LANDMARK_CLEARANCE + 0.8;
    let x = landmark.position[0] + Math.cos(approach) * reach;
    let z = landmark.position[2] + Math.sin(approach) * reach;

    // Y sin salirse de la isla por el otro lado.
    const outward = Math.atan2(z - position[2], x - position[0]);
    const limit = shape.radiusAt(outward) * 0.88;
    const distance = Math.hypot(x - position[0], z - position[2]);
    if (distance > limit) {
      x = position[0] + ((x - position[0]) * limit) / distance;
      z = position[2] + ((z - position[2]) * limit) / distance;
    }

    points.push([x, z]);
  } else {
    points.push(pointAt(gate.exit, 0.92));
  }

  return points;
}

function buildControlPoints({ islands, gates, landmarks, random }) {
  const points = [];

  islands.forEach((island, i) => {
    const waypoints = islandWaypoints({
      island,
      gate: gates[i],
      landmark: landmarks[i],
      random,
      isLast: i === islands.length - 1,
    });

    if (i > 0) {
      // Punto intermedio sobre el agua, desviado de la recta: el puente sale
      // curvo en vez de tirado a escuadra.
      const from = points[points.length - 1];
      const to = waypoints[0];
      const dx = to[0] - from[0];
      const dz = to[1] - from[1];
      const length = Math.hypot(dx, dz) || 1;
      const bend = (random() - 0.5) * length * 0.28;
      points.push([
        (from[0] + to[0]) / 2 + (-dz / length) * bend,
        (from[1] + to[1]) / 2 + (dx / length) * bend,
      ]);
    }

    points.push(...waypoints);
  });

  return points;
}

// --- Generador -------------------------------------------------------------

function attemptWorld({ seed, tileCount, scale }) {
  const random = makeRandom(seed);
  const islands = layIslands({ random, tileCount, scale, seed });
  const gates = islandGates(islands);
  const landmarks = placeLandmarks({ islands, gates, random, scale, seed });
  const controlPoints = buildControlPoints({ islands, gates, landmarks, random });

  const layout = buildPathLayout({
    controlPoints,
    tileCount,
    islands,
    surfaceY: ISLAND_TOP,
    margin: 1.6 * scale,
    seed: seed + 977,
  });

  return { islands, gates, landmarks, layout, random };
}

// Rodear un accidente al trazar es una preferencia, no una garantía: la curva
// suavizada puede acercarse más de lo previsto. Esto sí garantiza — el
// accidente se encoge hasta que ninguna casilla queda dentro de su falda, y si
// no hay tamaño que valga, se retira.
function enforceLandmarkClearance({ landmarks, islands, tiles, seed }) {
  return landmarks.map((landmark, i) => {
    if (!landmark) return null;

    let current = landmark;
    for (let attempt = 0; attempt < 14; attempt++) {
      const worst = tiles.reduce(
        (min, tile) =>
          Math.min(
            min,
            shapeGapTo({ shape: current.shape, center: current.position, point: tile.position }),
          ),
        Infinity,
      );
      if (worst >= LANDMARK_CLEARANCE) return current;

      const radius = current.shape.radius * 0.88;
      if (radius < islands[i].shape.radius * 0.1) return null;

      current = {
        ...current,
        shape: makeIslandShape({ seed: seed * 97 + i * 313 + 11, radius, wobble: 0.28, meadows: 0 }),
        height: radius * 1.9,
      };
    }

    return null;
  });
}

// Construye el mundo entero a partir del tablero y una semilla. Es
// determinista: misma semilla, mismo mundo en todos los clientes, sin guardar
// nada en la base de datos.
export function buildWorld({ seed = 1, board = [] }) {
  const tileCount = Math.max(2, board.length);

  // El camino tiene que dar de sí para alojar las casillas con una separación
  // legible. Se genera, se mide y se reescala el archipiélago: la longitud
  // crece casi lineal con la escala, así que converge en un par de pasadas.
  const target = (tileCount - 1) * TILE_SPACING;
  let scale = 1;
  let world = attemptWorld({ seed, tileCount, scale });

  for (let attempt = 0; attempt < 3; attempt++) {
    const ratio = target / world.layout.curve.getLength();
    if (ratio > 0.9 && ratio < 1.1) break;
    scale = Math.min(2.5, Math.max(0.5, scale * ratio));
    world = attemptWorld({ seed, tileCount, scale });
  }

  const { islands, landmarks, layout, random } = world;
  const safeLandmarks = enforceLandmarkClearance({
    landmarks,
    islands,
    tiles: layout.tiles,
    seed,
  });

  const tiles = layout.tiles.map((tile, i) => ({ ...tile, category: board[i] }));
  const blocked = [
    ...tiles.map((tile) => tile.position),
    ...safeLandmarks.filter(Boolean).map((landmark) => landmark.position),
  ];

  const rocks = islands.flatMap((island, i) =>
    scatterOnIsland({
      island,
      count: 2 + Math.floor(random() * 3),
      seed: seed * 41 + i * 97,
      margin: 2.6 * scale,
      avoid: blocked,
      avoidRadius: 4 * scale,
      minSpacing: 5 * scale,
    }).map((position, k) => ({
      seed: seed + i * 7 + k * 3,
      position: [position[0], ISLAND_TOP, position[2]],
      scale: (0.85 + random() * 0.7) * scale,
      count: 3 + Math.floor(random() * 2),
    })),
  );

  const palms = islands.flatMap((island, i) =>
    scatterOnIsland({
      island,
      count: 3 + Math.floor(random() * 3),
      seed: seed * 53 + i * 131,
      margin: 2.7 * scale,
      avoid: [...blocked, ...rocks.map((rock) => rock.position)],
      avoidRadius: 2.6 * scale,
      minSpacing: 3.2 * scale,
    }).map((position) => ({
      position: [position[0], ISLAND_TOP, position[2]],
      rotation: random() * TAU,
      scale: (0.72 + random() * 0.35) * scale,
    })),
  );

  const plants = islands.flatMap((island, i) =>
    scatterOnIsland({
      island,
      count: 20 + Math.floor(random() * 10),
      seed: seed * 67 + i * 149,
      margin: 1.3 * scale,
      avoid: blocked,
      avoidRadius: 1.6 * scale,
      minSpacing: 1.05 * scale,
    }).map((position) => ({
      position: [position[0], ISLAND_TOP, position[2]],
      variant: Math.floor(random() * 4),
      rotation: random() * TAU,
      scale: (0.7 + random() * 0.7) * scale,
      tone: Math.floor(random() * 3),
    })),
  );

  return {
    seed,
    scale,
    islands,
    landmarks: safeLandmarks,
    layout: { ...layout, tiles },
    rocks,
    palms,
    plants,
  };
}

// Extensión del mundo generado. La usan el encuadre amplio de la cámara y el
// laboratorio; se calcula con el radio real de cada contorno para que no se
// quede corta con las islas más irregulares.
export function worldBounds(world) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const island of world.islands) {
    const reach = island.shape.maxRadius;
    minX = Math.min(minX, island.position[0] - reach);
    maxX = Math.max(maxX, island.position[0] + reach);
    minZ = Math.min(minZ, island.position[2] - reach);
    maxZ = Math.max(maxZ, island.position[2] + reach);
  }

  return {
    center: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2],
    span: Math.max(maxX - minX, maxZ - minZ),
  };
}

// Semilla de reserva para salas creadas antes de que se guardara `world_seed`.
// No es criptografía: solo tiene que ser estable y repartir bien.
export function seedFromString(value) {
  let hash = 2166136261;
  for (let i = 0; i < String(value).length; i++) {
    hash ^= String(value).charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) || 1;
}
