"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { speciesFromIcon } from '../../../game/animals';
import { seedFromString } from '../../../game/worldGenerator';
import { teamColor } from '../../../components/hud/teamColors';
import { useGameRoom } from '../../../hooks/useGameRoom';
import { GameLogic } from '../../../utils/GameLogic';
import { STAGES } from '../../../utils/RoomLogic';
import { useRoundTimer } from '../../../hooks/useRoundTimer';
import { useDiceRoll } from '../../../hooks/useDiceRoll';
import CurrentCategory from '../../../components/hud/CurrentCategory';
import TeamsBar from '../../../components/hud/TeamsBar';
import HelpPanel from '../../../components/hud/HelpPanel';
import RoundStage from '../../../components/hud/RoundStage';
import EndGameModal from '../../../components/modals/EndGameModal';
import QrModal from '../../../components/modals/QrModal';

// El canvas solo existe en cliente: WebGL no se puede renderizar en el servidor.
const BoardWorld = dynamic(() => import('../../../components/world/BoardWorld'), { ssr: false });

export default function HostPlayPage({ params }) {
  // Compatibilidad futura: unwrap params si es un Promise.
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const { room_id } = resolvedParams;

  const router = useRouter();
  const { gameState, teams, board, boardRef, roomConfig } = useGameRoom(room_id);
  const phase = gameState?.current_phase;

  // La sala puede salir de la partida desde cualquier móvil —«nueva partida» la
  // devuelve a la configuración—, así que la pantalla grande sigue a `stage` en
  // vez de esperar a que alguien la lleve de vuelta.
  const stage = roomConfig?.stage;
  useEffect(() => {
    if (stage && stage !== STAGES.PLAYING && roomConfig?.code) {
      router.replace(`/host/${roomConfig.code}`);
    }
  }, [stage, roomConfig?.code, router]);

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
    <div className="fixed inset-0 overflow-hidden bg-[#6fcdf2]">
      {board.length > 0 ? (
        <BoardWorld
          seed={worldSeed}
          board={board}
          teams={pawns}
          focusId={gameState?.current_turn_team}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <div className="gp-display text-3xl text-white drop-shadow-[0_3px_0_rgba(27,55,80,0.45)]">
            Pictionario
          </div>
          <div className="gp-caption text-white/90">Levantando la isla</div>
        </div>
      )}

      <div className="gp-display pointer-events-none absolute left-6 top-6 z-40 text-2xl text-white drop-shadow-[0_3px_0_rgba(27,55,80,0.5)]">
        Pictionario
      </div>

      <CurrentCategory categoryKey={gameState?.current_category} allPlay={gameState?.all_play} />

      {/* Lo que la sala tiene que mirar ahora mismo: a quién esperamos, el reloj
          de la ronda o el dado. Todo lo demás es marco. */}
      <RoundStage
        phase={phase}
        teams={teams}
        gameState={gameState}
        round={round}
        dice={dice}
      />

      <TeamsBar teams={teams} currentTeamId={gameState?.current_turn_team} totalTiles={board.length} />

      <HelpPanel categories={roomConfig?.categories} onJoin={() => setShowQrModal(true)} />

      {phase === 'end' && (
        <EndGameModal
          teams={teams}
          winnerTeamId={gameState?.winner_team}
          ranking={gameState?.ranking}
          onNewGame={() => GameLogic.backToSetup(room_id)}
        />
      )}

      {showQrModal && roomConfig?.code && (
        <QrModal code={roomConfig.code} onClose={() => setShowQrModal(false)} />
      )}
    </div>
  );
}
