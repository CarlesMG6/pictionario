// Paleta del mundo. Deliberadamente apagada: los colores saturados se reservan
// para las casillas de categoría, que son la información del juego.
export const PALETTE = {
  seaDeep: '#1B8FC4',
  sea: '#3FB8DE',
  seaShallow: '#8FE5F0',
  sand: '#F2DCB3',
  sandShade: '#DEC195',
  sandWet: '#C3A176',
  sandPebble: '#C8AA77',
  rock: '#8C93A8',
  rockShade: '#6E7488',
  rockDeep: '#555B6E',
  foliage: '#72C86A',
  foliageLight: '#8FD97F',
  foliageShade: '#3F9E58',
  wood: '#A9714B',
  woodShade: '#7A4E33',
  cream: '#FBF3E2',
  skyTop: '#6FCDF2',
  skyHorizon: '#CDEEFF',
  cloud: '#FFFFFF',
};

// Acabado arcilla: mate, sin metalness, sin texturas. Es lo que unifica la
// escena y la separa del aspecto "plástico LEGO".
export const CLAY = { roughness: 0.78, metalness: 0 };
