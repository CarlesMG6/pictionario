import { db } from '../firebaseClient.js';
import { collection, doc, getDocs, query, runTransaction, updateDoc, where } from 'firebase/firestore';
import { DEFAULT_DIFFICULTY } from './CategoryWords';
import { ANIMAL_CHOICES } from '../game/animals';
import { TEAM_COLORS } from '../components/hud/teamColors';

// Antes de la partida la sala pasa por tres pantallas, y las dos que hay
// encendidas —la grande y cada móvil— se limitan a mirar `rooms.stage` y pintar
// la que toca. Es la única fuente de verdad: `playing` se sigue escribiendo al
// lado para las pestañas que se quedaron con la versión anterior.
export const STAGES = {
  LOBBY: 'lobby',     // entra gente; solo código y QR
  SETUP: 'setup',     // P1 monta la partida desde su móvil
  ROSTER: 'roster',   // cada equipo elige criatura y nombre
  PLAYING: 'playing',
};

// El mando lo lleva el primer hueco de la lista. No hace falta guardarlo: si
// ese jugador se va, el siguiente hereda los mandos sin que nadie escriba nada.
export const leaderIdOf = (teams) => (Array.isArray(teams) && teams.length ? teams[0].id : null);
export const isLeader = (teams, team_id) => Boolean(team_id) && leaderIdOf(teams) === team_id;

// Tantos huecos como colores hay: dos equipos del mismo color serían dos peones
// indistinguibles en el tablero.
export const MAX_SEATS = TEAM_COLORS.length;

export const seatLabel = (index) => `P${index + 1}`;

export const DEFAULT_CONFIG = {
  duration: 'media',
  round_time: 45,
  difficulty: DEFAULT_DIFFICULTY,
  categories: ['all', 'person', 'object', 'action'],
};

// La sala nace configurada para que la pantalla grande tenga tablero que
// enseñar desde el primer segundo, pero una sala antigua puede no traerlo.
export function configOf(room) {
  return {
    duration: room?.duration || DEFAULT_CONFIG.duration,
    round_time: Number(room?.round_time) || DEFAULT_CONFIG.round_time,
    difficulty: room?.difficulty || DEFAULT_CONFIG.difficulty,
    categories: Array.isArray(room?.categories) && room.categories.length
      ? room.categories
      : DEFAULT_CONFIG.categories,
  };
}

export async function findRoomByCode(code) {
  const snap = await getDocs(query(collection(db, 'rooms'), where('code', '==', code)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() };
}

// Todo lo que toca un hueco dentro de `teams` pasa por aquí: en la pantalla de
// criaturas hay varios móviles escribiendo sobre el mismo array a la vez, y un
// leer-y-escribir suelto perdería la elección del que llegue medio segundo
// antes. La transacción reintenta y no se pierde nada.
async function withTeams(room_id, mutate) {
  const ref = doc(db, 'rooms', room_id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const teams = Array.isArray(snap.data()?.teams) ? snap.data().teams : [];
    const result = mutate(teams, snap.data());
    if (!result) return null;
    tx.update(ref, { teams: result.teams });
    return result.value ?? null;
  });
}

// Entrar es coger hueco, sin formulario: el nombre y la criatura llegan después.
export async function joinSeat(room_id) {
  return withTeams(room_id, (teams) => {
    if (teams.length >= MAX_SEATS) return null;
    const seat = {
      id: crypto.randomUUID(),
      name: null,
      icon_url: null,
      ready: false,
      position: 0,
      createdAt: new Date().toISOString(),
    };
    return { teams: [...teams, seat], value: seat.id };
  });
}

export async function updateSeat(room_id, team_id, patch) {
  return withTeams(room_id, (teams) => ({
    teams: teams.map((team) => (team.id === team_id ? { ...team, ...patch } : team)),
    value: true,
  }));
}

// Reparte criatura a quien no la tenga. Se llama al entrar en la fase de
// criaturas: así la pantalla grande las enseña todas desde el primer segundo y
// nadie tiene que elegir desde cero, solo cambiar la que le ha tocado.
export async function dealAnimals(room_id) {
  return withTeams(room_id, (teams) => {
    const taken = new Set(teams.map((team) => team.icon_url).filter(Boolean));
    const free = ANIMAL_CHOICES.filter((choice) => !taken.has(choice.icon));

    return {
      teams: teams.map((team) => {
        if (team.icon_url || free.length === 0) return team;
        const [choice] = free.splice(Math.floor(Math.random() * free.length), 1);
        return { ...team, icon_url: choice.icon };
      }),
      value: true,
    };
  });
}

// Pasar a la criatura siguiente o a la anterior, saltándose las que ya lleva
// otro equipo. Va en transacción como todo lo que toca el array: dos flechas a
// la vez sobre el mismo delfín no pueden ganar las dos.
export async function cycleAnimal(room_id, team_id, direction = 1) {
  return withTeams(room_id, (teams) => {
    const me = teams.find((team) => team.id === team_id);
    if (!me) return null;

    const taken = new Set(
      teams.filter((team) => team.id !== team_id).map((team) => team.icon_url).filter(Boolean),
    );
    const from = ANIMAL_CHOICES.findIndex((choice) => choice.icon === me.icon_url);
    const total = ANIMAL_CHOICES.length;

    for (let step = 1; step <= total; step += 1) {
      const index = (((from + direction * step) % total) + total) % total;
      const choice = ANIMAL_CHOICES[index];
      if (taken.has(choice.icon)) continue;
      return {
        teams: teams.map((team) => (team.id === team_id ? { ...team, icon_url: choice.icon } : team)),
        value: choice.icon,
      };
    }

    // Sala llena de criaturas: no hay ninguna libre a la que saltar.
    return { teams, value: me.icon_url };
  });
}

export async function removeSeat(room_id, team_id) {
  return withTeams(room_id, (teams) => ({
    teams: teams.filter((team) => team.id !== team_id),
    value: true,
  }));
}

// P1 escribe los ajustes según los toca, no al final: es lo que permite que la
// pantalla grande sea un espejo y no un cartel de espera.
export async function updateConfig(room_id, patch) {
  await updateDoc(doc(db, 'rooms', room_id), patch);
}

export async function setStage(room_id, stage) {
  await updateDoc(doc(db, 'rooms', room_id), { stage, playing: stage === STAGES.PLAYING });
}

// Identidad del móvil dentro de la sala. Sobrevive a una recarga, que si no
// crearía un equipo nuevo y dejaría el viejo vacío en el tablero.
const seatKey = (room_id) => `team_id_${room_id}`;

export function rememberSeat(room_id, team_id) {
  try {
    localStorage.setItem(seatKey(room_id), team_id);
  } catch {
    // Navegador sin almacenamiento: se juega igual, solo que recargar da hueco nuevo.
  }
}

export function recallSeat(room_id) {
  try {
    return localStorage.getItem(seatKey(room_id));
  } catch {
    return null;
  }
}

export function forgetSeat(room_id) {
  try {
    localStorage.removeItem(seatKey(room_id));
  } catch {
    // Igual que arriba: no poder olvidar no rompe nada.
  }
}
