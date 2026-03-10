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

function ExpandIcon({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0">
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

type ForecastHour = {
  datetime: string;
  condition: string;
  temperature: number;
  precipitation_probability?: number;
  wind_speed?: number;
};

function bearingToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8];
}

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

// ── Weather Detail Sheet ───────────────────────────────────────────────────────

function WeatherDetailSheet({
  entity,
  forecast,
  hourlyForecast,
  onClose,
}: {
  entity: ReturnType<typeof useEntity>;
  forecast: ForecastDay[];
  hourlyForecast: ForecastHour[];
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 380);
  }

  const temp = entity?.attributes.temperature as number | undefined;
  const humidity = entity?.attributes.humidity as number | undefined;
  const windSpeed = entity?.attributes.wind_speed as number | undefined;
  const windGust = entity?.attributes.wind_gust_speed as number | undefined;
  const windBearing = entity?.attributes.wind_bearing as number | undefined;
  const condition = entity?.state ?? 'cloudy';
  const conditionLabel = CONDITION_ES[condition] ?? condition;

  const stats = [
    { label: 'Humedad', value: humidity != null ? `${humidity}%` : '—', icon: 'M12 2c-4 6-6 9-6 12a6 6 0 0012 0c0-3-2-6-6-12z' },
    { label: 'Viento', value: windSpeed != null ? `${windSpeed} km/h` : '—', icon: 'M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2' },
    { label: 'Ráfagas', value: windGust != null ? `${windGust} km/h` : '—', icon: 'M14 5l7 7m0 0l-7 7m7-7H3' },
    { label: 'Dirección', value: windBearing != null ? bearingToCompass(windBearing) : '—', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
        style={{
          background: 'rgba(8,18,36,0.97)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          maxHeight: '82vh',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-2 pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <WeatherIcon condition={condition} className="w-14 h-14" />
            <div>
              <p className="text-white font-bold leading-none" style={{ fontSize: '3.5rem' }}>
                {temp != null ? `${temp}°` : '—'}
              </p>
              <p className="text-white/50 text-sm mt-1">{conditionLabel}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/15 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 pb-8" style={{ scrollbarWidth: 'none' }}>
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {stats.map(({ label, value, icon }) => (
              <div
                key={label}
                className="rounded-2xl p-3 flex flex-col gap-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <p className="text-white font-semibold text-lg leading-none">{value}</p>
                <p className="text-white/40 text-xs">{label}</p>
              </div>
            ))}
          </div>

          {/* Hourly forecast */}
          {hourlyForecast.length > 0 && (
            <div className="mb-6">
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Próximas horas</p>
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none' }}
                onTouchStart={e => e.stopPropagation()}
                onTouchEnd={e => e.stopPropagation()}
              >
                {hourlyForecast.map((h) => {
                  const date = new Date(h.datetime);
                  const hLabel = `${date.getHours().toString().padStart(2, '0')}h`;
                  return (
                    <div
                      key={h.datetime}
                      className="flex-shrink-0 flex flex-col items-center gap-2 rounded-2xl px-3 py-3"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', minWidth: 58 }}
                    >
                      <span className="text-white/40 text-[11px]">{hLabel}</span>
                      <WeatherIcon condition={h.condition} className="w-6 h-6" />
                      <span className="text-white/80 text-[13px] font-medium">{h.temperature}°</span>
                      {h.precipitation_probability != null && (
                        <span className="text-sky-400 text-[10px]">{h.precipitation_probability}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily forecast */}
          {forecast.length > 0 && (
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Próximos días</p>
              <div className="space-y-1.5">
                {forecast.map((day) => {
                  const date = new Date(day.datetime);
                  const dayLabel = DAYS_ES[date.getDay()];
                  return (
                    <div
                      key={day.datetime}
                      className="flex items-center gap-4 rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span className="text-white/50 text-sm w-8">{dayLabel}</span>
                      <WeatherIcon condition={day.condition} className="w-6 h-6" />
                      <span className="text-white/50 text-xs flex-1">{CONDITION_ES[day.condition] ?? day.condition}</span>
                      <div className="flex items-center gap-3">
                        {day.templow != null && <span className="text-white/30 text-sm">{day.templow}°</span>}
                        <span className="text-white/80 text-sm font-medium">{day.temperature}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Weather Card ───────────────────────────────────────────────────────────────

function WeatherCard() {
  const entity = useEntity('weather.aemet');
  const { connection } = useHA();
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<ForecastHour[]>([]);
  const [expanded, setExpanded] = useState(false);

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
      if (!cancelled) setForecast(result.response?.['weather.aemet']?.forecast?.slice(0, 5) ?? []);
    }).catch(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (haCallService as any)(connection, 'weather', 'get_forecasts',
      { entity_id: 'weather.aemet', type: 'hourly' },
      undefined, true,
    ).then((result: { response?: Record<string, { forecast?: ForecastHour[] }> }) => {
      if (!cancelled) setHourlyForecast(result.response?.['weather.aemet']?.forecast?.slice(0, 24) ?? []);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [connection]);

  return (
    <>
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
          <ExpandIcon onClick={() => setExpanded(true)} />
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

      {expanded && (
        <WeatherDetailSheet
          entity={entity}
          forecast={forecast}
          hourlyForecast={hourlyForecast}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  );
}

// ── Calendar widget ────────────────────────────────────────────────────────────

type CalendarEventStart = { dateTime?: string; date?: string } | string;

type CalendarEvent = {
  summary: string;
  start: CalendarEventStart;
  end: CalendarEventStart;
  description?: string;
  location?: string;
};

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS_FULL_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function startToString(start: CalendarEventStart): string {
  if (typeof start === 'string') return start;
  return start.dateTime ?? start.date ?? '';
}

function eventLocalDate(ev: CalendarEvent): Date {
  const s = startToString(ev.start);
  // All-day: "YYYY-MM-DD" — parse as local midnight to avoid UTC offset shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

function useCalendarEvents(daysAhead = 60) {
  const { entities, connection } = useHA();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const calendarIds = Object.keys(entities).filter((id) => id.startsWith('calendar.'));

  useEffect(() => {
    if (!connection || calendarIds.length === 0) return;
    let cancelled = false;

    const now = new Date();
    // Start from midnight today so we don't miss events that began before this moment
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (haCallService as any)(
      connection, 'calendar', 'get_events',
      { entity_id: calendarIds, start_date_time: start.toISOString(), end_date_time: end.toISOString() },
      undefined, true,
    ).then((result: { response?: Record<string, { events?: CalendarEvent[] }> }) => {
      if (!cancelled) {
        const all: CalendarEvent[] = [];
        for (const id of calendarIds) {
          all.push(...(result.response?.[id]?.events ?? []));
        }
        all.sort((a, b) => eventLocalDate(a).getTime() - eventLocalDate(b).getTime());
        setEvents(all);
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, calendarIds.join(',')]);

  return events;
}

function formatEventTime(event: CalendarEvent): string {
  const s = startToString(event.start);
  if (!s || /^\d{4}-\d{2}-\d{2}$/.test(s)) return 'Todo el día';
  const d = new Date(s);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const EVENT_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];

// ── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ year, month, events }: { year: number; month: number; events: CalendarEvent[] }) {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div>
      <p className="text-white/60 text-sm font-semibold mb-3">
        {MONTHS_ES[month]} {year}
      </p>
      {/* Week header */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-white/25 text-[10px] font-medium py-1">{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {/* Leading empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const dayEvents = events.filter(ev => {
            const ed = eventLocalDate(ev);
            return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === d;
          });
          return (
            <div key={d} className="flex flex-col items-center py-0.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs leading-none ${
                isToday ? 'bg-white text-[#0d1b2e] font-semibold' : 'text-white/55'
              }`}>
                {d}
              </div>
              <div className="flex gap-[3px] h-1.5 items-center mt-0.5">
                {dayEvents.slice(0, 3).map((_, ei) => (
                  <div
                    key={ei}
                    className="w-1 h-1 rounded-full"
                    style={{ background: EVENT_COLORS[ei % EVENT_COLORS.length] }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Calendar Detail Sheet ──────────────────────────────────────────────────────

function CalendarDetailSheet({ allEvents, onClose, initialEvent }: { allEvents: CalendarEvent[]; onClose: () => void; initialEvent?: CalendarEvent }) {
  const [visible, setVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(initialEvent ?? null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [calAnimClass, setCalAnimClass] = useState('');
  const [calAnimKey, setCalAnimKey] = useState(0);
  const calTouchStartX = useRef(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 380);
  }

  const now = new Date();

  function getMonthYear(offset: number): { year: number; month: number } {
    const d = new Date(now.getFullYear(), now.getMonth() + offset);
    return { year: d.getFullYear(), month: d.getMonth() };
  }

  function navigateMonths(dir: 'forward' | 'back') {
    if (dir === 'back' && monthOffset === 0) return;
    setMonthOffset(prev => dir === 'forward' ? prev + 2 : prev - 2);
    setCalAnimClass(dir === 'forward' ? 'view-enter-right' : 'view-enter-left');
    setCalAnimKey(prev => prev + 1);
  }

  function onCalTouchStart(e: React.TouchEvent) {
    e.stopPropagation();
    calTouchStartX.current = e.touches[0].clientX;
  }

  function onCalTouchEnd(e: React.TouchEvent) {
    e.stopPropagation();
    const dx = e.changedTouches[0].clientX - calTouchStartX.current;
    if (Math.abs(dx) < 40) return;
    navigateMonths(dx < 0 ? 'forward' : 'back');
  }

  function toLocalDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Group events by local date string to avoid DST/timezone arithmetic issues
  const grouped: { label: string; dateStr: string; events: CalendarEvent[] }[] = [];
  for (let i = 0; i < 14; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const dateStr = toLocalDateStr(day);
    const dayEvents = allEvents.filter(ev => toLocalDateStr(eventLocalDate(ev)) === dateStr);
    if (i === 0 || dayEvents.length > 0) {
      const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${DAYS_FULL_ES[day.getDay()]} ${day.getDate()} ${MONTHS_SHORT_ES[day.getMonth()]}`;
      grouped.push({ label, dateStr, events: dayEvents });
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
        style={{
          background: 'rgba(8,18,36,0.97)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          height: '82vh',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-2 pb-4 flex-shrink-0">
          {selectedEvent ? (
            /* Detail header: back button + event title */
            <button
              onClick={() => setSelectedEvent(null)}
              className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Volver</span>
            </button>
          ) : (
            /* List header: date */
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-0.5">
                {DAYS_FULL_ES[now.getDay()]}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-white font-bold leading-none" style={{ fontSize: '2.5rem' }}>{now.getDate()}</p>
                <p className="text-white/50 text-sm">{MONTHS_ES[now.getMonth()]} {now.getFullYear()}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/15 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className={`flex-1 min-h-0 px-6 pb-8 ${selectedEvent ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`} style={{ scrollbarWidth: 'none' }}>
          {selectedEvent ? (
            /* ── Event detail view ── */
            <div className="view-enter-right flex flex-col flex-1 min-h-0 gap-3 pt-2">
              <div>
                <p className="text-white font-semibold text-xl leading-snug mb-1">{selectedEvent.summary}</p>
                <p className="text-white/40 text-sm">
                  {`${DAYS_FULL_ES[eventLocalDate(selectedEvent).getDay()]} ${eventLocalDate(selectedEvent).getDate()} ${MONTHS_ES[eventLocalDate(selectedEvent).getMonth()]} ${eventLocalDate(selectedEvent).getFullYear()}`}
                </p>
              </div>

              <div className="h-px bg-white/[0.07] my-4" />

              {/* Time */}
              {(() => {
                const timeStr = formatEventTime(selectedEvent);
                const endStr = (() => {
                  const s = startToString(selectedEvent.end);
                  if (!s || /^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
                  const d = new Date(s);
                  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                })();
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                      </svg>
                    </div>
                    <p className="text-white/80 text-sm">
                      {timeStr === 'Todo el día' ? 'Todo el día' : `${timeStr}${endStr ? ` – ${endStr}` : ''}`}
                    </p>
                  </div>
                );
              })()}

              {/* Description */}
              {selectedEvent.description && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h12M4 18h8" />
                    </svg>
                  </div>
                  <p className="text-white/65 text-sm flex-1 leading-relaxed mt-2">{selectedEvent.description}</p>
                </div>
              )}

              {/* Location + map */}
              {selectedEvent.location && (
                <div className="flex flex-col flex-1 min-h-0 gap-2">
                  <div className="flex items-start gap-3 flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <a
                      href={`https://maps.google.com/maps?q=${encodeURIComponent(selectedEvent.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 text-sm flex-1 mt-2 leading-snug"
                    >
                      {selectedEvent.location}
                    </a>
                  </div>
                  <div className="rounded-2xl overflow-hidden flex-1 min-h-0">
                    <iframe
                      title="map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedEvent.location)}&output=embed`}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Events list + calendars ── */
            <>
              <div className="space-y-5 mb-8">
                {grouped.map(({ label, events }) => (
                  <div key={label}>
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
                    {events.length === 0 ? (
                      <div
                        className="flex items-center gap-3 rounded-2xl px-4 py-3"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <p className="text-white/20 text-sm">Sin eventos</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {events.map((ev, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedEvent(ev)}
                            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:opacity-70 transition-opacity"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <div
                              className="w-1 self-stretch rounded-full flex-shrink-0"
                              style={{ background: EVENT_COLORS[i % EVENT_COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white/90 text-sm font-medium truncate">{ev.summary}</p>
                            </div>
                            <span className="text-white/35 text-xs font-mono flex-shrink-0">{formatEventTime(ev)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="h-px bg-white/[0.07] mb-6" />
              <div
                className="overflow-hidden"
                onTouchStart={onCalTouchStart}
                onTouchEnd={onCalTouchEnd}
              >
                <div key={calAnimKey} className={`grid grid-cols-2 gap-4 ${calAnimClass}`}>
                  {(() => {
                    const m1 = getMonthYear(monthOffset);
                    const m2 = getMonthYear(monthOffset + 1);
                    return (
                      <>
                        <MiniCalendar year={m1.year} month={m1.month} events={allEvents} />
                        <MiniCalendar year={m2.year} month={m2.month} events={allEvents} />
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function CalendarCard() {
  const allEvents = useCalendarEvents();
  const [expanded, setExpanded] = useState(false);
  const [initialEvent, setInitialEvent] = useState<CalendarEvent | undefined>(undefined);

  function openEvent(ev: CalendarEvent) {
    setInitialEvent(ev);
    setExpanded(true);
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000);
  const todayEvents = allEvents.filter(ev => {
    const t = eventLocalDate(ev).getTime();
    return t >= todayStart.getTime() && t < tomorrowStart.getTime();
  });
  const tomorrowEvents = allEvents.filter(ev => {
    const t = eventLocalDate(ev).getTime();
    return t >= tomorrowStart.getTime() && t < tomorrowEnd.getTime();
  });
const dayName = DAYS_FULL_ES[now.getDay()];
  const day = now.getDate();
  const month = MONTHS_ES[now.getMonth()];
  const year = now.getFullYear();

  // Week dots (Mon–Sun)
  const weekDays = ['L','M','X','J','V','S','D'];
  const todayDow = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon

  return (
    <>
      <GlassCard className="flex flex-col">
        {/* Top: date */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{dayName}</p>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-white font-bold leading-none" style={{ fontSize: '2.75rem' }}>{day}</p>
              <p className="text-white/50 text-sm">{month} {year}</p>
            </div>
            <div className="flex gap-1">
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
          <ExpandIcon onClick={() => setExpanded(true)} />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.07] mb-3" />

        {/* Events list */}
        <div className="space-y-2 overflow-y-auto">
          <>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider px-0.5">Hoy</p>
            {todayEvents.length === 0 ? (
              <p className="text-white/25 text-xs px-0.5 py-1">Sin eventos</p>
            ) : todayEvents.map((ev, i) => (
              <div key={`today-${i}`} className="flex items-center gap-3 rounded-xl px-2.5 py-2 cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)' }} onClick={() => openEvent(ev)}>
                <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: EVENT_COLORS[i % EVENT_COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 text-xs font-medium truncate">{ev.summary}</p>
                </div>
                <span className="text-white/35 text-[10px] font-mono flex-shrink-0">{formatEventTime(ev)}</span>
              </div>
            ))}
          </>
          {tomorrowEvents.length > 0 && (
            <>
              <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider px-0.5 pt-1">Mañana</p>
              {tomorrowEvents.map((ev, i) => (
                <div key={`tomorrow-${i}`} className="flex items-center gap-3 rounded-xl px-2.5 py-2 cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)' }} onClick={() => openEvent(ev)}>
                  <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: EVENT_COLORS[i % EVENT_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/85 text-xs font-medium truncate">{ev.summary}</p>
                  </div>
                  <span className="text-white/35 text-[10px] font-mono flex-shrink-0">{formatEventTime(ev)}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </GlassCard>

      {expanded && <CalendarDetailSheet allEvents={allEvents} initialEvent={initialEvent} onClose={() => { setExpanded(false); setInitialEvent(undefined); }} />}
    </>
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

export function Home({ className = '' }: { className?: string }) {
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

          {/* Quick actions bottom bar */}
          <div
            className="rounded-2xl p-3 border border-white/[0.1]"
            style={{ background: 'rgba(6,14,28,0.78)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center gap-2">
              {/* Door */}
              <button className="flex-1 flex flex-col items-center gap-1.5 py-1 rounded-xl transition-colors hover:bg-white/5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/20">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10.5V19a1 1 0 001 1h6v-4h4v4h6a1 1 0 001-1v-8.5M9 21V12h6v9M3 10.5L12 3l9 7.5" />
                  </svg>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">Abierta</span>
              </button>

              <div className="w-px h-10 bg-white/[0.07]" />

              {/* Security */}
              <button className="flex-1 flex flex-col items-center gap-1.5 py-1 rounded-xl transition-colors hover:bg-white/5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06]">
                  <svg className="w-5 h-5 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/35 font-medium">Seguridad</span>
              </button>

              <div className="w-px h-10 bg-white/[0.07]" />

              {/* Night mode */}
              <button className="flex-1 flex flex-col items-center gap-1.5 py-1 rounded-xl transition-colors hover:bg-white/5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06]">
                  <svg className="w-5 h-5 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/35 font-medium">Noche</span>
              </button>

              <div className="w-px h-10 bg-white/[0.07]" />

              {/* Away mode */}
              <button className="flex-1 flex flex-col items-center gap-1.5 py-1 rounded-xl transition-colors hover:bg-white/5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06]">
                  <svg className="w-5 h-5 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/35 font-medium">Fuera</span>
              </button>
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
