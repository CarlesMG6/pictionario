"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// El canvas solo existe en cliente: WebGL no se puede renderizar en el servidor.
const StyleLab = dynamic(() => import('../../components/world/StyleLab'), { ssr: false });

export default function WorldLabPage() {
  return (
    <Suspense fallback={null}>
      <StyleLab />
    </Suspense>
  );
}
