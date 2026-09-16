"use client";

// Preparados: 3 · 2 · 1. La misma cuenta que la pantalla grande y a la vez, para
// que quien mira el móvil y quien mira la tele arranquen juntos.
export default function Countdown({ value }) {
  return (
    <div className="relative flex flex-1 items-center justify-center">
      {/* Sin nada detras, una cifra blanca sobre el cielo claro casi no se ve.
          El velo es el mismo recurso que usa la pantalla grande en esta fase. */}
      <span
        className="pointer-events-none absolute -inset-x-8 -inset-y-10"
        style={{
          background:
            'radial-gradient(54% 42% at 50% 50%, rgba(20,19,26,0.45) 0%, rgba(20,19,26,0) 72%)',
        }}
      />
      <span
        key={value}
        className="gp-display gp-tick relative text-[#fdf6e8]"
        style={{ fontSize: '9rem', lineHeight: 1, textShadow: '0 6px 0 rgba(20,19,26,0.45)' }}
      >
        {value > 0 ? value : '¡Ya!'}
      </span>
    </div>
  );
}
