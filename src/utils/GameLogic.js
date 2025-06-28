import { db } from '../firebaseClient.js';
import { collection, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy } from 'firebase/firestore';

export class GameLogic {
  static async success(room_id) {
    // Cambiar fase a 'dice' (el equipo mantiene el turno)
    await updateDoc(doc(db, 'game_state', room_id), { current_phase: 'dice' });
    // No hay canales, rely on onSnapshot
  }

  static async fail(room_id) {
    // Obtener estado actual
    const stateSnap = await getDoc(doc(db, 'game_state', room_id));
    const state = stateSnap.exists() ? stateSnap.data() : null;
    if (!state) return;
    // Obtener equipos embebidos en la sala
    const roomSnap = await getDoc(doc(db, 'rooms', room_id));
    const roomData = roomSnap.data();
    const teams = Array.isArray(roomData?.teams) ? roomData.teams : [];
    if (!teams || teams.length === 0) return;
    // Calcular siguiente equipo
    const idx = teams.findIndex(t => t.id === state.current_turn_team);
    const nextIdx = (idx + 1) % teams.length;
    const nextTeam = teams[nextIdx];
    // Calcular categoría y palabra según la posición del equipo
    // Obtener tablero
    const categories = roomData?.categories || ['all'];
    const duration = roomData?.duration || 'media';
    const BOARD_SIZES = { corta: 23, media: 39, larga: 55 };
    const size = BOARD_SIZES[duration] || BOARD_SIZES.media;
    let catArr = Array.isArray(categories) ? categories : Object.keys(categories);
    if (catArr.length === 0) catArr = ['all'];
    const boardArr = Array.from({ length: size }, (_, i) => catArr[i % catArr.length]);
    // Posición del siguiente equipo
    const pos = nextTeam.position || 0;
    console.log(`Posición del equipo ${nextTeam.id}: ${pos}`);
    console.log(`Categoría del equipo ${nextTeam.id}: ${boardArr[pos]}`);
    const category = boardArr[pos];
    const CATEGORY_WORDS = {
      all: ['sol', 'casa', 'perro', 'gato', 'árbol', 'pelota', 'libro', 'avión', 'mar', 'luz'],
      object: ['mesa', 'silla', 'teléfono', 'cuchara', 'puerta', 'reloj', 'coche', 'vaso', 'llave', 'cama'],
      person: ['doctor', 'bombero', 'profesor', 'niño', 'abuelo', 'mujer', 'hombre', 'rey', 'reina', 'policía'],
      action: ['correr', 'saltar', 'bailar', 'leer', 'escribir', 'cantar', 'nadar', 'dibujar', 'cocinar', 'jugar'],
      movies: ['Titanic', 'Matrix', 'Avatar', 'Shrek', 'Frozen', 'Rocky', 'Gladiator', 'Coco', 'Up', 'Toy Story'],
    };
    function getRandomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    const word = getRandomElement(CATEGORY_WORDS[category] || CATEGORY_WORDS['all']);
    // Actualizar game_state
    console.log(`Actualizando estado del juego: equipo ${nextTeam.id}, categoría ${category}, palabra ${word}`);
    await updateDoc(doc(db, 'game_state', room_id), {
      current_phase: 'play',
      current_turn_team: nextTeam.id,
      current_category: category,
      current_word: word,
    });
    // No hay canales, rely on onSnapshot
  }
}
