"use client";

import { CanvasTexture, SRGBColorSpace } from 'three';

const SIZE = 256;
const cache = new Map();

// La calca va tumbada en la cara superior de la casilla y la cámara la mira en
// picado, así que en pantalla sale aplastada. Se dibuja estirada en vertical
// para compensar y que la letra se lea recta.
const STRETCH = 1.7;

// next/font genera un nombre de familia propio y lo expone en esta variable;
// leerla es la única forma de pedirle a canvas la misma tipografía que usa el
// resto de la interfaz.
function displayFamily() {
  if (typeof document === 'undefined') return 'sans-serif';
  const value = getComputedStyle(document.documentElement).getPropertyValue('--font-display');
  return `${value.trim() || ''}, 'Baloo 2', system-ui, sans-serif`.replace(/^,\s*/, '');
}

function paint(canvas, texture, letter) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.scale(1, STRETCH);
  ctx.font = `800 ${SIZE * 0.62}px ${displayFamily()}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(letter, 0, SIZE * 0.02);
  ctx.restore();
  texture.needsUpdate = true;
}

// Letra blanca sobre transparente, para imprimirla en una casilla igual que se
// imprime el icono de categoría. Se cachea por letra.
export function getLetterTexture(letter) {
  if (typeof document === 'undefined') return null;
  if (cache.has(letter)) return cache.get(letter);

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(letter, texture);

  // Primer trazo con lo que haya cargado, y repintado cuando la fuente esté
  // lista: si solo se espera, la casilla sale vacía durante el primer segundo.
  paint(canvas, texture, letter);
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => paint(canvas, texture, letter));
  }

  return texture;
}
