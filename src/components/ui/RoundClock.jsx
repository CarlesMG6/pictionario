"use client";

// Reloj de la ronda: un disco de arcilla con el anillo vaciándose. La misma
// pieza sirve en la pantalla grande y en el móvil cambiando el tamaño, para que
// el que dibuja y el que mira lean exactamente el mismo reloj.
//
// El color avisa antes que la cifra: verde mientras sobra tiempo, ámbar por la
// mitad y rojo en los últimos segundos.
function toneFor(ratio) {
  if (ratio > 0.5) return '#2b9e57';
  if (ratio > 0.22) return '#e8a51c';
  return '#dc4b3e';
}

export default function RoundClock({ seconds = 0, duration = 45, size = 200, showDigits = true }) {
  const safeDuration = duration > 0 ? duration : 1;
  const ratio = Math.max(0, Math.min(1, seconds / safeDuration));
  const color = toneFor(ratio);
  const low = seconds <= 5;
  const hurry = low && seconds > 0;

  const stroke = size * 0.085;
  const radius = (size - stroke) / 2 - size * 0.045;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'var(--w-cream)',
          border: `${Math.max(3, size * 0.018)}px solid var(--w-ink)`,
          boxShadow: `0 ${Math.max(4, size * 0.03)}px 0 rgba(35,34,43,0.38)`,
        }}
      />
      <svg width={size} height={size} className="relative" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--w-ink)"
          strokeOpacity="0.14"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s ease' }}
        />
      </svg>
      {showDigits && (
        <span
          className={`gp-display absolute tabular-nums ${hurry ? 'gp-beat' : ''}`}
          style={{ fontSize: size * 0.34, color: low ? '#dc4b3e' : 'var(--w-ink)', lineHeight: 1 }}
        >
          {Math.max(0, seconds)}
        </span>
      )}
    </div>
  );
}
