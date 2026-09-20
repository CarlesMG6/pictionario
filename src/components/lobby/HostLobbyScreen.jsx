"use client";

import { useDeferredValue, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { buildBoard } from '../../game/board';
import { teamColor } from '../hud/teamColors';
import { STAGES, seatLabel } from '../../utils/RoomLogic';
import { CategoryLegend, ConfigSummary } from './ConfigSummary';
import { RoomCodeChip, RoomCodePanel } from './RoomCode';
import { PlayerCard, SeatRow } from './Seats';

// El canvas solo existe en cliente: WebGL no se puede renderizar en el servidor.
const BoardWorld = dynamic(() => import('../world/BoardWorld'), { ssr: false });

// La pantalla grande antes de la partida. No tiene un solo control: los mandos
// están en el móvil de P1, y aquí se ve lo que P1 va haciendo. Por eso el mundo
// está desde el primer momento y a pantalla completa —es el mismo escenario de
// la partida, no una vista previa metida en un recuadro— y los paneles flotan
// encima, como en el HUD del juego.
export default function HostLobbyScreen({
  stage = STAGES.LOBBY,
  code = '',
  teams = [],
  config,
  seed = 1,
  inline = false,
}) {
  // Montar el archipiélago cuesta lo suyo y es lo último que tiene que ir
  // fluido: si P1 recorre la rejilla de categorías a dedazos, la tele reconstruye
  // el mundo cuando puede, no en cada pulsación.
  const board = useMemo(() => buildBoard(config.categories, config.duration), [config.categories, config.duration]);
  const previewBoard = useDeferredValue(board);

  return (
    <div className={`${inline ? 'absolute' : 'fixed'} inset-0 overflow-hidden`} style={{ background: 'var(--w-sky)' }}>
      <div className="absolute inset-0">
        <BoardWorld seed={seed} board={previewBoard} teams={[]} />
      </div>

      <div className="gp-display pointer-events-none absolute left-6 top-6 z-40 text-2xl text-white drop-shadow-[0_3px_0_rgba(27,55,80,0.5)]">
        Pictionario
      </div>

      {stage !== STAGES.LOBBY && (
        <div className="absolute right-6 top-6 z-40">
          <RoomCodeChip code={code} />
        </div>
      )}

      {stage === STAGES.LOBBY && <LobbyStage code={code} teams={teams} />}
      {stage === STAGES.SETUP && <SetupStage teams={teams} config={config} />}
      {stage === STAGES.ROSTER && <RosterStage teams={teams} />}
    </div>
  );
}

// Los rótulos de la pantalla grande van en chapa de papel y no en texto blanco:
// debajo hay un mundo a todo color, y sobre la arena clara un texto blanco con
// sombra se pierde justo cuando hace falta leerlo desde el sofá.
function Caption({ size = 'sm', children }) {
  // Tailwind necesita ver la clase entera para generarla, así que nada de
  // componerla con una plantilla.
  const text = size === 'lg' ? 'text-lg' : 'text-sm';
  return <div className={`gp-panel gp-label px-4 py-2 leading-none ${text}`}>{children}</div>;
}

function LobbyStage({ code, teams }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-10 p-8">
      <RoomCodePanel code={code} />

      <div className="flex flex-col items-center gap-3">
        <SeatRow teams={teams} size={96} />
        <Caption>
          {teams.length === 0 ? 'Esperando al primer jugador' : 'P1 lleva los mandos'}
        </Caption>
      </div>
    </div>
  );
}

function SetupStage({ teams, config }) {
  return (
    <>
      <div className="pointer-events-none absolute left-6 top-20 z-30 w-[320px]">
        <div className="gp-panel overflow-hidden p-0">
          <div
            className="flex items-center gap-2.5 border-b-[3px] px-4 py-3"
            style={{ borderColor: 'var(--w-ink)' }}
          >
            <i className="h-4 w-4 rounded-full border-[3px] border-[#23222b]" style={{ background: teamColor(0) }} />
            <span className="gp-label text-sm">{seatLabel(0)} monta la partida</span>
          </div>
          <div className="p-4">
            <ConfigSummary config={config} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-4 p-6">
        <div className="gp-panel max-w-5xl p-3">
          <CategoryLegend categories={config.categories} />
        </div>
        <SeatRow teams={teams} size={64} showEmpty={false} />
      </div>
    </>
  );
}

function RosterStage({ teams }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 p-8">
      <Caption size="lg">Eligen criatura</Caption>

      <div className="flex flex-wrap items-end justify-center gap-6">
        {teams.map((team, index) => (
          <PlayerCard key={team.id} index={index} team={team} />
        ))}
      </div>

      <Caption>
        {teams.length < 2
          ? 'Hacen falta dos equipos para empezar'
          : `${seatLabel(0)} empieza cuando estéis listos`}
      </Caption>
    </div>
  );
}
