"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseClient.js';
import { seedFromString } from '../../../game/worldGenerator';
import { STAGES, configOf, findRoomByCode } from '../../../utils/RoomLogic';
import HostLobbyScreen from '../../../components/lobby/HostLobbyScreen';

// La pantalla grande antes de la partida. No tiene ningún control: se suscribe
// a la sala y pinta la fase que marque `stage`, que va cambiando el móvil de
// P1. Cuando la partida arranca se aparta y deja paso a /host_play.
function HostClient({ id }) {
  const router = useRouter();
  const [roomUuid, setRoomUuid] = useState(null);
  const [room, setRoom] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id || id.length !== 6) {
      router.replace('/');
      return undefined;
    }

    let unsub = null;
    let alive = true;

    findRoomByCode(id).then((found) => {
      if (!alive) return;
      if (!found) {
        setMissing(true);
        return;
      }
      setRoomUuid(found.id);
      setRoom(found.data);
      unsub = onSnapshot(doc(db, 'rooms', found.id), (snap) => {
        if (snap.exists()) setRoom(snap.data());
      });
    });

    return () => {
      alive = false;
      if (unsub) unsub();
    };
  }, [id, router]);

  // Las salas creadas antes de que existiera `stage` solo tienen el booleano.
  const stage = room?.stage || (room?.playing ? STAGES.PLAYING : STAGES.LOBBY);

  useEffect(() => {
    if (stage === STAGES.PLAYING && roomUuid) router.replace(`/host_play/${roomUuid}`);
  }, [stage, roomUuid, router]);

  if (missing) return <Splash title="Esa sala ya no existe" caption="Crea una nueva desde la portada" />;
  if (!room || stage === STAGES.PLAYING) return <Splash />;

  return (
    <HostLobbyScreen
      stage={stage}
      code={id}
      teams={Array.isArray(room.teams) ? room.teams : []}
      config={configOf(room)}
      // Las salas anteriores a la semilla guardada siguen teniendo mundo: se
      // deriva de su código, que también es estable.
      seed={room.world_seed ?? seedFromString(id)}
    />
  );
}

function Splash({ title = 'Pictionario', caption = 'Levantando la isla' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--w-sky)' }}>
      <div className="gp-display text-3xl text-white drop-shadow-[0_3px_0_rgba(27,55,80,0.45)]">{title}</div>
      <div className="gp-caption text-white/90">{caption}</div>
    </div>
  );
}

export default function Page({ params }) {
  const resolvedParams = typeof params?.then === 'function' ? React.use(params) : params;
  return <HostClient id={resolvedParams.id} />;
}
