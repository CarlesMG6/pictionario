"use client";

import { CATEGORIES, DIFFICULTIES } from '../../utils/CategoryWords';
import { BOARD_SIZES } from '../../game/board';
import { readableOn } from '../hud/teamColors';

// La partida que se está montando, de solo lectura. Va en la pantalla grande
// —que hace de espejo mientras P1 toca su móvil— y en los móviles que no llevan
// los mandos. Ahí no hay controles apagados: lo que no se puede tocar en esta
// fase no aparece como botón, aparece como dato.

const DURATION_LABEL = { corta: 'Corta', media: 'Media', larga: 'Larga' };

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="gp-caption">{label}</span>
      <span className="gp-label text-right text-[0.95rem]">{children}</span>
    </div>
  );
}

export function ConfigSummary({ config }) {
  const difficulty = DIFFICULTIES.find((d) => d.key === config.difficulty);

  return (
    <div className="flex flex-col gap-2.5">
      <Row label="Duración">
        {DURATION_LABEL[config.duration] || config.duration}
        <span className="gp-number ml-2 text-lg">{BOARD_SIZES[config.duration] || '—'}</span>
        <span className="gp-caption ml-1 not-italic">casillas</span>
      </Row>
      <Row label="Ronda">
        <span className="gp-number text-lg">{config.round_time}</span>
        <span className="gp-caption ml-1 not-italic">s</span>
      </Row>
      <Row label="Dificultad">{difficulty?.label || config.difficulty}</Row>
    </div>
  );
}

// La leyenda enseña las diecinueve, no solo las elegidas: así, cuando P1
// enciende una desde su móvil, en la tele se ve encenderse.
export function CategoryLegend({ categories = [], size = 'md' }) {
  const on = new Set(categories);
  const text = size === 'sm' ? 'text-[0.62rem]' : 'text-[0.72rem]';

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const lit = on.has(category.key);
        return (
          <span
            key={category.key}
            className={`gp-label flex items-center gap-1.5 border-[3px] px-2 py-1 ${text}`}
            style={{
              borderRadius: 6,
              borderColor: lit ? 'var(--w-ink)' : 'rgba(35,34,43,0.22)',
              background: lit ? category.color : 'transparent',
              color: lit ? readableOn(category.color) : 'var(--w-ink)',
              opacity: lit ? 1 : 0.38,
            }}
          >
            {Icon && <Icon size={size === 'sm' ? 11 : 13} />}
            {category.label}
          </span>
        );
      })}
    </div>
  );
}
