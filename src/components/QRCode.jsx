"use client";

import { useEffect, useRef } from 'react';

// Genera el QR sobre un <canvas>. La librería se carga en diferido para que no
// entre en el bundle inicial.
export default function QRCode({ url, size = 128 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!url || !ref.current) return;
    import('qrcode').then((QR) => {
      QR.toCanvas(ref.current, url, { width: size, margin: 1, color: { dark: '#000', light: '#fff' } });
    });
  }, [url, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ background: '#fff', borderRadius: 4, boxShadow: '0 2px 8px #0001' }}
    />
  );
}
