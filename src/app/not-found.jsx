import NoticeScreen, { NoticeButton } from '../components/ui/NoticeScreen';

// Una dirección que no lleva a ningún sitio. La mayoría de las veces es un
// código de sala mal escrito, así que la segunda salida no es decorativa:
// lleva a la portada con el cuadro de código ya abierto.
export const metadata = {
  title: 'Esto no está en el mapa · Pictionario',
};

export default function NotFound() {
  return (
    <NoticeScreen
      art={<Signpost />}
      title="Esto no está en el mapa"
      caption="La dirección no existe o la sala se ha terminado hace rato."
    >
      <NoticeButton href="/" primary>
        Ir a la portada
      </NoticeButton>
      <NoticeButton href="/?unirme">Entrar con un código</NoticeButton>
    </NoticeScreen>
  );
}

// Un islote con un poste de señales que no apunta a nada: dice «te has salido
// del mapa» sin tener que explicarlo.
function Signpost() {
  return (
    <svg viewBox="0 0 260 180" className="w-[230px] sm:w-[250px]" aria-hidden="true">
      <ellipse cx="130" cy="150" rx="106" ry="24" fill="#1B8FC4" opacity="0.3" />
      <path d="M30 142 C30 124 64 112 104 109 C146 106 190 113 218 121 C238 127 246 136 240 143 C231 154 186 158 130 158 C74 158 30 154 30 142 Z" fill="#DEC195" />
      <path d="M40 136 C40 120 70 110 106 107 C144 104 184 111 209 118 C227 123 234 131 229 137 C221 147 180 151 130 151 C80 151 40 147 40 136 Z" fill="#F2DCB3" />
      <path d="M126 118 L126 42" stroke="#7A4E33" strokeWidth="9" strokeLinecap="round" />
      <path d="M126 56 L74 56 L62 68 L74 80 L126 80 Z" fill="#A9714B" stroke="#23222b" strokeWidth="3" strokeLinejoin="round" />
      <path d="M128 88 L186 88 L198 100 L186 112 L128 112 Z" fill="#C08C5E" stroke="#23222b" strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 62 h30 M146 94 h34" stroke="#FDF6E8" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      <path d="M58 132 C68 122 88 120 98 124 C86 130 70 132 58 132 Z" fill="#3F9E58" />
    </svg>
  );
}
