"use client";

import Modal from './Modal';
import QRCode from '../QRCode';

export default function QrModal({ code, onClose }) {
  return (
    <Modal className="min-w-[360px] px-10 py-8">
      <button
        className="gp-button absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center bg-[#fdf6e8] text-lg text-[#23222b]"
        onClick={onClose}
        aria-label="Cerrar"
        type="button"
      >
        ×
      </button>

      <div className="gp-caption">Únete a la partida</div>
      <div className="gp-label mt-3 text-center text-xs opacity-70">
        Entra en pictionario.vercel.app e introduce este código
      </div>
      <div className="gp-number my-4 text-5xl tracking-[0.12em] text-[#23222b]">{code}</div>
      <div className="gp-caption mb-3">O escanea este QR</div>
      <div className="border-[3px] border-[#23222b] p-1" style={{ borderRadius: 6 }}>
        <QRCode url={`https://pictionario.vercel.app/join/${code}`} size={150} />
      </div>
    </Modal>
  );
}
