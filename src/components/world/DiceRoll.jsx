"use client";

import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { ACESFilmicToneMapping, Euler, Quaternion, Vector3 } from 'three';
import DiceFigure, { DICE_SIZE } from './DiceFigure';

// La tirada, en tres dimensiones y compartida por las dos pantallas.
//
// En el móvil el dado sale disparado en la dirección del dedo, bota, rueda y se
// para: la tirada se simula a mano (gravedad, rebote y rozamiento) porque un
// motor de física entero para un cubo sería pagar mucho por poco, y porque el
// resultado no lo decide el dado — lo decide el host. Lo que hace la simulación
// es llevar el cubo hasta el reposo y, en el último tramo, girarlo hasta dejar
// arriba la cara que ha salido.
//
// En el host el dado no se mueve del centro y la cámara es cenital: es la misma
// tirada vista desde arriba, como se mira un dado sobre la mesa.

const REST_Y = DICE_SIZE / 2;
const GRAVITY = 19;
const BOUNCE = 0.34;
const FLOOR_FRICTION = 0.68;
const WALL = 1.25;
const MIN_FLIGHT = 1.05;
const SETTLE_S = 0.55;

// Orientación que deja cada valor mirando hacia arriba. Ver el reparto de caras
// en DiceFigure.
const FACE_UP = {
  1: [0, 0, 0],
  2: [-Math.PI / 2, 0, 0],
  3: [0, 0, Math.PI / 2],
  4: [0, 0, -Math.PI / 2],
  5: [Math.PI / 2, 0, 0],
  6: [Math.PI, 0, 0],
};

const easeOut = (t) => 1 - (1 - t) ** 3;

// La cámara se apunta a mano y no con el prop `camera` del Canvas: ese prop
// solo se aplica al crear el lienzo, así que un cambio de vista en caliente no
// llegaba nunca — el dado del host se seguía viendo en tres cuartos en vez de
// desde arriba.
function Rig({ topDown, lookY }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    if (topDown) {
      // Casi en la vertical. El milímetro de desplazamiento evita el caso
      // degenerado de mirar justo a lo largo del eje `up`.
      camera.position.set(0, 6.4, 0.001);
      camera.fov = 26;
    } else {
      camera.position.set(0, 4.6, 5.4);
      camera.fov = 32;
    }
    camera.near = 0.5;
    camera.far = 40;
    camera.lookAt(0, lookY, 0);
    camera.updateProjectionMatrix();
  }, [camera, topDown, lookY]);

  return null;
}

function DiceBody({ rolling, value, throwX = 0, throwY = -1, pinned = false }) {
  const group = useRef();
  const s = useRef({
    mode: 'idle',
    t: 0,
    settleT: 0,
    pos: new Vector3(0, REST_Y, 0),
    rest: new Vector3(0, REST_Y, 0),
    vel: new Vector3(),
    spin: new Vector3(),
    quat: new Quaternion(),
    from: new Quaternion(),
    to: new Quaternion(),
    // Reutilizados en cada fotograma para no generar basura en el bucle.
    tmpEuler: new Euler(),
    tmpQuat: new Quaternion(),
    yaw: 0,
  });

  useEffect(() => {
    const st = s.current;

    if (!rolling) {
      st.mode = 'idle';
      st.t = 0;
      st.pos.set(0, REST_Y, 0);
      st.vel.set(0, 0, 0);
      st.spin.set(0, 0, 0);
      st.quat.identity();
      return;
    }

    st.mode = 'flying';
    st.t = 0;
    st.settleT = 0;
    // El giro final se queda con una guiñada al azar: la cara de arriba es la
    // que manda, pero un dado que siempre cae alineado con la cámara canta.
    st.yaw = Math.random() * Math.PI * 2;

    const power = Math.min(1.7, Math.hypot(throwX, throwY) || 1);

    if (pinned) {
      // El dado del host no viaja: solo gira sobre el centro.
      st.pos.set(0, REST_Y, 0);
      st.vel.set(0, 0, 0);
    } else {
      st.pos.set(0, REST_Y + 0.1, 0.95);
      st.vel.set(throwX * 3.6, 6.2 + power * 1.9, throwY * 3.6);
    }

    const tumble = 9 + power * 7;
    st.spin.set(
      (Math.random() * 2 - 1) * tumble,
      (Math.random() * 2 - 1) * tumble * 0.7,
      (Math.random() * 2 - 1) * tumble,
    );
  }, [rolling, pinned, throwX, throwY]);

  useFrame((_, delta) => {
    const st = s.current;
    const node = group.current;
    if (!node) return;

    // Dos relojes distintos a propósito: la integración va con el paso
    // recortado, porque un fotograma perdido no puede teletransportar el dado al
    // otro lado de la pared invisible; y los tiempos de la tirada van con el
    // reloj real, porque si no, en un dispositivo que baja a diez fotogramas la
    // tirada duraría el triple y la partida ya habría seguido sin ella.
    const dt = Math.min(0.033, delta);

    if (st.mode === 'idle') {
      st.t += delta;
      node.position.set(0, REST_Y + Math.sin(st.t * 1.7) * 0.085, 0);
      // Pose ladeada y girando despacio: se ven tres caras, y un objeto que se
      // mueve invita a cogerlo de una forma que uno quieto no consigue.
      node.rotation.set(0.34, st.t * 0.42, 0.2);
      return;
    }

    st.t += delta;

    if (st.mode === 'flying') {
      if (!pinned) {
        st.vel.y -= GRAVITY * dt;
        st.pos.addScaledVector(st.vel, dt);

        if (st.pos.y <= REST_Y) {
          st.pos.y = REST_Y;
          st.vel.y = Math.abs(st.vel.y) * BOUNCE;
          st.vel.x *= FLOOR_FRICTION;
          st.vel.z *= FLOOR_FRICTION;
          st.spin.multiplyScalar(0.6);
        }

        // Paredes invisibles: el dado tiene que quedarse en cuadro.
        for (const axis of ['x', 'z']) {
          if (st.pos[axis] > WALL) {
            st.pos[axis] = WALL;
            st.vel[axis] *= -0.45;
          } else if (st.pos[axis] < -WALL) {
            st.pos[axis] = -WALL;
            st.vel[axis] *= -0.45;
          }
        }
      }

      st.tmpEuler.set(st.spin.x * dt, st.spin.y * dt, st.spin.z * dt);
      st.quat.multiply(st.tmpQuat.setFromEuler(st.tmpEuler));
      st.spin.multiplyScalar(1 - 0.5 * dt);

      // Se posa cuando ya se sabe el resultado y, o ha rodado lo suyo, o se ha
      // quedado sin fuerza. Sin resultado sigue girando: el host lo publica unos
      // milisegundos después de que el dedo suelte.
      const spent = !pinned && st.vel.length() < 1.1 && st.pos.y <= REST_Y + 0.01;
      if (value && (st.t > MIN_FLIGHT || spent)) {
        st.mode = 'settling';
        st.settleT = 0;
        st.from.copy(st.quat);
        st.tmpEuler.set(...(FACE_UP[value] || FACE_UP[1]));
        st.to.setFromEuler(st.tmpEuler);
        st.tmpEuler.set(0, st.yaw, 0);
        st.to.premultiply(st.tmpQuat.setFromEuler(st.tmpEuler));
        st.rest.set(st.pos.x, REST_Y, st.pos.z);
      }
    } else if (st.mode === 'settling') {
      st.settleT += delta;
      const k = Math.min(1, st.settleT / SETTLE_S);
      st.quat.slerpQuaternions(st.from, st.to, easeOut(k));
      st.pos.lerp(st.rest, Math.min(1, dt * 10));
      if (k >= 1) st.mode = 'done';
    }

    node.position.copy(st.pos);
    node.quaternion.copy(st.quat);
  });

  return (
    <group ref={group}>
      <DiceFigure />
    </group>
  );
}

export default function DiceRoll({
  value,
  rolling = false,
  pinned = false,
  topDown = false,
  throwX = 0,
  throwY = -1,
  // Apuntar la cámara por encima del dado lo baja dentro del cuadro y deja
  // hueco arriba para que se vea volar. El host apunta casi al propio dado.
  lookY = REST_Y * 0.8,
  className = '',
  style,
}) {
  return (
    <div className={className} style={style}>
      {/* Sin mapa de sombras: este lienzo convive con el del mundo, y los mapas
          VSM de aquel ya ocupan lo suyo — pedir otro par por cada dado hacía que
          el navegador tirase contextos de WebGL («Context Lost») y se congelara
          la escena. La sombra la pone ContactShadows, que es un render de
          profundidad pequeño y además da el borde difuso del acabado. */}
      <Canvas
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        {/* La cámara la coloca Rig y solo Rig: pasarla también por el prop
            `camera` del Canvas la pisaba en cada render, porque el objeto
            literal cambia de identidad y R3F lo vuelve a aplicar. */}
        <Rig topDown={topDown} lookY={lookY} />

        {/* Misma luz que el mundo: cielo frío arriba, arena cálida de rebote y
            una clave fuerte que saca el bisel. */}
        <hemisphereLight args={['#bfe9ff', '#f0cf9c', 0.8]} />
        <ambientLight intensity={0.22} />
        <directionalLight position={[3.6, 6.4, 3.2]} intensity={2.5} />

        <DiceBody
          rolling={rolling}
          value={value}
          throwX={throwX}
          throwY={throwY}
          pinned={pinned}
        />

        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={0.45}
          scale={7}
          blur={2.6}
          far={2.6}
          resolution={256}
          color="#1b3750"
        />
      </Canvas>
    </div>
  );
}
