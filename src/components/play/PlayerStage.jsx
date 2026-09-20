"use client";

import RoundClock from '../ui/RoundClock';
import { Trophy } from '../ui/Glyphs';
import DiceRoll from '../world/DiceRoll';
import Countdown from './Countdown';
import StartFlip from './StartFlip';
import ThrowDice from './ThrowDice';
import Verdict from './Verdict';
import Waiting from './Waiting';
import WordCard from './WordCard';

// Toda la pantalla del jugador, fase a fase y sin tocar Firestore: la página le
// pasa el estado ya masticado y las acciones. Separarlo así permite verla
// entera en /play-lab sin montar una partida, que es la única forma de revisar
// los gestos sin cuatro móviles delante.
//
// La regla de fondo es que en pantalla haya una sola cosa que hacer. Lo que no
// toca en esta fase no está apagado ni escondido detrás de una pestaña: no
// está. Quien no tiene el turno ve la información, nunca los controles.

function Brand() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span className="gp-display text-3xl text-white drop-shadow-[0_3px_0_rgba(27,55,80,0.4)]">
        Pictionario
      </span>
    </div>
  );
}

function TimeStrip({ seconds, duration }) {
  const ratio = Math.max(0, Math.min(1, seconds / (duration || 1)));
  const color = ratio > 0.5 ? '#2b9e57' : ratio > 0.22 ? '#e8a51c' : '#dc4b3e';
  const hurry = seconds <= 5 && seconds > 0;

  return (
    <div className="gp-panel flex shrink-0 items-center gap-3 px-3 py-2">
      <div
        className="relative h-3.5 flex-1 overflow-hidden rounded-full"
        style={{ background: 'rgba(35,34,43,0.14)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${ratio * 100}%`,
            background: color,
            transition: 'width 0.95s linear, background 0.4s ease',
          }}
        />
      </div>
      <span
        className={`gp-display w-8 text-right tabular-nums text-xl ${hurry ? 'gp-beat' : ''}`}
        style={{ color: seconds <= 5 ? '#dc4b3e' : '#23222b' }}
      >
        {seconds}
      </span>
    </div>
  );
}

export default function PlayerStage({
  phase,
  word,
  categoryKey,
  diceValue,
  activeTeam,
  turnColor,
  isMyTurn = false,
  allPlay = false,
  busy = false,
  canGoBack = false,
  seconds = 0,
  duration = 45,
  preCount = 3,
  winner = null,
  winnerColor = '#ef4444',
  place = 0,
  isLeader = false,
  onSlide,
  onStart,
  onSuccess,
  onFail,
  onThrow,
  onNewGame,
}) {
  // Con «todos juegan» dibujan todos los equipos a la vez, así que todos
  // necesitan la palabra durante la ronda.
  const canSeeWord = isMyTurn || allPlay;
  // Quién conduce la partida: siempre el equipo del turno, aunque jueguen
  // todos. Si dos móviles pudieran parar el reloj, se pisarían.
  const drives = isMyTurn;

  const wrap = (children) => (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-5 pt-9">{children}</div>
  );

  if (phase === 'end') {
    return wrap(
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <span className="text-[#f7c948] drop-shadow-[0_3px_0_rgba(27,55,80,0.35)]">
          <Trophy size={64} />
        </span>
        <Waiting team={winner} color={winnerColor} />
        {place > 0 && (
          <div className="gp-panel px-6 py-2">
            <span className="gp-number text-3xl text-[#23222b]">{place}º</span>
          </div>
        )}
        {/* Volver a jugar lo decide quien lleva los mandos, igual que en la
            sala: si cualquiera pudiera, un dedo despistado borraría el marcador
            que la mesa está mirando. */}
        {isLeader && onNewGame && (
          <button
            type="button"
            onClick={onNewGame}
            disabled={busy}
            className="gp-button w-full py-4 text-base disabled:opacity-70"
            style={{ background: 'var(--w-gold)', color: 'var(--w-ink)' }}
          >
            Nueva partida
          </button>
        )}
      </div>,
    );
  }

  if (phase === 'timer_starts') return wrap(<Countdown value={preCount} />);

  // Antes de dibujar: leer la palabra y darle la vuelta al reloj. La carta está
  // en todas las pantallas, pero solo la destapa quien va a dibujar — al resto
  // les tocaría adivinarla. Cambiarla y arrancar la ronda, solo el del turno.
  if (phase === 'play') {
    return wrap(
      <>
        <WordCard
          word={word}
          categoryKey={categoryKey}
          canReveal={canSeeWord}
          canSlide={drives}
          canGoBack={canGoBack}
          onSlide={onSlide}
        />
        {drives && (
          <div className="flex shrink-0 items-center justify-center pt-1">
            <StartFlip onStart={onStart} disabled={busy} />
          </div>
        )}
      </>,
    );
  }

  // Ronda en marcha o recién terminada.
  if (phase === 'timer_running' || phase === 'timer_stopped') {
    if (!canSeeWord) {
      return wrap(
        <Waiting team={activeTeam} color={turnColor}>
          <RoundClock seconds={seconds} duration={duration} size={136} />
        </Waiting>,
      );
    }
    return wrap(
      <>
        <TimeStrip seconds={seconds} duration={duration} />
        <WordCard
          word={word}
          categoryKey={categoryKey}
          stickyReveal={phase === 'timer_stopped'}
        />
        {drives && (
          <div className="flex shrink-0 items-center justify-center">
            <Verdict onFail={onFail} onSuccess={onSuccess} disabled={busy} />
          </div>
        )}
      </>,
    );
  }

  // Tirada: el dado se lanza desde el móvil del equipo del turno. El resto lo
  // ve como lo ve la sala, desde arriba.
  if (phase === 'dice' || phase === 'dice_rolling') {
    if (!drives) {
      return wrap(
        <Waiting team={activeTeam} color={turnColor}>
          <DiceRoll
            style={{ width: 180, height: 180 }}
            value={diceValue}
            rolling={phase === 'dice_rolling'}
            pinned
            topDown
            lookY={0.45}
          />
        </Waiting>,
      );
    }
    return wrap(
      <ThrowDice
        value={diceValue}
        thrown={phase === 'dice_rolling'}
        onThrow={onThrow}
        disabled={busy}
      />,
    );
  }

  return wrap(<Brand />);
}
