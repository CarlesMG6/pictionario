"use client";

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { buildBoard } from '../../game/board';
import { speciesFromIcon } from '../../game/animals';
import { teamColor } from '../../components/hud/teamColors';
import CurrentCategory from '../../components/hud/CurrentCategory';
import TeamsBar from '../../components/hud/TeamsBar';
import HelpPanel from '../../components/hud/HelpPanel';
import RoundStage from '../../components/hud/RoundStage';
import EndGameModal from '../../components/modals/EndGameModal';
import PlayerFrame from '../../components/play/PlayerFrame';
import PlayerStage from '../../components/play/PlayerStage';

// Banco de pruebas de la interfaz de partida, al lado de /world-lab y
// /animal-lab. Enseña las dos pantallas con datos falsos y sin Firestore, que
// es la única forma de revisar los gestos del móvil sin montar una sala con
// cuatro teléfonos encima de la mesa.
const BoardWorld = dynamic(() => import('../../components/world/BoardWorld'), { ssr: false });

const PHASES = [
  ['play', 'Palabra'],
  ['timer_starts', '3 · 2 · 1'],
  ['timer_running', 'Ronda'],
  ['timer_stopped', 'Tiempo'],
  ['dice', 'Dado'],
  ['dice_rolling', 'Tirando'],
  ['end', 'Final'],
];

const ROLES = [
  ['turn', 'Mi turno'],
  ['other', 'Otro equipo'],
  ['allplay', 'Todos juegan'],
];

const TEAMS = [
  { id: 'a', name: 'Los Garabatos', icon_url: '/player-icons/cat2.png', position: 7, members: ['Marta', 'Ivan'] },
  { id: 'b', name: 'Manos de Mantequilla', icon_url: '/player-icons/otter2.png', position: 4, members: ['Pau'] },
  { id: 'c', name: 'Trazo Fino', icon_url: '/player-icons/dragon2.png', position: 11, members: ['Nerea'] },
];

const CATEGORIES_IN_PLAY = ['all', 'person', 'object', 'action'];
const WORD = 'hora punta';
const DURATION = 45;

export default function PlayLabPage() {
  const [phase, setPhase] = useState('play');
  const [role, setRole] = useState('turn');
  const [seconds, setSeconds] = useState(DURATION);
  const [pre, setPre] = useState(3);

  const board = useMemo(() => buildBoard(CATEGORIES_IN_PLAY, 'corta'), []);
  const pawns = useMemo(
    () =>
      TEAMS.map((team, index) => ({
        id: team.id,
        species: speciesFromIcon(team.icon_url),
        color: teamColor(index),
        position: team.position,
      })),
    [],
  );

  // Los relojes corren de verdad: un reloj congelado no deja ver si el aro se
  // vacía bien ni cuando entra el rojo de los últimos segundos.
  useEffect(() => {
    if (phase !== 'timer_running') {
      setSeconds(DURATION);
      return undefined;
    }
    setSeconds(DURATION);
    const id = setInterval(() => setSeconds((s) => (s <= 1 ? DURATION : s - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'timer_starts') {
      setPre(3);
      return undefined;
    }
    setPre(3);
    const id = setInterval(() => setPre((p) => (p <= 0 ? 3 : p - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const isMyTurn = role === 'turn';
  const allPlay = role === 'allplay';
  const activeIndex = isMyTurn ? 0 : 1;
  const shownSeconds = phase === 'timer_stopped' ? 0 : seconds;

  const gameState = {
    current_turn_team: TEAMS[activeIndex].id,
    current_category: 'person',
    current_word: WORD,
    all_play: allPlay,
    dice_value: phase === 'dice_rolling' ? 4 : 3,
    winner_team: TEAMS[0].id,
    ranking: TEAMS.map((t) => t.id),
  };

  const chip = (on) =>
    `gp-button px-3 py-1.5 text-[0.7rem] ${on ? 'bg-[#23222b] text-[#fdf6e8]' : 'bg-white text-[#23222b]'}`;

  return (
    <div className="min-h-screen bg-[#eaf7ff] p-5 text-[#23222b]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="gp-caption mr-2">Fase</span>
        {PHASES.map(([key, label]) => (
          <button key={key} type="button" className={chip(phase === key)} onClick={() => setPhase(key)}>
            {label}
          </button>
        ))}
        <span className="gp-caption mx-2">Papel</span>
        {ROLES.map(([key, label]) => (
          <button key={key} type="button" className={chip(role === key)} onClick={() => setRole(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="relative h-[68vh] min-h-[420px] flex-1 overflow-hidden rounded-xl border-[3px] border-[#23222b] bg-[#6fcdf2]">
          <BoardWorld seed={7} board={board} teams={pawns} focusId={gameState.current_turn_team} />
          <CurrentCategory categoryKey={gameState.current_category} allPlay={allPlay} />
          <RoundStage
            phase={phase}
            teams={TEAMS}
            gameState={gameState}
            round={{ timer: shownSeconds, countdown: pre, duration: DURATION }}
            dice={{ value: phase === 'dice_rolling' ? 4 : null, rolling: phase === 'dice_rolling' }}
          />
          <TeamsBar teams={TEAMS} currentTeamId={gameState.current_turn_team} totalTiles={board.length} />
          <HelpPanel categories={CATEGORIES_IN_PLAY} onJoin={() => {}} />
          {phase === 'end' && (
            <EndGameModal
              teams={TEAMS}
              winnerTeamId={gameState.winner_team}
              ranking={gameState.ranking}
              onNewGame={() => {}}
            />
          )}
        </div>

        <div
          className="relative shrink-0 overflow-hidden rounded-[26px] border-[3px] border-[#23222b]"
          style={{ width: 372, height: '68vh', minHeight: 420 }}
        >
          <PlayerFrame
            inline
            myTeam={TEAMS[0]}
            myColor={teamColor(0)}
            turnColor={teamColor(activeIndex)}
          >
            <PlayerStage
              phase={phase}
              word={WORD}
              categoryKey={gameState.current_category}
              diceValue={phase === 'dice_rolling' ? 4 : 3}
              activeTeam={TEAMS[activeIndex]}
              turnColor={teamColor(activeIndex)}
              isMyTurn={isMyTurn}
              allPlay={allPlay}
              seconds={shownSeconds}
              duration={DURATION}
              preCount={pre}
              winner={TEAMS[0]}
              winnerColor={teamColor(0)}
              place={2}
              canGoBack
              isLeader
              onNewGame={() => {}}
              onSlide={() => {}}
              onStart={() => {}}
              onSuccess={() => {}}
              onFail={() => {}}
              onThrow={() => setPhase('dice_rolling')}
            />
          </PlayerFrame>
        </div>
      </div>
    </div>
  );
}
