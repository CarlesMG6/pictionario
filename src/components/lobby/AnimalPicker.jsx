"use client";

import { ANIMAL_CHOICES } from '../../game/animals';
import { useAnimalPortrait } from '../hud/animalPortrait';
import { teamColor } from '../hud/teamColors';

// Elegir criatura es elegir el peón que se va a ver en el tablero, así que la
// que ya se ha llevado otro equipo no está disponible: dos peones iguales en el
// mundo serían dos equipos indistinguibles desde el sofá.
//
// La rejilla va con los iconos planos, que son instantáneos; la figura de
// arcilla —la de verdad, la que se verá en la isla— se reserva para la que se
// tiene elegida, que es la que hay que reconocer.

export function AnimalCrest({ icon, color, size = 128 }) {
  const portrait = useAnimalPortrait(icon);

  return (
    <span
      className="flex items-center justify-center rounded-full border-[3px] border-[#23222b]"
      style={{ width: size, height: size, background: color, boxShadow: '0 5px 0 rgba(35,34,43,0.35)' }}
    >
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={portrait || icon} alt="" className="object-contain" style={{ width: size * 1.1, height: size * 1.1 }} />
      ) : (
        <span className="gp-display text-4xl" style={{ opacity: 0.5 }}>?</span>
      )}
    </span>
  );
}

export default function AnimalPicker({ teams = [], meId = null, value = null, onPick }) {
  // Quién lleva cada criatura, para pintar el punto de color de su dueño.
  const owner = new Map();
  teams.forEach((team, index) => {
    if (team.icon_url) owner.set(team.icon_url, { id: team.id, color: teamColor(index) });
  });

  return (
    <div className="grid grid-cols-5 gap-2">
      {ANIMAL_CHOICES.map((choice) => {
        const taken = owner.get(choice.icon);
        const mine = value === choice.icon;
        const blocked = Boolean(taken) && taken.id !== meId;

        return (
          <button
            key={choice.icon}
            type="button"
            onClick={() => !blocked && onPick(choice)}
            aria-label={choice.label}
            aria-pressed={mine}
            className="relative flex aspect-square items-center justify-center rounded-lg border-[3px]"
            style={{
              borderColor: mine ? 'var(--w-ink)' : 'rgba(35,34,43,0.22)',
              background: mine ? 'var(--w-gold)' : '#fff',
              boxShadow: mine ? '0 4px 0 rgba(35,34,43,0.4)' : 'none',
              opacity: blocked ? 0.34 : 1,
              filter: blocked ? 'grayscale(1)' : 'none',
              cursor: blocked ? 'default' : 'pointer',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={choice.icon} alt="" className="h-[80%] w-[80%] object-contain" />
            {blocked && (
              <i
                className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-[#23222b]"
                style={{ background: taken.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
