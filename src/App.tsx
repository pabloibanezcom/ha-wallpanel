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
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${haUrl}/local/casa.jpeg)` }}
      />
      <div className="absolute inset-0 bg-[rgba(5,12,24,0.72)]" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        <Nav active={view} onNavigate={setView} />

        {!connected && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/40 text-sm">Conectando a Home Assistant…</p>
          </div>
        )}

        {connected && (
          <main className="flex-1 overflow-y-auto px-4 pb-4">
            {view === 'inicio' && <Inicio />}
            {view === 'luces' && <Luces />}
            {view === 'dispositivos' && <Dispositivos />}
            {view === 'camaras' && <Camaras />}
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
