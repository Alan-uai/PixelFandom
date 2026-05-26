'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { GeminiLiveAPI, MultimodalLiveResponseType, type VoiceName, type ResponseMessage } from '@/lib/voice/geminilive'
import { AudioStreamer, AudioPlayer } from '@/lib/voice/mediaUtils'
import { AGENTS, createAgentTools, type AgentConfig } from '@/lib/voice/agentSystem'
import { useRouter } from 'next/navigation'

type OrbStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'

type Props = {
  tenantSlug: string
}

const STORAGE_KEY = 'pixelfandom:voice-settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

export default function FloatingVoiceOrb({ tenantSlug }: Props) {
  const router = useRouter()

  const [status, setStatus] = useState<OrbStatus>('idle')
  const [isMicOn, setIsMicOn] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const apiRef = useRef<GeminiLiveAPI | null>(null)
  const streamerRef = useRef<AudioStreamer | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const isConnectingRef = useRef(false)
  const settingsRef = useRef<any>({})

  useEffect(() => {
    settingsRef.current = loadSettings()
  }, [])

  const agent: AgentConfig = AGENTS.xwiki
  const lang = (settingsRef.current?.userLang as 'pt' | 'en' | 'es') || 'pt'

  const handleMessage = useCallback((message: ResponseMessage) => {
    switch (message.type) {
      case MultimodalLiveResponseType.TEXT:
        break
      case MultimodalLiveResponseType.AUDIO:
        playerRef.current?.playBase64(message.data)
        break
      case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
        break
      case MultimodalLiveResponseType.SETUP_COMPLETE:
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
  }, [])

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
          publicMode: settingsRef.current.publicMode || false,
          publicModeSensitivity: settingsRef.current.publicModeSensitivity || 5,
          constraints: {
            noiseSuppression: settingsRef.current.noiseCancellation ?? true,
            echoCancellation: settingsRef.current.echoCancellation ?? true,
            autoGainControl: settingsRef.current.autoGainControl ?? true,
          },
        })
        setIsMicOn(true)
        setStatus('listening')
      }
    } catch {
      setErrorMessage('Microfone não disponível.')
    }
  }, [])

  const connect = useCallback(async () => {
    if (apiRef.current || isConnectingRef.current) return
    isConnectingRef.current = true
    setIsConnecting(true)
    setStatus('connecting')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/token', { method: 'POST' })
      if (!response.ok) throw new Error(`Falha ao obter token: ${response.statusText}`)
      const { token } = await response.json()

      const client = new GeminiLiveAPI(token, 'gemini-3.1-flash-live-preview')

      const nameContext = settingsRef.current.userName?.trim()
        ? `\n\nThe user's name is "${settingsRef.current.userName.trim()}". Always address them by this name naturally.`
        : ''

      const wikiContext = `\n\nThe current wiki slug is "${tenantSlug}". The user is browsing this wiki.`
      const systemPrompt = agent.systemPrompt + nameContext + wikiContext

      client.systemInstructions = systemPrompt
      client.inputAudioTranscription = true
      client.outputAudioTranscription = true
      client.responseModalities = ['AUDIO']
      client.voiceName = (settingsRef.current.voice as VoiceName) || 'Kore'
      client.temperature = settingsRef.current.temperature ?? 0.7

      if (settingsRef.current.publicMode) client.setPublicMode(true)

      const tools = createAgentTools({
        tenantSlug,
        volume: settingsRef.current.volume ?? 80,
        voiceName: (settingsRef.current.voice as VoiceName) || 'Kore',
        language: settingsRef.current.userLang || 'pt',
        setVolume: () => {},
        setVoiceName: () => {},
        setLanguage: () => {},
        clearTranscripts: () => {},
        navigate: (path) => router.push(path),
        playerInterrupt: () => playerRef.current?.interrupt(),
        startMic: () => startAudioStreaming(),
        stopMic: () => streamerRef.current?.stop(),
        addTranscript: () => {},
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
  }, [agent, tenantSlug, router, handleMessage, startAudioStreaming])

  const disconnect = useCallback(() => {
    apiRef.current?.webSocket?.close()
    apiRef.current = null
    streamerRef.current?.stop()
    streamerRef.current = null
    playerRef.current?.close()
    playerRef.current = null
    setIsMicOn(false)
    setStatus('idle')
    setIsConnecting(false)
    isConnectingRef.current = false
  }, [])

  const handleClick = useCallback(() => {
    if (apiRef.current || isMicOn || isConnectingRef.current) {
      disconnect()
    } else {
      connect()
    }
  }, [connect, disconnect, isMicOn])

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
        onClick={handleClick}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 ${orbSize} rounded-full shadow-2xl transition-all duration-500 ${orbColors[status]} flex items-center justify-center hover:scale-110 hover:shadow-3xl`}
        title={apiRef.current ? 'Desconectar' : 'Assistente de Voz'}
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

      {errorMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-destructive/90 text-destructive-foreground text-xs px-4 py-2 rounded-full shadow-lg">
          {errorMessage}
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}
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
