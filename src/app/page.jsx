"use client";

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseClient.js';
import { WORLD_VERSION } from '../game/worldGenerator';
import { DEFAULT_CONFIG, STAGES } from '../utils/RoomLogic';

// El título vive dentro del mundo 3D, así que el canvas solo existe en cliente.
const TitleWorld = dynamic(() => import('../components/world/TitleWorld'), { ssr: false });

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function Home() {
  const router = useRouter();
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showJoin) inputRef.current?.focus();
  }, [showJoin]);

  // El 404 manda aquí a quien ha tecleado mal un código de sala, y lo que quiere
  // es volver a teclearlo: llega con el cuadro ya abierto.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('unirme')) {
      setShowJoin(true);
    }
  }, []);

  const handleCreateRoom = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const code = generateRoomId();
      await addDoc(collection(db, 'rooms'), {
        code,
        createdAt: serverTimestamp(),
        playing: false,
        // La sala nace configurada y en la primera fase: la pantalla grande
        // tiene así tablero que enseñar desde el primer segundo, y los ajustes
        // los cambia después el móvil de P1.
        stage: STAGES.LOBBY,
        ...DEFAULT_CONFIG,
        teams: [],
        // El mundo 3D se genera a partir de esta semilla. Se fija al crear la sala
        // para que tocar el generador no le cambie el mapa a una partida en curso.
        world_seed: Math.floor(Math.random() * 1e9),
        world_version: WORLD_VERSION,
      });
      router.push(`/host/${code}`);
    } catch {
      setBusy(false);
      setError('No se ha podido crear la sala. Inténtalo otra vez.');
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError('El código son 6 letras o números.');
      return;
    }
    const snap = await getDocs(query(collection(db, 'rooms'), where('code', '==', code)));
    if (snap.empty) {
      setError('No hay ninguna sala con ese código.');
      return;
    }
    setError('');
    setShowJoin(false);
    router.push(`/join/${code}`);
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--w-sky)' }}>
      <TitleWorld />

      {/* Todo lo de abajo flota sobre el mundo: el título ya está dentro de él. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-7 px-6 pb-10 pt-24">
        <div className="pointer-events-auto flex w-full max-w-md flex-col gap-3.5 sm:max-w-none sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={busy}
            className="gp-button px-11 py-5 text-lg disabled:opacity-70 sm:text-xl"
            style={{ background: 'var(--w-gold)', color: 'var(--w-ink)' }}
          >
            {busy ? 'Creando…' : 'Crear sala'}
          </button>
          <button
            type="button"
            onClick={() => { setShowJoin(true); setError(''); }}
            className="gp-button px-11 py-5 text-lg sm:text-xl"
            style={{ background: 'var(--w-paper)', color: 'var(--w-ink)' }}
          >
            Unirme a una sala
          </button>
        </div>

        <div className="pointer-events-auto flex gap-2.5">
          <FooterLink href="/rules">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4h11l3 3v13H5z" /><path d="M9 10h6M9 14h6" />
            </svg>
            Normas
          </FooterLink>
          <FooterLink href="https://carlesmoyaguerrero.com" external>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.5 2.6 2.5 12.4 0 16M12 4c-2.5 2.6-2.5 12.4 0 16" />
            </svg>
            Sobre mí
          </FooterLink>
        </div>
      </div>

      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-6 backdrop-blur-sm">
          <div className="gp-panel flex w-full max-w-sm flex-col gap-5 p-7">
            <div>
              <div className="gp-caption">Unirse a una sala</div>
              <div className="gp-label mt-1 text-lg">Introduce el código</div>
            </div>

            <input
              ref={inputRef}
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase().slice(0, 6)); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoinRoom(); }}
              maxLength={6}
              placeholder="ABC123"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="gp-display w-full rounded-lg border-[3px] text-center text-4xl tracking-[0.18em] outline-none"
              style={{ borderColor: 'var(--w-ink)', background: '#fff', color: 'var(--w-ink)', padding: '14px 12px' }}
            />

            {error && <div className="gp-label text-center text-sm" style={{ color: 'var(--w-red)' }}>{error}</div>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowJoin(false); setError(''); }}
                className="gp-button flex-1 py-3.5"
                style={{ background: '#fff', color: 'var(--w-ink)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleJoinRoom}
                className="gp-button flex-1 py-3.5"
                style={{ background: 'var(--w-gold)', color: 'var(--w-ink)' }}
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FooterLink({ href, external = false, children }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="gp-button flex items-center gap-2 px-4 py-3 text-[0.72rem] no-underline"
      style={{ background: 'var(--w-paper)', color: 'var(--w-ink)' }}
    >
      {children}
    </a>
  );
}
