// src/game/board.js
// El tablero es un array plano de claves de categoría, una por casilla.
// Se deriva de la configuración de la sala, así que todos los clientes lo
// reconstruyen igual sin necesidad de guardarlo en Firestore.

// Casillas de cada duración. Van de diez en diez para que la diferencia entre
// una y otra se note en la mesa: la media es la partida de referencia y las
// otras dos son media hora menos y media hora más, a ojo.
export const BOARD_SIZES = {
  corta: 15,
  media: 25,
  larga: 35,
};

export function buildBoard(categories, duration) {
  const size = BOARD_SIZES[duration] || BOARD_SIZES.media;
  let catArr = Array.isArray(categories) ? categories : Object.keys(categories || {});
  if (catArr.length === 0) catArr = ['all'];
  return Array.from({ length: size }, (_, i) => catArr[i % catArr.length]);
}
