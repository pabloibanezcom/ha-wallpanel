import { SensorCard } from '../components/SensorCard';
import { useEntity } from '../hooks/useEntity';
import { useHA } from '../context/HAContext';
import { Card } from '../components/Card';

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

export function Camaras() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">
          Habitación Andrés
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <SensorCard
            entityId="binary_sensor.camara_andres_person_detection"
            name="Detección personas"
            stateLabels={{ on: '🔴 Detectado', off: '✅ Sin actividad' }}
          />
          <SensorCard
            entityId="binary_sensor.camara_andres_motion_alarm"
            name="Alarma movimiento"
            stateLabels={{ on: '🔴 Activada', off: '✅ Sin movimiento' }}
          />
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
