import { ClimateCard } from '../components/ClimateCard';
import { LightCard } from '../components/LightCard';
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

function WeatherCard() {
  const entity = useEntity('weather.aemet');
  const temp = entity?.attributes.temperature as number | undefined;
  const state = entity?.state ?? '—';

  const labels: Record<string, string> = {
    sunny: '☀️ Soleado', 'partlycloudy': '⛅ Parcial', cloudy: '☁️ Nublado',
    rainy: '🌧️ Lluvia', snowy: '❄️ Nieve', windy: '💨 Ventoso', fog: '🌫️ Niebla',
    lightning: '⛈️ Tormenta', clear: '🌙 Despejado',
  };

  return (
    <Card className="col-span-2">
      <p className="text-white/50 text-xs mb-1">Tiempo exterior</p>
      <p className="text-white/95 text-3xl font-light mb-1">
        {temp != null ? `${temp}°C` : '—'}
      </p>
      <p className="text-white/60 text-sm">{labels[state] ?? state}</p>
    </Card>
  );
}

const ROOM_LIGHTS = [
  { id: 'light.salon', name: 'Salón' },
  { id: 'light.cocina', name: 'Cocina' },
  { id: 'light.dormitorio_entrada_a', name: 'Dormitorio' },
  { id: 'light.estudio', name: 'Estudio' },
  { id: 'light.habitacion_andres', name: 'Niños' },
  { id: 'light.exterior_salon', name: 'Exterior' },
];

export function Inicio() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <WeatherCard />
        <LockCard />
        <SensorCard
          entityId="binary_sensor.contact_sensor_puerta"
          name="Sensor puerta"
          stateLabels={{ on: 'Abierta', off: 'Cerrada' }}
        />
        <SensorCard
          entityId="binary_sensor.hue_outdoor_motion_sensor_1_movimiento"
          name="Movimiento garaje"
          stateLabels={{ on: 'Detectado', off: 'Sin movimiento' }}
        />
      </div>

      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">Clima</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ClimateCard entityId="climate.salon" name="Salón" />
          <ClimateCard entityId="climate.dormitorio_principal" name="Dormitorio" />
        </div>
      </div>

      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">Luces</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ROOM_LIGHTS.map((light) => (
            <LightCard key={light.id} entityId={light.id} name={light.name} />
          ))}
        </div>
      </div>
    </div>
  );
}
