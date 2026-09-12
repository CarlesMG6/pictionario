"use client";

import { useMemo } from 'react';
import { speciesFromIcon } from '../../game/animals';
import { animalPortrait } from './animalPortrait';
import { teamColor } from './teamColors';

const ORDINALS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º'];

// Barra inferior de equipos: la figura del jugador a la izquierda, fuera de la
// tarjeta y pisándola, y a su derecha la ficha con los datos. La del líder se
// eleva y la del turno en curso se marca con una banda superior.
export default function TeamsBar({ teams, currentTeamId, totalTiles }) {
  const portraits = useMemo(
    () =>
      Object.fromEntries(
        (teams || []).map((team) => [team.id, animalPortrait(speciesFromIcon(team.icon_url))]),
      ),
    [teams],
  );

  if (!teams || teams.length === 0) return null;

  // El puesto va por posición en el tablero; los empates lo comparten, que es lo
  // que espera cualquiera que mire la barra.
  const sorted = [...teams].sort((a, b) => (b.position || 0) - (a.position || 0));
  const rankOf = (team) => sorted.findIndex((t) => (t.position || 0) === (team.position || 0)) + 1;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-center gap-6 px-5 pb-5 pt-16">
      {teams.map((team, index) => {
        const color = teamColor(index);
        const rank = rankOf(team);
        const isTurn = team.id === currentTeamId;
        const portrait = portraits[team.id];

        return (
          <div
            key={team.id}
            className={`relative flex items-end transition-transform duration-300 ${
              rank === 1 ? '-translate-y-1.5' : ''
            }`}
          >
            {/* La figura vive fuera de la tarjeta y se apoya sobre su borde. */}
            <div className="relative z-10 -mr-5 mb-[-6px] flex h-[108px] w-[96px] items-end justify-center">
              {portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={portrait} alt="" className="h-[112px] w-[112px] object-contain drop-shadow-[0_5px_4px_rgba(0,0,0,0.35)]" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.icon_url || '/vercel.svg'} alt="" className="h-16 w-16 object-contain" />
              )}
            </div>

            <div className="gp-panel relative overflow-hidden pl-9 pr-4 pt-2.5 pb-2.5">
              {/* Banda del color del equipo; se ilumina entera en su turno. */}
              <div
                className="absolute inset-y-0 left-0 w-3 transition-all"
                style={{ background: color }}
              />
              {isTurn && <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />}

              <div className="flex items-center gap-5">
                <div className="min-w-0">
                  <div className="gp-label max-w-[13rem] truncate text-[0.95rem] leading-tight">
                    {team.name}
                  </div>
                  <div className="gp-caption mt-0.5">
                    Casilla {(team.position || 0) + 1}
                    {totalTiles ? ` / ${totalTiles}` : ''}
                  </div>
                </div>

                <div
                  className="gp-number text-[2.1rem] leading-none"
                  style={{ color: rank === 1 ? '#e8a51c' : '#9a958e' }}
                >
                  {ORDINALS[rank - 1] || `${rank}º`}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
