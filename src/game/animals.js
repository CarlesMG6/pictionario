// Catálogo de criaturas. Cada especie es una lista de piezas sobre un plan
// corporal común, no un modelo a medida: así son catorce configuraciones y un
// único constructor, en vez de catorce mallas que mantener.
//
// Piezas:
//   shape 'ellipsoid'  size [rx, ry, rz]
//   shape 'cone'       size [radioBase, radioPunta, altura]
//   at    [x, y, z]    rot [x, y, z] en radianes
//   mirror: true       duplica la pieza en -x (orejas, patas, aletas)
//
// El eje Z mira hacia delante. La criatura se apoya en y = 0 y mide algo menos
// de 1.5 unidades, que es la escala a la que se lee sobre una casilla de radio 1.

const EYE = 'eye';

// El icono del equipo es el nombre del fichero en /public/player-icons.
export const SPECIES_BY_ICON = {
  bird: 'bird',
  cat: 'cat',
  crab: 'crab',
  deer: 'deer',
  dolphin: 'dolphin',
  dragon: 'dragon',
  elephant: 'elephant',
  fish: 'fish',
  monkey: 'monkey',
  otter: 'otter',
  shrimp: 'shrimp',
  'space-cat': 'spaceCat',
  squid: 'squid',
  unicorn: 'unicorn',
};

// Nombre de cada especie, en plural: es lo que se le propone al equipo como
// nombre cuando elige criatura, así que tiene que leerse como un equipo («los
// delfines») y no como un bicho suelto.
export const SPECIES_LABEL = {
  bird: 'Pájaros',
  cat: 'Gatos',
  crab: 'Cangrejos',
  deer: 'Ciervos',
  dolphin: 'Delfines',
  dragon: 'Dragones',
  elephant: 'Elefantes',
  fish: 'Peces',
  monkey: 'Monos',
  otter: 'Nutrias',
  shrimp: 'Gambas',
  spaceCat: 'Gatos espaciales',
  squid: 'Calamares',
  unicorn: 'Unicornios',
};

// Las catorce criaturas entre las que se elige, en el orden en que se enseñan.
// Sale del mapa de iconos para que no haya dos listas que mantener.
export const ANIMAL_CHOICES = Object.entries(SPECIES_BY_ICON).map(([file, species]) => ({
  species,
  icon: `/player-icons/${file}2.png`,
  label: SPECIES_LABEL[species],
}));

// Ojos, idénticos en casi todas: se componen con el resto de piezas.
const eyes = (x, y, z, r = 0.055) => [
  { shape: 'ellipsoid', size: [r, r, r], at: [x, y, z], color: EYE, mirror: true },
];

export const ANIMALS = {
  cat: {
    palette: { fur: '#e8a15d', belly: '#fbe3c4', dark: '#3b2a21', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.34, 0.3, 0.42], at: [0, 0.44, 0], color: 'fur' },
      { shape: 'ellipsoid', size: [0.22, 0.18, 0.2], at: [0, 0.36, 0.24], color: 'belly' },
      { shape: 'ellipsoid', size: [0.3, 0.28, 0.27], at: [0, 0.86, 0.16], color: 'fur' },
      { shape: 'ellipsoid', size: [0.14, 0.1, 0.1], at: [0, 0.79, 0.38], color: 'belly' },
      { shape: 'ellipsoid', size: [0.045, 0.035, 0.04], at: [0, 0.82, 0.46], color: 'dark' },
      { shape: 'cone', size: [0.13, 0.01, 0.2], at: [0.15, 1.09, 0.14], rot: [0, 0, -0.25], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.08, 0.06, 0.26], at: [0.16, 0.16, 0.12], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.08, 0.06, 0.26], at: [0.16, 0.16, -0.16], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.07, 0.03, 0.42], at: [0, 0.6, -0.4], rot: [-0.9, 0, 0], color: 'fur' },
      ...eyes(0.12, 0.9, 0.36),
    ],
  },

  spaceCat: {
    palette: {
      fur: '#8f9bb3',
      belly: '#e7edf7',
      dark: '#2f3442',
      eye: '#241f26',
      glass: { color: '#bfe6ff', opacity: 0.42, transparent: true, roughness: 0.25 },
    },
    parts: [
      { shape: 'ellipsoid', size: [0.34, 0.3, 0.42], at: [0, 0.44, 0], color: 'fur' },
      { shape: 'ellipsoid', size: [0.23, 0.19, 0.21], at: [0, 0.36, 0.24], color: 'belly' },
      { shape: 'ellipsoid', size: [0.29, 0.27, 0.26], at: [0, 0.86, 0.14], color: 'fur' },
      { shape: 'ellipsoid', size: [0.13, 0.1, 0.1], at: [0, 0.8, 0.35], color: 'belly' },
      { shape: 'cone', size: [0.11, 0.01, 0.17], at: [0.14, 1.06, 0.12], rot: [0, 0, -0.25], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.08, 0.06, 0.26], at: [0.16, 0.16, 0.12], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.08, 0.06, 0.26], at: [0.16, 0.16, -0.16], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.07, 0.03, 0.4], at: [0, 0.62, -0.38], rot: [-1.1, 0, 0], color: 'fur' },
      ...eyes(0.11, 0.9, 0.33),
      { shape: 'ellipsoid', size: [0.42, 0.42, 0.42], at: [0, 0.9, 0.14], color: 'glass' },
      { shape: 'cone', size: [0.34, 0.3, 0.1], at: [0, 0.56, 0.14], color: 'dark' },
    ],
  },

  bird: {
    palette: { feather: '#48b5e8', belly: '#dff4ff', beak: '#f5a623', foot: '#e08c1a', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.3, 0.36, 0.34], at: [0, 0.55, 0], color: 'feather' },
      { shape: 'ellipsoid', size: [0.2, 0.24, 0.2], at: [0, 0.5, 0.2], color: 'belly' },
      { shape: 'ellipsoid', size: [0.26, 0.25, 0.24], at: [0, 0.95, 0.06], color: 'feather' },
      { shape: 'cone', size: [0.1, 0.01, 0.24], at: [0, 0.92, 0.32], rot: [1.57, 0, 0], color: 'beak' },
      { shape: 'ellipsoid', size: [0.09, 0.24, 0.3], at: [0.28, 0.58, -0.02], rot: [0, 0, -0.25], color: 'feather', mirror: true },
      { shape: 'cone', size: [0.05, 0.04, 0.22], at: [0.12, 0.11, 0.02], color: 'foot', mirror: true },
      { shape: 'ellipsoid', size: [0.16, 0.07, 0.26], at: [0, 0.48, -0.36], rot: [0.5, 0, 0], color: 'feather' },
      ...eyes(0.13, 1.0, 0.2, 0.05),
    ],
  },

  crab: {
    palette: { shell: '#e05541', light: '#f5907f', dark: '#7d2a20', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.5, 0.26, 0.38], at: [0, 0.38, 0], color: 'shell' },
      { shape: 'ellipsoid', size: [0.36, 0.14, 0.24], at: [0, 0.45, 0.08], color: 'light' },
      { shape: 'cone', size: [0.05, 0.05, 0.26], at: [0.17, 0.62, 0.12], color: 'shell', mirror: true },
      ...eyes(0.17, 0.76, 0.12, 0.08),
      { shape: 'cone', size: [0.07, 0.05, 0.3], at: [0.52, 0.42, 0.24], rot: [0, -0.5, -0.5], color: 'shell', mirror: true },
      { shape: 'ellipsoid', size: [0.17, 0.13, 0.12], at: [0.72, 0.5, 0.4], color: 'shell', mirror: true },
      { shape: 'ellipsoid', size: [0.13, 0.06, 0.09], at: [0.78, 0.6, 0.45], color: 'light', mirror: true },
      { shape: 'cone', size: [0.05, 0.04, 0.24], at: [0.42, 0.2, -0.04], rot: [0, 0, 0.7], color: 'dark', mirror: true },
      { shape: 'cone', size: [0.05, 0.04, 0.24], at: [0.38, 0.2, -0.24], rot: [0, 0, 0.7], color: 'dark', mirror: true },
    ],
  },

  deer: {
    palette: { fur: '#b5793f', belly: '#f0dcc0', antler: '#d8c49a', dark: '#4a3323', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.32, 0.3, 0.44], at: [0, 0.62, 0], color: 'fur' },
      { shape: 'ellipsoid', size: [0.2, 0.18, 0.24], at: [0, 0.54, 0.22], color: 'belly' },
      { shape: 'cone', size: [0.13, 0.11, 0.3], at: [0, 0.92, 0.22], rot: [-0.5, 0, 0], color: 'fur' },
      { shape: 'ellipsoid', size: [0.19, 0.2, 0.26], at: [0, 1.12, 0.32], color: 'fur' },
      { shape: 'ellipsoid', size: [0.1, 0.08, 0.11], at: [0, 1.06, 0.52], color: 'belly' },
      { shape: 'ellipsoid', size: [0.05, 0.13, 0.05], at: [0.14, 1.3, 0.28], rot: [0, 0, -0.3], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.045, 0.02, 0.3], at: [0.11, 1.42, 0.3], rot: [-0.2, 0, -0.35], color: 'antler', mirror: true },
      { shape: 'cone', size: [0.03, 0.015, 0.16], at: [0.22, 1.55, 0.28], rot: [0, 0, -1.1], color: 'antler', mirror: true },
      { shape: 'cone', size: [0.07, 0.05, 0.5], at: [0.17, 0.26, 0.18], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.07, 0.05, 0.5], at: [0.17, 0.26, -0.18], color: 'fur', mirror: true },
      { shape: 'ellipsoid', size: [0.08, 0.1, 0.08], at: [0, 0.74, -0.44], color: 'belly' },
      ...eyes(0.13, 1.16, 0.44),
    ],
  },

  dolphin: {
    palette: { skin: '#5aa8d8', belly: '#e6f4fb', dark: '#2c5a78', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.28, 0.3, 0.6], at: [0, 0.62, 0.02], color: 'skin' },
      { shape: 'ellipsoid', size: [0.2, 0.18, 0.42], at: [0, 0.5, 0.08], color: 'belly' },
      { shape: 'cone', size: [0.17, 0.05, 0.32], at: [0, 0.68, 0.6], rot: [1.45, 0, 0], color: 'skin' },
      { shape: 'ellipsoid', size: [0.06, 0.2, 0.16], at: [0, 1.0, -0.04], color: 'skin' },
      { shape: 'ellipsoid', size: [0.22, 0.05, 0.12], at: [0.24, 0.52, 0.14], rot: [0, 0.3, -0.4], color: 'skin', mirror: true },
      { shape: 'cone', size: [0.13, 0.05, 0.3], at: [0, 0.4, -0.5], rot: [-0.7, 0, 0], color: 'skin' },
      { shape: 'ellipsoid', size: [0.28, 0.05, 0.1], at: [0, 0.26, -0.66], color: 'skin' },
      ...eyes(0.17, 0.74, 0.4, 0.05),
    ],
  },

  dragon: {
    palette: { scale: '#4fae63', belly: '#e8dc9a', horn: '#f0e6c8', dark: '#26502f', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.34, 0.32, 0.44], at: [0, 0.5, 0], color: 'scale' },
      { shape: 'ellipsoid', size: [0.22, 0.2, 0.28], at: [0, 0.42, 0.22], color: 'belly' },
      { shape: 'ellipsoid', size: [0.27, 0.25, 0.3], at: [0, 0.94, 0.16], color: 'scale' },
      { shape: 'ellipsoid', size: [0.16, 0.12, 0.17], at: [0, 0.86, 0.42], color: 'scale' },
      { shape: 'cone', size: [0.05, 0.015, 0.22], at: [0.13, 1.14, 0.08], rot: [-0.3, 0, -0.3], color: 'horn', mirror: true },
      { shape: 'ellipsoid', size: [0.06, 0.3, 0.34], at: [0.3, 0.78, -0.1], rot: [0, 0.35, -0.35], color: 'dark', mirror: true },
      { shape: 'cone', size: [0.09, 0.07, 0.3], at: [0.18, 0.18, 0.14], color: 'scale', mirror: true },
      { shape: 'cone', size: [0.09, 0.07, 0.3], at: [0.18, 0.18, -0.16], color: 'scale', mirror: true },
      { shape: 'cone', size: [0.09, 0.02, 0.5], at: [0, 0.5, -0.5], rot: [-1.1, 0, 0], color: 'scale' },
      ...eyes(0.14, 0.99, 0.38),
    ],
  },

  elephant: {
    palette: { skin: '#9aa3b4', light: '#c3cad6', tusk: '#f6f0e0', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.42, 0.38, 0.48], at: [0, 0.52, 0], color: 'skin' },
      { shape: 'ellipsoid', size: [0.32, 0.3, 0.3], at: [0, 0.96, 0.2], color: 'skin' },
      { shape: 'ellipsoid', size: [0.05, 0.26, 0.26], at: [0.32, 0.98, 0.14], rot: [0, 0.25, 0], color: 'light', mirror: true },
      { shape: 'cone', size: [0.12, 0.07, 0.42], at: [0, 0.76, 0.46], rot: [-1.9, 0, 0], color: 'skin' },
      { shape: 'cone', size: [0.04, 0.015, 0.16], at: [0.12, 0.82, 0.42], rot: [-1.2, 0, 0], color: 'tusk', mirror: true },
      { shape: 'cone', size: [0.12, 0.11, 0.36], at: [0.22, 0.2, 0.18], color: 'skin', mirror: true },
      { shape: 'cone', size: [0.12, 0.11, 0.36], at: [0.22, 0.2, -0.18], color: 'skin', mirror: true },
      { shape: 'cone', size: [0.05, 0.02, 0.24], at: [0, 0.62, -0.5], rot: [-0.4, 0, 0], color: 'skin' },
      ...eyes(0.19, 1.02, 0.42),
    ],
  },

  fish: {
    palette: { scale: '#f2a33c', belly: '#ffe3b0', fin: '#e3762a', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.26, 0.4, 0.52], at: [0, 0.6, 0.04], color: 'scale' },
      { shape: 'ellipsoid', size: [0.18, 0.26, 0.36], at: [0, 0.48, 0.1], color: 'belly' },
      { shape: 'ellipsoid', size: [0.04, 0.26, 0.22], at: [0, 1.0, -0.02], rot: [0.3, 0, 0], color: 'fin' },
      { shape: 'ellipsoid', size: [0.16, 0.04, 0.12], at: [0.22, 0.52, 0.1], rot: [0, 0.3, -0.3], color: 'fin', mirror: true },
      { shape: 'ellipsoid', size: [0.04, 0.3, 0.22], at: [0, 0.66, -0.6], rot: [0.4, 0, 0], color: 'fin' },
      { shape: 'ellipsoid', size: [0.08, 0.06, 0.07], at: [0, 0.56, 0.54], color: 'fin' },
      ...eyes(0.17, 0.72, 0.36, 0.07),
    ],
  },

  monkey: {
    palette: { fur: '#8a5a38', face: '#e5b98d', dark: '#4b3120', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.3, 0.32, 0.32], at: [0, 0.5, 0], color: 'fur' },
      { shape: 'ellipsoid', size: [0.2, 0.2, 0.18], at: [0, 0.46, 0.2], color: 'face' },
      { shape: 'ellipsoid', size: [0.28, 0.27, 0.26], at: [0, 0.94, 0.08], color: 'fur' },
      { shape: 'ellipsoid', size: [0.2, 0.18, 0.14], at: [0, 0.9, 0.24], color: 'face' },
      { shape: 'ellipsoid', size: [0.05, 0.11, 0.11], at: [0.28, 0.96, 0.04], color: 'face', mirror: true },
      { shape: 'cone', size: [0.07, 0.06, 0.34], at: [0.28, 0.52, 0.02], rot: [0, 0, 0.35], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.08, 0.06, 0.26], at: [0.15, 0.15, 0.06], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.05, 0.03, 0.56], at: [0, 0.56, -0.36], rot: [-1.5, 0, 0], color: 'dark' },
      ...eyes(0.09, 0.97, 0.32, 0.05),
    ],
  },

  otter: {
    palette: { fur: '#8b6244', belly: '#e2c9a8', dark: '#4a3222', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.3, 0.3, 0.5], at: [0, 0.44, 0], color: 'fur' },
      { shape: 'ellipsoid', size: [0.21, 0.2, 0.32], at: [0, 0.36, 0.16], color: 'belly' },
      { shape: 'ellipsoid', size: [0.26, 0.24, 0.25], at: [0, 0.84, 0.24], color: 'fur' },
      { shape: 'ellipsoid', size: [0.15, 0.11, 0.12], at: [0, 0.77, 0.44], color: 'belly' },
      { shape: 'ellipsoid', size: [0.045, 0.035, 0.04], at: [0, 0.8, 0.53], color: 'dark' },
      { shape: 'ellipsoid', size: [0.07, 0.06, 0.04], at: [0.18, 0.98, 0.2], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.08, 0.07, 0.24], at: [0.17, 0.14, 0.14], color: 'fur', mirror: true },
      { shape: 'cone', size: [0.08, 0.07, 0.24], at: [0.17, 0.14, -0.14], color: 'fur', mirror: true },
      { shape: 'ellipsoid', size: [0.1, 0.05, 0.34], at: [0, 0.22, -0.6], rot: [0.25, 0, 0], color: 'fur' },
      ...eyes(0.12, 0.88, 0.42),
    ],
  },

  shrimp: {
    palette: { shell: '#f08a7a', light: '#ffd2c4', dark: '#b04a3c', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.24, 0.28, 0.3], at: [0, 0.6, 0.16], color: 'shell' },
      { shape: 'ellipsoid', size: [0.22, 0.24, 0.2], at: [0, 0.52, -0.14], color: 'light' },
      { shape: 'ellipsoid', size: [0.19, 0.2, 0.17], at: [0, 0.38, -0.38], color: 'shell' },
      { shape: 'ellipsoid', size: [0.15, 0.15, 0.14], at: [0, 0.24, -0.54], color: 'light' },
      { shape: 'cone', size: [0.14, 0.02, 0.2], at: [0, 0.16, -0.7], rot: [0.9, 0, 0], color: 'dark' },
      { shape: 'cone', size: [0.02, 0.01, 0.46], at: [0.07, 0.86, 0.3], rot: [-0.5, 0, -0.2], color: 'dark', mirror: true },
      { shape: 'cone', size: [0.05, 0.04, 0.22], at: [0.14, 0.16, 0.14], rot: [0, 0, 0.5], color: 'dark', mirror: true },
      { shape: 'cone', size: [0.05, 0.04, 0.22], at: [0.13, 0.16, -0.08], rot: [0, 0, 0.5], color: 'dark', mirror: true },
      ...eyes(0.11, 0.7, 0.38, 0.06),
    ],
  },

  squid: {
    palette: { mantle: '#a266c9', light: '#d9b4ee', dark: '#5f2f7d', eye: '#241f26' },
    parts: [
      { shape: 'cone', size: [0.05, 0.32, 0.6], at: [0, 0.92, 0], color: 'mantle' },
      { shape: 'ellipsoid', size: [0.3, 0.22, 0.3], at: [0, 0.6, 0.02], color: 'mantle' },
      { shape: 'ellipsoid', size: [0.22, 0.1, 0.2], at: [0, 0.56, 0.16], color: 'light' },
      { shape: 'ellipsoid', size: [0.17, 0.1, 0.22], at: [0.22, 0.9, -0.02], rot: [0, 0, 0.4], color: 'light', mirror: true },
      { shape: 'cone', size: [0.06, 0.03, 0.42], at: [0.14, 0.22, 0.16], rot: [0.3, 0, 0.2], color: 'mantle', mirror: true },
      { shape: 'cone', size: [0.06, 0.03, 0.42], at: [0.2, 0.22, -0.04], rot: [0, 0, 0.3], color: 'dark', mirror: true },
      { shape: 'cone', size: [0.06, 0.03, 0.42], at: [0.1, 0.22, -0.2], rot: [-0.3, 0, 0.15], color: 'mantle', mirror: true },
      ...eyes(0.2, 0.64, 0.2, 0.09),
    ],
  },

  unicorn: {
    palette: { coat: '#f6f0f8', mane: '#f06fa8', horn: '#f7c948', dark: '#c9b7cd', eye: '#241f26' },
    parts: [
      { shape: 'ellipsoid', size: [0.32, 0.3, 0.46], at: [0, 0.62, 0], color: 'coat' },
      { shape: 'cone', size: [0.14, 0.12, 0.32], at: [0, 0.94, 0.2], rot: [-0.45, 0, 0], color: 'coat' },
      { shape: 'ellipsoid', size: [0.17, 0.18, 0.26], at: [0, 1.14, 0.32], color: 'coat' },
      { shape: 'ellipsoid', size: [0.1, 0.09, 0.11], at: [0, 1.08, 0.52], color: 'dark' },
      { shape: 'cone', size: [0.05, 0.005, 0.26], at: [0, 1.42, 0.3], rot: [-0.25, 0, 0], color: 'horn' },
      { shape: 'ellipsoid', size: [0.05, 0.1, 0.05], at: [0.13, 1.3, 0.24], rot: [0, 0, -0.3], color: 'coat', mirror: true },
      { shape: 'ellipsoid', size: [0.1, 0.2, 0.16], at: [0, 1.16, 0.06], color: 'mane' },
      { shape: 'ellipsoid', size: [0.09, 0.14, 0.14], at: [0, 0.98, -0.1], color: 'mane' },
      { shape: 'cone', size: [0.08, 0.06, 0.52], at: [0.18, 0.27, 0.18], color: 'coat', mirror: true },
      { shape: 'cone', size: [0.08, 0.06, 0.52], at: [0.18, 0.27, -0.18], color: 'coat', mirror: true },
      { shape: 'cone', size: [0.1, 0.04, 0.34], at: [0, 0.68, -0.5], rot: [-0.8, 0, 0], color: 'mane' },
      ...eyes(0.12, 1.18, 0.44),
    ],
  },
};

// El icono del equipo llega como ruta ('/player-icons/cat2.png'); de ahí sale la
// especie. Si no se reconoce, gato: mejor una criatura equivocada que ninguna.
export function speciesFromIcon(iconUrl) {
  const file = String(iconUrl || '').split('/').pop() || '';
  const name = file.replace(/2?\.png$/, '');
  return ANIMALS[SPECIES_BY_ICON[name]] ? SPECIES_BY_ICON[name] : 'cat';
}
