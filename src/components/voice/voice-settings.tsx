'use client'

import { motion } from 'framer-motion'
import { Checkbox3D } from '@/components/ui/checkbox-3d'
import type { VoiceName } from '@/lib/voice/geminilive'

export interface Settings {
  userName: string
  voice: VoiceName
  temperature: number
  volume: number
  userLang: string
  noiseCancellation: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  wakeWordEnabled: boolean
  publicMode: boolean
  publicModeSensitivity: number
  voiceFilterEnabled: boolean
  voiceFilterThreshold: number
  primaryNavigation: boolean
}

interface Props {
  open: boolean
  settings: Settings
  onClose: () => void
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const voices: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede']

const toneOptions = [
  { value: 0.3, label: { pt: 'Profissional', en: 'Professional', es: 'Profesional' }, desc: { pt: 'Mais objetivo e direto', en: 'More objective and direct', es: 'Más objetivo y directo' } },
  { value: 0.7, label: { pt: 'Equilibrado', en: 'Balanced', es: 'Equilibrado' }, desc: { pt: 'Tom natural e acolhedor', en: 'Natural and welcoming', es: 'Tono natural y acogedor' } },
  { value: 1.2, label: { pt: 'Criativo', en: 'Creative', es: 'Creativo' }, desc: { pt: 'Mais expressivo e fluido', en: 'More expressive and fluid', es: 'Más expresivo y fluido' } },
]

const langOptions = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="mt-0.5 shrink-0">
        <Checkbox3D checked={checked} onChange={onChange} size="md" showParticles={false} />
      </div>
      <div className="cursor-pointer" onClick={() => onChange(!checked)}>
        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{label}</span>
        {desc && <span className="block text-xs text-slate-400 mt-0.5">{desc}</span>}
      </div>
    </div>
  )
}

export default function VoiceSettings({ open, settings, onClose, onChange }: Props) {
  if (!open) return null

  const lang = settings.userLang as 'pt' | 'en' | 'es'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="bg-gradient-to-r from-primary/80 to-primary/40 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <h2 className="text-lg font-semibold">
                {lang === 'pt' ? 'Preferências' : lang === 'es' ? 'Preferencias' : 'Preferences'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-white/70 mt-1 ml-9">
            {lang === 'pt' ? 'Personalize sua experiência' : lang === 'es' ? 'Personaliza tu experiencia' : 'Customize your experience'}
          </p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {lang === 'pt' ? 'Como devo te chamar?' : lang === 'es' ? '¿Cómo debo llamarte?' : 'What should I call you?'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">💬</span>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => onChange('userName', e.target.value)}
                placeholder={lang === 'pt' ? 'Seu nome...' : lang === 'es' ? 'Tu nombre...' : 'Your name...'}
                className="w-full bg-slate-800 border border-slate-600 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {lang === 'pt' ? 'Voz' : lang === 'es' ? 'Voz' : 'Voice'}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {voices.map((v) => (
                <button
                  key={v}
                  onClick={() => onChange('voice', v)}
                  className={`px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    settings.voice === v
                      ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {lang === 'pt' ? 'Tom da conversa' : lang === 'es' ? 'Tono de conversación' : 'Conversation tone'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {toneOptions.map((opt) => {
                const isActive = settings.temperature === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => onChange('temperature', opt.value)}
                    className={`px-3 py-3 rounded-2xl text-center transition-all ${
                      isActive
                        ? 'bg-primary/20 border border-primary/50 shadow-sm'
                        : 'bg-slate-800 border border-transparent hover:bg-slate-700'
                    }`}
                  >
                    <span className={`block text-sm font-semibold ${isActive ? 'text-primary' : 'text-slate-300'}`}>
                      {opt.label[lang] || opt.label['pt']}
                    </span>
                    <span className={`block text-[10px] mt-0.5 ${isActive ? 'text-primary/70' : 'text-slate-500'}`}>
                      {opt.desc[lang] || opt.desc['pt']}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {lang === 'pt' ? 'Volume da voz' : lang === 'es' ? 'Volumen de la voz' : 'Voice volume'}
              </label>
              <span className="text-sm font-medium text-primary">{settings.volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => onChange('volume', parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>🔇</span>
              <span>🔊</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              {lang === 'pt' ? 'Qualidade do Áudio' : lang === 'es' ? 'Calidad de Audio' : 'Audio Quality'}
            </label>
            <div className="space-y-3 bg-slate-800/70 rounded-2xl p-4 border border-slate-700">
              <Toggle
                checked={settings.noiseCancellation}
                onChange={(v) => onChange('noiseCancellation', v)}
                label={lang === 'pt' ? 'Cancelamento de Ruído' : lang === 'es' ? 'Cancelación de Ruido' : 'Noise Cancellation'}
                desc={lang === 'pt' ? 'Remove ruídos de fundo (ventilador, trânsito)' : lang === 'es' ? 'Elimina ruidos de fondo' : 'Removes background noise'}
              />
              <Toggle
                checked={settings.echoCancellation}
                onChange={(v) => onChange('echoCancellation', v)}
                label={lang === 'pt' ? 'Cancelamento de Eco' : lang === 'es' ? 'Cancelación de Eco' : 'Echo Cancellation'}
                desc={lang === 'pt' ? 'Evita eco e reverberação do áudio' : lang === 'es' ? 'Evita eco y reverberación' : 'Prevents audio echo and reverberation'}
              />
              <Toggle
                checked={settings.autoGainControl}
                onChange={(v) => onChange('autoGainControl', v)}
                label={lang === 'pt' ? 'Controle Automático de Ganho' : lang === 'es' ? 'Control Automático de Ganancia' : 'Auto Gain Control'}
                desc={lang === 'pt' ? 'Ajusta automaticamente o volume do microfone' : lang === 'es' ? 'Ajusta automáticamente el volumen del micrófono' : 'Automatically adjusts microphone volume'}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              {lang === 'pt' ? 'Ativação por Voz' : lang === 'es' ? 'Activación por Voz' : 'Voice Activation'}
            </label>
            <div className="space-y-3 bg-slate-800/70 rounded-2xl p-4 border border-slate-700">
              <Toggle
                checked={settings.wakeWordEnabled}
                onChange={(v) => onChange('wakeWordEnabled', v)}
                label={lang === 'pt' ? 'Wake Word ("xWiki")' : lang === 'es' ? 'Palabra de Activación' : 'Wake Word'}
                desc={lang === 'pt' ? 'Diga "xWiki" seguido da sua mensagem para ativar automaticamente' : lang === 'es' ? 'Di "xWiki" seguido de tu mensaje para activar' : 'Say "xWiki" followed by your message to activate'}
              />
              <Toggle
                checked={settings.publicMode}
                onChange={(v) => onChange('publicMode', v)}
                label={lang === 'pt' ? 'Cancelamento Público' : lang === 'es' ? 'Cancelación Pública' : 'Public Mode'}
                desc={lang === 'pt' ? 'Apenas sua voz pode interromper — vozes de fundo são ignoradas' : lang === 'es' ? 'Solo tu voz interrumpe — las voces de fondo se ignoran' : 'Only your voice interrupts — background voices ignored'}
              />
              {settings.publicMode && (
                <div className="pt-2 border-t border-slate-600/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-400">
                      {lang === 'pt' ? 'Sensibilidade do Filtro' : lang === 'es' ? 'Sensibilidad del Filtro' : 'Filter Sensitivity'}
                    </span>
                    <span className="text-sm font-semibold text-primary">{settings.publicModeSensitivity}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={settings.publicModeSensitivity}
                    onChange={(e) => onChange('publicModeSensitivity', parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                    <span>{lang === 'pt' ? 'Menos rígido' : lang === 'es' ? 'Menos estricto' : 'Lenient'}</span>
                    <span>{lang === 'pt' ? 'Máximo (só você)' : lang === 'es' ? 'Máximo (solo tú)' : 'Maximum (only you)'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              {lang === 'pt' ? 'Comportamento' : lang === 'es' ? 'Comportamiento' : 'Behavior'}
            </label>
            <div className="space-y-3 bg-slate-800/70 rounded-2xl p-4 border border-slate-700">
              <Toggle
                checked={settings.primaryNavigation}
                onChange={(v) => onChange('primaryNavigation', v)}
                label={lang === 'pt' ? 'Navegação Primária' : lang === 'es' ? 'Navegación Primaria' : 'Primary Navigation'}
                desc={lang === 'pt' ? 'Ao encontrar um item, navegue direto para a página antes de mostrar estatísticas'
                  : lang === 'es' ? 'Al encontrar un elemento, navega directamente a la página antes de mostrar estadísticas'
                  : 'When finding an item, navigate directly to its page before showing statistics'}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              {lang === 'pt' ? 'Idioma' : lang === 'es' ? 'Idioma' : 'Language'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {langOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange('userLang', opt.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    settings.userLang === opt.value
                      ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border-t border-slate-700 px-6 py-4 flex justify-end flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-primary/80 to-primary/40 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md"
          >
            {lang === 'pt' ? 'Pronto' : lang === 'es' ? 'Listo' : 'Done'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
