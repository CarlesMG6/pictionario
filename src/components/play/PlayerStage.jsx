"use client";

import { FaPeopleArrows } from 'react-icons/fa';
import { Trophy } from '../ui/Glyphs';
import DiceRoll from '../world/DiceRoll';
import Countdown from './Countdown';
import StartFlip from './StartFlip';
import ThrowDice from './ThrowDice';
import Verdict from './Verdict';
import TeamAvatar from './TeamAvatar';
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
//
// La palabra es información, no control: la puede destapar cualquiera con el
// dedo —el equipo del turno para leerla antes de dibujar, y los demás para
// seguir el dibujo desde fuera, que es media gracia del juego—. El secreto que
// protege el gesto es el de quien adivina, que comparte teléfono con quien
// dibuja, y ese sigue igual: al soltar, la carta se vuelve a tapar sola.

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

// «Todos juegan» cambia la regla de la ronda y ya no se deduce de poder ver la
// palabra —ahora la ve todo el mundo—, así que se dice con la misma chapa
// dorada que lleva la pantalla grande.
function AllPlay() {
  return (
    <div className="flex shrink-0 justify-center">
      <span
        className="gp-panel gp-label flex items-center gap-2 px-3.5 py-1.5 text-[0.72rem]"
        style={{ background: '#f7c948' }}
      >
        <FaPeopleArrows size={15} />
        Todos juegan
      </span>
    </div>
  );
}

// A quien no le toca, en el hueco donde el equipo del turno tiene sus dianas:
// sin controles, pero sabiendo a quién está mirando.
function Playing({ team, color }) {
  if (!team) return null;
  return (
    <div className="flex shrink-0 items-center justify-center">
      <span className="gp-panel flex items-center gap-3 py-1.5 pl-1.5 pr-4">
        <TeamAvatar team={team} color={color} size={38} />
        <span className="gp-label max-w-[12rem] truncate text-[0.9rem] text-[#23222b]">{team.name}</span>
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
  // en todas las pantallas y todas la destapan; cambiarla y arrancar la ronda,
  // solo el del turno.
  if (phase === 'play') {
    return wrap(
      <>
        {allPlay && <AllPlay />}
        <WordCard
          word={word}
          categoryKey={categoryKey}
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

  // Ronda en marcha o recién terminada. Todos ven el reloj y la carta; lo que
  // cambia es el pie: el equipo del turno decide el desenlace y el resto ve a
  // quién está mirando.
  if (phase === 'timer_running' || phase === 'timer_stopped') {
    return wrap(
      <>
        <TimeStrip seconds={seconds} duration={duration} />
        {allPlay && <AllPlay />}
        <WordCard
          word={word}
          categoryKey={categoryKey}
          stickyReveal={phase === 'timer_stopped'}
        />
        {drives ? (
          <div className="flex shrink-0 items-center justify-center">
            <Verdict onFail={onFail} onSuccess={onSuccess} disabled={busy} />
          </div>
        ) : (
          <Playing team={activeTeam} color={turnColor} />
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
