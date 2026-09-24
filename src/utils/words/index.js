// Punto único de acceso al banco de palabras.
//
// Cada categoría es un objeto { 1: [...], 2: [...], 3: [...], 4: [...], 5: [...] }
// donde el número es el nivel de dificultad de DIBUJO:
//
//   N1 Icónico    silueta única e inconfundible (sol, casa, avión)
//   N2 Específico concreto, hay que afinar rasgos (tucán, acordeón, faro)
//   N3 Compuesto  exige una escena o relación (atasco, mudanza, hora punta)
//   N4 Difícil    cualidad, término raro o abstracto anclable (resbaladizo, propina)
//   N5 Muy difícil abstracción o modismo, exige metáfora (entropía, tirar la toalla)
//
// La categoría `difficulty` tiene el suelo más alto: su N1 equivale
// aproximadamente a un N3 del resto.

import { all } from './all';
import { person } from './person';
import { object } from './object';
import { action } from './action';
import { difficulty } from './difficulty';
import {
  movies, famous, insect, food, animal, occupation, musicalInstrument,
} from './themed-a';
import {
  song, game, country, app, brand, heroe, place,
} from './themed-b';

export const LEVELS = [1, 2, 3, 4, 5];

export const WORDS_BY_LEVEL = {
  all,
  person,
  object,
  action,
  difficulty,
  movies,
  famous,
  insect,
  food,
  animal,
  occupation,
  musicalInstrument,
  song,
  game,
  country,
  app,
  brand,
  heroe,
  place,
};

// Pesos por dificultad de partida. Suman 100, o sea que son porcentajes, y
// determinan de qué nivel sale cada palabra.
//
// Los tres son campanas de Gauss de desviación 1,1 sobre la escala 1-5,
// ajustadas para que la media de nivel que sale de verdad sea la pedida:
//
//   fácil    media 1,75   (campana centrada en 1,32)
//   normal   media 3,00   (campana centrada en 3,00, simétrica)
//   difícil  media 4,00   (campana centrada en 4,26)
//
// El centro solo coincide con la media en el caso de normal, que cae justo en
// mitad de la escala. En los otros dos, el corte en 1 y en 5 deja fuera una
// cola que empuja la media hacia dentro, así que la campana hay que
// desplazarla para compensar. Difícil se queda sin N1 por eso: la campana le
// da un 0,5 %, que redondea a cero.
//
// Si se tocan, hay que rehacer la cuenta: el entero de cada nivel es el que
// menos se aleja de la campana entre los que suman 100 y dan la media exacta.
export const DIFFICULTIES = [
  {
    key: 'facil',
    label: 'Fácil',
    description: 'Sobre todo palabras icónicas y concretas.',
    weights: { 1: 45, 2: 38, 3: 14, 4: 3, 5: 0 },
  },
  {
    key: 'normal',
    label: 'Normal',
    description: 'Predominan escenas y conceptos con gancho visual.',
    weights: { 1: 7, 2: 24, 3: 38, 4: 24, 5: 7 },
  },
  {
    key: 'dificil',
    label: 'Difícil',
    description: 'Sobre todo abstracciones, modismos y términos raros.',
    weights: { 1: 0, 2: 6, 3: 21, 4: 40, 5: 33 },
  },
];

export const DEFAULT_DIFFICULTY = 'normal';

export const DIFFICULTY_WEIGHTS = Object.fromEntries(
  DIFFICULTIES.map((d) => [d.key, d.weights])
);

export function getLevels(category) {
  return WORDS_BY_LEVEL[category] || WORDS_BY_LEVEL.all;
}

/** Todas las palabras de una categoría, sin distinguir nivel. */
export function getAllWords(category) {
  const levels = getLevels(category);
  return LEVELS.flatMap((lvl) => levels[lvl] || []);
}

/**
 * Elige un nivel respetando los pesos de la dificultad, descartando los
 * niveles que no tengan palabras disponibles y renormalizando.
 */
function pickLevel(levels, weights, isAvailable) {
  const candidates = LEVELS.filter(
    (lvl) => (levels[lvl] || []).some(isAvailable) && (weights[lvl] || 0) > 0
  );
  if (candidates.length === 0) return null;
  const total = candidates.reduce((sum, lvl) => sum + weights[lvl], 0);
  let roll = Math.random() * total;
  for (const lvl of candidates) {
    roll -= weights[lvl];
    if (roll <= 0) return lvl;
  }
  return candidates[candidates.length - 1];
}

/**
 * Devuelve una palabra de `category` acorde a `difficulty`.
 *
 * `used` es una lista de palabras ya jugadas en la partida: se evitan
 * mientras queden alternativas, y si se agotan se reinicia el ciclo para no
 * quedarse nunca sin palabra.
 */
export function pickWord(category, difficulty = DEFAULT_DIFFICULTY, used = []) {
  const levels = getLevels(category);
  const weights = DIFFICULTY_WEIGHTS[difficulty] || DIFFICULTY_WEIGHTS[DEFAULT_DIFFICULTY];
  const usedSet = new Set(used);

  const fresh = (w) => !usedSet.has(w);
  let level = pickLevel(levels, weights, fresh);
  let pool = level ? (levels[level] || []).filter(fresh) : [];

  // Si la dificultad ha agotado todos sus niveles, reciclamos ignorando `used`.
  if (pool.length === 0) {
    level = pickLevel(levels, weights, () => true);
    pool = level ? levels[level] || [] : [];
  }
  // Último recurso: cualquier palabra de la categoría.
  if (pool.length === 0) pool = getAllWords(category);
  if (pool.length === 0) return '';

  return pool[Math.floor(Math.random() * pool.length)];
}
