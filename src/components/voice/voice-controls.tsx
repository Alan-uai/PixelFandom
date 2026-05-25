'use client';

import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import type { VoiceName } from '@/lib/voice/geminilive';

type Props = {
  isMicOn: boolean;
  volume: number;
  voiceName: VoiceName;
  wakeWordText: string;
  isConnecting: boolean;
  isConnected: boolean;
  onToggleMic: () => void;
  onVolumeChange: (volume: number) => void;
  onVoiceChange: (voice: VoiceName) => void;
  onDisconnect: () => void;
};

const VOICE_LABELS: Record<VoiceName, string> = {
  Puck: 'Puck — Equilibrada',
  Kore: 'Kore — Brilhante e clara',
  Charon: 'Charon — Grave e acolhedora',
  Fenrir: 'Fenrir — Forte e assertiva',
  Aoede: 'Aoede — Suave e melódica',
};

export default function VoiceControls({
  isMicOn,
  volume,
  voiceName,
  wakeWordText,
  isConnecting,
  isConnected,
  onToggleMic,
  onVolumeChange,
  onVoiceChange,
  onDisconnect,
}: Props) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-t bg-muted/30">
      {wakeWordText && (
        <div className="text-xs text-muted-foreground text-center">
          Wake word: <span className="font-medium text-foreground">&ldquo;{wakeWordText}&rdquo;</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          Voz
        </label>
        <select
          value={voiceName}
          onChange={(e) => onVoiceChange(e.target.value as VoiceName)}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {(Object.keys(VOICE_LABELS) as VoiceName[]).map((v) => (
            <option key={v} value={v}>
              {VOICE_LABELS[v]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMic}
          disabled={isConnecting}
          className={`rounded-full p-2 transition-all ${
            isMicOn
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground'
          } disabled:opacity-50`}
          title={isMicOn ? 'Desligar microfone' : 'Ligar microfone'}
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isMicOn ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-2 flex-1">
          <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-muted-foreground/20 cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
            {volume}
          </span>
        </div>

        {isConnected && (
          <button
            onClick={onDisconnect}
            className="text-xs text-destructive hover:underline whitespace-nowrap"
          >
            Desconectar
          </button>
        )}
      </div>
    </div>
  );
}
