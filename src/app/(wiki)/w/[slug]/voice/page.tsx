'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GeminiLiveAPI, type VoiceName } from '@/lib/voice/geminilive';
import { AudioStreamer, AudioPlayer } from '@/lib/voice/mediaUtils';
import { handleToolCall, TOOL_DECLARATIONS } from '@/lib/voice/tools';
import { useWikiData } from '@/context/wiki-provider';
import { Loader2, Volume2, Headphones } from 'lucide-react';

type OrbStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

const VOICE_LABELS: Record<VoiceName, string> = {
  Puck: 'Puck — Equilibrada',
  Kore: 'Kore — Brilhante e clara',
  Charon: 'Charon — Grave e acolhedora',
  Fenrir: 'Fenrir — Forte e assertiva',
  Aoede: 'Aoede — Suave e melódica',
};

export default function VoicePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data, loading } = useWikiData();
  const aiConfig = (data?.tenant?.ai_config as Record<string, unknown>) || {};
  const wakeWordText = (aiConfig.wake_word_text as string) || 'Psycho';
  const adminVolume = (aiConfig.voice_volume as number) || 80;
  const adminVoice = (aiConfig.voice_name as VoiceName) || 'Kore';

  const [status, setStatus] = useState<OrbStatus>('idle');
  const [volume, setVolume] = useState(adminVolume);
  const [voiceName, setVoiceName] = useState<VoiceName>(adminVoice);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<{ id: string; text: string; isUser: boolean }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiRef = useRef<GeminiLiveAPI | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const addTranscript = useCallback((text: string, isUser: boolean) => {
    setTranscripts((prev) => [...prev, { id: crypto.randomUUID(), text, isUser }]);
  }, []);

  const startMic = async (streamer: AudioStreamer, api: GeminiLiveAPI) => {
    streamer.onAudio = (base64) => {
      api.sendAudioMessage(base64);
    };
    await streamer.start();
  };

  const startVoice = useCallback(async () => {
    setIsConnecting(true);
    setStatus('connecting');
    setErrorMessage(null);

    try {
      const player = new AudioPlayer();
      await player.init();
      playerRef.current = player;
      player.setVolume(volume);

      const streamer = new AudioStreamer();
      streamerRef.current = streamer;

      const api = new GeminiLiveAPI({
        onOpen: () => {
          setStatus('connected');
        },
        onClose: () => {
          setStatus('idle');
          setIsMicOn(false);
        },
        onError: () => {
          setStatus('error');
          setErrorMessage('Erro de conexão. Tente novamente.');
          setIsMicOn(false);
        },
        onAudio: async (base64) => {
          setStatus('speaking');
          await player.playBase64(base64);
        },
        onText: (text) => {
          addTranscript(text, false);
        },
        onInterrupt: () => {
          player.interrupt();
        },
        onTurnComplete: () => {
          setStatus('listening');
        },
        onToolCall: async (calls) => {
          for (const call of calls) {
            addTranscript(`[Usando ${call.name}...]`, false);
            const result = await handleToolCall(call.name, call.args, {
              tenantSlug: slug,
              navigate: (path: string) => window.location.href = path,
            });
            api.sendToolResponse(call.id, call.name, result);
          }
        },
        onSetupComplete: () => {
          setIsMicOn(true);
          setStatus('listening');
          startMic(streamer, api);
        },
      });

      api.voiceName = voiceName;
      api.setTools(TOOL_DECLARATIONS);
      const systemInstruction = `Você é um assistente de voz para a wiki ${slug}. Ajude o usuário a encontrar informações, navegar entre artigos e responder perguntas sobre o conteúdo da wiki. Responda de forma concisa e direta. Use as ferramentas disponíveis para buscar conteúdo, navegar para artigos e listar informações.`;
      await api.connect(systemInstruction);
      apiRef.current = api;
    } catch (err) {
      setStatus('error');
      setErrorMessage('Erro ao iniciar conexão de voz.');
      console.error('Voice start error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [slug, volume, voiceName, addTranscript]);

  const stopVoice = useCallback(() => {
    streamerRef.current?.stop();
    playerRef.current?.close();
    apiRef.current?.disconnect();
    setStatus('idle');
    setIsMicOn(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      streamerRef.current?.stop();
      setIsMicOn(false);
      setStatus('connected');
    } else {
      if (streamerRef.current && apiRef.current) {
        startMic(streamerRef.current, apiRef.current);
        setIsMicOn(true);
        setStatus('listening');
      }
    }
  }, [isMicOn]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    playerRef.current?.setVolume(newVolume);
  }, []);

  const isActive = status !== 'idle' && status !== 'error';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 space-y-8">
      <div className="text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Headphones className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Assistente de Voz</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Converse com a wiki usando comandos de voz.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Wake Word
          </p>
          <p className="text-lg font-semibold">&ldquo;{wakeWordText}&rdquo;</p>
          <p className="text-xs text-muted-foreground mt-1">
            Diga esta palavra para ativar o assistente
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Voz
            </label>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value as VoiceName)}
              disabled={isActive}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              {(Object.keys(VOICE_LABELS) as VoiceName[]).map((v) => (
                <option key={v} value={v}>
                  {VOICE_LABELS[v]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <Volume2 className="h-3.5 w-3.5" />
              Volume ({volume}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-muted-foreground/20 cursor-pointer accent-primary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        {!isActive ? (
          <button
            onClick={startVoice}
            disabled={isConnecting}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Headphones className="h-4 w-4" />
                Iniciar Assistente de Voz
              </>
            )}
          </button>
        ) : (
          <button
            onClick={stopVoice}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-8 py-3 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            Encerrar
          </button>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <span className="relative flex h-2.5 w-2.5">
            {isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isActive
                  ? 'bg-green-500'
                  : status === 'error'
                  ? 'bg-destructive'
                  : 'bg-muted-foreground'
              }`}
            />
          </span>
          <span className="text-sm font-medium">
            {status === 'listening'
              ? 'Ouvindo...'
              : status === 'speaking'
              ? 'Falando...'
              : status === 'connecting'
              ? 'Conectando...'
              : status === 'error'
              ? 'Erro'
              : 'Pronto'}
          </span>
        </div>

        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {transcripts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Headphones className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">
                {isActive
                  ? 'Fale algo para começar...'
                  : 'Clique em "Iniciar Assistente de Voz" para começar.'}
              </p>
            </div>
          )}
          {transcripts.map((t) => (
            <div key={t.id} className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                  t.isUser
                    ? 'bg-primary text-primary-foreground'
                    : t.text.startsWith('[Usando')
                    ? 'bg-muted/50 text-muted-foreground italic'
                    : 'bg-muted'
                }`}
              >
                {t.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
