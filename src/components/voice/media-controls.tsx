'use client'

import { motion } from 'framer-motion'
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d'

interface Props {
  isAudioStreaming: boolean
  volume: number
  connectionStatus: string
  isConnected: boolean
  onToggleAudio: () => void
  onVolumeChange: (vol: number) => void
}

export default function MediaControls({
  isAudioStreaming,
  volume,
  connectionStatus,
  isConnected,
  onToggleAudio,
  onVolumeChange,
}: Props) {
  const connColor = isConnected
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : connectionStatus.includes('fail') || connectionStatus.includes('Erro')
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : 'bg-slate-800 text-slate-400 border-slate-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggleAudio}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              isAudioStreaming
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {isAudioStreaming ? 'Mic ATIVO' : 'Mic'}
          </motion.button>
        </div>

        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${connColor}`}>
          {connectionStatus}
        </span>
      </div>

      <div className="flex-1">
        <ElasticSlider3D
          label="Volume da Voz"
          defaultValue={volume}
          startingValue={0}
          maxValue={100}
          showValue
          valueSuffix="%"
          onValueChange={onVolumeChange}
        />
      </div>
    </motion.div>
  )
}
