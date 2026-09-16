"use client";

import { Check, Cross } from '../ui/Glyphs';

// El desenlace de la ronda, en dos dianas. El acierto ocupa casi todo el ancho
// porque es lo que se pulsa con prisa y a ciegas cuando alguien grita la
// palabra; el fallo queda a un lado, pequeño y en papel, para que no se pulse
// por error.
//
// Sustituye a la pareja «parar temporizador» + «acierto/fallo»: el reloj se
// para porque ha pasado algo, no como paso aparte.
export default function Verdict({ onFail, onSuccess, disabled }) {
  return (
    <div className="flex w-full items-stretch gap-3">
      <button
        type="button"
        onClick={onFail}
        disabled={disabled}
        aria-label="No lo han adivinado"
        className="gp-button flex shrink-0 items-center justify-center disabled:opacity-50"
        style={{ width: 84, height: 84, borderRadius: 999, background: 'var(--w-paper)', color: '#dc4b3e' }}
      >
        <Cross size={34} />
      </button>

      <button
        type="button"
        onClick={onSuccess}
        disabled={disabled}
        aria-label="Lo han adivinado"
        className="gp-button flex flex-1 items-center justify-center disabled:opacity-50"
        style={{ height: 84, background: '#2b9e57', color: '#ffffff' }}
      >
        <Check size={42} />
      </button>
    </div>
  );
}
