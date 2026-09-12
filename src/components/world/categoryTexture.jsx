"use client";

import { renderToStaticMarkup } from 'react-dom/server';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { CATEGORIES } from '../../utils/CategoryWords';

const SIZE = 256;
const PAD = 0.2; // margen relativo dentro de la casilla
const cache = new Map();

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

  const Icon = CATEGORIES.find((c) => c.key === key)?.icon;
  if (!Icon) return texture;

  // react-icons pinta con fill="currentColor" y un style inline de color, así
  // que basta con pasarle el color para que salga blanco dentro del <img>.
  const svg = renderToStaticMarkup(<Icon color="#ffffff" size={SIZE} />);
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    const inset = SIZE * PAD;
    ctx.drawImage(img, inset, inset, SIZE - inset * 2, SIZE - inset * 2);
    texture.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return texture;
}
