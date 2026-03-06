import type { ReactNode } from 'react';
import { useEntity } from '../hooks/useEntity';
import { useHA } from '../context/HAContext';

const haUrl = import.meta.env.VITE_HA_URL as string;

// ── Shared primitives ─────────────────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 border border-white/[0.08] ${className}`}
      style={{ background: 'rgba(10, 20, 38, 0.82)', backdropFilter: 'blur(16px)' }}
    >
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle?: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
        on ? 'bg-emerald-400' : 'bg-white/20'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
          on ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function ExpandIcon() {
  return (
    <button className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
      </svg>
    </button>
  );
}

function MoreIcon() {
  return (
    <button className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
      </svg>
    </button>
  );
}

// ── Widgets ───────────────────────────────────────────────────────────────────

function EnergyCard() {
  const weather = useEntity('weather.aemet');
  // Use humidity as a proxy for "energy load" if no dedicated sensor
  const humidity = weather?.attributes.humidity as number | undefined;
  const value = humidity ?? 62;
  const label = value > 66 ? 'High' : value > 33 ? 'Medium' : 'Low';

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/80 text-sm font-medium">Energy Usage</span>
        <ExpandIcon />
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-emerald-400 text-sm font-semibold">
          {value}% {label}
        </span>
      </div>
      {/* Progress bar */}
      <div className="relative h-2 bg-white/[0.08] rounded-full mb-1">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex justify-between text-white/25 text-[10px] mb-4">
        <span>0%</span>
        <span>100%</span>
      </div>
      {/* Wi-Fi row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <span className="text-white/50 text-xs">Wi-Fi</span>
        </div>
        <Toggle on={true} />
      </div>
    </GlassCard>
  );
}

function LivingRoomCard() {
  const entity = useEntity('climate.salon');
  const { callService } = useHA();
  const currentTemp = (entity?.attributes.current_temperature as number | undefined) ?? 23;
  const targetTemp = (entity?.attributes.temperature as number | undefined) ?? 23;
  const isOn = entity?.state !== 'off';

  function togglePower() {
    callService('climate', 'set_hvac_mode', {
      entity_id: 'climate.salon',
      hvac_mode: isOn ? 'off' : 'heat_cool',
    });
  }

  function setTemp(t: number) {
    callService('climate', 'set_temperature', {
      entity_id: 'climate.salon',
      temperature: t,
    });
  }

  const tempOptions = [targetTemp - 1, targetTemp, targetTemp + 1, targetTemp + 2];

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/80 text-sm font-medium">Living room</span>
        <div className="flex items-center gap-2">
          <Toggle on={isOn} onToggle={togglePower} />
          <MoreIcon />
        </div>
      </div>

      <div className="mb-1">
        <span className="text-white font-bold leading-none" style={{ fontSize: '3.25rem' }}>
          {currentTemp}°
        </span>
      </div>
      <p className="text-white/35 text-xs mb-1">Current temperature</p>
      <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        <span>Salón</span>
      </div>

      {/* Temperature selector pills */}
      <div className="flex gap-1.5">
        {tempOptions.map((t) => (
          <button
            key={t}
            onClick={() => setTemp(t)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
              t === targetTemp
                ? 'bg-white text-[#0d1b2e] font-semibold'
                : 'bg-white/[0.08] text-white/45 hover:bg-white/[0.13]'
            }`}
          >
            {t}°
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

function DialGauge({ value }: { value: number }) {
  const ticks = 24;
  const startDeg = 135;
  const totalDeg = 270;
  const cx = 52, cy = 52, rOuter = 40, rInner = 30;
  const activeTicks = Math.round((value / 100) * ticks);

  return (
    <svg width="104" height="72" viewBox="0 0 104 72">
      {Array.from({ length: ticks }, (_, i) => {
        const deg = startDeg + (i / (ticks - 1)) * totalDeg;
        const rad = (deg - 90) * (Math.PI / 180);
        const x1 = cx + rInner * Math.cos(rad);
        const y1 = cy + rInner * Math.sin(rad);
        const x2 = cx + rOuter * Math.cos(rad);
        const y2 = cy + rOuter * Math.sin(rad);
        const active = i < activeTicks;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={active ? '#4ade80' : 'rgba(255,255,255,0.1)'}
            strokeWidth={active ? '2.5' : '2'}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function LightingCard() {
  const entity = useEntity('light.salon');
  const { callService } = useHA();
  const isOn = entity?.state === 'on';
  const brightness = (entity?.attributes.brightness as number | undefined) ?? 0;
  const pct = isOn ? Math.round((brightness / 255) * 100) : 0;
  const label = pct > 66 ? 'High' : pct > 33 ? 'Medium' : 'Low';

  function toggle() {
    callService('light', isOn ? 'turn_off' : 'turn_on', { entity_id: 'light.salon' });
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/80 text-sm font-medium">Lighting Brightness</span>
        <div className="flex items-center gap-2">
          <Toggle on={isOn} onToggle={toggle} />
          <ExpandIcon />
        </div>
      </div>
      <p className="text-emerald-400 text-sm font-semibold mb-2">
        {pct}% {label}
      </p>
      <div className="flex justify-center">
        <DialGauge value={pct} />
      </div>
    </GlassCard>
  );
}

function KitchenCard() {
  const entity = useEntity('light.cocina');
  const { callService } = useHA();
  const isOn = entity?.state === 'on';

  function toggle() {
    callService('light', isOn ? 'turn_off' : 'turn_on', { entity_id: 'light.cocina' });
  }

  return (
    <GlassCard className="flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-white/80 text-sm font-medium">Kitchen</span>
        <div className="flex items-center gap-2">
          <Toggle on={isOn} onToggle={toggle} />
          <MoreIcon />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isOn ? 'bg-amber-400/20' : 'bg-white/[0.06]'
          }`}
        >
          <svg
            className={`w-5 h-5 transition-colors ${isOn ? 'text-amber-400' : 'text-white/25'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2a5 5 0 015 5c0 1.8-.96 3.37-2.4 4.25V14H9.4v-2.75A5 5 0 0112 2zm-2 13h4v1h-4v-1zm0 2h4v1a2 2 0 01-4 0v-1z" />
          </svg>
        </div>
        <div>
          <p className="text-white/70 text-sm font-medium">{isOn ? 'Encendida' : 'Apagada'}</p>
          <p className="text-white/30 text-xs">Cocina</p>
        </div>
      </div>
    </GlassCard>
  );
}

function SolarAreaChart() {
  // Decorative static chart — replace with real sensor data if available
  const data = [3.2, 5.8, 4.1, 7.3, 9.6, 10.8, 12.4];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const w = 100, h = 44, pad = 2;
  const max = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - 2 * pad),
    y: h - pad - (v / max) * (h - 2 * pad),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${h} L ${pts[0].x.toFixed(1)} ${h} Z`;

  return (
    <div>
      <div className="relative">
        <svg width="100%" height="60" viewBox={`0 0 100 ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#solarGrad)" />
          <path d={line} fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Endpoint dot + tooltip */}
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2" fill="#f97316" />
        </svg>
        {/* Tooltip */}
        <div className="absolute top-0 right-0 bg-orange-400/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">
          12.4 kWh
        </div>
      </div>
      <div className="flex justify-between text-white/25 text-[10px] mt-1 px-0.5">
        {days.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function SolarCard() {
  return (
    <GlassCard>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white/80 text-sm font-medium">Solar Charge Collected Today</p>
          <p className="text-orange-400 text-xs font-medium mt-0.5">12.4 kWh of clean energy</p>
        </div>
        <ExpandIcon />
      </div>
      <SolarAreaChart />
    </GlassCard>
  );
}

// ── Left panel sidebar ────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  {
    label: 'home',
    path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    active: true,
  },
  {
    label: 'camera',
    path: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    active: false,
  },
  {
    label: 'temp',
    path: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    active: false,
  },
  {
    label: 'shield',
    path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    active: false,
  },
  {
    label: 'grid',
    path: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    active: false,
  },
];

// ── Main layout ───────────────────────────────────────────────────────────────

function useGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'Buenos días';
  if (hour >= 14 && hour < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

export function Inicio() {
  const greeting = useGreeting();
  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Left panel: hero ─────────────────────────────────────── */}
      <div className="relative flex w-[42%] flex-shrink-0">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${haUrl}/local/casa.jpeg)` }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(4,10,22,0.65)] via-[rgba(4,10,22,0.35)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,10,22,0.6)] via-transparent to-transparent" />

        {/* Sidebar icons */}
        <div className="relative z-10 flex flex-col items-center gap-2.5 p-3 pt-5">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                item.active
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-black/20 text-white/40 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.path} />
              </svg>
            </button>
          ))}
        </div>

        {/* Main hero text + bottom bar */}
        <div className="relative z-10 flex flex-1 flex-col p-4 pt-6 min-w-0">
          <div className="flex-1">
            <h1 className="text-white text-3xl font-bold leading-tight drop-shadow-md">
              {greeting}
            </h1>
            <p className="text-white/75 text-sm mt-1 drop-shadow">
              Bienvenido a tu casa
            </p>
          </div>

          {/* Smart Hub bottom bar */}
          <div
            className="rounded-2xl p-3 border border-white/[0.1]"
            style={{ background: 'rgba(6,14,28,0.78)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-xs font-semibold truncate">Smart Family Hub</p>
                <p className="text-white/35 text-[10px] truncate">Control your home with the whole family</p>
              </div>
              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {[
                  <path key="s" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />,
                  null, // plus
                  null, // minus
                  <path key="x" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
                ].map((icon, i) => (
                  <button
                    key={i}
                    className="w-6 h-6 rounded-full bg-white/10 text-white/55 flex items-center justify-center hover:bg-white/20 transition-colors text-sm leading-none"
                  >
                    {i === 1 ? '+' : i === 2 ? '−' : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              {/* Avatar stack */}
              <div className="flex -space-x-2 flex-shrink-0 ml-1">
                {[
                  'bg-orange-400',
                  'bg-sky-400',
                  'bg-emerald-400',
                ].map((color, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white ${color}`}
                    style={{ borderColor: 'rgba(6,14,28,0.78)' }}
                  >
                    {['A', 'B', 'C'][i]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: widgets ──────────────────────────────────── */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 h-full" style={{ gridTemplateRows: 'auto auto 1fr' }}>
          <EnergyCard />
          <LivingRoomCard />
          <LightingCard />
          <KitchenCard />
          <div className="col-span-2">
            <SolarCard />
          </div>
        </div>
      </div>
    </div>
  );
}
