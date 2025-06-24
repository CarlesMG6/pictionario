"use client";

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import Image from "next/image";
import { supabase } from '@/supabaseClient';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateRoom = async () => {
    const id = generateRoomId();
    const code = id;
    await supabase.from('rooms').insert([{ code }]);
    router.push(`/host/${id}`);
  };

  const handleJoinRoom = async () => {
    if (!/^[a-zA-Z0-9]{6}$/.test(joinCode)) {
      setError('Introduce un código válido de 6 caracteres.');
      return;
    }
    // Comprobar si existe la sala en Supabase
    const { data, error: dbError } = await supabase.from('rooms').select('code').eq('code', joinCode).single();
    if (dbError || !data) {
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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

        <div className="text-7xl font-bold tracking-tighter font-sans" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
          Pictionario
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
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
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
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
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
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
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
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
          Go to nextjs.org →
        </a>
      </footer>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 min-w-[320px] flex flex-col gap-4">
            <h2 className="text-lg font-semibold mb-2">Unirse a una sala</h2>
            <input
              ref={inputRef}
              className="border rounded px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Código de sala (6 caracteres)"
              maxLength={6}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              autoFocus
            />
            {error && <span className="text-red-500 text-sm">{error}</span>}
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700"
                onClick={() => { setShowModal(false); setError(''); }}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
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
