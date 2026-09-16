"use client";

import { useState } from 'react';
import { Hourglass } from '../ui/Glyphs';

// Empezar la ronda es darle la vuelta al reloj de arena. La arena está abajo
// —el reloj está gastado— y al pulsarlo gira: la arena queda arriba y empieza a
// caer. No hace falta poner «empezar» debajo, el objeto ya lo dice.
export default function StartFlip({ onStart, disabled }) {
  const [flipped, setFlipped] = useState(false);

  const go = () => {
    if (disabled || flipped) return;
    setFlipped(true);
    // El giro se ve entero antes de que la partida cambie de fase.
    setTimeout(() => onStart?.(), 380);
  };

  return (
    <div className="relative flex items-center justify-center">
      {!flipped && !disabled && (
        <span
          className="gp-beat pointer-events-none absolute rounded-full"
          style={{ width: 118, height: 118, background: 'rgba(247,201,72,0.35)' }}
        />
      )}
      <button
        type="button"
        onClick={go}
        disabled={disabled}
        aria-label="Empezar la ronda"
        className="gp-button gp-grab relative flex items-center justify-center disabled:opacity-50"
        style={{ width: 96, height: 96, borderRadius: 999, background: '#f7c948', color: '#23222b' }}
      >
        <span
          style={{
            display: 'block',
            transform: flipped ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.42s cubic-bezier(0.2, 0.9, 0.3, 1.35)',
          }}
        >
          <Hourglass size={48} fill="bottom" color="#7a4e33" />
        </span>
      </button>
    </div>
  );
}
