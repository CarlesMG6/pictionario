"use client";

import { useMemo } from 'react';
import { BackSide, Color, ShaderMaterial } from 'three';
import { PALETTE } from './palette';

// Cúpula de cielo con degradado vertical. Va en un ShaderMaterial propio, así
// que hay que pasar los colores a espacio lineal y aplicar a mano el tone
// mapping para que case con el resto de materiales de la escena.
export default function SkyDome() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new Color(PALETTE.skyTop) },
          uHorizon: { value: new Color(PALETTE.skyHorizon) },
        },
        vertexShader: `
          varying float vHeight;
          void main() {
            vHeight = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          varying float vHeight;
          void main() {
            float h = smoothstep(-0.1, 0.55, vHeight);
            gl_FragColor = vec4(mix(uHorizon, uTop, h), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );

  return (
    <mesh material={material} scale={300} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  );
}
