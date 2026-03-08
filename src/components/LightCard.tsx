import { useHA } from '../context/HAContext';
import { useEntity } from '../hooks/useEntity';
import { Card } from './Card';

interface LightCardProps {
  entityId: string;
  name: string;
}

export function LightCard({ entityId, name }: LightCardProps) {
  const entity = useEntity(entityId);
  const { callService } = useHA();

  const isOn = entity?.state === 'on';

  function toggle() {
    callService('light', isOn ? 'turn_off' : 'turn_on', { entity_id: entityId });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/95 text-sm font-medium">{name}</span>
        <button
          onClick={toggle}
          className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${
            isOn ? 'bg-white/90' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full shadow transition-all duration-200 ${
              isOn ? 'left-6 bg-[#0d1b2e]' : 'left-1 bg-white/60'
            }`}
          />
        </button>
      </div>
    </Card>
  );
}
