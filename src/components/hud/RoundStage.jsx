"use client";

import RoundClock from '../ui/RoundClock';
import { Check, Cross, FlickHint } from '../ui/Glyphs';
import DiceRoll from '../world/DiceRoll';
import TeamBadge from './TeamBadge';
import { teamColor } from './teamColors';

// El narrador de la pantalla grande. En cada fase la sala tiene que saber una
// sola cosa —a quién esperamos y para qué—, así que el centro enseña esa cosa y
// nada más. Los datos permanentes (categoría, marcador) viven fuera, en el HUD.
//
// Ninguna fase pone un velo opaco salvo la cuenta atrás: debajo hay un mundo 3D
// a todo color y taparlo durante los 45 segundos de la ronda lo convertía en un
// fondo de pantalla.

function Scrim({ opacity = 0.34 }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(60% 55% at 50% 44%, rgba(20,19,26,${opacity}) 0%, rgba(20,19,26,${
          opacity * 0.55
        }) 45%, rgba(20,19,26,0) 78%)`,
      }}
    />
  );
}

function TeamChip({ team, color }) {
  if (!team) return null;
  return (
    <div className="gp-panel flex items-center gap-3 px-5 py-2">
      <span className="h-4 w-4 rounded-full border-2 border-[#23222b]" style={{ background: color }} />
      <span className="gp-label text-lg">{team.name}</span>
    </div>
  );
}

export default function RoundStage({ phase, teams, gameState, round, dice }) {
  const index = teams.findIndex((t) => t.id === gameState?.current_turn_team);
  const team = index >= 0 ? teams[index] : null;
  const color = teamColor(Math.max(0, index));

  // Turno resuelto y ficha en movimiento: el escenario se aparta para que se vea
  // saltar al peón, que es lo único que importa en ese segundo.
  if (phase === 'dice_rolling' && !dice?.rolling) return null;
  if (!['play', 'timer_starts', 'timer_running', 'timer_stopped', 'dice', 'dice_rolling'].includes(phase)) {
    return null;
  }

  const stage = (() => {
    switch (phase) {
      // Esperando a que el equipo lea la palabra y arranque la ronda.
      case 'play':
        return (
          <div className="gp-pop flex flex-col items-center">
            <TeamBadge team={team} color={color} size={148} />
          </div>
        );

      // Preparados: 3 · 2 · 1. Es la única fase que sí tapa el mundo, porque
      // dura tres segundos y todo el mundo tiene que mirar a la vez.
      case 'timer_starts':
        return (
          <div className="flex flex-col items-center">
            <span
              key={round?.countdown}
              className="gp-display gp-tick text-[#fdf6e8]"
              style={{ fontSize: '13rem', lineHeight: 1, textShadow: '0 8px 0 rgba(20,19,26,0.5)' }}
            >
              {round?.countdown > 0 ? round.countdown : '¡Ya!'}
            </span>
          </div>
        );

      case 'timer_running':
        return (
          <div className="flex flex-col items-center">
            <RoundClock seconds={round?.timer ?? 0} duration={round?.duration ?? 45} size={280} />
            <div className="mt-5">
              <TeamChip team={team} color={color} />
            </div>
          </div>
        );

      // Se acabó el tiempo: el reloj a cero y los dos desenlaces latiendo, que
      // es lo que el equipo está decidiendo en el móvil ahora mismo.
      case 'timer_stopped':
        return (
          <div className="flex flex-col items-center">
            <RoundClock seconds={0} duration={round?.duration ?? 45} size={240} />
            <div className="mt-6 flex items-center gap-5">
              <span
                className="gp-panel gp-beat flex h-16 w-16 items-center justify-center text-[#dc4b3e]"
                style={{ borderRadius: 999, animationDelay: '0.12s' }}
              >
                <Cross size={32} />
              </span>
              <span
                className="gp-panel gp-beat flex h-16 w-16 items-center justify-center text-[#2b9e57]"
                style={{ borderRadius: 999 }}
              >
                <Check size={32} />
              </span>
            </div>
          </div>
        );

      // El dado espera el lanzamiento del móvil; los galones repiten en grande
      // el gesto que tiene que hacer el jugador.
      case 'dice':
        return (
          <div className="gp-pop flex flex-col items-center">
            <div className="text-[#fdf6e8] drop-shadow-[0_3px_0_rgba(20,19,26,0.45)]">
              <FlickHint size={46} />
            </div>
            <DiceRoll style={{ width: 340, height: 340 }} value={gameState?.dice_value} pinned topDown lookY={0.45} />
            <TeamChip team={team} color={color} />
          </div>
        );

      // La tirada, vista desde arriba: el dado se queda en el centro y lo que
      // gira es él, como se mira un dado sobre la mesa.
      case 'dice_rolling':
        return (
          <DiceRoll
            style={{ width: 420, height: 420 }}
            value={dice?.value ?? gameState?.dice_value}
            rolling
            pinned
            topDown
            lookY={0.45}
          />
        );

      default:
        return null;
    }
  })();

  const hurry = phase === 'timer_running' && (round?.timer ?? 99) <= 5;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {phase === 'timer_starts' ? (
        <div className="absolute inset-0 bg-[#14131a]/55 backdrop-blur-[2px]" />
      ) : (
        <Scrim opacity={phase === 'timer_running' ? 0.28 : 0.4} />
      )}

      {/* Últimos segundos: el borde de la pantalla late en rojo. Se ve desde
          cualquier punto de la sala aunque nadie esté mirando el reloj.
          Cuando el tiempo ya se ha acabado el rojo se queda quieto: el equipo
          puede tardar lo que quiera en decidir, y una pantalla parpadeando
          todo ese rato cansa en vez de avisar. */}
      {hurry && (
        <div
          className="gp-alarm absolute inset-0"
          style={{ boxShadow: 'inset 0 0 200px 70px rgba(220,75,62,0.5)' }}
        />
      )}
      {phase === 'timer_stopped' && (
        <div
          className="absolute inset-0"
          style={{ boxShadow: 'inset 0 0 180px 50px rgba(220,75,62,0.3)' }}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center pb-40">{stage}</div>
    </div>
  );
}
