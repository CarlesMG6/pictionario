"use client";

import { useEffect, useState } from 'react';
import QRCode from '../QRCode';

// El código de la sala, en los dos tamaños que necesita la pantalla grande: el
// cartel de la fase de entrada, que es lo único que hay que mirar, y la chapa
// de la esquina para cuando ya se está montando la partida y todavía puede
// llegar gente.
//
// La dirección sale del navegador y no de una constante: así el QR también
// sirve cuando se prueba desde otro aparato de la misma red.
function useJoinUrl(code) {
  const [origin, setOrigin] = useState('https://pictionario.vercel.app');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  return { url: `${origin}/join/${code}`, host: origin.replace(/^https?:\/\//, '') };
}

export function RoomCodePanel({ code }) {
  const { url, host } = useJoinUrl(code);

  return (
    <div className="gp-panel flex flex-col items-center gap-6 p-7 sm:flex-row sm:gap-9 sm:p-8">
      <div className="text-center sm:text-left">
        <div className="gp-caption">Código de sala</div>
        <div className="gp-display gp-number mt-1 text-7xl leading-none sm:text-8xl">{code}</div>
        <div className="gp-label mt-3 text-sm opacity-75">
          Entra en {host}
        </div>
      </div>

      <div className="hidden w-[3px] self-stretch opacity-15 sm:block" style={{ background: 'var(--w-ink)' }} />

      <div className="flex flex-col items-center gap-2">
        <div className="border-[3px] border-[#23222b] p-1" style={{ borderRadius: 6 }}>
          <QRCode url={url} size={168} />
        </div>
        <div className="gp-caption">Escanear</div>
      </div>
    </div>
  );
}

export function RoomCodeChip({ code }) {
  const { url } = useJoinUrl(code);

  return (
    <div className="gp-panel flex flex-col items-center gap-1.5 p-2.5">
      <div className="gp-number text-xl tracking-[0.1em]">{code}</div>
      <QRCode url={url} size={84} />
    </div>
  );
}
