'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GeminiLiveAPI, MultimodalLiveResponseType, type VoiceName, type ResponseMessage } from '@/lib/voice/geminilive'
import { AudioStreamer, AudioPlayer } from '@/lib/voice/mediaUtils'
import { AGENTS, createAgentTools, type AgentConfig } from '@/lib/voice/agentSystem'
import { useWikiData } from '@/context/wiki-provider'
import MediaControls from '@/components/voice/media-controls'
import VoiceSettings, { type Settings } from '@/components/voice/voice-settings'

type PageStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'

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

function detectUserLanguage(): string {
  if (typeof navigator === 'undefined') return 'pt'
  const nav = navigator.language || (navigator.languages?.[0]) || 'pt-BR'
  if (nav.startsWith('pt')) return 'pt'
  if (nav.startsWith('es')) return 'es'
  return 'en'
}

export default function VoicePage() {
  const params = useParams()
  const slug = params?.slug as string
  const { data, loading } = useWikiData()
  const aiConfig = (data?.tenant?.ai_config as Record<string, unknown>) || {}
  const adminVolume = (aiConfig.voice_volume as number) || 80
  const adminVoice = (aiConfig.voice_name as VoiceName) || 'Kore'

  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    volume: adminVolume,
    voice: adminVoice,
    userLang: detectUserLanguage(),
  }))
  const [status, setStatus] = useState<PageStatus>('idle')
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

  const clearTranscripts = useCallback(() => setTranscripts([]), [])

  const handleVolumeChange = useCallback((level: number) => {
    const clamped = Math.max(1, Math.min(100, level))
    playerRef.current?.setVolume(clamped)
    setSettings((s) => ({ ...s, volume: clamped }))
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
        setStatus('listening')
        addTranscript('[Microfone ativado automaticamente]', 'system')
      }
    } catch (err: any) {
      addTranscript('[Microfone indisponível — modo texto ativado]', 'system')
    }
  }, [addTranscript, settings])

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

      const wikiContext = `\n\nThe current wiki slug is "${slug}". The user is browsing this wiki.\n`
      const systemPrompt = agent.systemPrompt + nameContext + wikiContext

      client.systemInstructions = systemPrompt
      client.inputAudioTranscription = true
      client.outputAudioTranscription = true
      client.responseModalities = ['AUDIO']
      client.voiceName = settings.voice
      client.temperature = settings.temperature

      if (settings.publicMode) client.setPublicMode(true)

      const tools = createAgentTools({
        tenantSlug: slug,
        volume: settings.volume,
        voiceName: settings.voice,
        language: settings.userLang,
        setVolume: handleVolumeChange,
        setVoiceName: (v) => setSettings((s) => ({ ...s, voice: v })),
        setLanguage: (l) => setSettings((s) => ({ ...s, userLang: l })),
        clearTranscripts,
        navigate: (path) => { window.location.href = path },
        playerInterrupt: () => playerRef.current?.interrupt(),
        startMic: () => startAudioStreaming(),
        stopMic: () => streamerRef.current?.stop(),
        addTranscript: (text, isUser) => addTranscript(text, isUser ? 'user' : 'assistant'),
        fetchWithSlug: async (path, params) => {
          const url = new URL(path, window.location.origin)
          Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
          url.searchParams.set('slug', slug)
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
  }, [settings, agent, slug, handleMessage, handleVolumeChange, startAudioStreaming, addTranscript, clearTranscripts, lang])

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

  const sendMessage = useCallback((text: string) => {
    if (!apiRef.current?.connected) {
      addTranscript('[Conecte-se ao assistente primeiro]', 'system')
      return
    }
    addTranscript(text, 'user')
    playerRef.current?.interrupt()
    apiRef.current.sendTextMessage(text)
  }, [addTranscript])

  const [inputText, setInputText] = useState('')

  const isActive = status !== 'idle' && status !== 'error'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4"
        >
          <span className="text-3xl">🧠</span>
        </motion.div>
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {agent.subtitle[lang] || agent.subtitle['pt']}
        </p>
      </div>

      {!isActive ? (
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={connect}
            disabled={isConnecting}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg"
          >
            {isConnecting ? (
              <>
                <div className="h-4 w-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Iniciar Assistente de Voz
              </>
            )}
          </motion.button>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={disconnect}
          className="mx-auto flex items-center gap-2 rounded-full bg-destructive px-8 py-3 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-lg"
        >
          Encerrar Sessão
        </motion.button>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isActive
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
                : 'Pronto'}
            </span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600 transition-all"
          >
            ⚙️ Configurações
          </button>
        </div>

        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {transcripts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
              <span className="text-4xl mb-3 opacity-40">🧠</span>
              <p className="text-sm">
                {isActive
                  ? 'Fale algo para começar...'
                  : 'Clique em "Iniciar Assistente de Voz" para começar.'}
              </p>
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

        <div className="border-t border-slate-700 bg-slate-800/30">
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
            onToggleAudio={async () => {
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
            }}
            onVolumeChange={handleVolumeChange}
          />

          <div className="px-4 py-3 border-t border-slate-700">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (inputText.trim()) {
                  sendMessage(inputText.trim())
                  setInputText('')
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={lang === 'pt' ? 'Digite uma mensagem...' : lang === 'es' ? 'Escribe un mensaje...' : 'Type a message...'}
                disabled={!apiRef.current?.connected}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || !apiRef.current?.connected}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
          {errorMessage}
        </div>
      )}

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
    </div>
  )
}
