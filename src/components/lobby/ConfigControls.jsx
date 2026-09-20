"use client";

import { CATEGORIES, DIFFICULTIES, LEVELS } from '../../utils/CategoryWords';
import { BOARD_SIZES } from '../../game/board';
import { useCategoryTilePortraits } from '../hud/tilePortrait';

// Los mandos de la partida. Solo los monta el móvil de P1: el resto de la sala
// ve el resumen, no los controles apagados.
//
// Las piezas vienen de la pantalla de configuración que vivía en el host; aquí
// están reencajadas para un ancho de móvil, pero el criterio es el mismo —una
// categoría se elige tocando la casilla que va a salir en el camino, no una
// casilla de verificación.

const CATEGORY_KEYS = CATEGORIES.map((cat) => cat.key);

export function Section({ title, aside, children }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="gp-caption">{title}</div>
        {aside && <div className="gp-caption opacity-45">{aside}</div>}
      </div>
      {children}
    </div>
  );
}

export function DurationPicker({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {['corta', 'media', 'larga'].map((key) => {
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="gp-button flex-1 px-2 py-3 text-[0.72rem]"
            style={
              on
                ? { background: 'var(--w-ink)', color: 'var(--w-paper)' }
                : { background: '#fff', color: 'var(--w-ink)', opacity: 0.72, boxShadow: '0 4px 0 rgba(35,34,43,0.18)' }
            }
          >
            {key}
            <span className="gp-number ml-1.5 not-italic opacity-60">{BOARD_SIZES[key]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 15, max = 120, step = 5, unit = 's' }) {
  const clamp = (n) => Math.min(max, Math.max(min, n));

  return (
    <div className="gp-button flex items-center justify-between px-2 py-1.5" style={{ background: '#fff', cursor: 'default' }}>
      <StepperButton onClick={() => onChange(clamp(value - step))} label="Menos">
        <path d="M6 12h12" />
      </StepperButton>
      <span className="gp-number text-3xl">
        {value}
        <span className="gp-caption ml-1 align-middle not-italic">{unit}</span>
      </span>
      <StepperButton onClick={() => onChange(clamp(value + step))} label="Más">
        <path d="M12 6v12M6 12h12" />
      </StepperButton>
    </div>
  );
}

function StepperButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-md"
      style={{ background: '#efe4ce' }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" stroke="var(--w-ink)" strokeWidth="3.2" strokeLinecap="round" fill="none">
        {children}
      </svg>
    </button>
  );
}

// El reparto de niveles no se escribe a mano: sale de los pesos reales con los
// que `pickWord` elige, así que la barra no puede mentir sobre lo que toca.
export function DifficultyPicker({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {DIFFICULTIES.map((difficulty) => {
        const on = value === difficulty.key;
        const max = Math.max(...LEVELS.map((level) => difficulty.weights[level] || 0));
        return (
          <button
            key={difficulty.key}
            type="button"
            onClick={() => onChange(difficulty.key)}
            className="rounded-lg border-[3px] p-3 text-left"
            style={
              on
                ? { borderColor: 'var(--w-ink)', background: '#fff6df', boxShadow: '0 5px 0 rgba(35,34,43,0.4)' }
                : { borderColor: 'rgba(35,34,43,0.3)', background: '#fff', boxShadow: '0 3px 0 rgba(35,34,43,0.12)', opacity: 0.7 }
            }
          >
            <div className="gp-label text-[0.95rem]">{difficulty.label}</div>
            <div className="mt-1 text-[0.74rem] leading-snug opacity-70">{difficulty.description}</div>
            <div className="mt-2 flex items-end gap-1">
              {LEVELS.map((level) => {
                const weight = difficulty.weights[level] || 0;
                return (
                  <span
                    key={level}
                    className="flex-1 rounded"
                    style={{
                      height: 6,
                      opacity: weight / max > 0.5 ? 1 : 0.22,
                      background: 'var(--w-ink)',
                      flexGrow: Math.max(0.35, weight / max),
                    }}
                  />
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function CategoryPicker({ selected = [], onToggle, columns = 4 }) {
  const portraits = useCategoryTilePortraits(CATEGORY_KEYS);
  const on = new Set(selected);

  return (
    <div className="grid gap-x-1.5 gap-y-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {CATEGORIES.map((category) => {
        const lit = on.has(category.key);
        return (
          <button
            key={category.key}
            type="button"
            onClick={() => onToggle(category.key)}
            aria-pressed={lit}
            className="flex flex-col items-center gap-1 rounded-lg py-1"
            style={{
              filter: lit ? 'none' : 'grayscale(1) contrast(0.55) brightness(1.2)',
              opacity: lit ? 1 : 0.5,
              transform: lit ? 'translateY(-2px)' : 'none',
              transition: 'transform 0.12s ease, opacity 0.12s ease',
            }}
          >
            {portraits[category.key] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portraits[category.key]} alt="" className="h-[54px] w-[54px] object-contain" />
            ) : (
              <span
                className="h-[46px] w-[46px] rounded-full border-[3px]"
                style={{ background: category.color, borderColor: 'var(--w-ink)' }}
              />
            )}
            <span className="gp-label text-center text-[0.56rem] leading-tight">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
