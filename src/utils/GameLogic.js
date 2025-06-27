import { supabase } from '../supabaseClient.js';

const CATEGORY_WORDS = {
  all: ['sol', 'casa', 'perro', 'gato', 'árbol', 'pelota', 'libro', 'avión', 'mar', 'luz'],
  object: ['mesa', 'silla', 'teléfono', 'cuchara', 'puerta', 'reloj', 'coche', 'vaso', 'llave', 'cama'],
  person: ['doctor', 'bombero', 'profesor', 'niño', 'abuelo', 'mujer', 'hombre', 'rey', 'reina', 'policía'],
  action: ['correr', 'saltar', 'bailar', 'leer', 'escribir', 'cantar', 'nadar', 'dibujar', 'cocinar', 'jugar'],
  movies: ['Titanic', 'Matrix', 'Avatar', 'Shrek', 'Frozen', 'Rocky', 'Gladiator', 'Coco', 'Up', 'Toy Story'],
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class GameLogic {
  static async success(room_id) {
    // Cambiar fase a 'dice' (el equipo mantiene el turno)
    await supabase.from('game_state').update({ current_phase: 'dice' }).eq('room_id', room_id);
    await supabase.channel(`room-${room_id}`)
      .send({ type: 'broadcast', event: 'update_match', payload: {} });
  }

  static async fail(room_id) {
    // Obtener estado actual
    const { data: state } = await supabase.from('game_state').select('*').eq('room_id', room_id).single();
    if (!state) return;
    // Obtener equipos
    const { data: teams } = await supabase.from('teams').select('id').eq('room_id', room_id).order('position');
    if (!teams || teams.length === 0) return;
    // Calcular siguiente equipo
    const idx = teams.findIndex(t => t.id === state.current_turn_team);
    const nextIdx = (idx + 1) % teams.length;
    const nextTeam = teams[nextIdx];
    // Calcular categoría y palabra
    const categories = state.categories || ['all'];
    const category = getRandomElement(categories);
    const word = getRandomElement(CATEGORY_WORDS[category] || CATEGORY_WORDS['all']);
    // Actualizar game_state
    await supabase.from('game_state').update({
      current_phase: 'play',
      current_turn_team: nextTeam.id,
      current_category: category,
      current_word: word,
    }).eq('room_id', room_id);
    await supabase.channel(`room-${room_id}`)
      .send({ type: 'broadcast', event: 'update_match', payload: {} });
  }
}
