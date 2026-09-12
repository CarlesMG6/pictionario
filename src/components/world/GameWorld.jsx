"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CameraRig from './CameraRig';
import { MotionProvider } from './motionState';
import { Bloom, EffectComposer, N8AO, Vignette } from '@react-three/postprocessing';
import { ACESFilmicToneMapping } from 'three';
import Clouds from './Clouds';
import Sea from './Sea';
import SkyDome from './SkyDome';

// Valores por defecto del acabado. El laboratorio puede sobreescribirlos por
// query param para poder afinar sin tocar código.
export const LOOK = {
  shadowMap: 2048,
  shadowRadius: 6,
  shadowSamples: 16,
  shadowBias: 0,
  shadowNormalBias: 0.03,
  keyIntensity: 2.6,
  hemiIntensity: 0.75,
  ambientIntensity: 0.18,
  exposure: 1.05,
  aoIntensity: 9,
  aoRadius: 3.2,
  vignette: 0.4,
};

// El escenario: cámara casi isométrica (FOV estrecho para aplanar la
// perspectiva), luz suave y el post-proceso que define el acabado. El N8AO es
// la pieza clave: sin oclusión ambiental la escena se lee como juguete de
// plástico en vez de como render de arcilla.
//
// Las sombras van en VSM en vez del PCSS de drei: <SoftShadows> inyecta un
// chunk que three 0.186 ya no acepta (unpackRGBAToDepth y vogelDiskSample
// duplicado) y tumba la compilación de todos los materiales de la escena.
export default function GameWorld({
  children,
  controls = false,
  look = {},
  islands = [],
  target = [0, 0.6, 0],
  cameraPosition = [24, 20, 24],
  // Con `bounds` la cámara se conduce sola: sigue a la ficha que se mueve y,
  // cuando no hay ninguna, se abre y orbita el mapa.
  bounds = null,
}) {
  const L = { ...LOOK, ...look };

  return (
    <Canvas
      shadows="variance"
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: L.exposure }}
      camera={{ position: cameraPosition, fov: 26, near: 1, far: 600 }}
      onCreated={({ camera }) => camera.lookAt(target[0], target[1], target[2])}
    >
      <hemisphereLight args={['#bfe9ff', '#f0cf9c', L.hemiIntensity]} />
      <ambientLight intensity={L.ambientIntensity} />
      <directionalLight
        position={[26, 34, 18]}
        intensity={L.keyIntensity}
        castShadow
        shadow-mapSize={[L.shadowMap, L.shadowMap]}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-radius={L.shadowRadius}
        shadow-blurSamples={L.shadowSamples}
        shadow-bias={L.shadowBias}
        shadow-normalBias={L.shadowNormalBias}
      />

      <SkyDome />
      <Clouds />
      <Sea islands={islands} />

      {/* El rig comparte contexto con los peones: son ellos quienes le dicen
          qué se está moviendo y dónde. */}
      <MotionProvider>
        {children}
        {bounds && <CameraRig bounds={bounds} />}
      </MotionProvider>

      <EffectComposer multisampling={4}>
        <N8AO
          aoRadius={L.aoRadius}
          intensity={L.aoIntensity}
          distanceFalloff={1.2}
          color="#1d3350"
          quality="high"
          aoSamples={24}
          denoiseSamples={8}
        />
        <Bloom intensity={0.25} luminanceThreshold={0.9} mipmapBlur />
        <Vignette offset={0.32} darkness={L.vignette} />
      </EffectComposer>

      {controls && !bounds && (
        <OrbitControls makeDefault target={target} maxPolarAngle={Math.PI / 2.2} />
      )}
    </Canvas>
  );
}
