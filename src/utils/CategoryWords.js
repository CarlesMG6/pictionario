// src/utils/CategoryWords.js
//
// Metadatos de categorías + fachada sobre el banco de palabras.
// Las palabras viven en `src/utils/words/`, agrupadas por nivel de dificultad
// (1 a 5). Ver `src/utils/words/index.js` para la definición de cada nivel.

// Importación de iconos para categorías
import { FaPeopleArrows, FaUser, FaCube, FaRunning, FaStar, FaFilm, FaCrown, FaBug, FaUtensils, FaDog, FaBriefcase, FaGuitar, FaMusic, FaGamepad, FaGlobe, FaMobileAlt, FaAppleAlt, FaSuperpowers, FaMapMarkerAlt } from 'react-icons/fa';

import {
  WORDS_BY_LEVEL,
  LEVELS,
  DIFFICULTIES,
  DIFFICULTY_WEIGHTS,
  DEFAULT_DIFFICULTY,
  getAllWords,
  getLevels,
  pickWord,
} from './words';

export const CATEGORIES = [
  { key: 'all', label: 'Todos juegan', color: '#fbbf24', icon: FaPeopleArrows  },
  { key: 'person', label: 'Persona, animal o lugar', color: '#ef4444', icon: FaUser },
  { key: 'object', label: 'Objeto', color: '#3b82f6', icon: FaCube },
  { key: 'action', label: 'Acción', color: '#10b981', icon: FaRunning },
  { key: 'difficulty', label: 'Dificultad', color: '#ec4899', icon: FaStar },
  { key: 'movies', label: 'Películas o series', color: '#8b5cf6', icon: FaFilm },
  { key: 'famous', label: 'Famosos', color: '#fb923c', icon: FaCrown },
  { key: 'insect', label: 'Insectos', color: '#84cc16', icon: FaBug },
  { key: 'food', label: 'Comida y bebida', color: '#eab308', icon: FaUtensils },
  { key: 'animal', label: 'Animales', color: '#0ea5e9', icon: FaDog },
  { key: 'occupation', label: 'Profesión', color: '#6366f1', icon: FaBriefcase },
  { key: 'musicalInstrument', label: 'Instrumentos musicales', color: '#14b8a6', icon: FaGuitar },
  { key: 'song', label: 'Canciones', color: '#db2777', icon: FaMusic },
  { key: 'game', label: 'Juegos', color: '#22c55e', icon: FaGamepad },
  { key: 'country', label: 'Países', color: '#2563eb', icon: FaGlobe },
  { key: 'app', label: 'Apps o sitios web', color: '#f43f5e', icon: FaMobileAlt },
  { key: 'brand', label: 'Marcas', color: '#d97706', icon: FaAppleAlt },
  { key: 'heroe', label: 'Superhéroes', color: '#7c3aed', icon: FaSuperpowers },
  { key: 'place', label: 'Lugares', color: '#06b6d4', icon: FaMapMarkerAlt },
];

export const CATEGORY_COLORS = Object.fromEntries(CATEGORIES.map(cat => [cat.key, cat.color]));

// Metadatos de una categoría por su clave. Devuelve null si no existe, que es
// lo que pasa mientras la partida todavía no ha repartido casilla.
export const categoryOf = (key) => CATEGORIES.find((cat) => cat.key === key) || null;

export {
  WORDS_BY_LEVEL,
  LEVELS,
  DIFFICULTIES,
  DIFFICULTY_WEIGHTS,
  DEFAULT_DIFFICULTY,
  getAllWords,
  getLevels,
  pickWord,
};

// Vista plana (todas las palabras de cada categoría, sin nivel). Se mantiene
// porque hay pantallas que solo necesitan saber qué claves de categoría
// existen o listar el vocabulario completo.
export const CATEGORY_WORDS = Object.fromEntries(
  Object.keys(WORDS_BY_LEVEL).map((key) => [key, getAllWords(key)])
);
