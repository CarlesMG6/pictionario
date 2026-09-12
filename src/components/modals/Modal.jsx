"use client";

// Carcasa común de los modales: velo a pantalla completa y caja centrada. El
// panel en sí lo pone cada modal con `gp-panel`, para que compartan el mismo
// lenguaje que el resto de la interfaz.
//
// El velo es oscuro y desenfoca lo de detrás porque no tapa una página sino un
// mundo 3D a pleno color: con un velo claro, el fondo competía con el contenido.
export default function Modal({ children, className = '' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm">
      <div className={`gp-panel relative flex flex-col items-center ${className}`}>{children}</div>
    </div>
  );
}
