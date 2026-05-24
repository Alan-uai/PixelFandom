'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Bot, Loader2, Wifi, WifiOff, Headphones } from 'lucide-react';
import { GeminiLiveAPI } from '@/lib/voice/geminilive';
import { AudioStreamer, AudioPlayer } from '@/lib/voice/mediaUtils';
import { detectCommand } from '@/lib/voice/commands';
import { handleToolCall, TOOL_DECLARATIONS } from '@/lib/voice/tools';
import VoiceButton from './voice-button';
import VoiceControls from './voice-controls';
import { useRouter } from 'next/navigation';

type Transcript = {
  id: string;
  text: string;
  isUser: boolean;
};

type Props = {
  tenantSlug: string;
};

export default function VoiceChat({ tenantSlug }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [volume, setVolume] = useState(80);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiRef = useRef<GeminiLiveAPI | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const navigateRef = useRef<(path: string) => void>(() => {});

  navigateRef.current = (path: string) => {
    router.push(path);
  };

  const addTranscript = useCallback((text: string, isUser: boolean) => {
    setTranscripts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, isUser },
    ]);
  }, []);

  const handleToolCallFn = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      const context = {
        tenantSlug,
        navigate: navigateRef.current,
      };

      if (name === 'navigateToPage' || name === 'switchWiki') {
        const result = await handleToolCall(name, args, context);
        setIsOpen(false);
        return result;
      }

      return handleToolCall(name, args, context);
    },
    [tenantSlug]
  );

  const startVoice = useCallback(async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
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
          setIsConnected(true);
          setConnectionStatus('connected');
        },
        onClose: () => {
          setIsConnected(false);
          setConnectionStatus('idle');
          setIsMicOn(false);
          setIsActive(false);
        },
        onError: () => {
          setConnectionStatus('error');
          setErrorMessage('Erro de conexão. Tente novamente.');
          setIsConnected(false);
          setIsActive(false);
        },
        onAudio: (base64) => {
          player.playBase64(base64);
        },
        onText: (text) => {
          addTranscript(text, false);
        },
        onInterrupt: () => {
          player.interrupt();
        },
        onTurnComplete: () => {
          // turn completed
        },
        onToolCall: async (calls) => {
          for (const call of calls) {
            addTranscript(`[Usando ${call.name}...]`, false);
            const result = await handleToolCallFn(call.name, call.args);
            api.sendToolResponse(call.id, call.name, result);
          }
        },
        onSetupComplete: () => {
          setIsActive(true);
          setIsMicOn(true);
          startMic(streamer, api);
        },
      });

      api.setTools(TOOL_DECLARATIONS);
      const systemInstruction = `Você é um assistente de voz para a wiki ${tenantSlug}. Ajude o usuário a encontrar informações, navegar entre artigos e responder perguntas sobre o conteúdo da wiki. Responda de forma concisa e direta. Use as ferramentas disponíveis para buscar conteúdo, navegar para artigos e listar informações.`;
      await api.connect(systemInstruction);
      apiRef.current = api;
    } catch (err) {
      setConnectionStatus('error');
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
    setIsActive(false);
    setIsConnected(false);
    setIsMicOn(false);
    setConnectionStatus('idle');
  }, []);

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      streamerRef.current?.stop();
      setIsMicOn(false);
    } else {
      if (streamerRef.current && apiRef.current) {
        startMic(streamerRef.current, apiRef.current);
        setIsMicOn(true);
      }
    }
  }, [isMicOn]);

  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      setTranscripts([]);
    }
  }, [isOpen, stopVoice]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
      playerRef.current?.setVolume(newVolume);
    },
    []
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 left-4 z-40 rounded-full p-3.5 shadow-lg transition-all ${
          isActive
            ? 'bg-destructive text-destructive-foreground animate-pulse'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
        title="Comando de Voz"
      >
        {isActive ? (
          <Headphones className="h-5 w-5" />
        ) : (
          <Headphones className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 left-4 z-40 w-80 bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Comando de Voz</span>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="h-3.5 w-3.5 text-green-500" />
              ) : connectionStatus === 'connecting' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {transcripts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="h-8 w-8 mb-2" />
                <p className="text-xs">
                  Conecte-se e comece a falar.
                </p>
                <p className="text-xs mt-1">
                  Comandos: /ajuda
                </p>
              </div>
            )}

            {transcripts.map((t) => (
              <div
                key={t.id}
                className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}
              >
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
            <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">
              {errorMessage}
            </div>
          )}

          <VoiceControls
            isMicOn={isMicOn}
            volume={volume}
            isConnecting={isConnecting}
            isConnected={isConnected}
            onToggleMic={toggleMic}
            onVolumeChange={handleVolumeChange}
            onDisconnect={stopVoice}
          />

          <div className="px-4 py-2 border-t">
            {!isConnected ? (
              <button
                onClick={startVoice}
                disabled={isConnecting}
                className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando...
                  </span>
                ) : (
                  'Conectar Voz'
                )}
              </button>
            ) : (
              <p className="text-xs text-center text-muted-foreground">
                Microfone ativo. Fale com o assistente.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
