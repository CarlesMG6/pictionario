"use client";

import { useEffect, useRef, useState } from 'react';
import { categoryOf } from '../../utils/CategoryWords';
import { PressHint, Rotate } from '../ui/Glyphs';

// La carta de la palabra. Dos gestos, ninguno explicado con texto:
//
//  - mantener el dedo encima la enfoca, y al soltar se vuelve a emborronar. Es
//    lo mismo que tapar una carta con la mano: nunca se queda destapada sobre
//    la mesa por descuido, que es justo lo que pasaba con el interruptor de ojo.
//  - arrastrarla a la derecha reparte una palabra nueva; a la izquierda vuelve
//    a la anterior, como quien deshace.
//
// Sin `canReveal` la carta no se destapa: el equipo que no juega la ve borrosa y
// no puede hacer nada con ella, así que tampoco se le enseña el dedo — un
// pictograma que invita a pulsar algo que no responde es peor que ninguno.
//
// La palabra se dibuja siempre, solo que desenfocada: verla borrosa dice que
// hay algo debajo mucho mejor que un rótulo de «palabra oculta».
const DRAG_START = 14;
const SLIDE_AT = 96;
const FLY = 420;

export default function WordCard({
  word,
  categoryKey,
  // Una vez acabada la ronda basta un toque para dejarla a la vista: a veces se
  // sigue jugando después del pitido, y ahí ya no hay nada que proteger.
  stickyReveal = false,
  canReveal = true,
  canSlide = false,
  canGoBack = false,
  onSlide,
}) {
  const [mode, setMode] = useState('none');
  const [dx, setDx] = useState(0);
  const [instant, setInstant] = useState(false);
  const [stuck, setStuck] = useState(false);
  const startRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Palabra nueva, secreto nuevo: la carta se vuelve a tapar.
  useEffect(() => {
    setStuck(false);
  }, [word]);

  const revealed = canReveal && (stuck || mode === 'peek');
  const category = categoryOf(categoryKey);
  const interactive = canReveal || canSlide;

  const allowed = (direction) => canSlide && (direction > 0 || canGoBack);

  const reset = () => {
    startRef.current = null;
    setMode('none');
    setDx(0);
  };

  const slide = (direction) => {
    setMode('none');
    startRef.current = null;
    setDx(direction * FLY);
    onSlide?.(direction > 0 ? 'next' : 'prev');
    timersRef.current.push(
      setTimeout(() => {
        setInstant(true);
        setDx(-direction * FLY);
        timersRef.current.push(
          setTimeout(() => {
            setInstant(false);
            setDx(0);
          }, 40),
        );
      }, 220),
    );
  };

  const onDown = (event) => {
    if (!interactive) return;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* sin captura el gesto sigue funcionando mientras el dedo no se salga */
    }
    startRef.current = { x: event.clientX };
    setMode(canReveal ? 'peek' : 'none');
  };

  const onMove = (event) => {
    if (!startRef.current) return;
    const delta = event.clientX - startRef.current.x;
    if (mode === 'drag' || (canSlide && Math.abs(delta) > DRAG_START)) {
      if (mode !== 'drag') setMode('drag');
      setDx(delta);
    }
  };

  const onUp = () => {
    if (mode === 'drag' && Math.abs(dx) > SLIDE_AT && allowed(Math.sign(dx))) {
      slide(Math.sign(dx));
      return;
    }
    // Toque limpio, sin arrastre: en la fase en que ya no hay secreto, destapa.
    if (mode === 'peek' && stickyReveal) setStuck(true);
    reset();
  };

  // Cuanto más lejos va la carta, más sólido se pone el icono: el gesto dice
  // por sí mismo cuándo ha llegado lo bastante lejos.
  const pull = Math.min(1, Math.abs(dx) / SLIDE_AT);
  const direction = Math.sign(dx);

  return (
    <div className="relative flex w-full flex-1 items-stretch">
      {allowed(direction) && pull > 0 && (
        <span
          className="pointer-events-none absolute top-1/2 z-10 text-[#23222b]"
          style={{
            [direction > 0 ? 'right' : 'left']: -6,
            opacity: pull,
            transform: `translateY(-50%) scale(${0.7 + pull * 0.45})${
              direction > 0 ? '' : ' scaleX(-1)'
            }`,
          }}
        >
          <Rotate size={34} />
        </span>
      )}

      <div
        className={`gp-panel relative flex w-full flex-col items-center justify-center px-5 pb-6 pt-5 ${
          interactive ? 'gp-grab' : ''
        }`}
        style={{
          transform: `translateX(${dx}px) rotate(${dx / 30}deg)`,
          transition: instant ? 'none' : 'transform 0.26s cubic-bezier(0.2, 0.9, 0.3, 1.1)',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={reset}
        onLostPointerCapture={reset}
      >
        {category && <div className="gp-caption mb-3 text-center">{category.label}</div>}

        <div className="relative flex w-full flex-1 items-center justify-center">
          <span
            className="gp-display w-full text-center leading-tight text-[#23222b]"
            style={{
              fontSize: 'clamp(1.6rem, 8.5vw, 2.9rem)',
              wordBreak: 'break-word',
              filter: revealed ? 'none' : 'blur(15px)',
              opacity: revealed ? 1 : 0.42,
              transform: revealed ? 'none' : 'scale(1.04)',
              transition: 'filter 0.16s ease, opacity 0.16s ease, transform 0.16s ease',
            }}
          >
            {word || '—'}
          </span>

          {!revealed && canReveal && (
            <span className="pointer-events-none absolute text-[#23222b]/70">
              <PressHint size={60} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
