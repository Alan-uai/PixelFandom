'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Headphones, Volume2, Mic, UserCheck, Loader2 } from 'lucide-react';
import { VoiceProfile } from '@/lib/voice/voiceProfile';
import type { VoiceName } from '@/lib/voice/geminilive';

const STORAGE_KEY_VOICE = 'pixelfandom_voice_config';

const VOICE_OPTIONS: { value: VoiceName; desc: string }[] = [
  { value: 'Puck', desc: 'Equilibrada (padrão)' },
  { value: 'Kore', desc: 'Brilhante e clara' },
  { value: 'Charon', desc: 'Grave e acolhedora' },
  { value: 'Fenrir', desc: 'Forte e assertiva' },
  { value: 'Aoede', desc: 'Suave e melódica' },
];

function loadConfig() {
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

export default function VoiceConfigPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const configRef = useRef(loadConfig());

  const [volume, setVolume] = useState(configRef.current.volume);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(configRef.current.voice);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(configRef.current.wakeWord);
  const [publicMode, setPublicMode] = useState(configRef.current.publicMode);
  const [publicSensitivity, setPublicSensitivity] = useState(configRef.current.publicSensitivity);

  const [enrolling, setEnrolling] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState('');
  const [voiceProfile] = useState(() => {
    const profile = new VoiceProfile();
    profile.loadFromStorage();
    return profile;
  });
  const [isEnrolled, setIsEnrolled] = useState(voiceProfile.isEnrolled);

  const persist = (updates: Record<string, unknown>) => {
    Object.assign(configRef.current, updates);
    saveConfig(configRef.current);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    persist({ volume: v });
  };

  const handleVoiceChange = (v: VoiceName) => {
    setSelectedVoice(v);
    persist({ voice: v });
  };

  const handleWakeWordToggle = (v: boolean) => {
    setWakeWordEnabled(v);
    persist({ wakeWord: v });
  };

  const handlePublicModeToggle = (v: boolean) => {
    setPublicMode(v);
    persist({ publicMode: v });
  };

  const handlePublicSensitivityChange = (v: number) => {
    setPublicSensitivity(v);
    persist({ publicSensitivity: v });
  };

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
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => router.push(`/w/${slug}`)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para a wiki
        </button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Headphones className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Configuração do Agente de Voz</h1>
            <p className="text-sm text-muted-foreground">
              Personalize o assistente de voz da wiki.
            </p>
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Volume2 className="h-4 w-4 text-primary" />
          Volume da Voz
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span className="font-medium text-foreground">{volume}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Voice Select */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <label className="text-sm font-medium">Voz do Assistente</label>
        <p className="text-xs text-muted-foreground">
          Escolha a voz que o assistente usará para responder.
        </p>
        <select
          value={selectedVoice}
          onChange={(e) => handleVoiceChange(e.target.value as VoiceName)}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {VOICE_OPTIONS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.value} — {v.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Wake Word */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Wake Word</p>
            <p className="text-xs text-muted-foreground">
              Diga &ldquo;Psycho&rdquo; para ativar o microfone automaticamente
            </p>
          </div>
          <input
            type="checkbox"
            checked={wakeWordEnabled}
            onChange={(e) => handleWakeWordToggle(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>
      </div>

      {/* Public Mode */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Modo Público</p>
            <p className="text-xs text-muted-foreground">
              Reduz a sensibilidade para ambientes com ruído
            </p>
          </div>
          <input
            type="checkbox"
            checked={publicMode}
            onChange={(e) => handlePublicModeToggle(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>
        {publicMode && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Sensibilidade ao ruído: {publicSensitivity}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={publicSensitivity}
              onChange={(e) => handlePublicSensitivityChange(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínima</span>
              <span>Máxima</span>
            </div>
          </div>
        )}
      </div>

      {/* Voice Profile */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Perfil de Voz</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Treine o assistente para reconhecer sua voz e responder apenas a você.
        </p>
        {isEnrolled ? (
          <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Perfil de voz ativo
              </span>
            </div>
            <button
              onClick={handleResetProfile}
              className="text-xs text-destructive hover:underline font-medium"
            >
              Remover
            </button>
          </div>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {enrolling ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {enrollProgress || 'Criando...'}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Mic className="h-4 w-4" />
                Treinar Perfil de Voz
              </span>
            )}
          </button>
        )}
        {!isEnrolled && (
          <p className="text-xs text-muted-foreground">
            Você precisará ler 5 frases em voz alta para criar o perfil.
          </p>
        )}
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          As configurações são salvas automaticamente no seu navegador.
        </p>
      </div>
    </div>
  );
}
