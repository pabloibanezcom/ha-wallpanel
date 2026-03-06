export type View = 'inicio' | 'luces' | 'dispositivos' | 'camaras';

const VIEWS: { id: View; label: string }[] = [
  { id: 'inicio', label: 'Dashboard' },
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
    <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] flex-shrink-0">
      <div className="min-w-[160px]" />

      {/* Center tabs */}
      <div className="flex items-center gap-0.5 bg-white/[0.07] border border-white/[0.09] rounded-full p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => onNavigate(v.id)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              active === v.id
                ? 'bg-white text-[#0d1b2e] font-semibold shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="min-w-[160px]" />
    </div>
  );
}
