"use client";

import Modal from './Modal';

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const rad = ((angleInDegrees - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const arcSweep = endAngle - startAngle <= 180 ? 0 : 1;
  return ['M', start.x, start.y, 'A', r, r, 0, arcSweep, 0, end.x, end.y].join(' ');
}

// Arco de 270º (de -225º a 45º) que se vacía con el tiempo restante. Cambia de
// color al entrar en los últimos segundos, que es cuando hay que mirarlo.
function CircularProgress({ value, max }) {
  const percent = Math.max(0, Math.min(1, value / max));
  const r = 70;
  const cx = 80;
  const cy = 80;
  const stroke = percent > 0.22 ? '#2b9e57' : '#dc4b3e';

  return (
    <svg width="160" height="160">
      <path
        d={describeArc(cx, cy, r, -225, 45)}
        stroke="#23222b"
        strokeOpacity="0.16"
        strokeWidth="15"
        fill="none"
        strokeLinecap="round"
      />
      {percent > 0 && (
        <path
          d={describeArc(cx, cy, r, -225, -225 + 270 * percent)}
          stroke={stroke}
          strokeWidth="15"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function TimerModal({ phase, countdown, timer, duration }) {
  const stopped = phase === 'timer_stopped';

  return (
    <Modal className="min-w-[340px] px-10 py-8">
      {phase === 'timer_starts' && countdown > 0 ? (
        <div className="flex flex-col items-center">
          <div className="gp-number text-8xl leading-none text-[#23222b]">{countdown}</div>
          <div className="gp-caption mt-3">Preparados</div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <CircularProgress value={timer} max={duration} />
            <span className="gp-number absolute text-4xl text-[#23222b]">{formatTimer(timer || 0)}</span>
          </div>
          <div className="gp-caption mt-3">{stopped ? 'Se acabó' : 'Tiempo en marcha'}</div>
        </div>
      )}
    </Modal>
  );
}
