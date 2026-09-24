"use client";

import { ANIMAL_CHOICES } from '../../game/animals';
import { useAnimalPortrait } from '../hud/animalPortrait';

// Elegir criatura no es abrir un catálogo: al entrar en la fase ya se tiene una
// puesta y desde aquí se pasa a la siguiente o a la anterior, como quien gira
// un expositor. Lo que se toca es la criatura que la sala está viendo en la
// pantalla grande, así que el móvil enseña exactamente lo mismo que ellos.
//
// Las que llevan otros equipos no aparecen: las flechas se las saltan, y así no
// hay forma de elegir una que ya está cogida.

export function AnimalCrest({ icon, color, size = 128, dim = false }) {
  const portrait = useAnimalPortrait(icon);

  return (
    <span
      className="flex items-center justify-center rounded-full border-[3px] border-[#23222b] transition-opacity"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: '0 5px 0 rgba(35,34,43,0.35)',
        opacity: dim ? 0.55 : 1,
      }}
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

export default function AnimalCarousel({ icon, color, busy = false, onCycle }) {
  const label = ANIMAL_CHOICES.find((choice) => choice.icon === icon)?.label || '';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <Arrow direction={-1} disabled={busy} onClick={() => onCycle(-1)} />
        <AnimalCrest icon={icon} color={color} size={152} dim={busy} />
        <Arrow direction={1} disabled={busy} onClick={() => onCycle(1)} />
      </div>
      <span className="gp-label text-base text-[#23222b]">{label}</span>
    </div>
  );
}

function Arrow({ direction, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction > 0 ? 'Siguiente criatura' : 'Criatura anterior'}
      className="gp-button flex h-14 w-14 flex-none items-center justify-center disabled:opacity-60"
      style={{ background: 'var(--w-paper)', color: 'var(--w-ink)', borderRadius: 999 }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: direction > 0 ? 'none' : 'scaleX(-1)' }}
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
