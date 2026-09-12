"use client";

import dynamic from 'next/dynamic';

// El canvas solo existe en cliente: WebGL no se puede renderizar en el servidor.
const AnimalSheet = dynamic(() => import('../../components/world/AnimalSheet'), { ssr: false });

export default function AnimalLabPage() {
  return <AnimalSheet />;
}
