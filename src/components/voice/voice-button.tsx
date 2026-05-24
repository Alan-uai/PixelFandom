'use client';

import { Mic, MicOff } from 'lucide-react';

type Props = {
  isActive: boolean;
  isConnected: boolean;
  onClick: () => void;
};

export default function VoiceButton({ isActive, isConnected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
        isActive
          ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30'
          : isConnected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
      title={isActive ? 'Desativar voz' : 'Ativar voz'}
    >
      {isActive ? (
        <>
          <MicOff className="h-4 w-4" />
          <span className="hidden sm:inline">Desativar Voz</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">Voz</span>
        </>
      )}
      {isActive && (
        <span className="absolute -top-1 -right-1 h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
        </span>
      )}
    </button>
  );
}
