import { db } from '../firebaseClient.js';
import { collection, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy } from 'firebase/firestore';
import { pickWord, DEFAULT_DIFFICULTY } from './CategoryWords';
import { buildBoard } from '../game/board';
import { ANIMAL_CHOICES } from '../game/animals';
import { STAGES, configOf, seatLabel } from './RoomLogic';

// Las palabras ya jugadas se guardan en game_state.used_words para no repetir
// dentro de la misma partida. Se recorta para no engordar el documento.
const MAX_USED_WORDS = 400;

function rememberWord(used, word) {
    if (!word) return Array.isArray(used) ? used : [];
    const next = [...(Array.isArray(used) ? used : []), word];
    return next.length > MAX_USED_WORDS ? next.slice(-MAX_USED_WORDS) : next;
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
    const boardArr = buildBoard(categories, duration);
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
    // Empezar la partida. La lanza el móvil de P1, no la pantalla grande: la
    // configuración ya está escrita en la sala —P1 la ha ido guardando según la
    // tocaba— así que aquí solo se cierra el reparto y se crea el estado.
    //
    // El estado de juego se escribe antes que la fase de la sala: las dos
    // pantallas saltan en cuanto ven `stage: 'playing'`, y si llegaran a la
    // partida antes que el estado se encontrarían el tablero sin palabra.
    static async startGame(room_id) {
        const roomSnap = await getDoc(doc(db, 'rooms', room_id));
        const room = roomSnap.data();
        if (!room) return false;

        const config = configOf(room);
        const seats = Array.isArray(room.teams) ? room.teams : [];
        if (seats.length < 2) return false;

        // Quien no haya elegido criatura entra igual con una libre: su teléfono
        // está en la mesa, y dejarlo fuera por no haber tocado la rejilla sería
        // peor que jugar con un nombre puesto por la casa.
        const taken = new Set(seats.map((seat) => seat.icon_url).filter(Boolean));
        const teams = seats.map((seat, index) => {
            let icon = seat.icon_url;
            if (!icon) {
                icon = (ANIMAL_CHOICES.find((choice) => !taken.has(choice.icon)) || ANIMAL_CHOICES[0]).icon;
                taken.add(icon);
            }
            const label = ANIMAL_CHOICES.find((choice) => choice.icon === icon)?.label;
            return {
                ...seat,
                position: 0,
                locked: true,
                ready: true,
                icon_url: icon,
                name: seat.name || label || seatLabel(index),
            };
        });

        const firstTeamId = teams[Math.floor(Math.random() * teams.length)].id;
        const category = config.categories[Math.floor(Math.random() * config.categories.length)];
        const word = pickWord(category, config.difficulty);

        await setDoc(doc(db, 'game_state', room_id), {
            room_id,
            current_turn_team: firstTeamId,
            current_phase: 'play',
            current_word: word,
            current_category: category,
            all_play: GameLogic.shouldAllPlay(category),
            difficulty: config.difficulty,
            used_words: word ? [word] : [],
            dice_value: null,
            is_active: true,
        });

        await updateDoc(doc(db, 'rooms', room_id), {
            ...config,
            teams,
            stage: STAGES.PLAYING,
            playing: true,
        });

        return true;
    }

    // «Nueva partida»: la sala vuelve a la configuración con los mismos equipos
    // —criatura y nombre incluidos— y las fichas otra vez en la salida.
    static async backToSetup(room_id) {
        const roomSnap = await getDoc(doc(db, 'rooms', room_id));
        const teams = (Array.isArray(roomSnap.data()?.teams) ? roomSnap.data().teams : [])
            .map((team) => ({ ...team, position: 0 }));
        await updateDoc(doc(db, 'rooms', room_id), {
            teams,
            stage: STAGES.SETUP,
            playing: false,
        });
    }

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
        const boardArr = buildBoard(categories, duration);
        // Posición del siguiente equipo
        const pos = nextTeam.position || 0;
        console.log(`Posición del equipo ${nextTeam.id}: ${pos}`);
        console.log(`Categoría del equipo ${nextTeam.id}: ${boardArr[pos]}`);
        const category = boardArr[pos];
        console.log(`Categoría seleccionada: ${category}`);
        const difficulty = roomData?.difficulty || DEFAULT_DIFFICULTY;
        const word = pickWord(category, difficulty, state.used_words);
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
            used_words: rememberWord(state.used_words, word),
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
