'use client';

import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';

type Props = {
  isMicOn: boolean;
  volume: number;
  isConnecting: boolean;
  isConnected: boolean;
  onToggleMic: () => void;
  onVolumeChange: (volume: number) => void;
  onDisconnect: () => void;
};

export default function VoiceControls({
  isMicOn,
  volume,
  isConnecting,
  isConnected,
  onToggleMic,
  onVolumeChange,
  onDisconnect,
}: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t bg-muted/30">
      <button
        onClick={onToggleMic}
        disabled={isConnecting}
        className={`rounded-full p-2.5 transition-all ${
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
          className="text-xs text-destructive hover:underline"
        >
          Desconectar
        </button>
      )}
    </div>
  );
}
