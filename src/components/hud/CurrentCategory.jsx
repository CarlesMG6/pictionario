"use client";

import { CATEGORIES } from '../../utils/CategoryWords';
import { readableOn } from './teamColors';

// Categoría en juego, arriba y centrada. Es el dato que más se mira desde lejos:
// va en una placa del color de la categoría, con su icono a la izquierda.
export default function CurrentCategory({ categoryKey, allPlay }) {
  const category = CATEGORIES.find((c) => c.key === categoryKey);
  if (!category) return null;

  const Icon = category.icon;
  const foreground = readableOn(category.color);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 p-5">
      <div className="gp-panel flex items-stretch overflow-hidden p-0">
        <div
          className="flex items-center px-4"
          style={{ background: category.color, color: foreground }}
        >
          {Icon && <Icon size={26} />}
        </div>
        <div className="flex items-center border-l-[3px] border-[#23222b] px-5 py-2.5">
          <span className="gp-label text-xl">{category.label}</span>
        </div>
      </div>

      {allPlay && (
        <div className="gp-panel gp-label px-4 py-1 text-xs" style={{ background: '#f7c948' }}>
          Todos juegan
        </div>
      )}
    </div>
  );
}
