"use client";

// Pictogramas del juego. Todos comparten el trazo del canvas de diseño (2.2 de
// grosor, extremos redondos, `currentColor`) para que se lean como una familia
// y no como iconos sueltos de distintas librerías.
//
// Los de gesto (PressHint, FlickHint) no son iconos: son pequeñas animaciones
// que enseñan el movimiento que hay que hacer. Es lo que sustituye al texto
// explicativo.

export function Hourglass({ size = 28, fill = 'top', color = '#f7c948', ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      {(fill === 'top' || fill === 'both') && <path d="M8 6.2h8l-4 5.6z" fill={color} />}
      {(fill === 'bottom' || fill === 'both') && <path d="M8 18.4h8l-4-5.4z" fill={color} />}
      <path
        d="M6.6 4.2h10.8l-5.4 7.8zM6.6 20.4h10.8l-5.4-7.8z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M4.6 3.3h14.8M4.6 21.3h14.8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Check({ size = 28, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <path
        d="M4.5 12.8 10 18.4 19.6 6.4"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Cross({ size = 28, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <path
        d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Pencil({ size = 28, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <path
        d="M4 20.2l1-4.3L15.7 5.2a2.1 2.1 0 0 1 3 0l1.2 1.2a2.1 2.1 0 0 1 0 3L9.2 20.2z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M14.4 6.6 18.4 10.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Trophy({ size = 28, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <path
        d="M7 3.5h10v5.2a5 5 0 0 1-10 0z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M7 5h-2.6a3 3 0 0 0 3 3.6M17 5h2.6a3 3 0 0 1-3 3.6M12 13.8v3.4M8.4 20.5h7.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Rotate({ size = 28, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <path
        d="M20.2 12a8.2 8.2 0 1 1-2.6-6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M20.4 3.4v5h-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Dedo que baja y deja ondas: «mantén pulsado aquí».
export function PressHint({ size = 54, ...rest }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 48 50" fill="none" {...rest}>
      <g style={{ transformOrigin: '24px 14px' }}>
        <ellipse
          cx="24"
          cy="13"
          rx="9"
          ry="4"
          stroke="currentColor"
          strokeWidth="2.2"
          opacity="0.55"
          style={{ animation: 'gp-ripple 2.1s ease-out infinite', transformOrigin: '24px 13px' }}
        />
        <ellipse
          cx="24"
          cy="13"
          rx="14"
          ry="6"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
          style={{ animation: 'gp-ripple 2.1s ease-out infinite 0.16s', transformOrigin: '24px 13px' }}
        />
      </g>
      <g style={{ animation: 'gp-press 2.1s ease-in-out infinite', transformOrigin: '24px 30px' }}>
        <path
          d="M20.6 24V13.4a2.6 2.6 0 0 1 5.2 0V24"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M25.8 21.6l6.2 2.2a3 3 0 0 1 1.9 3.5l-1.4 5.6a4.4 4.4 0 0 1-4.3 3.3h-4.6a4.4 4.4 0 0 1-3.5-1.8l-3.7-5a2.3 2.3 0 0 1 3.4-3.1l2.8 2.4"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

// Tres galones que suben en cascada: «lanza hacia arriba».
export function FlickHint({ size = 34, ...rest }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 24 30" fill="none" {...rest}>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M5 ${20 - i * 7} 12 ${13 - i * 7} 19 ${20 - i * 7}`}
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: `gp-rise 1.5s ease-out infinite ${i * 0.2}s` }}
        />
      ))}
    </svg>
  );
}
