// Color de cada equipo, por orden de entrada. Los equipos no guardan color en
// Firestore: se derivan del índice para que el peón del mundo y la tarjeta del
// HUD coincidan siempre sin tener que sincronizar nada.
export const TEAM_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

export const teamColor = (index) => TEAM_COLORS[index % TEAM_COLORS.length];

// Texto legible sobre un fondo de color. Las categorías van del amarillo al
// morado, así que un blanco fijo se pierde en la mitad de ellas.
export function readableOn(hex) {
  const value = parseInt(String(hex).replace('#', ''), 16);
  if (Number.isNaN(value)) return '#ffffff';
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#ffffff';
}
