"use client";

import React, { useMemo, useState } from "react";
import dynamic from 'next/dynamic';
import { speciesFromIcon } from '../../../game/animals';
import { seedFromString } from '../../../game/worldGenerator';
import { teamColor } from '../../../components/hud/teamColors';
import { useGameRoom } from '../../../hooks/useGameRoom';
import { useRoundTimer } from '../../../hooks/useRoundTimer';
import { useDiceRoll } from '../../../hooks/useDiceRoll';
import CurrentCategory from '../../../components/hud/CurrentCategory';
import TeamsBar from '../../../components/hud/TeamsBar';
import HelpPanel from '../../../components/hud/HelpPanel';
import DiceModal from '../../../components/modals/DiceModal';
import TimerModal from '../../../components/modals/TimerModal';
import EndGameModal from '../../../components/modals/EndGameModal';
import QrModal from '../../../components/modals/QrModal';

// El canvas solo existe en cliente: WebGL no se puede renderizar en el servidor.
const BoardWorld = dynamic(() => import('../../../components/world/BoardWorld'), { ssr: false });

export default function HostPlayPage({ params }) {
  // Compatibilidad futura: unwrap params si es un Promise.
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const { room_id } = resolvedParams;

  const { gameState, teams, board, boardRef, roomConfig } = useGameRoom(room_id);
  const phase = gameState?.current_phase;

  const dice = useDiceRoll(room_id, phase, boardRef);
  const round = useRoundTimer(room_id, phase, roomConfig?.round_time);

  const [showQrModal, setShowQrModal] = useState(false);

  // Las salas creadas antes de que se guardara la semilla siguen teniendo mundo:
  // se deriva de su id, que también es estable.
  const worldSeed = roomConfig?.world_seed ?? seedFromString(room_id);

  // Los equipos no guardan color: se deriva del orden de entrada, de modo que el
  // peón del mundo y la tarjeta del HUD siempre coinciden.
  const pawns = useMemo(
    () =>
      teams.map((team, index) => ({
        id: team.id,
        species: speciesFromIcon(team.icon_url),
        color: teamColor(index),
        position: team.position || 0,
      })),
    [teams],
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-sky-300">
      {board.length > 0 ? (
        <BoardWorld seed={worldSeed} board={board} teams={pawns} />
      ) : (
        <div className="flex h-full items-center justify-center text-lg text-slate-600">
          Cargando mundo...
        </div>
      )}

      <div className="pointer-events-none absolute left-5 top-5 text-xl font-bold tracking-tighter text-white drop-shadow-lg">
        Pictionario
      </div>

      <CurrentCategory categoryKey={gameState?.current_category} allPlay={gameState?.all_play} />

      <TeamsBar teams={teams} currentTeamId={gameState?.current_turn_team} totalTiles={board.length} />

      <HelpPanel categories={roomConfig?.categories} onJoin={() => setShowQrModal(true)} />

      {round.visible && (
        <TimerModal
          phase={phase}
          countdown={round.countdown}
          timer={round.timer}
          duration={round.duration}
        />
      )}

      {dice.rolling && <DiceModal value={dice.value} />}

      {phase === 'end' && (
        <EndGameModal
          teams={teams}
          winnerTeamId={gameState?.winner_team}
          ranking={gameState?.ranking}
          roomCode={roomConfig?.code}
        />
      )}

      {showQrModal && roomConfig?.code && (
        <QrModal code={roomConfig.code} onClose={() => setShowQrModal(false)} />
      )}
    </div>
  );
}
