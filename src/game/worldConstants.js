// Constantes compartidas entre la generación del mundo y su dibujado. Viven
// aquí para que no se dupliquen: si la superficie de las islas cambia de altura,
// el generador y los componentes tienen que moverse a la vez.

// Altura de la meseta de las islas sobre el nivel del mar.
export const ISLAND_TOP = 0.75;

// Inclinación del talud que baja de la meseta al agua.
export const SLOPE_DEG = 20;

// La pasarela va por encima de la arena: a la misma altura, las dos superficies
// se solapaban y parpadeaban al renderizar.
export const DECK_LIFT = 0.14;
