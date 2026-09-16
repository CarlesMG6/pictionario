"use client";

import { useState } from 'react';
import { CATEGORIES } from '../../utils/CategoryWords';
import { readableOn } from './teamColors';

// Todo lo consultable pero no urgente vive aquí: las categorías de la partida,
// las normas y el acceso para unirse. Fuera del HUD permanente, que tiene que
// dejar ver el mundo.
export default function HelpPanel({ categories, onJoin }) {
  const [open, setOpen] = useState(false);
  const inPlay = CATEGORIES.filter((c) => (categories || []).includes(c.key));

  return (
    <div className="absolute bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="gp-panel w-72 p-3">
          {inPlay.length > 0 && (
            <>
              <div className="gp-caption mb-2">Categorías de la partida</div>
              {/* Aquí sí van el color y el icono, al contrario que en el rótulo
                  de la categoría en juego: esta lista es la leyenda del tablero,
                  y sin ellos no se puede emparejar un nombre con las casillas
                  que se ven en el mapa. */}
              <div className="mb-3 flex flex-col gap-1">
                {inPlay.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={category.key}
                      className="gp-label flex items-center gap-2 border-[3px] border-[#23222b] px-2.5 py-1 text-[0.72rem]"
                      style={{ background: category.color, color: readableOn(category.color), borderRadius: 6 }}
                    >
                      {Icon && <Icon size={14} />}
                      {category.label}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <button
            type="button"
            className="gp-button mb-2 w-full bg-[#fdf6e8] px-3 py-2 text-xs text-[#23222b]"
            onClick={() => window.open('/rules', '_blank')}
          >
            Normas del juego
          </button>
          <button
            type="button"
            className="gp-button w-full bg-[#f7c948] px-3 py-2 text-xs text-[#23222b]"
            onClick={() => {
              setOpen(false);
              onJoin();
            }}
          >
            Unirse a la partida
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? 'Cerrar ayuda' : 'Ayuda'}
        className="gp-button gp-number flex h-12 w-12 items-center justify-center bg-[#fdf6e8] text-xl text-[#23222b]"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? '×' : '?'}
      </button>
    </div>
  );
}
