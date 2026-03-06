type View = 'inicio' | 'luces' | 'dispositivos' | 'camaras';

const VIEWS: { id: View; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'luces', label: 'Luces' },
  { id: 'dispositivos', label: 'Dispositivos' },
  { id: 'camaras', label: 'Cámaras' },
];

interface NavProps {
  active: View;
  onNavigate: (view: View) => void;
}

export function Nav({ active, onNavigate }: NavProps) {
  return (
    <div className="flex justify-center pt-6 pb-2 px-4">
      <div className="flex items-center gap-1 bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-full p-1">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => onNavigate(view.id)}
            className={`px-5 py-2 rounded-full text-sm transition-all duration-200 ${
              active === view.id
                ? 'bg-white/95 text-[#0d1b2e] font-semibold shadow-sm'
                : 'text-white/50 hover:text-white/80 font-medium'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { View };
