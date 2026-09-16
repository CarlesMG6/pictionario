"use client";

import { useAnimalPortrait } from '../hud/animalPortrait';

// El avatar del equipo en el móvil es la misma figura de arcilla que su peón en
// el tablero, no el icono plano: quien mira la pantalla grande reconoce la
// criatura sin tener que emparejar nombres. El disco lleva el color del equipo,
// que es el otro dato de identidad.
//
// Hasta que el retrato 3D está listo —se rinde en cliente, después de montar—
// se enseña el PNG del icono, que es la misma especie en plano.
export default function TeamAvatar({ team, color, size = 44, className = '' }) {
  const portrait = useAnimalPortrait(team?.icon_url);

  if (!team) return null;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#23222b] ${className}`}
      style={{ width: size, height: size, background: color }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={portrait || team.icon_url || '/vercel.svg'}
        alt=""
        className="object-contain"
        style={{ width: size * 1.18, height: size * 1.18 }}
      />
    </span>
  );
}
