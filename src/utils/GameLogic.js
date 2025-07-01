import { db } from '../firebaseClient.js';
import { collection, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy } from 'firebase/firestore';
import { CATEGORY_WORDS } from './CategoryWords';

function getRandomElement(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

async function checkAndEndGameIfNeeded(room_id) {
    // Obtener equipos y tablero
    const roomSnap = await getDoc(doc(db, 'rooms', room_id));
    const roomData = roomSnap.data();
    const teams = Array.isArray(roomData?.teams) ? roomData.teams : [];
    if (!teams || teams.length === 0) return false;
    const stateSnap = await getDoc(doc(db, 'game_state', room_id));
    const state = stateSnap.exists() ? stateSnap.data() : null;
    if (!state) return false;
    const teamId = state.current_turn_team;
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;
    const categories = roomData?.categories || ['all'];
    const duration = roomData?.duration || 'media';
    const BOARD_SIZES = { corta: 23, media: 39, larga: 55 };
    const size = BOARD_SIZES[duration] || BOARD_SIZES.media;
    let catArr = Array.isArray(categories) ? categories : Object.keys(categories);
    if (catArr.length === 0) catArr = ['all'];
    const boardArr = Array.from({ length: size }, (_, i) => catArr[i % catArr.length]);
    const lastCell = boardArr.length - 1;
    if (team.position >= lastCell) {
        // Setear fase end y guardar ranking
        const ranking = [...teams].sort((a, b) => (b.position || 0) - (a.position || 0));
        await updateDoc(doc(db, 'game_state', room_id), {
            current_phase: 'end',
            winner_team: teamId,
            ranking: ranking.map(t => t.id),
        });
        return true;
    }
    return false;
}

export class GameLogic {
    // SUCCESS: El equipo mantiene el turno y se le asigna una nueva palabra
    static async success(room_id) {
        // Comprobar si el equipo ha llegado al final
        const ended = await checkAndEndGameIfNeeded(room_id);
        if (ended) return;
        // Cambiar fase a 'dice' (el equipo mantiene el turno)
        await updateDoc(doc(db, 'game_state', room_id), { current_phase: 'dice' });
        // No hay canales, rely on onSnapshot
    }
    // FAILURE: El equipo pierde el turno y se asigna un nuevo equipo y una nueva palabra
    static async fail(room_id) {
        console.log(`Fallando turno en sala ${room_id}`);
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
        if (idx === -1) {
            console.error(`No se ha podido encontrar el equipo actual en la lista de equipos: ${state.current_turn_team}`);
            return;
        }
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
        console.log(`Categoría seleccionada: ${category}`);
        console.log(`Palabras disponibles para la categoría ${category}:`, CATEGORY_WORDS[category] || CATEGORY_WORDS['all']);
        const word = getRandomElement(CATEGORY_WORDS[category] || CATEGORY_WORDS['all']);
        // Calcular all_play usando el método extraído
        const allPlay = GameLogic.shouldAllPlay(category);
        // Actualizar game_state
        console.log(`Actualizando estado del juego: equipo ${nextTeam.id}, categoría ${category}, palabra ${word}, all_play: ${allPlay}`);
        await updateDoc(doc(db, 'game_state', room_id), {
            current_phase: 'play',
            current_turn_team: nextTeam.id,
            current_category: category,
            current_word: word,
            all_play: allPlay,
        });
        // No hay canales, rely on onSnapshot
    }

    // Método para determinar si todos los equipos deben jugar
    static shouldAllPlay(category) {
        if (category === 'all') return true;
        return Math.random() < (1 / 3);
    }

    static calculateTeamPosition(oldPosition = 0, diceValue, boardLength) {
        let newPos;
        if (oldPosition + diceValue > boardLength - 1) {
            // Rebote: calcula la posición rebotando desde la meta
            newPos = (boardLength - 1) * 2 - (oldPosition + diceValue);
            return Math.max(0, newPos);
        } else {
            return oldPosition + diceValue;
        }
    }

    static rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    // Nueva función para iniciar la ronda
    static async startRound(room_id, team_id) {
        // Cambia la fase a 'timer_starts' solo si es el turno del equipo
        const stateSnap = await getDoc(doc(db, 'game_state', room_id));
        const state = stateSnap.exists() ? stateSnap.data() : null;
        if (!state || state.current_turn_team !== team_id) return;
        await updateDoc(doc(db, 'game_state', room_id), { current_phase: 'timer_starts' });
    }
}
