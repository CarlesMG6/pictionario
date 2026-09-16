"use client";

import { useEffect, useState } from 'react';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { buildAnimalGeometries } from '../world/AnimalFigure';
import { speciesFromIcon } from '../../game/animals';

// Retrato de la criatura para la barra de equipos. Se rinde una vez por especie
// a un PNG y se cachea: el HUD es DOM, y montar un canvas 3D por jugador
// gastaría un contexto WebGL por tarjeta sin ganar nada — la figura no se
// anima ahí.
const SIZE = 256;
const cache = new Map();
let renderer = null;

export function animalPortrait(species) {
  if (cache.has(species)) return cache.get(species);
  if (typeof document === 'undefined') return null;

  try {
    if (!renderer) {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setSize(SIZE, SIZE, false);
      renderer.setPixelRatio(2);
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.outputColorSpace = SRGBColorSpace;
    }

    const scene = new Scene();
    scene.add(new AmbientLight(0xffffff, 1.2));

    const key = new DirectionalLight(0xffffff, 2.4);
    key.position.set(2.5, 3.5, 3);
    scene.add(key);

    const fill = new DirectionalLight(0xbfe9ff, 0.9);
    fill.position.set(-3, 1.2, 1.5);
    scene.add(fill);

    for (const group of buildAnimalGeometries(species)) {
      scene.add(
        new Mesh(group.geometry, new MeshStandardMaterial({ roughness: 0.78, metalness: 0, ...group.material })),
      );
    }

    const camera = new PerspectiveCamera(30, 1, 0.1, 30);
    camera.position.set(1.5, 1.5, 2.5);
    camera.lookAt(0, 0.68, 0);

    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    cache.set(species, url);
    return url;
  } catch (error) {
    // Sin WebGL disponible el HUD sigue funcionando, solo que sin figura.
    cache.set(species, null);
    return null;
  }
}

// En el servidor no hay WebGL, así que el retrato solo puede existir después de
// montar. Pedirlo durante el render dejaba el HTML del servidor con el PNG del
// icono y el del cliente con el retrato: React lo detecta y avisa de que la
// hidratación no cuadra. Con el efecto, el primer render coincide en los dos
// lados y el retrato entra justo después.
export function useAnimalPortrait(iconUrl) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    setUrl(animalPortrait(speciesFromIcon(iconUrl)));
  }, [iconUrl]);
  return url;
}

export function useAnimalPortraits(teams) {
  const [portraits, setPortraits] = useState({});
  const key = (teams || []).map((team) => team.id + ':' + team.icon_url).join('|');

  useEffect(() => {
    setPortraits(
      Object.fromEntries(
        (teams || []).map((team) => [team.id, animalPortrait(speciesFromIcon(team.icon_url))]),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return portraits;
}
