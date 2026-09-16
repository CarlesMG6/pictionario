"use client";

import TeamAvatar from './TeamAvatar';

// Pantalla de quien no tiene nada que hacer todavía: quién está jugando y qué
// está pasando, sin un solo control que invite a tocar. El pictograma de abajo
// cambia con la fase, así que la espera se sigue sin leer nada.
export default function Waiting({ team, color, children }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-7">
      {team && (
        <div className="flex flex-col items-center">
          <TeamAvatar
            team={team}
            color={color}
            size={104}
            className="shadow-[0_5px_0_rgba(35,34,43,0.35)]"
          />
          <span className="gp-label mt-3 max-w-[16rem] truncate text-base text-[#23222b]">
            {team.name}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
