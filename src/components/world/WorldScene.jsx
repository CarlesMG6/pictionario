"use client";

import { DECK_LIFT, ISLAND_TOP } from '../../game/worldConstants';
import Bridge, { PLANK_THICKNESS } from './Bridge';
import Island from './Island';
import Mountain from './Mountain';
import Palm from './Palm';
import PathTile from './PathTile';
import Plants from './Plants';
import Rock from './Rock';
import TeamPawn from './TeamPawn';
import Trail from './Trail';

// Dibuja el mundo descrito por el generador. No decide nada: toda la colocación
// viene resuelta y verificada en `buildWorld`.
export default function WorldScene({ world, teams = [] }) {
  const { islands, landmarks, layout, rocks, palms, plants } = world;

  return (
    <group>
      {islands.map((island, i) => (
        <Island key={i} shape={island.shape} position={island.position} />
      ))}

      <Trail pebbles={layout.trail} />
      <Bridge deck={layout.deck} y={ISLAND_TOP + DECK_LIFT - PLANK_THICKNESS / 2} />

      {layout.tiles.map((tile) => (
        <PathTile
          key={tile.index}
          category={tile.category}
          position={tile.position}
          rotation={tile.rotation}
        />
      ))}

      {landmarks.map((landmark, i) =>
        landmark ? (
          <Mountain
            key={i}
            shape={landmark.shape}
            height={landmark.height}
            position={landmark.position}
          />
        ) : null,
      )}

      {rocks.map((rock, i) => (
        <Rock key={i} {...rock} />
      ))}
      {palms.map((palm, i) => (
        <Palm key={i} {...palm} />
      ))}

      <Plants items={plants} />

      {teams.map((team, i) => (
        <TeamPawn
          key={team.id}
          id={team.id}
          tiles={layout.tiles}
          tileIndex={team.position}
          species={team.species}
          color={team.color}
          slot={i}
          slotCount={teams.length}
        />
      ))}
    </group>
  );
}
