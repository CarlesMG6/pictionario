"use client";

import { useRef, useState } from 'react';
import DiceRoll from '../world/DiceRoll';
import { FlickHint } from '../ui/Glyphs';

// Tirar el dado no es pulsar un botón: el dado está ahí, se coge con el dedo y
// se lanza. Sale en la dirección del gesto, bota, rueda y se para — la
// simulación vive en DiceRoll.
//
// Vale cualquiera de las dos cosas, un tirón corto y rápido o un arrastre
// largo: exigir velocidad deja fuera a quien arrastra despacio. Y un toque sin
// arrastrar no lanza nada, porque el dado ya se mueve solo y eso basta para
// decir que se puede coger.
const THROW_DISTANCE = 54;
const THROW_VELOCITY = 0.45;
const DRAG_SCALE = 110;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Capturar el puntero evita perder el gesto si el dedo se sale del elemento,
// pero lanza si el puntero ya no está activo: el gesto no puede depender de eso.
function capture(event) {
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId);
  } catch {
    /* sin captura el gesto sigue funcionando mientras el dedo no se salga */
  }
}

export default function ThrowDice({ value, thrown, onThrow, disabled }) {
  const [drag, setDrag] = useState({ dx: 0, dy: 0 });
  const [dragging, setDragging] = useState(false);
  const [impulse, setImpulse] = useState({ x: 0, y: -1 });
  const startRef = useRef(null);

  if (thrown) {
    return (
      <div className="relative flex-1">
        <DiceRoll
          className="absolute inset-0"
          rolling
          value={value}
          throwX={impulse.x}
          throwY={impulse.y}
          lookY={1.3}
        />
      </div>
    );
  }

  const onDown = (event) => {
    if (disabled) return;
    capture(event);
    startRef.current = { x: event.clientX, y: event.clientY, t: performance.now() };
    setDragging(true);
  };

  const onMove = (event) => {
    const start = startRef.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Hacia abajo apenas se deja mover: el dado se lanza hacia arriba.
    setDrag({ dx: clamp(dx, -90, 90), dy: clamp(dy > 0 ? dy * 0.3 : dy, -90, 40) });
  };

  const rest = () => {
    startRef.current = null;
    setDragging(false);
    setDrag({ dx: 0, dy: 0 });
  };

  const onUp = (event) => {
    const start = startRef.current;
    rest();
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const speed = -dy / Math.max(1, performance.now() - start.t);

    if (-dy > THROW_DISTANCE || speed > THROW_VELOCITY) {
      setImpulse({
        x: clamp(dx / DRAG_SCALE, -1.5, 1.5),
        y: clamp(dy / DRAG_SCALE, -1.7, -0.35),
      });
      onThrow?.();
    }
  };

  return (
    <div className="relative flex-1">
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${drag.dx}px, ${drag.dy}px)`,
          transition: dragging ? 'none' : 'transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.35)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <DiceRoll className="h-full w-full" value={value} lookY={1.3} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[26%] flex justify-center text-[#23222b]/45">
        <FlickHint size={40} />
      </div>

      {/* La diana del gesto es toda el área: acertarle a un objeto pequeño en
          movimiento con el dedo es pedir mucho. */}
      <div
        className="gp-grab absolute inset-0"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={rest}
        onLostPointerCapture={rest}
      />
    </div>
  );
}
