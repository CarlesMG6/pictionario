"use client";

import { createContext, useContext, useRef } from 'react';

// Dónde está cada ficha (`spots`) y cuáles se están moviendo (`movers`),
// compartido entre los peones y la cámara. Van en un ref y no en estado de
// React a propósito: se escriben en cada fotograma, y provocar un render por
// fotograma sería absurdo.
//
// Son dos mapas y no uno porque la cámara los usa para cosas distintas: sigue
// a quien se mueve, y cuando no se mueve nadie se queda sobre la ficha del
// turno, que está quieta pero es la que la sala tiene que mirar.
const MotionContext = createContext(null);

export function MotionProvider({ children }) {
  const motion = useRef({ movers: new Map(), spots: new Map() });
  return <MotionContext.Provider value={motion}>{children}</MotionContext.Provider>;
}

export function useMotionState() {
  return useContext(MotionContext);
}
