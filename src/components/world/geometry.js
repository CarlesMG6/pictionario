import { BufferAttribute, BufferGeometry, ExtrudeGeometry, LatheGeometry, Shape, Vector2 } from 'three';

// Cilindro con los cantos redondeados: se revoluciona un perfil alrededor del
// eje Y. Es la forma base de casi todo el mundo (casillas, troncos, islas): el
// bisel constante es lo que da la lectura de arcilla en vez de la de caja.
export function roundedCylinderGeometry({
  radius = 1,
  height = 0.4,
  corner = 0.08,
  radialSegments = 48,
  cornerSegments = 5,
} = {}) {
  const r = Math.min(corner, radius * 0.5, height * 0.5);
  const half = height / 2;
  const pts = [new Vector2(0, -half)];

  for (let i = 0; i <= cornerSegments; i++) {
    const a = -Math.PI / 2 + (i / cornerSegments) * (Math.PI / 2);
    pts.push(new Vector2(radius - r + Math.cos(a) * r, -half + r + Math.sin(a) * r));
  }
  for (let i = 0; i <= cornerSegments; i++) {
    const a = (i / cornerSegments) * (Math.PI / 2);
    pts.push(new Vector2(radius - r + Math.cos(a) * r, half - r + Math.sin(a) * r));
  }

  pts.push(new Vector2(0, half));
  return new LatheGeometry(pts, radialSegments);
}

// Variante cónica para troncos y rocas: el radio superior difiere del inferior.
export function taperedCylinderGeometry({
  bottomRadius = 1,
  topRadius = 0.7,
  height = 1,
  corner = 0.06,
  radialSegments = 32,
  cornerSegments = 4,
} = {}) {
  const half = height / 2;
  const rb = Math.min(corner, bottomRadius * 0.5, half);
  const rt = Math.min(corner, topRadius * 0.5, half);
  const pts = [new Vector2(0, -half)];

  for (let i = 0; i <= cornerSegments; i++) {
    const a = -Math.PI / 2 + (i / cornerSegments) * (Math.PI / 2);
    pts.push(new Vector2(bottomRadius - rb + Math.cos(a) * rb, -half + rb + Math.sin(a) * rb));
  }
  for (let i = 0; i <= cornerSegments; i++) {
    const a = (i / cornerSegments) * (Math.PI / 2);
    pts.push(new Vector2(topRadius - rt + Math.cos(a) * rt, half - rt + Math.sin(a) * rt));
  }

  pts.push(new Vector2(0, half));
  return new LatheGeometry(pts, radialSegments);
}

// Volumen por lofting de un contorno irregular: cada anillo es el mismo
// contorno escalado y/o desplazado hacia fuera, a una altura distinta. Sirve
// para islas (talud tendido hacia el mar), montañas (con terrazas) y rocas.
//
// `rings` va de arriba abajo y el radio debe crecer al bajar, que es lo que
// mantiene coherente el sentido de las caras.
export function loftedBlobGeometry({ radiusAt, rings, radialSegments = 96 }) {
  const R = rings.length;
  const S = radialSegments;
  const vertexCount = R * S + 2;

  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const useColor = rings.some((r) => r.color);

  const write = (i, x, y, z, color) => {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    if (color) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
  };

  const TOP = 0;
  const BOTTOM = vertexCount - 1;
  const ringVertex = (ring, seg) => 1 + ring * S + seg;

  const topCenter = rings[0].center || [0, 0];
  const bottomCenter = rings[R - 1].center || [0, 0];
  write(TOP, topCenter[0], rings[0].y, topCenter[1], rings[0].color);
  write(BOTTOM, bottomCenter[0], rings[R - 1].y, bottomCenter[1], rings[R - 1].color);

  for (let i = 0; i < R; i++) {
    const { y, color, scale = 1, offset = 0, center = [0, 0] } = rings[i];
    const contour = rings[i].radiusAt || radiusAt;
    for (let j = 0; j < S; j++) {
      const theta = (j / S) * Math.PI * 2;
      const r = contour(theta) * scale + offset;
      write(ringVertex(i, j), Math.cos(theta) * r + center[0], y, Math.sin(theta) * r + center[1], color);
    }
  }

  const indices = [];
  for (let j = 0; j < S; j++) {
    const j1 = (j + 1) % S;
    indices.push(TOP, ringVertex(0, j1), ringVertex(0, j));
    indices.push(BOTTOM, ringVertex(R - 1, j), ringVertex(R - 1, j1));
  }
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < S; j++) {
      const j1 = (j + 1) % S;
      const a = ringVertex(i, j);
      const b = ringVertex(i, j1);
      const c = ringVertex(i + 1, j1);
      const d = ringVertex(i + 1, j);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  if (useColor) geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Anillos de un talud a `slopeDeg` grados sobre la horizontal, desde la meseta
// hasta `depth` por debajo del nivel del mar.
export function slopeRings({ topY, depth, slopeDeg = 20, steps = 5, colors = [] }) {
  const run = 1 / Math.tan((slopeDeg * Math.PI) / 180);
  const total = topY + depth;
  const rings = [{ y: topY, offset: 0, color: colors[0] }];
  // Pequeño labio antes del talud: evita una arista dura en el borde superior.
  rings.push({ y: topY - total * 0.04, offset: total * 0.04 * run * 0.45, color: colors[0] });
  for (let i = 1; i <= steps; i++) {
    const drop = total * (i / steps);
    rings.push({
      y: topY - drop,
      offset: drop * run,
      color: colors[Math.min(colors.length - 1, i)] || colors[colors.length - 1],
    });
  }
  return rings;
}

// Tablón: contorno de cuatro esquinas libres extruido con bisel. Frente a una
// caja redondeada, permite que ningún tablón sea perfectamente rectangular —
// que es lo que hace que la pasarela no se lea como una regla.
export function plankGeometry({ corners, thickness = 0.2, bevel = 0.045 }) {
  const shape = new Shape();
  shape.moveTo(corners[0][0], corners[0][1]);
  for (let i = 1; i < corners.length; i++) shape.lineTo(corners[i][0], corners[i][1]);
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, {
    depth: thickness - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 1,
  });

  // ExtrudeGeometry crece en +Z; lo tumbamos para que el grosor quede en Y y
  // el contorno en el plano XZ, y lo centramos verticalmente.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -(thickness / 2 - bevel), 0);
  geometry.computeVertexNormals();
  return geometry;
}
