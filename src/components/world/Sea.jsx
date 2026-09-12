"use client";

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Vector3 } from 'three';
import { CLAY, PALETTE } from './palette';

const SIZE = 600;
const MAX_ISLANDS = 12;

// Mar mate con una ondulación muy suave en el vertex shader y el color por
// distancia a la isla más cercana: cada isla se queda con su halo de agua clara
// y el azul se va a profundo hacia el horizonte. A propósito no se recalculan
// las normales — dejar la superficie sin brillos la mantiene en el mismo
// lenguaje de arcilla que el resto del mundo.
export default function Sea({ islands = [] }) {
  const shaderRef = useRef(null);

  // x, z y radio de cada isla, empaquetados para el shader.
  const islandData = useMemo(() => {
    const data = Array.from({ length: MAX_ISLANDS }, () => new Vector3(0, 0, -1e4));
    islands.slice(0, MAX_ISLANDS).forEach((island, i) => {
      data[i].set(island.position[0], island.position[2], island.shape.radius);
    });
    return data;
  }, [islands]);

  const onBeforeCompile = useMemo(
    () => (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uIslands = { value: islandData };
      shader.uniforms.uShallow = { value: new Color(PALETTE.seaShallow) };
      shader.uniforms.uMid = { value: new Color(PALETTE.sea) };
      shader.uniforms.uDeep = { value: new Color(PALETTE.seaDeep) };

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
           uniform float uTime;
           varying vec2 vWorldXZ;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           transformed.z += sin(transformed.x * 0.09 + uTime * 0.6) * 0.22
                          + sin(transformed.y * 0.13 - uTime * 0.45) * 0.16;
           // El plano viene rotado -90 en X, así que el eje Z del mundo es -y local.
           vWorldXZ = vec2(transformed.x, -transformed.y);`,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           #define MAX_ISLANDS ${MAX_ISLANDS}
           uniform vec3 uIslands[MAX_ISLANDS];
           uniform vec3 uShallow;
           uniform vec3 uMid;
           uniform vec3 uDeep;
           varying vec2 vWorldXZ;`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
           float nearest = 1.0e5;
           for (int i = 0; i < MAX_ISLANDS; i++) {
             float d = length(vWorldXZ - uIslands[i].xy) - uIslands[i].z;
             nearest = min(nearest, d);
           }
           vec3 seaColor = mix(uShallow, uMid, smoothstep(0.0, 13.0, nearest));
           seaColor = mix(seaColor, uDeep, smoothstep(22.0, 85.0, nearest));
           diffuseColor.rgb = seaColor;`,
        );

      shaderRef.current = shader;
    },
    [islandData],
  );

  useFrame(({ clock }) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[SIZE, SIZE, 96, 96]} />
      <meshStandardMaterial
        key={islands.length}
        color="#ffffff"
        roughness={0.62}
        metalness={CLAY.metalness}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  );
}
