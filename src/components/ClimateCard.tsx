import { useHA } from '../context/HAContext';
import { useEntity } from '../hooks/useEntity';
import { Card } from './Card';

interface ClimateCardProps {
  entityId: string;
  name: string;
}

export function ClimateCard({ entityId, name }: ClimateCardProps) {
  const entity = useEntity(entityId);
  const { callService } = useHA();

  const currentTemp = entity?.attributes.current_temperature as number | undefined;
  const targetTemp = entity?.attributes.temperature as number | undefined;
  const hvacMode = entity?.state;
  const isOff = hvacMode === 'off';

  function adjustTemp(delta: number) {
    if (!targetTemp) return;
    callService('climate', 'set_temperature', {
      entity_id: entityId,
      temperature: targetTemp + delta,
    });
  }

  function togglePower() {
    callService('climate', isOff ? 'set_hvac_mode' : 'set_hvac_mode', {
      entity_id: entityId,
      hvac_mode: isOff ? 'heat_cool' : 'off',
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/95 text-sm font-medium">{name}</span>
        <button
          onClick={togglePower}
          className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${
            !isOff ? 'bg-white/90' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full shadow transition-all duration-200 ${
              !isOff ? 'left-6 bg-[#0d1b2e]' : 'left-1 bg-white/60'
            }`}
          />
        </button>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-white/40 text-xs">Actual</p>
          <p className="text-white/95 text-2xl font-light">
            {currentTemp != null ? `${currentTemp}°` : '—'}
          </p>
        </div>
        {!isOff && targetTemp != null && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustTemp(-0.5)}
              className="w-7 h-7 rounded-full bg-white/10 text-white/70 text-lg flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              −
            </button>
            <span className="text-white/70 text-sm w-10 text-center">{targetTemp}°</span>
            <button
              onClick={() => adjustTemp(0.5)}
              className="w-7 h-7 rounded-full bg-white/10 text-white/70 text-lg flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              +
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
