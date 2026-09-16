"use client";

import { FaPeopleArrows } from 'react-icons/fa';
import { categoryOf } from '../../utils/CategoryWords';

// Categoría en juego, arriba y centrada: es el dato que más se mira desde
// lejos, y por eso va solo. El nombre y nada más — el icono y el disco de
// color ya están en la casilla que el peón tiene debajo, en el propio tablero.
export default function CurrentCategory({ categoryKey, allPlay }) {
  const category = categoryOf(categoryKey);
  if (!category) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-col items-center gap-2.5 p-5">
      <div className="gp-panel flex items-center px-8 py-3.5">
        <span className="gp-label text-xl leading-none">{category.label}</span>
      </div>

      {/* «Todos juegan» cambia la regla de la ronda, así que no puede ser una
          nota al pie: va en dorado y con el mismo icono que su casilla. */}
      {allPlay && (
        <div
          className="gp-panel gp-label flex items-center gap-2 px-4 py-1.5 text-sm"
          style={{ background: '#f7c948' }}
        >
          <FaPeopleArrows size={16} />
          Todos juegan
        </div>
      )}
    </div>
  );
}
