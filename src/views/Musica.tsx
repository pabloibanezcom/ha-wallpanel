import { useState } from 'react';
import { useEntity } from '../hooks/useEntity';
import { useHA } from '../context/HAContext';

// ── Speakers ──────────────────────────────────────────────────────────────────
// Add Alexa / other media_player entity_ids here when the integration is set up
const SPEAKERS = [
  { id: 'media_player.sonos_one_2', name: 'Sonos', icon: 'speaker' },
  // Alexa devices — add entity_ids once Alexa Media Player integration is set up
  { id: 'alexa_media.echo_salon',      name: 'Echo Salón',    icon: 'alexa' },
  { id: 'alexa_media.echo_cocina',     name: 'Echo Cocina',   icon: 'alexa' },
  { id: 'alexa_media.echo_dormitorio', name: 'Echo Dormit.', icon: 'alexa' },
  { id: 'alexa_media.echo_andres',     name: 'Echo Andrés',  icon: 'alexa' },
];

function SpeakerIcon({ type }: { type: string }) {
  if (type === 'alexa') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        <path d="M12 1C5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11S18.07 1 12 1zm0 2c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm-1 4v10l-3-3H5v-4h3l3-3zm5 2.5c1.5.87 2.5 2.5 2.5 4.5s-1 3.63-2.5 4.5v-2.2c.67-.63 1-1.45 1-2.3 0-.85-.33-1.67-1-2.3V9.5z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M8.464 8.464a5 5 0 000 7.072M3 12h1m8-9v1m0 16v1m9-9h-1" />
    </svg>
  );
}

// ── Player controls ───────────────────────────────────────────────────────────
function PlayerControls({ entityId }: { entityId: string }) {
  const entity = useEntity(entityId);
  const { callService } = useHA();

  const state = entity?.state ?? 'unavailable';
  const isPlaying = state === 'playing';
  const isAvailable = state !== 'unavailable' && state !== 'unknown';
  const title = entity?.attributes.media_title as string | undefined;
  const artist = entity?.attributes.media_artist as string | undefined;
  const album = entity?.attributes.media_album_name as string | undefined;
  const albumArt = entity?.attributes.entity_picture as string | undefined;
  const volume = ((entity?.attributes.volume_level as number | undefined) ?? 0) * 100;

  function call(service: string, extra?: Record<string, unknown>) {
    callService('media_player', service, { entity_id: entityId, ...extra });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Album art */}
      <div
        className="w-48 h-48 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {albumArt ? (
          <img src={albumArt} alt="Album art" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-16 h-16 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )}
      </div>

      {/* Track info */}
      <div className="text-center px-4">
        {isAvailable && (title || artist) ? (
          <>
            <p className="text-white font-semibold text-lg leading-snug truncate max-w-xs">{title ?? '—'}</p>
            <p className="text-white/50 text-sm mt-0.5 truncate max-w-xs">{artist ?? ''}{album ? ` · ${album}` : ''}</p>
          </>
        ) : (
          <p className="text-white/25 text-sm">Sin reproducción activa</p>
        )}
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => call('media_previous_track')}
          className="text-white/50 hover:text-white/90 transition-colors disabled:opacity-30"
          disabled={!isAvailable}
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={() => call(isPlaying ? 'media_pause' : 'media_play')}
          disabled={!isAvailable}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
        >
          {isPlaying ? (
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={() => call('media_next_track')}
          className="text-white/50 hover:text-white/90 transition-colors disabled:opacity-30"
          disabled={!isAvailable}
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zm2-8.14 4.96 3.51L8 17.14V9.86zM16 6h2v12h-2z" />
          </svg>
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 w-64">
        <svg className="w-4 h-4 text-white/35 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.5 12A4.5 4.5 0 0016 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5zm7-.17v6.34L9.83 13H7v-2h2.83L12 8.83z" />
        </svg>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume)}
          onChange={(e) => call('volume_set', { volume_level: Number(e.target.value) / 100 })}
          disabled={!isAvailable}
          className="flex-1 accent-white disabled:opacity-30"
          style={{ height: 4 }}
        />
        <svg className="w-5 h-5 text-white/35 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
        </svg>
      </div>
    </div>
  );
}

// ── Speaker card ──────────────────────────────────────────────────────────────
function SpeakerCard({
  speaker,
  active,
  onClick,
}: {
  speaker: typeof SPEAKERS[number];
  active: boolean;
  onClick: () => void;
}) {
  const entity = useEntity(speaker.id);
  const isPlaying = entity?.state === 'playing';
  const isAvailable = entity?.state !== 'unavailable' && entity?.state !== 'unknown' && entity?.state !== undefined;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
      style={{
        background: active
          ? 'rgba(255,255,255,0.14)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)' }}
      >
        <span className={active ? 'text-white' : 'text-white/35'}>
          <SpeakerIcon type={speaker.icon} />
        </span>
      </div>
      <p className={`text-[10px] font-medium text-center leading-tight ${active ? 'text-white' : 'text-white/40'}`}>
        {speaker.name}
      </p>
      {isAvailable && (
        <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-white/20'}`} />
      )}
    </button>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function Musica() {
  const [activeSpeaker, setActiveSpeaker] = useState(SPEAKERS[0].id);

  return (
    <div className="h-full flex gap-4 p-4">

      {/* Left: player */}
      <div
        className="flex-1 flex flex-col items-center justify-center rounded-3xl p-6"
        style={{ background: 'rgba(8,16,30,0.55)', backdropFilter: 'blur(24px)' }}
      >
        <PlayerControls entityId={activeSpeaker} />
      </div>

      {/* Right: speakers + source */}
      <div className="w-52 flex flex-col gap-3">
        {/* Source selector */}
        <div
          className="rounded-2xl p-3"
          style={{ background: 'rgba(8,16,30,0.55)', backdropFilter: 'blur(24px)' }}
        >
          <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">Fuente</p>
          <div className="flex gap-2">
            {/* Spotify */}
            <button
              className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl transition-colors"
              style={{ background: 'rgba(30,215,96,0.15)', border: '1px solid rgba(30,215,96,0.25)' }}
            >
              <svg className="w-5 h-5 text-[#1ed760]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="text-[10px] font-medium text-[#1ed760]">Spotify</span>
            </button>
            {/* YouTube Music */}
            <button
              className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <svg className="w-5 h-5 text-white/30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z" />
              </svg>
              <span className="text-[10px] font-medium text-white/30">YT Music</span>
            </button>
          </div>
        </div>

        {/* Speaker selector */}
        <div
          className="flex-1 rounded-2xl p-3 overflow-y-auto"
          style={{ background: 'rgba(8,16,30,0.55)', backdropFilter: 'blur(24px)', scrollbarWidth: 'none' }}
        >
          <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">Altavoces</p>
          <div className="grid grid-cols-2 gap-2">
            {SPEAKERS.map((s) => (
              <SpeakerCard
                key={s.id}
                speaker={s}
                active={activeSpeaker === s.id}
                onClick={() => setActiveSpeaker(s.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
