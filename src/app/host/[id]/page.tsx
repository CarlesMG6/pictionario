"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (!id || id.length !== 6) {
      router.replace('/');
    }
  }, [id, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Eres el anfitrión de la sala: {id}</h1>
      <p className="text-lg">Comparte este código para que otros se unan.</p>
    </div>
  );
}
