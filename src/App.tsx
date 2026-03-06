import { useRef, useState } from 'react';
import { HAProvider, useHA } from './context/HAContext';
import { Nav, type View } from './components/Nav';
import { Inicio } from './views/Inicio';
import { Luces } from './views/Luces';
import { Dispositivos } from './views/Dispositivos';
import { Camaras } from './views/Camaras';

const haUrl = import.meta.env.VITE_HA_URL as string;

const VIEWS_ORDER: View[] = ['inicio', 'luces', 'dispositivos', 'camaras'];
const SWIPE_THRESHOLD = 50;

function Dashboard() {
  const [view, setView] = useState<View>('inicio');
  const [swipeDir, setSwipeDir] = useState<'left' | 'right'>('left');
  const { connected } = useHA();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  function navigate(newView: View) {
    const from = VIEWS_ORDER.indexOf(view);
    const to = VIEWS_ORDER.indexOf(newView);
    setSwipeDir(to > from ? 'right' : 'left');
    setView(newView);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Ignore if more vertical than horizontal
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    const idx = VIEWS_ORDER.indexOf(view);
    if (dx < 0 && idx < VIEWS_ORDER.length - 1) {
      navigator.vibrate?.(8);
      navigate(VIEWS_ORDER[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      navigator.vibrate?.(8);
      navigate(VIEWS_ORDER[idx - 1]);
    }
  }

  const animClass = swipeDir === 'right' ? 'view-enter-right' : 'view-enter-left';

  return (
    <div
      className="h-screen w-screen flex items-stretch p-3"
      style={{
        background: '#080f1a',
        backgroundImage: `url(${haUrl}/local/casa.jpeg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Outer dark overlay */}
      <div className="absolute inset-0 bg-[rgba(4,10,20,0.55)]" />

      {/* Layout */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden rounded-3xl">
        <Nav active={view} onNavigate={navigate} />

        {!connected ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/40 text-sm">Conectando a Home Assistant…</p>
          </div>
        ) : (
          <main
            className="flex-1 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {view === 'inicio' && <Inicio key="inicio" className={animClass} />}
            {view === 'luces' && (
              <div key="luces" className={`p-4 h-full overflow-y-auto ${animClass}`}>
                <Luces />
              </div>
            )}
            {view === 'dispositivos' && (
              <div key="dispositivos" className={`p-4 h-full overflow-y-auto ${animClass}`}>
                <Dispositivos />
              </div>
            )}
            {view === 'camaras' && (
              <div key="camaras" className={`p-4 h-full overflow-y-auto ${animClass}`}>
                <Camaras />
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HAProvider>
      <Dashboard />
    </HAProvider>
  );
}
