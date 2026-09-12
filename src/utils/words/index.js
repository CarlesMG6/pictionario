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

// Pesos por dificultad de partida. Suman 100 y determinan de qué nivel sale
// cada palabra: fácil tira de N1-N2, normal de N3-N4, difícil de N4-N5.
export const DIFFICULTIES = [
  {
    key: 'facil',
    label: 'Fácil',
    description: 'Sobre todo palabras icónicas y concretas.',
    weights: { 1: 40, 2: 35, 3: 17, 4: 6, 5: 2 },
  },
  {
    key: 'normal',
    label: 'Normal',
    description: 'Predominan escenas y conceptos con gancho visual.',
    weights: { 1: 8, 2: 17, 3: 33, 4: 30, 5: 12 },
  },
  {
    key: 'dificil',
    label: 'Difícil',
    description: 'Sobre todo abstracciones, modismos y términos raros.',
    weights: { 1: 2, 2: 5, 3: 15, 4: 40, 5: 38 },
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
