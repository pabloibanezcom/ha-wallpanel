import { SensorCard } from '../components/SensorCard';
import { useEntity } from '../hooks/useEntity';
import { useHA } from '../context/HAContext';
import { Card } from '../components/Card';
import { useEffect, useRef, useState } from 'react';
import { getHaUrl } from '../config/ha';

const haUrl = getHaUrl();

function CameraFeed({ entityId, name }: { entityId: string; name: string }) {
  const { connection } = useHA();
  const entity = useEntity(entityId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [webrtcFailed, setWebrtcFailed] = useState(false);
  const token = entity?.attributes.access_token as string | undefined;

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.ontrack = (e) => {
      if (videoRef.current && e.streams[0]) videoRef.current.srcObject = e.streams[0];
    };

    async function negotiate() {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering (max 3 s)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve();
        const done = () => { if (pc.iceGatheringState === 'complete') resolve(); };
        pc.addEventListener('icegatheringstatechange', done);
        setTimeout(resolve, 3000);
      });

      if (cancelled) return;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (connection as any).sendMessagePromise({
          type: 'camera/webrtc',
          entity_id: entityId,
          offer: pc.localDescription!.sdp,
        });
        if (cancelled) return;
        await pc.setRemoteDescription({ type: 'answer', sdp: result.answer });
      } catch {
        if (!cancelled) setWebrtcFailed(true);
      }
    }

    negotiate();

    return () => {
      cancelled = true;
      pc.close();
      pcRef.current = null;
    };
  }, [connection, entityId]);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/[0.08] relative"
      style={{ background: 'rgba(10, 20, 38, 0.82)', aspectRatio: '16/9' }}
    >
      {webrtcFailed && token ? (
        <img
          src={`${haUrl}/api/camera_proxy_stream/${entityId}?token=${token}`}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}
      {!webrtcFailed && !videoRef.current?.srcObject && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/30 text-sm">Conectando…</p>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: 'linear-gradient(to top, rgba(4,10,20,0.8), transparent)' }}>
        <p className="text-white/80 text-xs font-medium">{name}</p>
      </div>
    </div>
  );
}

function LockCard() {
  const entity = useEntity('lock.casa');
  const { callService } = useHA();
  const isLocked = entity?.state === 'locked';

  return (
    <Card onClick={() => callService('lock', isLocked ? 'unlock' : 'lock', { entity_id: 'lock.casa' })}>
      <p className="text-white/50 text-xs mb-1">Puerta entrada</p>
      <p className={`text-lg font-medium ${isLocked ? 'text-white/95' : 'text-amber-400'}`}>
        {isLocked ? '🔒 Cerrada' : '🔓 Abierta'}
      </p>
    </Card>
  );
}

export function Cameras() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">
          Habitación Andrés
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <CameraFeed entityId="camera.camara_andres_hd_stream" name="Andrés · HD" />
        </div>
      </div>

      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">
          Seguridad
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <LockCard />
          <SensorCard
            entityId="binary_sensor.contact_sensor_puerta"
            name="Sensor puerta"
            stateLabels={{ on: '🔴 Abierta', off: '✅ Cerrada' }}
          />
          <SensorCard
            entityId="binary_sensor.hue_outdoor_motion_sensor_1_movimiento"
            name="Movimiento garaje"
            stateLabels={{ on: '🔴 Detectado', off: '✅ Sin movimiento' }}
          />
          <SensorCard
            entityId="sensor.hue_outdoor_motion_sensor_1_temperatura"
            name="Temp. exterior"
          />
        </div>
      </div>
    </div>
  );
}
