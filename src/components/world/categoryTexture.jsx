"use client";

import { renderToStaticMarkup } from 'react-dom/server';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { CATEGORIES } from '../../utils/CategoryWords';

const SIZE = 256;
const PAD = 0.2; // margen relativo dentro de la casilla
const cache = new Map();
const images = new Map();

// Los iconos de categoría ya existen como componentes de react-icons. En vez de
// duplicarlos como assets, se rasterizan una vez a una textura de canvas que se
// pega en la cara superior del disco. La textura se cachea por categoría.
export function getCategoryIconTexture(key) {
  if (typeof document === 'undefined') return null;
  if (cache.has(key)) return cache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);

  loadCategoryIcon(key).then((img) => {
    if (!img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    const inset = SIZE * PAD;
    ctx.drawImage(img, inset, inset, SIZE - inset * 2, SIZE - inset * 2);
    texture.needsUpdate = true;
  });

  return texture;
}

// El icono de categoría rasterizado, como promesa. La casilla del mundo puede
// pintarse antes de que llegue y repintarse después, pero el retrato de
// `tilePortrait` se saca de un solo disparo y necesita esperarlo.
export function loadCategoryIcon(key) {
  if (typeof document === 'undefined') return Promise.resolve(null);
  if (images.has(key)) return images.get(key);

  const Icon = CATEGORIES.find((c) => c.key === key)?.icon;
  if (!Icon) return Promise.resolve(null);

  // react-icons pinta con fill="currentColor" y un style inline de color, así
  // que basta con pasarle el color para que salga blanco dentro del <img>.
  const svg = renderToStaticMarkup(<Icon color="#ffffff" size={SIZE} />);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

  images.set(key, promise);
  return promise;
}
