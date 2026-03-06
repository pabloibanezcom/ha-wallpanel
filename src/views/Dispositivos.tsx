import { ClimateCard } from '../components/ClimateCard';
import { SensorCard } from '../components/SensorCard';
import { useEntity } from '../hooks/useEntity';
import { useHA } from '../context/HAContext';
import { Card } from '../components/Card';

function SwitchCard({ entityId, name }: { entityId: string; name: string }) {
  const entity = useEntity(entityId);
  const { callService } = useHA();
  const isOn = entity?.state === 'on';

  return (
    <Card onClick={() => callService('switch', isOn ? 'turn_off' : 'turn_on', { entity_id: entityId })}>
      <div className="flex items-center justify-between">
        <span className="text-white/95 text-sm font-medium">{name}</span>
        <div className={`w-11 h-6 rounded-full transition-colors relative ${isOn ? 'bg-white/90' : 'bg-white/20'}`}>
          <span className={`absolute top-1 w-4 h-4 rounded-full shadow transition-all ${isOn ? 'left-6 bg-[#0d1b2e]' : 'left-1 bg-white/60'}`} />
        </div>
      </div>
      <p className="text-white/50 text-xs mt-1">{isOn ? 'Encendido' : 'Apagado'}</p>
    </Card>
  );
}

function FanCard() {
  const entity = useEntity('fan.ventilador_estudio');
  const { callService } = useHA();
  const isOn = entity?.state === 'on';
  const speed = entity?.attributes.percentage as number | undefined;

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/95 text-sm font-medium">Ventilador Estudio</span>
        <button
          onClick={() => callService('fan', isOn ? 'turn_off' : 'turn_on', { entity_id: 'fan.ventilador_estudio' })}
          className={`w-11 h-6 rounded-full transition-colors relative ${isOn ? 'bg-white/90' : 'bg-white/20'}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full shadow transition-all ${isOn ? 'left-6 bg-[#0d1b2e]' : 'left-1 bg-white/60'}`} />
        </button>
      </div>
      {isOn && speed != null && (
        <input
          type="range"
          min={0}
          max={100}
          value={speed}
          onChange={(e) =>
            callService('fan', 'set_percentage', {
              entity_id: 'fan.ventilador_estudio',
              percentage: Number(e.target.value),
            })
          }
        />
      )}
      <p className="text-white/50 text-xs mt-1">{isOn ? `${speed ?? 0}%` : 'Apagado'}</p>
    </Card>
  );
}

const BLIND_SCRIPTS = [
  { id: 'script.persiana_dormitorio_a_subir', name: '▲ Subir' },
  { id: 'script.persiana_dormitorio_a_parar', name: '■ Parar' },
  { id: 'script.persiana_dormitorio_a_bajar', name: '▼ Bajar' },
];

export function Dispositivos() {
  const { callService } = useHA();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">Climatización</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <ClimateCard entityId="climate.salon" name="Salón" />
          <ClimateCard entityId="climate.dormitorio_principal" name="Dormitorio" />
          <ClimateCard entityId="climate.cocina" name="Cocina" />
          <ClimateCard entityId="climate.estudio" name="Estudio" />
          <ClimateCard entityId="climate.dormitorio_ninos" name="Niños" />
        </div>
      </div>

      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">Enchufes & Ventilación</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <SwitchCard entityId="switch.enchufe_terraza_enchufe_1" name="Enchufe terraza" />
          <FanCard />
        </div>
      </div>

      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">Electrodomésticos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <SensorCard
            entityId="sensor.lavavajillas_operation_state"
            name="Lavavajillas"
            stateLabels={{ run: 'En marcha', ready: 'Listo', finished: 'Terminado', off: 'Apagado' }}
          />
          <SensorCard
            entityId="binary_sensor.lavavajillas_door"
            name="Puerta lavavajillas"
            stateLabels={{ on: 'Abierta', off: 'Cerrada' }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 px-1">Persiana dormitorio</h2>
        <div className="grid grid-cols-3 gap-3 max-w-xs">
          {BLIND_SCRIPTS.map((s) => (
            <Card
              key={s.id}
              onClick={() => callService('script', 'turn_on', { entity_id: s.id })}
              className="text-center"
            >
              <p className="text-white/95 text-sm font-medium">{s.name}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
