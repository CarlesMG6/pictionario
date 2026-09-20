"use client";

import { useState } from 'react';
import PlayerFrame from '../play/PlayerFrame';
import { readableOn, teamColor } from '../hud/teamColors';
import { STAGES, seatLabel } from '../../utils/RoomLogic';
import AnimalPicker, { AnimalCrest } from './AnimalPicker';
import { CategoryPicker, DifficultyPicker, DurationPicker, Section, Stepper } from './ConfigControls';
import { CategoryLegend, ConfigSummary } from './ConfigSummary';
import { SeatChips } from './Seats';

// El móvil antes de la partida. Es el mando: aquí está todo lo que se puede
// tocar, y la pantalla grande solo lo refleja.
//
// Vale la misma regla que en la partida: quien no lleva los mandos ve la
// información, nunca un control apagado. Por eso el que no es P1 no recibe los
// selectores en gris, sino el resumen de lo que P1 va eligiendo.
export default function PhoneLobbyScreen({
  stage = STAGES.LOBBY,
  teams = [],
  me = null,
  myIndex = 0,
  isLeader = false,
  config,
  busy = false,
  inline = false,
  onContinue,
  onConfig,
  onToRoster,
  onPick,
  onName,
  onReady,
  onStart,
}) {
  const color = teamColor(myIndex);

  return (
    <PlayerFrame
      myTeam={me ? { ...me, name: me.name || seatLabel(myIndex) } : null}
      myColor={color}
      turnColor={color}
      seatLabel={seatLabel(myIndex)}
      inline={inline}
    >
      {stage === STAGES.LOBBY && (
        <LobbyStage
          teams={teams}
          me={me}
          myIndex={myIndex}
          color={color}
          isLeader={isLeader}
          busy={busy}
          onContinue={onContinue}
        />
      )}

      {stage === STAGES.SETUP && (
        isLeader ? (
          <SetupControls config={config} onConfig={onConfig} onToRoster={onToRoster} busy={busy} />
        ) : (
          <SetupMirror config={config} />
        )
      )}

      {stage === STAGES.ROSTER && (
        <RosterStage
          teams={teams}
          me={me}
          color={color}
          isLeader={isLeader}
          busy={busy}
          onPick={onPick}
          onName={onName}
          onReady={onReady}
          onStart={onStart}
        />
      )}
    </PlayerFrame>
  );
}

// --- Entrada ---------------------------------------------------------------

function LobbyStage({ teams, me, myIndex, color, isLeader, busy, onContinue }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-5 pb-5 pt-10">
      <div className="flex flex-col items-center gap-4">
        <span
          className="flex h-[132px] w-[132px] items-center justify-center rounded-full border-[3px] border-[#23222b]"
          style={{ background: color, boxShadow: '0 6px 0 rgba(35,34,43,0.35)' }}
        >
          <span className="gp-display text-5xl" style={{ color: readableOn(color) }}>
            {seatLabel(myIndex)}
          </span>
        </span>
        <span className="gp-label text-base text-[#23222b]">Estás dentro</span>
      </div>

      <SeatChips teams={teams} meId={me?.id} />

      {isLeader ? (
        <button
          type="button"
          onClick={onContinue}
          disabled={busy}
          className="gp-button mt-auto w-full py-5 text-lg disabled:opacity-70"
          style={{ background: 'var(--w-gold)', color: 'var(--w-ink)' }}
        >
          Continuar
        </button>
      ) : (
        <span className="gp-label mt-auto pb-3 text-center text-sm text-[#23222b] opacity-70">
          {seatLabel(0)} lleva los mandos
        </span>
      )}
    </div>
  );
}

// --- Configuración ---------------------------------------------------------

function SetupControls({ config, onConfig, onToRoster, busy }) {
  const toggle = (key) => {
    const on = config.categories.includes(key);
    const next = on ? config.categories.filter((k) => k !== key) : [...config.categories, key];
    // Un tablero sin categorías no existe: la última encendida no se apaga.
    if (next.length === 0) return;
    onConfig({ categories: next });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <div className="gp-panel flex flex-col gap-6 p-4">
          <Section title="Duración de la partida">
            <DurationPicker value={config.duration} onChange={(duration) => onConfig({ duration })} />
          </Section>

          <Section title="Tiempo por ronda">
            <Stepper value={config.round_time} onChange={(round_time) => onConfig({ round_time })} />
          </Section>

          <Section title="Dificultad de las palabras">
            <DifficultyPicker value={config.difficulty} onChange={(difficulty) => onConfig({ difficulty })} />
          </Section>

          <Section title="Categorías del tablero" aside={`${config.categories.length} en el camino`}>
            <CategoryPicker selected={config.categories} onToggle={toggle} />
          </Section>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4">
        <button
          type="button"
          onClick={onToRoster}
          disabled={busy}
          className="gp-button w-full py-4 text-lg disabled:opacity-70"
          style={{ background: 'var(--w-gold)', color: 'var(--w-ink)' }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function SetupMirror({ config }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-7">
      <span className="gp-label text-center text-sm text-[#23222b] opacity-75">
        {seatLabel(0)} está montando la partida
      </span>
      <div className="gp-panel w-full p-4">
        <ConfigSummary config={config} />
      </div>
      <div className="gp-panel w-full p-3">
        <CategoryLegend categories={config.categories} size="sm" />
      </div>
    </div>
  );
}

// --- Criatura y nombre -----------------------------------------------------

function RosterStage({ teams, me, color, isLeader, busy, onPick, onName, onReady, onStart }) {
  // El borrador solo existe si se ha escrito: mientras no se toque, el nombre es
  // el que tenga la sala —el de la criatura recién elegida— y así elegir delfín
  // y no escribir nada deja el equipo llamado Delfines sin un paso más.
  const [draft, setDraft] = useState(null);
  const name = draft ?? (me?.name || '');
  const ready = Boolean(me?.ready);
  const readyCount = teams.filter((team) => team.ready).length;

  const commit = () => {
    const value = name.trim().slice(0, 20);
    if (value && value !== me?.name) onName(value);
  };

  if (ready) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-7">
        <AnimalCrest icon={me?.icon_url} color={color} size={140} />
        <div className="gp-label text-xl text-[#23222b]">{me?.name}</div>

        {isLeader && readyCount >= 2 ? (
          <button
            type="button"
            onClick={onStart}
            disabled={busy}
            className="gp-button w-full py-5 text-lg disabled:opacity-70"
            style={{ background: 'var(--w-gold)', color: 'var(--w-ink)' }}
          >
            Empezar partida
          </button>
        ) : (
          <span className="gp-label text-center text-sm text-[#23222b] opacity-70">
            {isLeader ? 'Faltan equipos por estar listos' : 'Esperando a los demás'}
          </span>
        )}

        <button
          type="button"
          onClick={() => onReady(false)}
          className="gp-caption underline"
          style={{ color: 'var(--w-ink)' }}
        >
          Cambiar criatura
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <div className="flex flex-col items-center gap-3">
          <AnimalCrest icon={me?.icon_url} color={color} size={120} />
          <input
            value={name}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            placeholder="Nombre del equipo"
            maxLength={20}
            className="gp-label w-full rounded-lg border-[3px] px-3 py-2.5 text-center text-base outline-none"
            style={{ borderColor: 'var(--w-ink)', background: '#fff', color: 'var(--w-ink)' }}
          />
        </div>

        <div className="mt-4">
          <AnimalPicker
            teams={teams}
            meId={me?.id}
            value={me?.icon_url}
            onPick={(choice) => {
              setDraft(null);
              onPick(choice);
            }}
          />
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4">
        {me?.icon_url ? (
          <button
            type="button"
            onClick={() => {
              commit();
              onReady(true);
            }}
            disabled={busy}
            className="gp-button w-full py-4 text-lg disabled:opacity-70"
            style={{ background: 'var(--w-gold)', color: 'var(--w-ink)' }}
          >
            Listo
          </button>
        ) : (
          <span className="gp-label block py-4 text-center text-sm text-[#23222b] opacity-70">
            Elige tu criatura
          </span>
        )}
      </div>
    </div>
  );
}
