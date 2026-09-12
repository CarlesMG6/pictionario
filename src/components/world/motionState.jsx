"use client";

import { createContext, useContext, useRef } from 'react';

// Qué fichas se están moviendo y dónde están, compartido entre los peones y la
// cámara. Va en un ref y no en estado de React a propósito: se escribe en cada
// fotograma, y provocar un render por fotograma sería absurdo.
const MotionContext = createContext(null);

export function MotionProvider({ children }) {
  const motion = useRef({ movers: new Map() });
  return <MotionContext.Provider value={motion}>{children}</MotionContext.Provider>;
}

export function useMotionState() {
  return useContext(MotionContext);
}
