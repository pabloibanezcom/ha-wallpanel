import type { HassEntity } from 'home-assistant-js-websocket';
import { useHA } from '../context/HAContext';

export function useEntity(entityId: string): HassEntity | undefined {
  const { entities } = useHA();
  return entities[entityId];
}
