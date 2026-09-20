// Las normas dejan de ser un documento y pasan a ser del mismo mundo que el
// tablero: cielo, mar y el volcán de la meta al pie. Cada norma vive en un
// panel, no en un punto de una lista, porque es lo que hace el resto del juego.
//
// La página no tiene estado: las dos variantes se enseñan a la vez en vez de
// esconder una detrás de un interruptor. Se eligen comparándolas, y así hay un
// control menos en pantalla.

export const metadata = {
  title: 'Normas · Pictionario',
};

const TITLE = [
  ['N', '#ef4444'],
  ['O', '#fbbf24'],
  ['R', '#3b82f6'],
  ['M', '#10b981'],
  ['A', '#8b5cf6'],
  ['S', '#fb923c'],
];

const STEPS = [
  { icon: Card, text: 'Sale una palabra secreta en el móvil del equipo al que le toca.' },
  { icon: Pencil, text: 'Uno la dibuja. Sin hablar y sin escribir: solo dibujo.' },
  { icon: Hourglass, text: 'Su equipo tiene que acertarla antes de que suene el pitido.' },
  { icon: Die, text: 'Si acierta, tira el dado y avanza. Gana quien llega antes al volcán.' },
];

const ALWAYS = [
  'Nada de letras, números ni símbolos. Las flechas sí valen.',
  'Quien dibuja no habla desde que ve la palabra.',
  'Quien adivina no mira la palabra secreta del móvil.',
];

const VARIANTS = [
  {
    key: 'competitiva',
    label: 'Competitiva',
    caption: 'A rajatabla',
    color: 'var(--w-gold)',
    ink: 'var(--w-ink)',
    icon: Trophy,
    rules: [
      'Solo gestos de sí, no, bien o mal. Nada de mímica de la palabra.',
      'Hay que decir la palabra exacta, y en el orden correcto.',
      'No se pueden reutilizar dibujos de turnos anteriores.',
    ],
  },
  {
    key: 'chill',
    label: 'Chill',
    caption: 'A pasarlo bien',
    color: 'var(--w-green)',
    ink: 'var(--w-paper)',
    icon: Sun,
    rules: [
      'Vale con acertar el concepto principal o parte de la palabra.',
      'Se puede mezclar dibujo y mímica.',
      'Y se pueden reaprovechar los dibujos de antes.',
    ],
  },
];

export default function RulesPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(180deg, var(--w-sky) 0px, var(--w-sky-soft) 240px, var(--w-sky-pale) 430px, #eaf7ff 620px)' }}
    >
      {/* Las nubes son decorado y en el móvil solo estorbarían: ahí el cielo se
          queda limpio detrás del título. */}
      <Cloud className="left-24 top-16 hidden h-11 w-48 sm:block" />
      <Cloud className="left-40 top-10 hidden h-12 w-28 sm:block" />
      <Cloud className="right-8 top-24 hidden h-12 w-52 sm:block" />
      <Cloud className="right-16 top-[72px] hidden h-14 w-28 sm:block" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-7 px-4 py-6 sm:px-8 sm:py-9">

        <div className="flex items-center gap-4">
          <a
            href="/"
            className="gp-button flex items-center gap-2 px-4 py-3 text-[0.7rem] no-underline"
            style={{ background: 'var(--w-paper)', color: 'var(--w-ink)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 6l-6 6 6 6" />
            </svg>
            Volver
          </a>

          {/* El título son casillas del camino, como el de la portada. */}
          <div className="flex flex-1 justify-center gap-1">
            {TITLE.map(([letter, color]) => (
              <span key={letter} className="gp-tile [--tile:44px] sm:[--tile:62px]">
                <i className="base" />
                <i className="rim" style={{ background: color }} />
                <i className="top" style={{ background: color }}>
                  <span
                    className="gp-display text-[1.2rem] leading-none text-white sm:text-[1.7rem]"
                    style={{ transform: 'scaleY(1.16)', textShadow: '0 2px 0 rgba(0,0,0,0.16)' }}
                  >
                    {letter}
                  </span>
                </i>
              </span>
            ))}
          </div>

          <span className="hidden w-[104px] sm:block" />
        </div>

        <Section title="Cómo se juega">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.text} className="gp-panel flex flex-col gap-3 p-5">
                  <span className="gp-number text-3xl leading-none opacity-30">{index + 1}</span>
                  <Icon />
                  <p className="m-0 text-[0.95rem] font-semibold leading-snug">{step.text}</p>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Siempre, se juegue como se juegue">
          <div className="grid gap-4 lg:grid-cols-3">
            {ALWAYS.map((rule) => (
              <div key={rule} className="gp-panel flex items-start gap-3.5 p-4">
                {/* Aspa roja: son las tres cosas que no valen, y eso tiene que
                    verse antes de leerlo. */}
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-[3px]"
                  style={{ background: 'var(--w-red)', borderColor: 'var(--w-ink)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
                    <path d="M7 7l10 10M17 7L7 17" />
                  </svg>
                </span>
                <p className="m-0 text-[0.95rem] font-semibold leading-snug">{rule}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Y luego, elegid cómo jugáis">
          <div className="grid gap-4 lg:grid-cols-2">
            {VARIANTS.map((variant) => {
              const Icon = variant.icon;
              return (
                <div key={variant.key} className="gp-panel overflow-hidden p-0">
                  <div
                    className="flex items-center gap-3 border-b-[3px] px-5 py-3.5"
                    style={{ background: variant.color, borderColor: 'var(--w-ink)', color: variant.ink }}
                  >
                    <Icon />
                    <span className="gp-label text-base">{variant.label}</span>
                    <span className="gp-caption ml-auto" style={{ color: variant.ink, opacity: 0.8 }}>
                      {variant.caption}
                    </span>
                  </div>
                  <ul className="m-0 flex list-none flex-col gap-3 p-5">
                    {variant.rules.map((rule) => (
                      <li key={rule} className="flex gap-3 text-[0.95rem] font-semibold leading-snug">
                        <span
                          className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full border-[3px]"
                          style={{ background: variant.color, borderColor: 'var(--w-ink)' }}
                        />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <Sea />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="gp-caption mb-3">{title}</div>
      {children}
    </div>
  );
}

function Cloud({ className }) {
  return <div className={`pointer-events-none absolute rounded-full bg-white/90 ${className}`} />;
}

// El pie de la página es el mar, con la meta del tablero asomando: la página
// termina donde termina el mundo.
function Sea() {
  return (
    <div className="relative mt-4 h-[120px] sm:h-[150px]">
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #8FE5F0 0%, var(--w-sea) 34%, var(--w-sea-deep) 100%)' }}
      />
      <svg
        viewBox="0 0 420 150"
        className="absolute bottom-0 right-4 w-[260px] sm:right-16 sm:w-[380px]"
        aria-hidden="true"
      >
        <path d="M22 132 C22 108 74 92 132 88 C196 83 258 92 320 104 C368 113 392 124 384 134 C372 148 292 150 200 150 C108 150 22 146 22 132 Z" fill="#F2DCB3" />
        <path d="M150 104 C168 74 196 48 214 44 C232 48 258 76 276 106 C244 96 182 96 150 104 Z" fill="#8C93A8" />
        <path d="M196 60 C204 50 224 50 232 60 C226 66 202 66 196 60 Z" fill="#dc4b3e" />
        <path d="M60 122 C74 108 104 104 120 110 C104 118 78 122 60 122 Z" fill="#3F9E58" />
      </svg>
    </div>
  );
}

// --- Pictogramas ------------------------------------------------------------

function Glyph({ children }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--w-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function Card() {
  return (
    <Glyph>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M9 9h6M9 13h6" />
    </Glyph>
  );
}

function Pencil() {
  return (
    <Glyph>
      <path d="M4 20l1-4L16 5l3 3L8 19z" />
      <path d="M14 7l3 3" />
    </Glyph>
  );
}

function Hourglass() {
  return (
    <Glyph>
      <path d="M7 3h10M7 21h10" />
      <path d="M7 3c0 5 5 6 5 9s-5 4-5 9" />
      <path d="M17 3c0 5-5 6-5 9s5 4 5 9" />
    </Glyph>
  );
}

function Die() {
  return (
    <Glyph>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <circle cx="8.5" cy="8.5" r="1.4" fill="var(--w-ink)" />
      <circle cx="12" cy="12" r="1.4" fill="var(--w-ink)" />
      <circle cx="15.5" cy="15.5" r="1.4" fill="var(--w-ink)" />
    </Glyph>
  );
}

function Trophy() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M10 19h4M12 14v5" />
    </svg>
  );
}

function Sun() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </svg>
  );
}
