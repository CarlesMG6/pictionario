"use client";

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import Image from "next/image";
import { db } from '../firebaseClient.js';
import { collection, addDoc, getDoc, doc, setDoc, getDocs, query, where, onSnapshot, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';

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
  const [showModal, setShowModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleCreateRoom = async () => {
    const code = generateRoomId();
    // Crear sala con id autogenerado y campos code, createdAt, playing: false
    const docRef = await addDoc(collection(db, 'rooms'), {
      code,
      createdAt: serverTimestamp(),
      playing: false,
      teams: []
    });
    router.push(`/host/${code}`);
  };

  const handleJoinRoom = async () => {
    if (!/^[a-zA-Z0-9]{6}$/.test(joinCode)) {
      setError('Introduce un código válido de 6 caracteres.');
      return;
    }
    // Buscar la sala por el campo code en Firestore
    const q = query(collection(db, 'rooms'), where('code', '==', joinCode));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      setError('No existe ninguna sala con ese código.');
      setTimeout(() => {
        setShowModal(false);
        setError('');
        router.push('/');
      }, 1500);
      return;
    }
    setError('');
    setShowModal(false);
    router.push(`/join/${joinCode}`);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-background text-foreground">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

        <div className="text-7xl text-primary font-bold tracking-tighter font-sans" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
          Pictionario
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-primary text-primary-foreground gap-2 hover:bg-primary-hover hover:text-primary-foreground font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            onClick={handleCreateRoom}
            type="button"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Crear Sala
          </button>
          <button
            className="rounded-full border border-solid border-border transition-colors flex items-center justify-center hover:bg-muted hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px] bg-background text-foreground"
            onClick={() => setShowModal(true)}
            type="button"
          >
            Unirme a Sala
          </button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://pictionario.vercel.app/rules"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Normas del juego
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://carlesmoyaguerrero.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          About me
        </a>
      </footer>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-foreground/40 z-50">
          <div className="bg-background rounded-xl shadow-lg p-6 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-semibold mb-2 text-foreground">Unirse a una sala</h2>
            <input
              ref={inputRef}
              className="border border-border rounded-xl px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
              placeholder="Código de sala (6 caracteres)"
              maxLength={6}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              autoFocus
            />
            {error && <span className="text-destructive text-sm">{error}</span>}
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted-hover text-foreground"
                onClick={() => { setShowModal(false); setError(''); }}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
                onClick={handleJoinRoom}
                type="button"
              >
                Unirme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}