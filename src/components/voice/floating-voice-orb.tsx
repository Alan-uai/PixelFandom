'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GeminiLiveAPI, type VoiceName } from '@/lib/voice/geminilive';
import { AudioStreamer, AudioPlayer } from '@/lib/voice/mediaUtils';
import { handleToolCall, TOOL_DECLARATIONS } from '@/lib/voice/tools';
import { WakeWordDetector } from '@/lib/voice/wakeWord';
import { VoiceProfile } from '@/lib/voice/voiceProfile';
import { useRouter } from 'next/navigation';
import { useWikiData } from '@/context/wiki-provider';
import VoiceControls from './voice-controls';

type OrbStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

type Props = {
  tenantSlug: string;
};

export default function FloatingVoiceOrb({ tenantSlug }: Props) {
  const router = useRouter();
  const { data } = useWikiData();
  const aiConfig = (data?.tenant?.ai_config as Record<string, unknown>) || {};
  const adminVolume = (aiConfig.voice_volume as number) || 80;
  const adminVoice = (aiConfig.voice_name as VoiceName) || 'Kore';
  const wakeWordText = (aiConfig.wake_word_text as string) || 'Psycho';

  const [status, setStatus] = useState<OrbStatus>('idle');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [volume, setVolume] = useState(adminVolume);
  const [userVoiceName, setUserVoiceName] = useState<VoiceName>(adminVoice);
  const [transcripts, setTranscripts] = useState<{ id: string; text: string; isUser: boolean }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const apiRef = useRef<GeminiLiveAPI | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const wakeWordRef = useRef<WakeWordDetector | null>(null);
  const voiceProfileRef = useRef<VoiceProfile | null>(null);
  const navigateRef = useRef<(path: string) => void>(() => {});

  navigateRef.current = (path: string) => router.push(path);

  const addTranscript = useCallback((text: string, isUser: boolean) => {
    setTranscripts((prev) => [...prev, { id: crypto.randomUUID(), text, isUser }]);
  }, []);

  const handleToolCallFn = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      const context = { tenantSlug, navigate: navigateRef.current };
      if (name === 'navigateToPage' || name === 'switchWiki') {
        const result = await handleToolCall(name, args, context);
        setIsPanelOpen(false);
        return result;
      }
      return handleToolCall(name, args, context);
    },
    [tenantSlug]
  );

  const startWakeWord = useCallback(
    async (streamer: AudioStreamer) => {
      const detector = new WakeWordDetector();
      if (wakeWordText) detector.setWakeWord(wakeWordText);
      detector.onWakeDetected(() => {
        setStatus('listening');
        setIsMicOn(true);
        if (streamerRef.current && apiRef.current) {
          const micStream = streamerRef.current as any;
          if (typeof micStream.start === 'function') {
            micStream.start();
          }
        }
      });
      wakeWordRef.current = detector;
    },
    [wakeWordText]
  );

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
            const result = await handleToolCallFn(call.name, call.args);
            api.sendToolResponse(call.id, call.name, result);
          }
        },
        onSetupComplete: () => {
          setIsMicOn(true);
          setStatus('listening');
          startMic(streamer, api);
        },
      });

      api.setTools(TOOL_DECLARATIONS);
      const systemInstruction = `Você é um assistente de voz para a wiki ${tenantSlug}. Ajude o usuário a encontrar informações, navegar entre artigos e responder perguntas sobre o conteúdo da wiki. Responda de forma concisa e direta. Use as ferramentas disponíveis para buscar conteúdo, navegar para artigos e listar informações.`;
      await api.connect(systemInstruction);
      apiRef.current = api;
    } catch (err) {
      setStatus('error');
      setErrorMessage('Erro ao iniciar conexão de voz.');
      console.error('Voice start error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [tenantSlug, volume, addTranscript, handleToolCallFn]);

  const startMic = async (streamer: AudioStreamer, api: GeminiLiveAPI) => {
    streamer.onAudio = (base64) => {
      api.sendAudioMessage(base64);
    };
    await streamer.start();
  };

  const stopVoice = useCallback(() => {
    streamerRef.current?.stop();
    playerRef.current?.close();
    apiRef.current?.disconnect();
    wakeWordRef.current?.stop();
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

  useEffect(() => {
    if (!isPanelOpen) {
      stopVoice();
      setTranscripts([]);
    }
  }, [isPanelOpen, stopVoice]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
      playerRef.current?.setVolume(newVolume);
    },
    []
  );

  const orbSize = status === 'idle' ? 'h-16 w-16' : 'h-20 w-20';

  const orbAnimations: Record<OrbStatus, string> = {
    idle: 'animate-pulse',
    connecting: 'animate-spin',
    connected: 'animate-pulse shadow-lg',
    listening: 'animate-pulse',
    speaking: 'animate-pulse',
    error: 'animate-pulse',
  };

  const orbColors: Record<OrbStatus, string> = {
    idle: 'bg-primary/60 shadow-primary/20',
    connecting: 'bg-amber-500/60 shadow-amber-500/20',
    connected: 'bg-emerald-500/60 shadow-emerald-500/20',
    listening: 'bg-cyan-500/60 shadow-cyan-500/20',
    speaking: 'bg-violet-500/60 shadow-violet-500/20',
    error: 'bg-destructive/60 shadow-destructive/20',
  };

  return (
    <>
      {/* Floating Orb */}
      <button
        onClick={() => {
          if (!isPanelOpen) {
            setIsPanelOpen(true);
            startVoice();
          } else {
            setIsPanelOpen(false);
          }
        }}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 ${orbSize} rounded-full shadow-2xl transition-all duration-500 ${orbColors[status]} ${orbAnimations[status]} flex items-center justify-center hover:scale-110 hover:shadow-3xl`}
        title="Assistente de Voz"
      >
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        <div className="relative flex items-center justify-center">
          {status === 'connecting' ? (
            <div className="h-6 w-6 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
          ) : status === 'idle' ? (
            <Mic className="h-6 w-6 text-white" />
          ) : (
            <div className="flex items-center justify-center">
              {status === 'listening' && (
                <div className="absolute -inset-4 rounded-full border-2 border-cyan-400/40 animate-ping" />
              )}
              {status === 'speaking' && (
                <div className="absolute -inset-3 rounded-full border-2 border-violet-400/40 animate-ping" />
              )}
              <Mic className={`h-7 w-7 text-white ${status === 'speaking' ? 'animate-bounce' : ''}`} />
            </div>
          )}
        </div>
      </button>

      {/* Panel */}
      {isPanelOpen && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-80 bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {status === 'connected' || status === 'listening' || status === 'speaking' ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                ) : null}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    status === 'connected' || status === 'listening' || status === 'speaking'
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
                  : 'Voz Ativa'}
              </span>
            </div>
          </div>

          <div className="h-48 overflow-y-auto p-3 space-y-2">
            {transcripts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p className="text-xs">Fale com o assistente de voz.</p>
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

          {errorMessage && (
            <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">{errorMessage}</div>
          )}

          <VoiceControls
            isMicOn={isMicOn}
            volume={volume}
            voiceName={userVoiceName}
            wakeWordText={wakeWordText}
            isConnecting={isConnecting}
            isConnected={status !== 'idle' && status !== 'error'}
            onToggleMic={toggleMic}
            onVolumeChange={handleVolumeChange}
            onVoiceChange={setUserVoiceName}
            onDisconnect={stopVoice}
          />
        </div>
      )}
    </>
  );
}

function Mic({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
