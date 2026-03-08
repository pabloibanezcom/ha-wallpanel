function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getHaUrl(): string {
  const envHaUrl = (import.meta.env.VITE_HA_URL as string | undefined)?.trim();
  if (envHaUrl) return trimTrailingSlashes(envHaUrl);

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlashes(window.location.origin);
  }

  return 'http://homeassistant.local:8123';
}

export function getHaToken(): string | null {
  const token = (import.meta.env.VITE_HA_TOKEN as string | undefined)?.trim();
  return token || null;
}
