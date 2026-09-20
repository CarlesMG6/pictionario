"use client";

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMotionState } from './motionState';

// Vuelta completa alrededor del mapa en algo más de tres minutos: tiene que
// leerse como deriva, no como un carrusel.
const ORBIT_SPEED = 0.032;

// Inclinación de la cámara, como fracción de la distancia horizontal. Mantener
// la misma en los dos modos es lo que hace que la transición no se note.
const ELEVATION = 0.72;

const FOLLOW_DISTANCE = 26;
const FOLLOW_LERP = 3.2;
const WIDE_LERP = 0.7;

// Cambio de turno: la cámara cruza el mapa hasta la ficha del que entra. Va más
// despacio que el seguimiento de un salto a propósito —es un viaje largo, y a
// ritmo de seguimiento parecería un latigazo.
const TRACK_LERP = 1.4;

// Tras aterrizar la ficha, la cámara se queda un momento sobre ella antes de
// abrirse. Sin esto, un salto de dos casillas dura menos que la propia
// transición y el acercamiento no llega a completarse nunca.
const HOLD_SECONDS = 2.2;

// Aire alrededor del mapa en el encuadre amplio.
const MARGIN = 1.12;

// Suavizado independiente de los fotogramas por segundo: con un lerp por
// fotograma a secas, la cámara se movería más rápido cuanto mejor fuese el
// equipo.
const smooth = (rate, delta) => 1 - Math.exp(-rate * delta);

// La cámara vive encima de la ficha que importa. Mientras una se mueve, la
// sigue de cerca; cuando no se mueve ninguna se queda sobre la del turno
// (`focusId`), orbitando despacio a su alrededor. Solo cuando no hay turno
// —la sala antes de empezar— se abre para encuadrar el mapa entero.
export default function CameraRig({ bounds, focusId = null }) {
  const { camera } = useThree();
  const motion = useMotionState();

  const angle = useRef(Math.PI * 0.25);
  const hold = useRef(0);
  const target = useRef(new Vector3(bounds.center[0], 0.6, bounds.center[2]));
  const focus = useMemo(() => new Vector3(), []);
  const held = useMemo(() => new Vector3(), []);
  const desired = useMemo(() => new Vector3(), []);

  // Distancia a la que el mapa entra en cuadro. Se calcula con el FOV y el
  // aspecto reales: el FOV es vertical, así que en una pantalla apaisada la
  // restricción es la vertical, y en una estrecha, la horizontal.
  const wideDistance = () => {
    const vertical = (camera.fov * Math.PI) / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
    const needed = (bounds.span * 0.5 * MARGIN) / Math.tan(Math.min(vertical, horizontal) / 2);
    // `needed` es distancia en línea recta; la cámara está elevada, así que su
    // componente horizontal es menor.
    return needed / Math.hypot(1, ELEVATION);
  };

  useFrame((_, delta) => {
    // El ángulo avanza siempre, también durante el seguimiento: así la cámara no
    // da un tirón al volver al modo amplio.
    angle.current += delta * ORBIT_SPEED;

    const movers = [...motion.current.movers.values()];
    const moving = movers.length > 0;

    if (moving) {
      let x = 0;
      let y = 0;
      let z = 0;
      for (const mover of movers) {
        x += mover[0];
        y += mover[1];
        z += mover[2];
      }
      held.set(x / movers.length, y / movers.length, z / movers.length);
      hold.current = HOLD_SECONDS;
    } else if (hold.current > 0) {
      hold.current -= delta;
    }

    // Prioridad: lo que se mueve, luego la ficha del turno, y solo si no hay
    // ninguna de las dos, el mapa entero.
    const chasing = moving || hold.current > 0;
    const spot = focusId ? motion.current.spots.get(focusId) : null;

    if (chasing) focus.copy(held);
    else if (spot) focus.set(spot[0], spot[1], spot[2]);
    else focus.set(bounds.center[0], 0.6, bounds.center[2]);

    const following = chasing || Boolean(spot);
    const distance = following ? FOLLOW_DISTANCE : wideDistance();
    desired.set(
      focus.x + Math.cos(angle.current) * distance,
      focus.y + distance * ELEVATION,
      focus.z + Math.sin(angle.current) * distance,
    );

    const rate = chasing ? FOLLOW_LERP : spot ? TRACK_LERP : WIDE_LERP;
    camera.position.lerp(desired, smooth(rate, delta));
    target.current.lerp(focus, smooth(rate, delta));
    camera.lookAt(target.current);
  });

  return null;
}
