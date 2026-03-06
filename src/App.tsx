import { useState } from 'react';
import { HAProvider, useHA } from './context/HAContext';
import { Nav, type View } from './components/Nav';
import { Inicio } from './views/Inicio';
import { Luces } from './views/Luces';
import { Dispositivos } from './views/Dispositivos';
import { Camaras } from './views/Camaras';

const haUrl = import.meta.env.VITE_HA_URL as string;

function Dashboard() {
  const [view, setView] = useState<View>('inicio');
  const { connected } = useHA();

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

      {/* Dashboard card */}
      <div className="relative z-10 flex-1 rounded-3xl overflow-hidden flex flex-col border border-white/[0.07] shadow-[0_8px_64px_rgba(0,0,0,0.7)]" style={{ background: 'rgba(8,16,30,0.6)', backdropFilter: 'blur(2px)' }}>
        <Nav active={view} onNavigate={setView} />

        {!connected ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/40 text-sm">Conectando a Home Assistant…</p>
          </div>
        ) : (
          <main className="flex-1 overflow-hidden">
            {view === 'inicio' && <Inicio />}
            {view === 'luces' && (
              <div className="p-4 h-full overflow-y-auto">
                <Luces />
              </div>
            )}
            {view === 'dispositivos' && (
              <div className="p-4 h-full overflow-y-auto">
                <Dispositivos />
              </div>
            )}
            {view === 'camaras' && (
              <div className="p-4 h-full overflow-y-auto">
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
