import { useLayoutEffect, useRef, useState } from 'react';

export type View = 'inicio' | 'luces' | 'dispositivos' | 'camaras' | 'musica';

const VIEWS: { id: View; label: string }[] = [
  { id: 'inicio', label: 'Dashboard' },
  { id: 'luces', label: 'Luces' },
  { id: 'dispositivos', label: 'Dispositivos' },
  { id: 'camaras', label: 'Cámaras' },
  { id: 'musica', label: 'Música' },
];

interface NavProps {
  active: View;
  onNavigate: (view: View) => void;
}

export function Nav({ active, onNavigate }: NavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const activeIndex = VIEWS.findIndex((v) => v.id === active);
    const tab = tabRefs.current[activeIndex];
    const container = containerRef.current;
    if (!tab || !container) return;

    const cRect = container.getBoundingClientRect();
    const tRect = tab.getBoundingClientRect();
    setPill({ left: tRect.left - cRect.left, width: tRect.width });
    setReady(true);
  }, [active]);

  return (
    <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
      <div className="min-w-[160px]" />

      {/* Liquid glass pill nav */}
      <div
        ref={containerRef}
        className="relative flex items-center p-1 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Sliding glass indicator */}
        {ready && (
          <span
            className="absolute top-1 bottom-1 rounded-full pointer-events-none"
            style={{
              left: pill.left,
              width: pill.width,
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 1px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(255,255,255,0.4)',
              transition: 'left 0.38s cubic-bezier(0.34,1.56,0.64,1), width 0.38s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        )}

        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            onClick={() => onNavigate(v.id)}
            className="relative z-10 px-5 py-1.5 rounded-full text-sm font-medium select-none"
            style={{
              color: active === v.id ? '#0d1b2e' : 'rgba(255,255,255,0.5)',
              fontWeight: active === v.id ? 600 : 500,
              transition: 'color 0.25s ease',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="min-w-[160px]" />
    </div>
  );
}
