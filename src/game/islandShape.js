// Contorno irregular de una isla: un radio que varía con el ángulo como suma de
// unos pocos armónicos. Es determinista a partir de la semilla, así que todos
// los clientes generan exactamente el mismo mundo sin guardarlo en Firestore.

// Generador determinista compartido: el mundo debe salir idéntico en todos
// los clientes sin guardarlo en Firestore.
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deja sitio para el talud de la mancha de hierba (~1 unidad) y para que
// siga viéndose playa de arena alrededor de toda la isla.
const MEADOW_MARGIN = 1.9;

const HARMONICS = [
  { k: 2, weight: 1 },
  { k: 3, weight: 0.62 },
  { k: 5, weight: 0.34 },
  { k: 7, weight: 0.18 },
];

function fitInside(center, innerRadiusAt, outerRadiusAt, margin, samples = 72) {
  const isInside = (x, z) => Math.hypot(x, z) <= outerRadiusAt(Math.atan2(z, x)) - margin;
  let scale = 1;

  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * Math.PI * 2;
    const dx = Math.cos(theta);
    const dz = Math.sin(theta);
    const r = innerRadiusAt(theta);
    const at = (k) => isInside(center[0] + dx * r * k, center[1] + dz * r * k);
    if (at(1)) continue;

    let lo = 0;
    let hi = 1;
    for (let it = 0; it < 12; it++) {
      const mid = (lo + hi) / 2;
      if (at(mid)) lo = mid;
      else hi = mid;
    }
    scale = Math.min(scale, lo);
  }

  return scale;
}

export function makeIslandShape({ seed = 1, radius = 9, wobble = 0.2, meadows = 2 } = {}) {
  const random = makeRandom(seed);
  const terms = HARMONICS.map((h) => ({
    k: h.k,
    amp: wobble * h.weight * (0.6 + random() * 0.8),
    phase: random() * Math.PI * 2,
  }));

  function radiusAt(theta) {
    let factor = 1;
    for (const t of terms) factor += t.amp * Math.sin(t.k * theta + t.phase);
    return radius * factor;
  }

  // Coordenadas locales a la isla. `margin` deja las casillas separadas del
  // borde para que no queden colgando sobre el talud.
  function contains(x, z, margin = 0) {
    return Math.hypot(x, z) <= radiusAt(Math.atan2(z, x)) - margin;
  }

  // Manchas de hierba en el interior. Se quedan lejos del borde para que la
  // arena siga leyéndose como playa alrededor de toda la isla.
  const patches = [];
  for (let i = 0; i < meadows; i++) {
    const angle = random() * Math.PI * 2;
    const dist = radius * (0.05 + random() * 0.26);
    const center = [Math.cos(angle) * dist, Math.sin(angle) * dist];
    const shape = makeIslandShape({
      seed: seed * 977 + i * 31 + 7,
      radius: radius * (0.28 + random() * 0.22),
      wobble: 0.32,
      meadows: 0,
    });
    // El talud de la hierba sobresale casi una unidad por debajo del contorno,
    // así que el margen lo cubre además de dejar playa alrededor.
    const scale = fitInside(center, shape.radiusAt, radiusAt, MEADOW_MARGIN);
    if (scale > 0.25) patches.push({ center, shape, scale });
  }

  // Radio real con el wobble aplicado: es lo que hay que reservar al colocar
  // la forma sobre una isla, no el radio nominal.
  let maxRadius = 0;
  for (let i = 0; i < 128; i++) maxRadius = Math.max(maxRadius, radiusAt((i / 128) * Math.PI * 2));

  return { seed, radius, maxRadius, radiusAt, contains, meadows: patches };
}
