// Pantalla de aviso: cuando algo no sale —una dirección que no existe, una sala
// llena, una pantalla que se cae— el jugador sigue dentro del juego, no en una
// página de error. Mismo cielo y mismo mar que el móvil de la partida, una
// ilustración que cuenta qué ha pasado con una pieza del propio juego, y la
// salida debajo.
//
// La comparten el 404, el error y los avisos de la sala, que es lo que hace que
// se lean como la misma cosa.
export default function NoticeScreen({ art = null, title, caption = null, children = null }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-7 overflow-hidden px-6"
      style={{
        background: 'linear-gradient(180deg, #6fcdf2 0%, #a6e1f7 46%, #cdeeff 74%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%]"
        style={{ background: 'linear-gradient(180deg, rgba(143,229,240,0) 0%, #8fe5f0 26%, #3fb8de 62%, #1b8fc4 100%)' }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        {art}

        <div className="gp-panel flex w-full flex-col items-center gap-3 px-6 py-6 text-center">
          <div className="gp-label text-lg">{title}</div>
          {caption && <p className="m-0 text-[0.9rem] font-semibold leading-snug opacity-75">{caption}</p>}
        </div>

        {children && <div className="flex w-full flex-col gap-3">{children}</div>}
      </div>
    </div>
  );
}

// Los botones de las salidas, con el mismo reparto de siempre: dorado el que se
// espera que se pulse, papel el otro.
export function NoticeButton({ href, onClick, primary = false, children }) {
  const style = primary
    ? { background: 'var(--w-gold)', color: 'var(--w-ink)' }
    : { background: 'var(--w-paper)', color: 'var(--w-ink)' };

  if (href) {
    return (
      <a href={href} className="gp-button w-full py-4 text-center text-sm no-underline" style={style}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="gp-button w-full py-4 text-sm" style={style}>
      {children}
    </button>
  );
}
