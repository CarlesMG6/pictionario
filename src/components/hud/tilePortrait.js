"use client";

import { useEffect, useState } from 'react';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { CATEGORY_COLORS } from '../../utils/CategoryWords';
import { loadCategoryIcon } from '../world/categoryTexture';
import { CLAY, PALETTE } from '../world/palette';
import { BASE_HEIGHT, TILE_HEIGHT, TILE_RADIUS, TILE_TOP, tileGeometries } from '../world/Tile';

// Retrato de una casilla para las rejillas del DOM, con el mismo criterio que
// `animalPortrait`: se rinde la malla de verdad —las geometrías que comparte
// con el tablero— a un PNG y se cachea. Montar diecinueve canvas 3D en la
// pantalla de sala gastaría un contexto WebGL por categoría sin ganar nada,
// porque ahí la casilla no se mueve.
const SIZE = 256;
const ICON_SIZE = 256;
const cache = new Map();
let renderer = null;

function getRenderer() {
  if (!renderer) {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(SIZE, SIZE, false);
    renderer.setPixelRatio(2);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.outputColorSpace = SRGBColorSpace;
  }
  return renderer;
}

function iconTextureFrom(img) {
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext('2d');
  const inset = ICON_SIZE * 0.2;
  ctx.drawImage(img, inset, inset, ICON_SIZE - inset * 2, ICON_SIZE - inset * 2);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

async function render(key) {
  const gl = getRenderer();
  const geometry = tileGeometries();

  const scene = new Scene();
  scene.add(new AmbientLight(0xffffff, 1.1));

  const light = new DirectionalLight(0xffffff, 2.5);
  light.position.set(2, 4, 2.5);
  scene.add(light);

  const fill = new DirectionalLight(0xbfe9ff, 0.85);
  fill.position.set(-2.5, 1.5, 2);
  scene.add(fill);

  const base = new Mesh(geometry.base, new MeshStandardMaterial({ color: PALETTE.cream, ...CLAY }));
  base.position.y = BASE_HEIGHT / 2;
  scene.add(base);

  const disc = new Mesh(
    geometry.tile,
    new MeshStandardMaterial({ color: CATEGORY_COLORS[key] || '#cccccc', ...CLAY }),
  );
  disc.position.y = BASE_HEIGHT + TILE_HEIGHT / 2;
  scene.add(disc);

  const img = await loadCategoryIcon(key);
  if (img) {
    const decal = new Mesh(
      new PlaneGeometry(TILE_RADIUS * 1.3, TILE_RADIUS * 1.3),
      new MeshStandardMaterial({
        map: iconTextureFrom(img),
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        ...CLAY,
      }),
    );
    decal.rotation.x = -Math.PI / 2;
    decal.position.y = TILE_TOP + 0.004;
    scene.add(decal);
  }

  // Mismo picado que la cámara del tablero, para que la casilla del selector se
  // reconozca como la que luego se pisa en el mundo.
  const camera = new PerspectiveCamera(26, 1, 0.1, 40);
  camera.position.set(0, 3.5, 4.4);
  camera.lookAt(0, TILE_TOP * 0.5, 0);

  gl.render(scene, camera);
  return gl.domElement.toDataURL('image/png');
}

export function categoryTilePortrait(key) {
  if (typeof document === 'undefined') return Promise.resolve(null);
  if (cache.has(key)) return cache.get(key);

  const promise = render(key).catch(() => null);
  cache.set(key, promise);
  return promise;
}

// En el servidor no hay WebGL, así que el retrato solo puede existir tras
// montar: pedirlo durante el render dejaría el HTML del servidor sin él y el
// del cliente con él, y React avisaría de que la hidratación no cuadra.
export function useCategoryTilePortraits(keys) {
  const [portraits, setPortraits] = useState({});
  const id = (keys || []).join('|');

  useEffect(() => {
    let alive = true;
    Promise.all((keys || []).map((key) => categoryTilePortrait(key).then((url) => [key, url]))).then(
      (entries) => {
        if (alive) setPortraits(Object.fromEntries(entries));
      },
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return portraits;
}
