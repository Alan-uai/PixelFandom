'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { GeminiLiveAPI, MultimodalLiveResponseType, type VoiceName, type ResponseMessage } from '@/lib/voice/geminilive'
import { AudioStreamer, AudioPlayer } from '@/lib/voice/mediaUtils'
import { createAgentTools } from '@/lib/voice/agentSystem'
import { buildSystemPrompt } from '@/lib/voice/systemPrompt'
import { getSchemaPrompt } from '@/lib/game-schema'
import { WakeWordDetector } from '@/lib/voice/wakeWord'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase'
import type { WidgetVoiceConfig } from '@/components/page-builder/types'
import FerrofluidOrb, { type OrbVisualStatus } from '@/components/voice/ferrofluid-orb'

type Props = {
  tenantSlug: string
  aiConfig?: Record<string, unknown>
  discordUrl?: string
  gameUrl?: string
  widgetConfig?: WidgetVoiceConfig
}

const STORAGE_KEY = 'pixelfandom:voice-settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {/* noop */}
  return {}
}

export default function FloatingVoiceOrb({ tenantSlug, aiConfig, discordUrl, gameUrl, widgetConfig }: Props) {
  const router = useRouter()

  const [status, setStatus] = useState<OrbVisualStatus>('idle')
  const [isMicOn, setIsMicOn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  const apiRef = useRef<GeminiLiveAPI | null>(null)
  const streamerRef = useRef<AudioStreamer | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const isConnectingRef = useRef(false)
  const settingsRef = useRef<any>({})
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null)
  const disconnectIntentionalRef = useRef(false)
  const searchCountRef = useRef(0)

  const beginSearch = useCallback(() => {
    searchCountRef.current += 1
    setSearching(true)
  }, [])

  const endSearch = useCallback(() => {
    searchCountRef.current = Math.max(0, searchCountRef.current - 1)
    if (searchCountRef.current === 0) setSearching(false)
  }, [])

  const voiceSessionIdRef = useRef<string | null>(null)
  const sessionCleanupRef = useRef<(() => void) | null>(null)
  const semaphoreRef = useRef(true)


  useEffect(() => {
    settingsRef.current = loadSettings()
  }, [])

  const saveVoiceSessionMessage = useCallback(async (role: string, content: string) => {
    const sid = voiceSessionIdRef.current
    if (!sid) return
    try {
      await fetch(`/api/chat/sessions/${sid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role, content, provider: 'voice', metadata: { transcribed: true } }],
        }),
      })
    } catch {/* noop */}
  }, [])

  const handleMessage = useCallback(async (message: ResponseMessage) => {
    switch (message.type) {
      case MultimodalLiveResponseType.TEXT:
        break
      case MultimodalLiveResponseType.AUDIO:
        playerRef.current?.playBase64(message.data)
        break
      case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
        if (message.data?.text && message.data?.finished) {
          saveVoiceSessionMessage('assistant', message.data.text)
        }
        break
      case MultimodalLiveResponseType.INPUT_TRANSCRIPTION:
        if (message.data?.text && message.data?.finished) {
          saveVoiceSessionMessage('user', message.data.text)
        }
        break
      case MultimodalLiveResponseType.SETUP_COMPLETE:
        break
      case MultimodalLiveResponseType.TURN_COMPLETE:
        break
      case MultimodalLiveResponseType.SESSION_RESUMPTION_UPDATE:
        if (message.data?.handle) {
          const sid = voiceSessionIdRef.current
          if (sid) {
            await supabase
              .from('chat_sessions')
              .update({ gemini_resumption_handle: message.data.handle })
              .eq('id', sid)
          }
        }
        break
      case MultimodalLiveResponseType.TOOL_CALL: {
        const functionCalls = message.data.functionCalls
        const responses: { id?: string; name: string; response: Record<string, any> }[] = []
        for (const fc of functionCalls) {
          try {
            const result = await apiRef.current?.callFunction(fc.name, fc.args)
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
  }, [saveVoiceSessionMessage])

  const startAudioStreaming = useCallback(async () => {
    try {
      if (!streamerRef.current) {
        streamerRef.current = new AudioStreamer()
      }
      streamerRef.current.onAudio = (base64) => {
        apiRef.current?.sendAudioMessage(base64)
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
    } catch (err) {
      console.error('[Voice] Erro ao iniciar microfone:', err)
      setErrorMessage(
        'Microfone não disponível.' +
          (err instanceof DOMException ? ` (${err.name})` : '')
      )
      throw err
    }
  }, [])

  const stopWakeWordDetector = useCallback(() => {
    wakeWordDetectorRef.current?.stop()
    wakeWordDetectorRef.current = null
  }, [])

  const connectRef = useRef<() => Promise<void>>(async () => {})
  const disconnectRef = useRef<() => void>(() => {})

  const startWakeWordDetector = useCallback(async () => {
    const settings = loadSettings()
    if (!settings.wakeWordEnabled) return
    if (wakeWordDetectorRef.current?.active) return

    try {
      const detector = new WakeWordDetector()
      const wakeWordText = (aiConfig?.wake_word_text as string) || 'xWiki'
      detector.setWakeWord(wakeWordText)

      detector.onWakeDetected(() => {
        if (!apiRef.current && !isConnectingRef.current) {
          connectRef.current()
        }
      })

      await detector.start()
      wakeWordDetectorRef.current = detector
    } catch {
      console.warn('WakeWordDetector: failed to start')
    }
  }, [aiConfig])

  const connect = useCallback(async () => {
    if (apiRef.current || isConnectingRef.current) return
    stopWakeWordDetector()
    isConnectingRef.current = true
    semaphoreRef.current = true
    setStatus('connecting')
    setErrorMessage(null)

    try {
      // Request the microphone now, inside the user's click gesture. Some
      // browsers require a transient user activation for getUserMedia; waiting
      // until onSetupComplete would make the gesture expire and fail with a
      // misleading "Microfone não disponível" plus a connection error.
      await startAudioStreaming()

      const response = await fetch('/api/token', { method: 'POST' })
      if (!response.ok) throw new Error(`Falha ao obter token: ${response.statusText}`)
      const { token } = await response.json()

      const client = new GeminiLiveAPI(token, 'gemini-3.1-flash-live-preview')

      // Create voice session in DB
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', tenantSlug)
          .single()

        if (tenant) {
          const abortController = new AbortController()
          fetch('/api/chat/sessions', {
            signal: abortController.signal,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: tenant.id,
              title: `Conversa de voz - ${new Date().toLocaleString('pt-BR')}`,
              provider: 'voice',
              model: 'gemini-3.1-flash-live-preview',
              voice_name: settingsRef.current.voice || 'Puck',
            }),
          }).then((res) => {
            if (semaphoreRef.current && res.ok) {
              return res.json().then((session) => {
                voiceSessionIdRef.current = session.id
              })
            }
          }).catch((err) => {
            if (err.name !== 'AbortError') {
              console.error('[Voice] Failed to create session', err)
            }
          })
          sessionCleanupRef.current = () => abortController.abort()
        }
      }

      const nameContext = settingsRef.current.userName?.trim()
        ? `\n\nThe user's name is "${settingsRef.current.userName.trim()}". Always address them by this name naturally.`
        : ''

      const wikiContext = `\n\nThe current wiki slug is "${tenantSlug}". The user is browsing this wiki.`
      const agentName = (aiConfig?.wake_word_text as string) || 'xWiki'
      const schemaPrompt = await getSchemaPrompt().catch(() => undefined)
      let systemPrompt = buildSystemPrompt(agentName, schemaPrompt) + nameContext + wikiContext
      if (settingsRef.current.primaryNavigation) {
        systemPrompt += `\n\nIMPORTANTE — Modo Navegação Primária está ATIVO.\nQuando o usuário perguntar sobre um item ou artigo específico, chame navigateToPage PRIMEIRO para navegar até a página, e só depois descreva as estatísticas e detalhes. A navegação tem prioridade sobre a descrição.`
      }

      client.systemInstructions = systemPrompt
      client.inputAudioTranscription = true
      client.outputAudioTranscription = true
      client.responseModalities = ['AUDIO']
      client.voiceName = (settingsRef.current.voice as VoiceName) || 'Puck'
      client.temperature = settingsRef.current.temperature ?? 0.7

      if (settingsRef.current.publicMode) client.setPublicMode(true)

      const tools = createAgentTools({
        tenantSlug,
        discordUrl,
        gameUrl,
        volume: settingsRef.current.volume ?? 80,
        voiceName: (settingsRef.current.voice as VoiceName) || 'Puck',
        language: settingsRef.current.userLang || 'pt',
        setVolume: () => {},
        setVoiceName: () => {},
        setLanguage: () => {},
        clearTranscripts: () => {},
        navigate: (path) => {
          // Navigation counts as "the agent is doing something" — pink spin.
          beginSearch()
          setTimeout(endSearch, 1400)
          router.push(path)
        },
        playerInterrupt: () => playerRef.current?.interrupt(),
        startMic: () => startAudioStreaming(),
        stopMic: () => streamerRef.current?.stop(),
        addTranscript: () => {},
        onEndSession: () => disconnectRef.current(),
        fetchWithSlug: async (path, params) => {
          beginSearch()
          try {
            const url = new URL(path, window.location.origin)
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
            url.searchParams.set('slug', tenantSlug)
            const res = await fetch(url.toString())
            if (!res.ok) {
              const errBody = await res.json().catch(() => ({error: res.statusText}))
              throw new Error(errBody.error || `HTTP ${res.status}`)
            }
            return res.json()
          } finally {
            endSearch()
          }
        },
      })
      tools.forEach((t) => client.addFunction(t))

      client.onReceiveResponse = handleMessage
      client.onError = (err) => {
        setStatus('error')
        setErrorMessage('Erro: ' + err)
        isConnectingRef.current = false
      }
      client.onClose = () => {
        setStatus('idle')
        setIsMicOn(false)
        streamerRef.current = null
        apiRef.current = null
        isConnectingRef.current = false

        // Archive voice session
        const sid = voiceSessionIdRef.current
        if (sid) {
          supabase
            .from('chat_sessions')
            .update({ status: 'archived' })
            .eq('id', sid)
            .then(() => { voiceSessionIdRef.current = null })
        }

        if (!disconnectIntentionalRef.current) {
          startWakeWordDetector()
        }
        disconnectIntentionalRef.current = false
      }
      client.onOpen = async () => {
        setStatus('connected')
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
      streamerRef.current?.stop()
      streamerRef.current = null
      setIsMicOn(false)
    }
  }, [tenantSlug, aiConfig, router, handleMessage, startAudioStreaming, stopWakeWordDetector, discordUrl, gameUrl, startWakeWordDetector, beginSearch, endSearch])

  const disconnect = useCallback(() => {
    disconnectIntentionalRef.current = true
    apiRef.current?.webSocket?.close()
    apiRef.current = null
    streamerRef.current?.stop()
    streamerRef.current = null
    playerRef.current?.close()
    playerRef.current = null
    setIsMicOn(false)
    setStatus('idle')
    isConnectingRef.current = false
    semaphoreRef.current = false
  }, [])

  useEffect(() => {
    connectRef.current = connect
    return () => {
      if (sessionCleanupRef.current) {
        sessionCleanupRef.current()
        sessionCleanupRef.current = null
      }
    }
  }, [connect])
  useEffect(() => { disconnectRef.current = disconnect; }, [disconnect])

  // DO NOT auto-start the wake word detector on mount. The Web Speech API
  // requests microphone permission and, if triggered without a user gesture
  // (transient activation), browsers auto-deny it and cache that denial for the
  // origin — so a later orb click never shows a prompt. The detector is only
  // started after the user has granted mic permission via a real click.
  useEffect(() => {
    return () => {
      stopWakeWordDetector()
    }
  }, [stopWakeWordDetector])

  const handleClick = useCallback(() => {
    if (apiRef.current || isMicOn || isConnectingRef.current) {
      disconnect()
    } else {
      connect()
    }
  }, [connect, disconnect, isMicOn])

  // The 3D orb detects live speaking/listening from the audio taps; elevate the
  // UI state (size/glow) without clobbering lifecycle states.
  const handleOrbStatus = useCallback((next: OrbVisualStatus) => {
    setStatus((prev) => (prev === 'connecting' || prev === 'error' ? prev : next))
  }, [])

  if (widgetConfig?.enabled === false) return null

  const baseIdleSize = widgetConfig?.size === 'sm' ? 'h-14 w-14' : widgetConfig?.size === 'lg' ? 'h-20 w-20' : 'h-16 w-16'
  const baseActiveSize = widgetConfig?.size === 'sm' ? 'h-16 w-16' : widgetConfig?.size === 'lg' ? 'h-24 w-24' : 'h-20 w-20'
  const orbSize = status === 'idle' ? baseIdleSize : baseActiveSize

  const positionClass = widgetConfig?.position === 'bottom-left'
    ? 'bottom-8 left-8'
    : widgetConfig?.position === 'bottom-right'
    ? 'bottom-8 right-8'
    : 'bottom-8 left-1/2 -translate-x-1/2'

  const animationClass = widgetConfig?.animation === 'pulse'
    ? 'animate-pulse'
    : widgetConfig?.animation === 'bounce'
    ? 'animate-bounce'
    : widgetConfig?.animation === 'float'
    ? 'animate-float'
    : widgetConfig?.animation === 'glow'
    ? 'animate-glow'
    : ''

  const orbColors: Record<OrbVisualStatus, string> = {
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
        className={`fixed ${positionClass} z-50 ${orbSize} rounded-full shadow-2xl transition-all duration-500 ${orbColors[status]} flex items-center justify-center hover:scale-105 hover:shadow-3xl ${animationClass}`}
        title={isMicOn ? 'Desconectar' : 'Assistente de Voz'}
        aria-label={isMicOn ? 'Desconectar assistente de voz' : 'Ativar assistente de voz'}
      >
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <FerrofluidOrb
          className="absolute -inset-4 z-10"
          status={status}
          searching={searching}
          onStatusChange={handleOrbStatus}
        />
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
