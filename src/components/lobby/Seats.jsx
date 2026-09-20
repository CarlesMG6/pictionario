"use client";

import { useAnimalPortrait } from '../hud/animalPortrait';
import { readableOn, teamColor } from '../hud/teamColors';
import { MAX_SEATS, seatLabel } from '../../utils/RoomLogic';

// Quién está en la sala, en los tres sitios donde hace falta enseñarlo: la
// fila de la pantalla grande, las tarjetas de la elección de criatura y las
// chapas pequeñas del móvil. Es la misma identidad en los tres —color por
// orden de entrada y etiqueta P1…P8— porque emparejar un móvil con un hueco de
// la tele tiene que poder hacerse de un vistazo.

export function SeatBox({ index, team = null, size = 96 }) {
  const color = teamColor(index);
  const ink = readableOn(color);

  if (!team) {
    return (
      // El hueco libre va relleno: un contorno punteado sobre el mundo a todo
      // color desaparece, y es justo lo que dice que todavía cabe gente.
      <div
        className="rounded-lg border-[3px] border-dashed"
        style={{
          width: size,
          height: size,
          borderColor: 'rgba(35,34,43,0.45)',
          background: 'rgba(253,246,232,0.42)',
        }}
      />
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border-[3px]"
      style={{
        width: size,
        height: size,
        background: color,
        borderColor: 'var(--w-ink)',
        boxShadow: '0 5px 0 rgba(35,34,43,0.4)',
      }}
    >
      <span className="gp-display text-3xl" style={{ color: ink }}>
        {seatLabel(index)}
      </span>
      {/* El nombre solo cabe en la caja grande; en la fila pequeña de la fase
          de configuración se cortaría a la mitad, y un nombre cortado no
          identifica a nadie. */}
      {team.name && size >= 88 && (
        <span
          className="gp-label mt-0.5 max-w-full truncate px-2 text-[0.6rem]"
          style={{ color: ink, opacity: 0.85 }}
        >
          {team.name}
        </span>
      )}
    </div>
  );
}

// La fila de la tele enseña también los huecos que quedan: ver tres cajas
// vacías es lo que le dice a la mesa que todavía cabe gente.
export function SeatRow({ teams = [], size = 96, showEmpty = true }) {
  const slots = showEmpty ? Math.max(teams.length + 1, 5) : teams.length;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {Array.from({ length: Math.min(slots, MAX_SEATS) }, (_, index) => (
        <SeatBox key={index} index={index} team={teams[index] || null} size={size} />
      ))}
    </div>
  );
}

// Tarjeta de la fase de criaturas: la figura vive fuera del marco y se apoya
// sobre su borde, el mismo encaje que la barra de equipos de la partida.
export function PlayerCard({ index, team, width = 200 }) {
  const color = teamColor(index);
  const portrait = useAnimalPortrait(team?.icon_url);
  const figure = team?.icon_url ? portrait || team.icon_url : null;

  return (
    <div className="flex flex-col items-center" style={{ width }}>
      <div className="relative z-10 -mb-5 flex h-[104px] w-[104px] items-end justify-center">
        {figure ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={figure}
            alt=""
            className="h-[120px] w-[120px] object-contain drop-shadow-[0_6px_5px_rgba(0,0,0,0.32)]"
          />
        ) : (
          // El pedestal vacío va relleno: un contorno punteado sobre el mundo a
          // todo color no se ve desde el sofá, y es justo el hueco que hay que
          // notar para saber que falta alguien por elegir.
          <div
            className="mb-2 flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] border-dashed"
            style={{ borderColor: 'var(--w-ink)', background: 'rgba(253,246,232,0.8)' }}
          >
            <span className="gp-display text-2xl opacity-45">?</span>
          </div>
        )}
      </div>

      <div className="gp-panel relative w-full overflow-hidden px-3 py-2.5 text-center">
        <div className="absolute inset-x-0 top-0 h-2.5" style={{ background: color }} />
        <div className="gp-caption mt-1.5">{seatLabel(index)}</div>
        <div className="gp-label mt-0.5 truncate text-[0.95rem]">
          {team?.name || 'Eligiendo…'}
        </div>
        {team?.ready && (
          <div className="gp-caption mt-1" style={{ color: 'var(--w-green)', opacity: 1 }}>
            Listo
          </div>
        )}
      </div>
    </div>
  );
}

// Chapas del móvil: quién más está dentro, con la propia resaltada.
export function SeatChips({ teams = [], meId = null }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {teams.map((team, index) => {
        const color = teamColor(index);
        const mine = team.id === meId;
        return (
          <span
            key={team.id}
            className="gp-label flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem]"
            style={{
              background: mine ? color : 'rgba(253,246,232,0.9)',
              color: mine ? readableOn(color) : 'var(--w-ink)',
              border: `3px solid ${mine ? 'var(--w-ink)' : 'rgba(35,34,43,0.22)'}`,
            }}
          >
            {!mine && <i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
            {team.name || seatLabel(index)}
          </span>
        );
      })}
    </div>
  );
}
