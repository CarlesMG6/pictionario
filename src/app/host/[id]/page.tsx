"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const TEAM_ICONS = [
  '/vercel.svg', // Puedes cambiar estos iconos por otros en public/
  '/file.svg',
  '/window.svg',
  '/globe.svg',
];

const CATEGORIES = [
  { key: 'all', label: 'Todos Juegan' },
  { key: 'object', label: 'Objeto' },
  { key: 'person', label: 'Persona animal o lugar' },
  { key: 'action', label: 'Acción' },
  { key: 'movies', label: 'Películas o series' },
];

export default function HostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  // Simulación de equipos (en producción vendría de backend/socket)
  const [teams, setTeams] = useState([
    {
      name: 'Equipo Azul',
      icon: TEAM_ICONS[0],
      participants: ['Ana', 'Luis'],
    },
    {
      name: 'Equipo Rojo',
      icon: TEAM_ICONS[1],
      participants: ['Marta'],
    },
  ]);

  // Configuración de partida
  const [duration, setDuration] = useState<'corta' | 'media' | 'larga'>('media');
  const [roundTime, setRoundTime] = useState<string>('45'); // segundos
  const [categories, setCategories] = useState<Record<string, boolean>>({
    all: true,
    object: true,
    person: true,
    action: true,
    movies: false,
  });

  useEffect(() => {
    if (!id || id.length !== 6) {
      router.replace('/');
    }
  }, [id, router]);

  const handleCategoryToggle = (key: string) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-7xl font-extrabold mb-4 text-center">{id}</h1>
      <p className="text-xl text-center mb-10">
        Accede a <span className="font-bold">pictionario.com</span> e introduce este código
      </p>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        {/* Columna equipos */}
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-lg shadow p-6 flex flex-col min-w-[260px]">
          <h2 className="text-2xl font-semibold mb-4">Equipos</h2>
          <div className="flex flex-col gap-4 mb-6">
            {teams.map((team, idx) => (
              <div key={team.name} className="flex items-start gap-3 p-3 rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                <Image src={team.icon} alt="icono equipo" width={32} height={32} className="mt-1" />
                <div>
                  <div className="font-bold text-lg">{team.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{team.participants.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded transition-colors text-lg">Empezar partida</button>
        </div>
        {/* Columna configuración */}
        <div className="flex-1 bg-white dark:bg-neutral-900 rounded-lg shadow p-6 min-w-[260px]">
          <h2 className="text-2xl font-semibold mb-4">Configuración</h2>
          <form className="flex flex-col gap-6">
            <div>
              <label className="block font-medium mb-1">Duración de la partida</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={duration}
                onChange={e => setDuration(e.target.value as any)}
              >
                <option value="corta">Corta</option>
                <option value="media">Media</option>
                <option value="larga">Larga</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Tiempo por ronda (segundos)</label>
              <input
                type="number"
                min={0}
                max={120}
                className="w-full border rounded px-3 py-2"
                value={roundTime}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "") {
                    setRoundTime("");
                  } else {
                    let num = parseInt(val, 10);
                    if (isNaN(num)) num = 0;
                    if (num < 0) num = 0;
                    if (num > 120) num = 120;
                    setRoundTime(num.toString());
                  }
                }}
                onBlur={() => {
                  if (roundTime === "" || isNaN(Number(roundTime))) {
                    setRoundTime("45");
                  }
                }}
                placeholder="45"
              />
            </div>
            <div>
              <label className="block font-medium mb-2">Categorías habilitadas</label>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map(cat => (
                  <label key={cat.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!categories[cat.key]}
                      onChange={() => handleCategoryToggle(cat.key)}
                    />
                    <span>{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
