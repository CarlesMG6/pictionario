"use client";

import { useState } from 'react';
import HostLobbyScreen from '../../components/lobby/HostLobbyScreen';
import PhoneLobbyScreen from '../../components/lobby/PhoneLobbyScreen';
import { DEFAULT_CONFIG, STAGES } from '../../utils/RoomLogic';
import { ANIMAL_CHOICES } from '../../game/animals';

// Banco de pruebas de la sala, al lado de /play-lab y /world-lab: las dos
// pantallas de cada fase, sin Firestore y sin tener que reunir tres móviles
// para ver qué pasa cuando el tercero todavía no ha elegido criatura.
//
// Los controles funcionan de verdad contra el estado local, así que tocar una
// categoría en el móvil de la derecha rehace el mundo de la izquierda igual que
// lo hará en una sala real.

const STAGE_TABS = [
  [STAGES.LOBBY, 'Entrada'],
  [STAGES.SETUP, 'Configuración'],
  [STAGES.ROSTER, 'Criaturas'],
];

const ROLES = [
  ['leader', 'Soy P1'],
  ['guest', 'Soy P2'],
];

const INITIAL_TEAMS = [
  { id: 'a', name: 'Delfines', icon_url: '/player-icons/dolphin2.png', locked: true, ready: true, position: 0 },
  { id: 'b', name: null, icon_url: '/player-icons/crab2.png', locked: false, ready: false, position: 0 },
  { id: 'c', name: null, icon_url: '/player-icons/dragon2.png', locked: true, ready: false, position: 0 },
];

export default function LobbyLabPage() {
  const [stage, setStage] = useState(STAGES.LOBBY);
  const [role, setRole] = useState('leader');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [teams, setTeams] = useState(INITIAL_TEAMS);

  const myIndex = role === 'leader' ? 0 : 1;
  const me = teams[myIndex];
  const patchMe = (patch) =>
    setTeams((previous) => previous.map((team, index) => (index === myIndex ? { ...team, ...patch } : team)));

  const chip = (on) =>
    `gp-button px-3 py-1.5 text-[0.7rem] ${on ? 'bg-[#23222b] text-[#fdf6e8]' : 'bg-white text-[#23222b]'}`;

  return (
    <div className="min-h-screen bg-[#eaf7ff] p-5 text-[#23222b]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="gp-caption mr-2">Fase</span>
        {STAGE_TABS.map(([key, label]) => (
          <button key={key} type="button" className={chip(stage === key)} onClick={() => setStage(key)}>
            {label}
          </button>
        ))}
        <span className="gp-caption mx-2">Papel</span>
        {ROLES.map(([key, label]) => (
          <button key={key} type="button" className={chip(role === key)} onClick={() => setRole(key)}>
            {label}
          </button>
        ))}
        <span className="gp-caption mx-2">Sala</span>
        <button
          type="button"
          className={chip(false)}
          onClick={() => setTeams((previous) => previous.slice(0, Math.max(1, previous.length - 1)))}
        >
          − jugador
        </button>
        <button
          type="button"
          className={chip(false)}
          onClick={() =>
            setTeams((previous) => [
              ...previous,
              {
                id: crypto.randomUUID(),
                name: null,
                icon_url: ANIMAL_CHOICES.find(
                  (c) => !previous.some((t) => t.icon_url === c.icon),
                )?.icon || null,
                locked: false,
                ready: false,
                position: 0,
              },
            ])
          }
        >
          + jugador
        </button>
      </div>

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="relative h-[68vh] min-h-[420px] flex-1 overflow-hidden rounded-xl border-[3px] border-[#23222b] bg-[#6fcdf2]">
          <HostLobbyScreen inline stage={stage} code="K7QP2M" teams={teams} config={config} seed={7} />
        </div>

        <div
          className="relative shrink-0 overflow-hidden rounded-[26px] border-[3px] border-[#23222b]"
          style={{ width: 372, height: '68vh', minHeight: 420 }}
        >
          <PhoneLobbyScreen
            inline
            stage={stage}
            teams={teams}
            me={me}
            myIndex={myIndex}
            isLeader={role === 'leader'}
            config={config}
            onContinue={() => setStage(STAGES.SETUP)}
            onConfig={(patch) => setConfig((previous) => ({ ...previous, ...patch }))}
            onToRoster={() => setStage(STAGES.ROSTER)}
            onCycle={(direction) => {
              const taken = teams.filter((t) => t.id !== me.id).map((t) => t.icon_url);
              const from = ANIMAL_CHOICES.findIndex((c) => c.icon === me.icon_url);
              const total = ANIMAL_CHOICES.length;
              for (let step = 1; step <= total; step += 1) {
                const choice = ANIMAL_CHOICES[(((from + direction * step) % total) + total) % total];
                if (!taken.includes(choice.icon)) return patchMe({ icon_url: choice.icon });
              }
              return undefined;
            }}
            onLock={(value = true) =>
              patchMe(value === false ? { locked: false, ready: false } : { locked: true })}
            onName={(name) => patchMe({ name, ready: true })}
            onReady={(ready) => patchMe(ready ? { ready: true } : { ready: false, locked: false })}
            onKick={(id) => setTeams((previous) => previous.filter((team) => team.id !== id))}
            onStart={() => setStage(STAGES.LOBBY)}
          />
        </div>
      </div>
    </div>
  );
}
