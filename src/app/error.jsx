"use client";

import NoticeScreen, { NoticeButton } from '../components/ui/NoticeScreen';

// Cuando una pantalla se cae. La partida vive en la sala, no en este navegador,
// así que reintentar casi siempre basta: `reset` vuelve a montar la ruta sin
// recargar, y si no, queda la portada.
export default function Error({ reset }) {
  return (
    <NoticeScreen
      art={<BrokenTile />}
      title="Se ha roto una casilla"
      caption="Algo ha fallado en esta pantalla. La partida sigue en la sala: se puede volver a entrar."
    >
      <NoticeButton onClick={() => reset()} primary>
        Reintentar
      </NoticeButton>
      <NoticeButton href="/">Ir a la portada</NoticeButton>
    </NoticeScreen>
  );
}

// Una casilla del camino, rajada. Es la pieza más reconocible del juego: rota
// se entiende sin leer que algo se ha partido.
function BrokenTile() {
  return (
    <svg viewBox="0 0 260 180" className="w-[220px] sm:w-[240px]" aria-hidden="true">
      <ellipse cx="130" cy="150" rx="96" ry="22" fill="#1B8FC4" opacity="0.26" />
      <g transform="rotate(-6 130 116)">
        <ellipse cx="130" cy="132" rx="66" ry="21" fill="#FBF3E2" />
        <path d="M64 132 A66 21 0 0 0 196 132 L196 120 A66 21 0 0 1 64 120 Z" fill="#E7DAC0" />
        <ellipse cx="130" cy="120" rx="66" ry="21" fill="#FBF3E2" />
        <path d="M74 106 A56 18 0 0 0 186 106 L186 96 A56 18 0 0 1 74 96 Z" fill="#b23a30" />
        <ellipse cx="130" cy="96" rx="56" ry="18" fill="#dc4b3e" />
        <path
          d="M84 92 L108 98 L98 86 L124 96 L116 84 L142 96 L134 86 L160 98 L150 88 L176 100"
          stroke="#23222b"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </g>
      <g transform="rotate(24 214 138)">
        <ellipse cx="214" cy="138" rx="17" ry="6" fill="#FBF3E2" />
        <ellipse cx="214" cy="132" rx="14" ry="5" fill="#dc4b3e" />
      </g>
      <path
        d="M126 54 l-9 24 l14 -4 l-11 26"
        stroke="#23222b"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}
