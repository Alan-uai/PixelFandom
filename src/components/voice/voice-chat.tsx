'use client';

import { useState, useRef, useCallback } from 'react';
import { Headphones, Mic, Volume2 } from 'lucide-react';
import VoiceAgentConfig from './voice-agent-config';
import type { VoiceName } from '@/lib/voice/geminilive';

type Props = {
  tenantSlug: string;
  mode?: 'header';
};

const STORAGE_KEY_VOICE = 'pixelfandom_voice_config';

function loadConfig(): {
  volume: number;
  voice: VoiceName;
  wakeWord: boolean;
  publicMode: boolean;
  publicSensitivity: number;
} {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_VOICE);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return {
    volume: 80,
    voice: 'Kore' as VoiceName,
    wakeWord: false,
    publicMode: false,
    publicSensitivity: 5,
  };
}

function saveConfig(config: Record<string, unknown>) {
  try {
    localStorage.setItem(STORAGE_KEY_VOICE, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export default function VoiceChat({ mode = 'header' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const configRef = useRef(loadConfig());
  const [volume, setVolume] = useState(configRef.current.volume);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(configRef.current.voice);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(configRef.current.wakeWord);
  const [publicMode, setPublicMode] = useState(configRef.current.publicMode);
  const [publicSensitivity, setPublicSensitivity] = useState(configRef.current.publicSensitivity);

  const persist = useCallback((updates: Record<string, unknown>) => {
    Object.assign(configRef.current, updates);
    saveConfig(configRef.current);
  }, []);

  const handleVolumeChange = useCallback(
    (v: number) => {
      setVolume(v);
      persist({ volume: v });
    },
    [persist]
  );

  const handleVoiceChange = useCallback(
    (v: VoiceName) => {
      setSelectedVoice(v);
      persist({ voice: v });
    },
    [persist]
  );

  const handleWakeWordToggle = useCallback(
    (v: boolean) => {
      setWakeWordEnabled(v);
      persist({ wakeWord: v });
    },
    [persist]
  );

  const handlePublicModeToggle = useCallback(
    (v: boolean) => {
      setPublicMode(v);
      persist({ publicMode: v });
    },
    [persist]
  );

  const handlePublicSensitivityChange = useCallback(
    (v: number) => {
      setPublicSensitivity(v);
      persist({ publicSensitivity: v });
    },
    [persist]
  );

  if (mode === 'header') {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Configuração do Agente de Voz"
        >
          <Headphones className="h-4 w-4" />
        </button>

        {isOpen && (
          <div className="fixed bottom-4 left-4 z-50">
            <VoiceAgentConfig
              onClose={() => setIsOpen(false)}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              selectedVoice={selectedVoice}
              onVoiceChange={handleVoiceChange}
              wakeWordEnabled={wakeWordEnabled}
              onWakeWordToggle={handleWakeWordToggle}
              publicMode={publicMode}
              onPublicModeToggle={handlePublicModeToggle}
              publicSensitivity={publicSensitivity}
              onPublicSensitivityChange={handlePublicSensitivityChange}
            />
          </div>
        )}
      </>
    );
  }

  return null;
}
