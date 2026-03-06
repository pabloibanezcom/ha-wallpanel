import { useEntity } from '../hooks/useEntity';
import { Card } from './Card';

interface SensorCardProps {
  entityId: string;
  name: string;
  unit?: string;
  stateLabels?: Record<string, string>;
}

export function SensorCard({ entityId, name, unit, stateLabels }: SensorCardProps) {
  const entity = useEntity(entityId);
  const rawState = entity?.state ?? '—';
  const displayState = stateLabels?.[rawState] ?? rawState;
  const displayUnit = unit ?? (entity?.attributes.unit_of_measurement as string | undefined) ?? '';

  return (
    <Card>
      <p className="text-white/50 text-xs mb-1">{name}</p>
      <p className="text-white/95 text-2xl font-light">
        {displayState}
        {displayUnit && <span className="text-sm text-white/50 ml-1">{displayUnit}</span>}
      </p>
    </Card>
  );
}
