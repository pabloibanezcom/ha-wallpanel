import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { callService as haCallService } from 'home-assistant-js-websocket';
import { useEntity } from '../hooks/useEntity';
import { useHA } from '../context/HAContext';

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14l-2 6 6-2M3.5 19.5l7-7M20 10l2-6-6 2M20.5 4.5l-7 7" />
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

// ── Weather widget ─────────────────────────────────────────────────────────────

type ForecastDay = {
  datetime: string;
  condition: string;
  temperature: number;
  templow?: number;
};

const CONDITION_ES: Record<string, string> = {
  sunny: 'Despejado', clear: 'Despejado', 'clear-night': 'Despejado',
  partlycloudy: 'Parcialmente nublado', cloudy: 'Nublado',
  rainy: 'Lluvia', pouring: 'Lluvia intensa',
  snowy: 'Nieve', 'snowy-rainy': 'Nieve y lluvia',
  windy: 'Ventoso', 'windy-variant': 'Ventoso',
  fog: 'Niebla', hail: 'Granizo',
  lightning: 'Tormenta', 'lightning-rainy': 'Tormenta',
  exceptional: 'Excepcional',
};

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function WeatherIcon({ condition, className = 'w-12 h-12' }: { condition: string; className?: string }) {
  const c = condition?.toLowerCase() ?? '';

  if (c === 'sunny' || c === 'clear' || c === 'clear-night') {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="6" fill="#fbbf24" />
        {[0,45,90,135,180,225,270,315].map(deg => {
          const r = Math.PI * deg / 180;
          return <line key={deg} x1={16 + 9*Math.cos(r)} y1={16 + 9*Math.sin(r)} x2={16 + 13*Math.cos(r)} y2={16 + 13*Math.sin(r)} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />;
        })}
      </svg>
    );
  }

  if (c === 'partlycloudy') {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <circle cx="13" cy="13" r="5" fill="#fbbf24" />
        {[315,0,45].map(deg => {
          const r = Math.PI * deg / 180;
          return <line key={deg} x1={13 + 7*Math.cos(r)} y1={13 + 7*Math.sin(r)} x2={13 + 10*Math.cos(r)} y2={13 + 10*Math.sin(r)} stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />;
        })}
        <path d="M10 22c-3.3 0-6-2.7-6-6 0-3 2.2-5.4 5-5.9A6 6 0 0120 16c0 3.3-2.7 6-6 6H10z" fill="rgba(180,200,230,0.9)" />
      </svg>
    );
  }

  if (c === 'cloudy') {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M8 24c-3.9 0-7-3.1-7-7s3.1-7 7-7c.7 0 1.3.1 1.9.3A7 7 0 0124 16c0 4.4-3.6 8-8 8H8z" fill="rgba(180,200,230,0.85)" />
      </svg>
    );
  }

  if (c === 'rainy' || c === 'pouring') {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M7 20c-3.3 0-6-2.7-6-6 0-3 2.2-5.5 5-5.9A6 6 0 0119 13c0 3.3-2.7 6-6 6H7z" fill="rgba(160,185,220,0.85)" />
        {[[9,23,10,27],[14,23,15,27],[19,23,20,27]].map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
        ))}
      </svg>
    );
  }

  if (c === 'snowy' || c === 'snowy-rainy') {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M7 19c-3.3 0-6-2.7-6-6 0-3 2.2-5.5 5-5.9A6 6 0 0119 12c0 3.3-2.7 6-6 6H7z" fill="rgba(180,200,230,0.8)" />
        {[[9,23,10,26],[14,23,15,26],[19,23,20,26]].map(([x1,y1,x2,y2],i) => (
          <circle key={i} cx={(x1+x2)/2} cy={(y1+y2)/2} r="1.2" fill="white" />
        ))}
      </svg>
    );
  }

  if (c === 'fog') {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        {[10,16,22].map((y,i) => (
          <line key={i} x1={i===1?4:6} y1={y} x2={i===1?28:26} y2={y} stroke="rgba(180,200,230,0.7)" strokeWidth="2.5" strokeLinecap="round" />
        ))}
      </svg>
    );
  }

  if (c.includes('lightning')) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <path d="M6 18c-3 0-5.5-2.5-5.5-5.5S3 7 6 6.5A5.5 5.5 0 0117 12c0 3.3-2.7 6-6 6H6z" fill="rgba(160,185,220,0.85)" />
        <path d="M15 16l-3 7 2-1-2 6 5-8-2.5.5z" fill="#fbbf24" />
      </svg>
    );
  }

  // windy / default
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      {([[4,11,20],[4,16,24],[4,21,18]] as [number,number,number][]).map(([x1,y1,x2],i) => (
        <path key={i} d={`M${x1} ${y1} Q${(x1+x2)/2} ${y1-3} ${x2} ${y1}`} stroke="rgba(180,200,230,0.8)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      ))}
    </svg>
  );
}

function WeatherCard() {
  const entity = useEntity('weather.aemet');
  const { connection } = useHA();
  const [forecast, setForecast] = useState<ForecastDay[]>([]);

  const temp = entity?.attributes.temperature as number | undefined;
  const humidity = entity?.attributes.humidity as number | undefined;
  const windSpeed = entity?.attributes.wind_speed as number | undefined;
  const condition = entity?.state ?? 'cloudy';
  const conditionLabel = CONDITION_ES[condition] ?? condition;

  useEffect(() => {
    if (!connection) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (haCallService as any)(connection, 'weather', 'get_forecasts',
      { entity_id: 'weather.aemet', type: 'daily' },
      undefined, true,
    ).then((result: { response?: Record<string, { forecast?: ForecastDay[] }> }) => {
      if (!cancelled) {
        setForecast(result.response?.['weather.aemet']?.forecast?.slice(0, 5) ?? []);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [connection]);

  return (
    <GlassCard>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white/60 text-xs font-medium mb-1">Tiempo exterior</p>
          <div className="flex items-end gap-3">
            <span className="text-white font-bold leading-none" style={{ fontSize: '3.25rem' }}>
              {temp != null ? `${temp}°` : '—'}
            </span>
            <WeatherIcon condition={condition} className="w-12 h-12 mb-1" />
          </div>
          <p className="text-white/50 text-sm mt-1">{conditionLabel}</p>
        </div>
        <ExpandIcon />
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <span className="text-white/50 text-xs">{humidity != null ? `${humidity}%` : '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="text-white/50 text-xs">{windSpeed != null ? `${windSpeed} km/h` : '—'}</span>
        </div>
      </div>

      {/* 5-day forecast */}
      {forecast.length > 0 && (
        <div className="flex justify-between gap-1">
          {forecast.map((day) => {
            const date = new Date(day.datetime);
            const dayLabel = DAYS_ES[date.getDay()];
            return (
              <div key={day.datetime} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-white/35 text-[10px]">{dayLabel}</span>
                <WeatherIcon condition={day.condition} className="w-5 h-5" />
                <span className="text-white/70 text-[11px] font-medium">{day.temperature}°</span>
                {day.templow != null && (
                  <span className="text-white/30 text-[10px]">{day.templow}°</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

// ── Calendar widget ────────────────────────────────────────────────────────────

type CalendarEvent = {
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_FULL_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function todayAt(h: number, m = 0): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const MOCK_EVENTS: CalendarEvent[] = [
  { summary: 'Revisión caldera', start: { dateTime: todayAt(9, 0) }, end: { dateTime: todayAt(10, 0) } },
  { summary: 'Almuerzo familiar', start: { dateTime: todayAt(14, 0) }, end: { dateTime: todayAt(15, 30) } },
  { summary: 'Recogida colegio', start: { dateTime: todayAt(17, 0) }, end: { dateTime: todayAt(17, 30) } },
];

function useCalendarEvents() {
  const { entities, connection } = useHA();
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);

  const calendarIds = Object.keys(entities).filter((id) => id.startsWith('calendar.'));

  useEffect(() => {
    if (!connection || calendarIds.length === 0) return;
    let cancelled = false;

    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (haCallService as any)(
      connection, 'calendar', 'get_events',
      { entity_id: calendarIds, start_date_time: now.toISOString(), end_date_time: end.toISOString() },
      undefined, true,
    ).then((result: { response?: Record<string, { events?: CalendarEvent[] }> }) => {
      if (!cancelled) {
        const all: CalendarEvent[] = [];
        for (const id of calendarIds) {
          all.push(...(result.response?.[id]?.events ?? []));
        }
        all.sort((a, b) => {
          const ta = new Date(a.start.dateTime ?? a.start.date ?? '').getTime();
          const tb = new Date(b.start.dateTime ?? b.start.date ?? '').getTime();
          return ta - tb;
        });
        if (all.length > 0) setEvents(all);
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, calendarIds.join(',')]);

  return events;
}

function formatEventTime(event: CalendarEvent): string {
  if (event.start.date && !event.start.dateTime) return 'Todo el día';
  if (!event.start.dateTime) return '';
  const d = new Date(event.start.dateTime);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function CalendarCard() {
  const events = useCalendarEvents();
  const now = new Date();
  const dayName = DAYS_FULL_ES[now.getDay()];
  const day = now.getDate();
  const month = MONTHS_ES[now.getMonth()];
  const year = now.getFullYear();

  // Week dots (Mon–Sun)
  const weekDays = ['L','M','X','J','V','S','D'];
  const todayDow = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon

  return (
    <GlassCard className="flex flex-col">
      {/* Top: date + week row */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-0.5">{dayName}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-white font-bold leading-none" style={{ fontSize: '2.75rem' }}>{day}</p>
            <p className="text-white/50 text-sm">{month} {year}</p>
          </div>
        </div>
        <div className="flex gap-1 mb-1">
          {weekDays.map((d, i) => (
            <div
              key={d}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                i === todayDow ? 'bg-white text-[#0d1b2e] font-semibold' : 'text-white/30'
              }`}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.07] mb-3" />

      {/* Events list */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Agenda de hoy</p>
        <ExpandIcon />
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-3">
          <svg className="w-7 h-7 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-white/25 text-xs">No hay eventos programados</p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto">
          {events.map((ev, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: ['#38bdf8','#a78bfa','#34d399'][i % 3] }} />
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-xs font-medium truncate">{ev.summary}</p>
              </div>
              <span className="text-white/35 text-[10px] font-mono flex-shrink-0">{formatEventTime(ev)}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// ── Widgets ───────────────────────────────────────────────────────────────────

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
      <p className="text-white/35 text-xs mb-1">Temperatura actual</p>
      <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        <span>Salón</span>
      </div>

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

// ── Vertical sidebar nav ──────────────────────────────────────────────────────

function SideNav() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pill, setPill] = useState({ top: 0, height: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const item = itemRefs.current[activeIndex];
    const container = containerRef.current;
    if (!item || !container) return;
    const cRect = container.getBoundingClientRect();
    const iRect = item.getBoundingClientRect();
    setPill({ top: iRect.top - cRect.top, height: iRect.height });
    setReady(true);
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center p-1 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {ready && (
        <span
          className="absolute left-1 right-1 rounded-full pointer-events-none"
          style={{
            top: pill.top,
            height: pill.height,
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(255,255,255,0.4)',
            transition: 'top 0.38s cubic-bezier(0.34,1.56,0.64,1), height 0.38s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      )}
      {SIDEBAR_ITEMS.map((item, i) => (
        <button
          key={item.label}
          ref={(el) => { itemRefs.current[i] = el; }}
          onClick={() => setActiveIndex(i)}
          className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center select-none"
          style={{
            color: i === activeIndex ? '#0d1b2e' : 'rgba(255,255,255,0.45)',
            transition: 'color 0.25s ease',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.path} />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

function useGreeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'Buenos días';
  if (hour >= 14 && hour < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

export function Inicio({ className = '' }: { className?: string }) {
  const greeting = useGreeting();
  return (
    <div className={`h-full flex overflow-hidden ${className}`}>
      {/* ── Left panel: hero ─────────────────────────────────────── */}
      <div className="relative flex w-[42%] flex-shrink-0">

        {/* Sidebar icons */}
        <div className="relative z-10 flex flex-col items-center p-3 pt-5">
          <SideNav />
        </div>

        {/* Main hero text + bottom bar */}
        <div className="relative z-10 flex flex-1 flex-col p-4 pt-6 min-w-0">
          <div className="flex-1">
            <h1 className="text-white text-4xl font-bold leading-tight drop-shadow-md">
              {greeting}
            </h1>
            <p className="text-white/75 text-base mt-1 drop-shadow">
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
              <div className="flex items-center gap-1 flex-shrink-0">
                {[
                  <path key="s" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />,
                  null,
                  null,
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
              <div className="flex -space-x-2 flex-shrink-0 ml-1">
                {['bg-orange-400', 'bg-sky-400', 'bg-emerald-400'].map((color, i) => (
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
      <div
        className="flex-1 p-3 overflow-y-auto rounded-3xl"
        style={{ background: 'rgba(8,16,30,0.55)', backdropFilter: 'blur(24px)' }}
      >
        <div className="grid grid-cols-2 gap-3 h-full" style={{ gridTemplateRows: 'auto 1fr' }}>
          <WeatherCard />
          <CalendarCard />
          <div className="col-span-2">
            <LivingRoomCard />
          </div>
        </div>
      </div>
    </div>
  );
}
