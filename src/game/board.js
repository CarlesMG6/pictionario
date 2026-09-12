// src/game/board.js
// El tablero es un array plano de claves de categoría, una por casilla.
// Se deriva de la configuración de la sala, así que todos los clientes lo
// reconstruyen igual sin necesidad de guardarlo en Firestore.

export const BOARD_SIZES = {
  corta: 23,
  media: 39,
  larga: 55,
};

export function buildBoard(categories, duration) {
  const size = BOARD_SIZES[duration] || BOARD_SIZES.media;
  let catArr = Array.isArray(categories) ? categories : Object.keys(categories || {});
  if (catArr.length === 0) catArr = ['all'];
  return Array.from({ length: size }, (_, i) => catArr[i % catArr.length]);
}
