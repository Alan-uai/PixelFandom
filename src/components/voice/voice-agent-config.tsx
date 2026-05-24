'use client';

import { useState } from 'react';
import { X, Volume2, Mic, UserCheck, Save, Loader2 } from 'lucide-react';
import { VoiceProfile } from '@/lib/voice/voiceProfile';
import type { VoiceName } from '@/lib/voice/geminilive';

type VoiceAgentConfigProps = {
  onClose: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  selectedVoice: VoiceName;
  onVoiceChange: (v: VoiceName) => void;
  wakeWordEnabled: boolean;
  onWakeWordToggle: (v: boolean) => void;
  publicMode: boolean;
  onPublicModeToggle: (v: boolean) => void;
  publicSensitivity: number;
  onPublicSensitivityChange: (v: number) => void;
};

const VOICE_OPTIONS: { value: VoiceName; desc: string }[] = [
  { value: 'Puck', desc: 'Equilibrada (padrão)' },
  { value: 'Kore', desc: 'Brilhante e clara' },
  { value: 'Charon', desc: 'Grave e acolhedora' },
  { value: 'Fenrir', desc: 'Forte e assertiva' },
  { value: 'Aoede', desc: 'Suave e melódica' },
];

export default function VoiceAgentConfig({
  onClose,
  volume,
  onVolumeChange,
  selectedVoice,
  onVoiceChange,
  wakeWordEnabled,
  onWakeWordToggle,
  publicMode,
  onPublicModeToggle,
  publicSensitivity,
  onPublicSensitivityChange,
}: VoiceAgentConfigProps) {
  const [enrolling, setEnrolling] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState('');
  const [voiceProfile] = useState(() => {
    const profile = new VoiceProfile();
    profile.loadFromStorage();
    return profile;
  });
  const [isEnrolled, setIsEnrolled] = useState(voiceProfile.isEnrolled);

  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollProgress('Preparando...');

    try {
      const textLabels = [
        'Texto 1 de 5',
        'Texto 2 de 5',
        'Texto 3 de 5',
        'Texto 4 de 5',
        'Texto 5 de 5',
        'Palavra de ativação',
      ];
      await voiceProfile.enroll((index, phase) => {
        if (phase === 'recording') {
          setEnrollProgress(`Gravando: ${textLabels[index]}...`);
        } else if (phase === 'processing') {
          setEnrollProgress('Processando...');
        } else {
          setEnrollProgress(`✓ Concluído ${index + 1}/${textLabels.length}`);
        }
      });
      setIsEnrolled(true);
      setEnrollProgress('Perfil de voz criado com sucesso!');
    } catch {
      setEnrollProgress('Erro ao criar perfil.');
    }
    setEnrolling(false);
  };

  const handleResetProfile = () => {
    voiceProfile.reset();
    setIsEnrolled(false);
  };

  return (
    <div className="w-80 bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Configuração de Voz</span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 overflow-y-auto max-h-96">
        {/* Volume */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Volume2 className="h-3.5 w-3.5" />
            Volume da Voz
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="text-xs text-muted-foreground">{volume}%</span>
        </div>

        {/* Voice Select */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Voz do Assistente
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value as VoiceName)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.value} — {v.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Wake Word */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Wake Word</p>
            <p className="text-xs text-muted-foreground">
              Diga &ldquo;Psycho&rdquo; para ativar
            </p>
          </div>
          <input
            type="checkbox"
            checked={wakeWordEnabled}
            onChange={(e) => onWakeWordToggle(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>

        {/* Public Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Modo Público</p>
              <p className="text-xs text-muted-foreground">
                Menos sensível a ruídos
              </p>
            </div>
            <input
              type="checkbox"
              checked={publicMode}
              onChange={(e) => onPublicModeToggle(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
          {publicMode && (
            <div>
              <label className="text-xs text-muted-foreground">
                Sensibilidade ({publicSensitivity}/10)
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={publicSensitivity}
                onChange={(e) =>
                  onPublicSensitivityChange(Number(e.target.value))
                }
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
          )}
        </div>

        {/* Voice Profile */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Perfil de Voz
            </span>
          </div>
          {isEnrolled ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600 dark:text-green-400">
                ✓ Perfil criado
              </span>
              <button
                onClick={handleResetProfile}
                className="text-xs text-destructive hover:underline"
              >
                Remover
              </button>
            </div>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full rounded-lg bg-primary/10 text-primary py-2 text-xs font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              {enrolling ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {enrollProgress || 'Criando...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Mic className="h-3 w-3" />
                  Treinar Perfil de Voz
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t bg-muted/20">
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          As configurações são salvas automaticamente.
        </p>
      </div>
    </div>
  );
}
