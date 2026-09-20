"use client";

import TeamAvatar from './TeamAvatar';

// Marco de la pantalla del móvil. Tres cosas fijas y nada más:
//
//  - la franja de arriba lleva el color del equipo que juega, así que el
//    teléfono entero se tiñe de quien tiene el turno y se sabe de un vistazo si
//    toca actuar;
//  - la barra de identidad dice de quién es este teléfono, que en una mesa con
//    cuatro móviles iguales es la primera duda que aparece;
//  - el fondo es el mismo cielo y el mismo mar de la pantalla grande, para que
//    las dos pantallas se lean como un solo juego.
export default function PlayerFrame({ myTeam, myColor, turnColor, seatLabel = null, inline = false, children }) {
  return (
    <div
      className={`${inline ? 'absolute' : 'fixed'} inset-0 flex flex-col overflow-hidden`}
      style={{
        height: inline ? '100%' : '100dvh',
        background: 'linear-gradient(180deg, #6fcdf2 0%, #a6e1f7 46%, #cdeeff 74%)',
        // El area segura se reserva aqui y no en la franja de color: la franja
        // mide siete pixeles, y con box-sizing el hueco de la muesca se le
        // comeria entera en un movil con notch.
        paddingTop: inline ? 0 : 'env(safe-area-inset-top)',
      }}
    >
      {/* Mar al pie: ancla la pantalla en el mundo del tablero. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]"
        style={{ background: 'linear-gradient(180deg, rgba(143,229,240,0) 0%, #8fe5f0 26%, #3fb8de 62%, #1b8fc4 100%)' }}
      />

      <div
        className="relative z-10 shrink-0 transition-colors duration-500"
        style={{ height: 7, background: turnColor || '#23222b' }}
      />

      <div
        className="relative z-10 flex shrink-0 items-center gap-3 border-b-[3px] border-[#23222b] px-4 py-2.5"
        style={{ background: 'var(--w-paper)' }}
      >
        <TeamAvatar team={myTeam} color={myColor} size={44} label={seatLabel} />
        <span className="gp-label min-w-0 flex-1 truncate text-[0.95rem] text-[#23222b]">
          {myTeam?.name || seatLabel || 'Equipo'}
        </span>
      </div>

      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {children}
      </div>
    </div>
  );
}
