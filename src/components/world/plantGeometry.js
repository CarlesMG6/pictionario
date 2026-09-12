import { BoxGeometry, ConeGeometry, CylinderGeometry, SphereGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeRandom } from '../../game/islandShape';

// Cada variante se fusiona en una sola geometría para poder instanciarla: con
// cuarenta matas repartidas por el mapa, un mesh por hoja se comería los draw
// calls sin dar nada a cambio.

function tuft(seed) {
  const random = makeRandom(seed);
  const blades = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + random() * 0.5;
    const height = 0.42 + random() * 0.3;
    const blade = new ConeGeometry(0.05, height, 4, 1);
    blade.translate(0, height / 2, 0);
    blade.rotateZ((0.25 + random() * 0.3) * (random() < 0.5 ? -1 : 1));
    blade.rotateY(angle);
    blade.translate(Math.cos(angle) * 0.07, 0, Math.sin(angle) * 0.07);
    blades.push(blade);
  }
  return mergeGeometries(blades);
}

function bush(seed) {
  const random = makeRandom(seed);
  const lumps = [];
  for (let i = 0; i < 5; i++) {
    const r = 0.15 + random() * 0.12;
    const lump = new SphereGeometry(r, 12, 9);
    const angle = (i / 5) * Math.PI * 2;
    const dist = i === 0 ? 0 : 0.13 + random() * 0.1;
    lump.translate(Math.cos(angle) * dist, r * (0.65 + random() * 0.4), Math.sin(angle) * dist);
    lumps.push(lump);
  }
  return mergeGeometries(lumps);
}

function fern(seed) {
  const random = makeRandom(seed);
  const fronds = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + random() * 0.4;
    const frond = new SphereGeometry(1, 10, 7);
    frond.scale(0.32, 0.045, 0.11);
    frond.translate(0.28, 0, 0);
    frond.rotateZ(0.42 + random() * 0.22);
    frond.rotateY(angle);
    frond.translate(0, 0.12, 0);
    fronds.push(frond);
  }
  return mergeGeometries(fronds);
}

function reeds(seed) {
  const random = makeRandom(seed);
  const stems = [];
  for (let i = 0; i < 4; i++) {
    const height = 0.55 + random() * 0.45;
    const stem = new CylinderGeometry(0.022, 0.035, height, 5);
    stem.translate(0, height / 2, 0);
    stem.rotateZ((random() * 2 - 1) * 0.22);
    const angle = random() * Math.PI * 2;
    stem.rotateY(angle);
    stem.translate(Math.cos(angle) * 0.09, 0, Math.sin(angle) * 0.09);
    stems.push(stem);

    const tip = new BoxGeometry(0.05, 0.13, 0.05);
    tip.translate(Math.cos(angle) * 0.09, height, Math.sin(angle) * 0.09);
    stems.push(tip);
  }
  return mergeGeometries(stems);
}

export const PLANT_VARIANTS = [tuft, bush, fern, reeds];

export function buildPlantGeometries() {
  return PLANT_VARIANTS.map((build, i) => {
    const geometry = build(i * 137 + 11);
    geometry.computeVertexNormals();
    return geometry;
  });
}

// Guijarro del sendero: una esfera achatada y deformada, lo bastante pequeña
// como para que no haga falta más detalle.
export function buildPebbleGeometry() {
  const pebble = new SphereGeometry(1, 9, 6);
  pebble.scale(1, 0.55, 0.82);
  pebble.computeVertexNormals();
  return pebble;
}
