'use client'

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GeminiLiveAPI, MultimodalLiveResponseType, type VoiceName, type ResponseMessage } from '@/lib/voice/geminilive'
import { AudioStreamer, AudioPlayer } from '@/lib/voice/mediaUtils'
import { AGENTS, createAgentTools, type AgentConfig } from '@/lib/voice/agentSystem'
import { useRouter } from 'next/navigation'
import { useWikiData } from '@/context/wiki-provider'
import MediaControls from './media-controls'
import VoiceSettings, { type Settings } from './voice-settings'

type OrbStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'

const defaultSettings: Settings = {
  userName: '',
  voice: 'Kore',
  temperature: 0.7,
  volume: 80,
  userLang: 'pt',
  noiseCancellation: true,
  echoCancellation: true,
  autoGainControl: true,
  wakeWordEnabled: false,
  publicMode: false,
  publicModeSensitivity: 5,
  voiceFilterEnabled: false,
  voiceFilterThreshold: 0.78,
}

type Props = {
  tenantSlug: string
}

export default function FloatingVoiceOrb({ tenantSlug }: Props) {
  const router = useRouter()
  const { data } = useWikiData()
  const aiConfig = (data?.tenant?.ai_config as Record<string, unknown>) || {}
  const adminVolume = (aiConfig.voice_volume as number) || 80
  const adminVoice = (aiConfig.voice_name as VoiceName) || 'Kore'

  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    volume: adminVolume,
    voice: adminVoice,
  }))
  const [status, setStatus] = useState<OrbStatus>('idle')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [transcripts, setTranscripts] = useState<{ id: string; text: string; type: string }[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const apiRef = useRef<GeminiLiveAPI | null>(null)
  const streamerRef = useRef<AudioStreamer | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const isConnectingRef = useRef(false)

  const agent: AgentConfig = AGENTS.xwiki
  const lang = settings.userLang as 'pt' | 'en' | 'es'

  const addTranscript = useCallback((text: string, type: string) => {
    setTranscripts((prev) => [...prev, { id: crypto.randomUUID(), text, type }])
  }, [])

  const clearTranscripts = useCallback(() => {
    setTranscripts([])
  }, [])

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    if (key === 'voice') {
      apiRef.current?.setVoice(value as VoiceName)
    }
    if (key === 'publicMode') {
      apiRef.current?.setPublicMode(value as boolean)
      streamerRef.current?.setPublicMode(value as boolean, settings.publicModeSensitivity)
    }
    if (key === 'publicModeSensitivity' && settings.publicMode) {
      streamerRef.current?.setPublicMode(true, value as number)
    }
  }, [settings.publicMode])

  const handleVolumeChange = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(100, level))
    playerRef.current?.setVolume(clamped)
    setSettings((s) => ({ ...s, volume: clamped }))
  }, [])

  const handleMessage = useCallback((message: ResponseMessage) => {
    switch (message.type) {
      case MultimodalLiveResponseType.TEXT:
        addTranscript(message.data, 'assistant')
        break
      case MultimodalLiveResponseType.AUDIO:
        playerRef.current?.playBase64(message.data)
        break
      case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
        if (message.data.finished && message.data.text) {
          addTranscript(message.data.text, 'assistant')
        }
        break
      case MultimodalLiveResponseType.SETUP_COMPLETE:
        addTranscript(`🧠 ${agent.name} conectado!`, 'system')
        break
      case MultimodalLiveResponseType.TOOL_CALL: {
        const functionCalls = message.data.functionCalls
        const responses: { id?: string; name: string; response: Record<string, any> }[] = []
        for (const fc of functionCalls) {
          try {
            const result = apiRef.current?.callFunction(fc.name, fc.args)
            responses.push({ id: fc.id, name: fc.name, response: { result: result ?? 'ok' } })
          } catch (err: any) {
            responses.push({ id: fc.id, name: fc.name, response: { error: err.message } })
          }
        }
        apiRef.current?.sendToolResponse(responses)
        break
      }
      case MultimodalLiveResponseType.INTERRUPTED:
        playerRef.current?.interrupt()
        break
    }
  }, [addTranscript, agent])

  const startAudioStreaming = useCallback(async () => {
    try {
      if (!streamerRef.current) {
        streamerRef.current = new AudioStreamer()
      }
      if (apiRef.current) {
        streamerRef.current.onAudio = (base64) => {
          apiRef.current?.sendAudioMessage(base64)
        }
      }
      if (streamerRef.current) {
        await streamerRef.current.start({
          publicMode: settings.publicMode,
          publicModeSensitivity: settings.publicModeSensitivity,
          constraints: {
            noiseSuppression: settings.noiseCancellation,
            echoCancellation: settings.echoCancellation,
            autoGainControl: settings.autoGainControl,
          },
        })
        setIsMicOn(true)
        addTranscript('[Microfone ativado]', 'system')
      }
    } catch (err: any) {
      addTranscript('[Erro ao ativar microfone: ' + err.message + ']', 'system')
    }
  }, [addTranscript, settings])

  const connect = useCallback(async () => {
    if (apiRef.current || isConnectingRef.current) return
    isConnectingRef.current = true
    setIsConnecting(true)
    setStatus('connecting')
    setErrorMessage(null)

    try {
      addTranscript('[Obtendo token...]', 'system')
      const response = await fetch('/api/token', { method: 'POST' })
      if (!response.ok) throw new Error(`Falha ao obter token: ${response.statusText}`)
      const { token } = await response.json()

      addTranscript(`[Conectando ao ${agent.name}...]`, 'system')
      const client = new GeminiLiveAPI(token, 'gemini-3.1-flash-live-preview')

      const nameContext = settings.userName.trim()
        ? `\n\nThe user's name is "${settings.userName.trim()}". Always address them by this name naturally.`
        : ''

      const wikiContext = `\n\nThe current wiki slug is "${tenantSlug}". The user is browsing this wiki.`
      const systemPrompt = agent.systemPrompt + nameContext + wikiContext

      client.systemInstructions = systemPrompt
      client.inputAudioTranscription = true
      client.outputAudioTranscription = true
      client.responseModalities = ['AUDIO']
      client.voiceName = settings.voice
      client.temperature = settings.temperature

      if (settings.publicMode) client.setPublicMode(true)

      const tools = createAgentTools({
        tenantSlug,
        volume: settings.volume,
        voiceName: settings.voice,
        language: settings.userLang,
        setVolume: handleVolumeChange,
        setVoiceName: (v: VoiceName) => setSettings((s) => ({ ...s, voice: v })),
        setLanguage: (l: string) => setSettings((s) => ({ ...s, userLang: l })),
        clearTranscripts,
        navigate: (path) => router.push(path),
        playerInterrupt: () => playerRef.current?.interrupt(),
        startMic: () => startAudioStreaming(),
        stopMic: () => streamerRef.current?.stop(),
        addTranscript: (text, isUser) => addTranscript(text, isUser ? 'user' : 'assistant'),
        fetchWithSlug: async (path, params) => {
          const url = new URL(path, window.location.origin)
          Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
          url.searchParams.set('slug', tenantSlug)
          const res = await fetch(url.toString())
          return res.json()
        },
      })
      tools.forEach((t) => client.addFunction(t))

      client.onReceiveResponse = handleMessage
      client.onError = (err) => {
        setStatus('error')
        setErrorMessage('Erro: ' + err)
        isConnectingRef.current = false
        setIsConnecting(false)
      }
      client.onClose = () => {
        setStatus('idle')
        setIsMicOn(false)
        streamerRef.current = null
        apiRef.current = null
        isConnectingRef.current = false
        setIsConnecting(false)
      }
      client.onOpen = async () => {
        setStatus('connected')
        setIsConnecting(false)
        isConnectingRef.current = false

        const greet = agent.greetingMessages[lang] || agent.greetingMessages['pt']
        addTranscript(greet, 'assistant')
      }

      client.onSetupComplete = () => {
        startAudioStreaming()
      }

      apiRef.current = client
      client.connect()

      playerRef.current = new AudioPlayer()
      await playerRef.current.init()
    } catch (error: any) {
      setStatus('error')
      setErrorMessage('Falha: ' + error.message)
      isConnectingRef.current = false
      setIsConnecting(false)
    }
  }, [settings, agent, tenantSlug, router, handleMessage, handleVolumeChange, startAudioStreaming, addTranscript, clearTranscripts, lang])

  const disconnect = useCallback(() => {
    apiRef.current?.webSocket?.close()
    apiRef.current = null
    streamerRef.current?.stop()
    streamerRef.current = null
    playerRef.current?.close()
    setIsMicOn(false)
    setStatus('idle')
    setIsConnecting(false)
    isConnectingRef.current = false
  }, [])

  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      streamerRef.current?.stop()
      setIsMicOn(false)
      setStatus('connected')
    } else {
      if (apiRef.current?.connected) {
        const streamer = new AudioStreamer()
        streamer.onAudio = (base64) => {
          apiRef.current?.sendAudioMessage(base64)
        }
        streamerRef.current = streamer
        try {
          await streamer.start({
            publicMode: settings.publicMode,
            publicModeSensitivity: settings.publicModeSensitivity,
            constraints: {
              noiseSuppression: settings.noiseCancellation,
              echoCancellation: settings.echoCancellation,
              autoGainControl: settings.autoGainControl,
            },
          })
          setIsMicOn(true)
          setStatus('listening')
        } catch {
          setErrorMessage('Microfone não disponível.')
        }
      }
    }
  }, [isMicOn, settings])

  useEffect(() => {
    if (!isPanelOpen) {
      disconnect()
      setTranscripts([])
    }
  }, [isPanelOpen, disconnect])

  const orbSize = status === 'idle' ? 'h-16 w-16' : 'h-20 w-20'

  const orbColors: Record<OrbStatus, string> = {
    idle: 'bg-primary/60 shadow-primary/20',
    connecting: 'bg-amber-500/60 shadow-amber-500/20',
    connected: 'bg-emerald-500/60 shadow-emerald-500/20',
    listening: 'bg-cyan-500/60 shadow-cyan-500/20',
    speaking: 'bg-violet-500/60 shadow-violet-500/20',
    error: 'bg-destructive/60 shadow-destructive/20',
  }

  return (
    <>
      <button
        onClick={() => {
          if (!isPanelOpen) {
            setIsPanelOpen(true)
            connect()
          } else {
            setIsPanelOpen(false)
          }
        }}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 ${orbSize} rounded-full shadow-2xl transition-all duration-500 ${orbColors[status]} flex items-center justify-center hover:scale-110 hover:shadow-3xl`}
        title="Assistente de Voz"
      >
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        <div className="relative flex items-center justify-center">
          {isConnecting || status === 'connecting' ? (
            <div className="h-6 w-6 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Mic className={`h-7 w-7 text-white ${status === 'speaking' ? 'animate-bounce' : ''}`} />
          )}
        </div>
        {(status === 'listening' || status === 'speaking') && (
          <div className={`absolute -inset-4 rounded-full border-2 animate-ping ${
            status === 'listening' ? 'border-cyan-400/40' : 'border-violet-400/40'
          }`} />
        )}
      </button>

      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  {(status === 'connected' || status === 'listening' || status === 'speaking') && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    status === 'connected' || status === 'listening' || status === 'speaking'
                      ? 'bg-green-500'
                      : status === 'error'
                      ? 'bg-destructive'
                      : 'bg-slate-500'
                  }`} />
                </span>
                <span className="text-sm font-medium text-slate-200">
                  {isConnecting ? 'Conectando...'
                    : status === 'listening' ? 'Ouvindo...'
                    : status === 'speaking' ? 'Falando...'
                    : status === 'error' ? 'Erro'
                    : 'Voz Ativa'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm"
                >
                  ⚙️
                </button>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-2">
              {transcripts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                  <p className="text-xs">Fale com o assistente de voz.</p>
                </div>
              )}
              {transcripts.map((t) => (
                <div key={t.id} className={`flex ${t.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                    t.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : t.type === 'system'
                      ? 'bg-slate-800 text-slate-400 italic text-xs'
                      : 'bg-slate-800 text-slate-200'
                  }`}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">{errorMessage}</div>
            )}

            <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 space-y-3">
              <MediaControls
                isAudioStreaming={isMicOn}
                volume={settings.volume}
                connectionStatus={
                  isConnecting ? 'Conectando...'
                    : status === 'error' ? 'Erro'
                    : apiRef.current?.connected ? 'Conectado'
                    : 'Desconectado'
                }
                isConnected={apiRef.current?.connected || false}
                onToggleAudio={toggleMic}
                onVolumeChange={handleVolumeChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <VoiceSettings
            open={settingsOpen}
            settings={settings}
            onClose={() => setSettingsOpen(false)}
            onChange={updateSetting}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function Mic({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
