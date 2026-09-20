"use client";

import { useAnimalPortraits } from '../hud/animalPortrait';
import { teamColor } from '../hud/teamColors';
import { Trophy } from '../ui/Glyphs';
import Modal from './Modal';

const ORDINALS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º'];

export default function EndGameModal({ teams, winnerTeamId, ranking, onNewGame }) {

  const portraits = useAnimalPortraits(teams);

  const winner = teams.find((t) => t.id === winnerTeamId);
  const rankingTeams = (ranking || []).map((id) => teams.find((t) => t.id === id)).filter(Boolean);
  const colorOf = (team) => teamColor(teams.findIndex((t) => t.id === team.id));

  return (
    <Modal className="min-w-[420px] px-10 py-8">
      <div className="flex items-center gap-2 text-[#e8a51c]">
        <Trophy size={20} />
        <span className="gp-caption text-[#23222b]">Fin de la partida</span>
      </div>

      <div className="mt-3 flex flex-col items-center">
        {portraits[winnerTeamId] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portraits[winnerTeamId]} alt="" className="h-28 w-28 object-contain drop-shadow-[0_5px_4px_rgba(0,0,0,0.3)]" />
        )}
        <div className="gp-label mt-1 text-2xl">{winner?.name}</div>
        <div className="gp-caption mt-1">Gana la partida</div>
      </div>

      <div className="mt-6 w-full">
        <div className="gp-caption mb-2">Clasificación</div>
        <div className="flex flex-col gap-1.5">
          {rankingTeams.map((team, index) => (
            <div
              key={team.id}
              className="flex items-center gap-3 border-[3px] border-[#23222b] bg-white/70 px-3 py-1.5"
              style={{ borderRadius: 6 }}
            >
              <span className="gp-number w-8 text-lg" style={{ color: index === 0 ? '#e8a51c' : '#9a958e' }}>
                {ORDINALS[index] || `${index + 1}º`}
              </span>
              <span className="h-5 w-2 rounded-sm" style={{ background: colorOf(team) }} />
              <span className="gp-label text-sm">{team.name}</span>
              <span className="gp-caption ml-auto">Casilla {(team.position || 0) + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex w-full">
        <button
          type="button"
          className="gp-button flex-1 bg-[#f7c948] px-4 py-3 text-xs text-[#23222b]"
          // Devolver la sala a la configuración es un cambio de fase, no una
          // navegación: las dos pantallas siguen a `rooms.stage` y se mueven
          // solas, aquí y en cada móvil.
          onClick={onNewGame}
        >
          Nueva partida
        </button>
      </div>
    </Modal>
  );
}
