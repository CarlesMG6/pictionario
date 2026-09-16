"use client";

import { useAnimalPortrait } from './animalPortrait';

// La criatura del equipo, grande y con su nombre debajo. Es la forma más rápida
// de decir de quién es el turno: en el tablero se ve el mismo peón moviéndose,
// así que nadie tiene que emparejar nombres.
export default function TeamBadge({ team, color, size = 104, className = '' }) {
  const portrait = useAnimalPortrait(team?.icon_url);

  if (!team) return null;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portrait}
          alt=""
          style={{ width: size, height: size }}
          className="object-contain drop-shadow-[0_6px_5px_rgba(27,55,80,0.35)]"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.icon_url || '/vercel.svg'} alt="" style={{ width: size * 0.7, height: size * 0.7 }} className="object-contain" />
      )}
      {/* El nombre va sobre papel: encima del mundo a todo color, el texto
          suelto se pierde en cuanto la cámara pasa por una isla clara. */}
      <div className="gp-panel -mt-1 flex items-center gap-2.5 px-4 py-1.5">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#23222b]" style={{ background: color }} />
        <span className="gp-label max-w-[15rem] truncate text-lg">{team.name}</span>
      </div>
    </div>
  );
}
