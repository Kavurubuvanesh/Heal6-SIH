import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ChevronRight, X, Volume2, VolumeX, ShieldAlert, Sparkles } from 'lucide-react'

// Synthesizes a soft, high-tech dual-frequency medical alert chime (A5 -> E6) using Web Audio API
function playMedicalAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Tone 1: 880 Hz (A5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    gain1.gain.setValueAtTime(0.09, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.3)

    // Tone 2: 1318.5 Hz (E6)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1318.5, now + 0.12)
    gain2.gain.setValueAtTime(0.10, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.55)
  } catch (e) {
    // Audio autoplay restrictions will silently bypass
  }
}

export default function CriticalAlertBanner({ alert, onReview, onDismiss }) {
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (alert && !isMuted) {
      playMedicalAlertChime()
    }
  }, [alert])

  if (!alert) return null

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Critical Limb Salvage Triage Alert"
        initial={{ y: -80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#0e120f]/95 border-2 border-rose-500/70 shadow-[0_12px_40px_rgba(244,63,94,0.35)] backdrop-blur-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
          {/* Ambient red radial pulse */}
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-600/20 via-transparent to-rose-600/20 pointer-events-none animate-pulse" />

          {/* Left: Critical Icon + Demographics */}
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500 text-white tracking-wider animate-pulse">
                  CRITICAL SURGICAL EMERGENCY
                </span>
                <span className="text-[11px] font-mono text-rose-300">
                  SINBAD: {alert.sinbadScore}/6
                </span>
              </div>

              <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>{alert.patientName || 'Emergency Patient'}</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({alert.patientId}) • {alert.age}y
                </span>
              </h4>

              <p className="text-xs text-slate-300 line-clamp-1">
                {alert.locationLabel} • Area: <strong className="text-rose-400 font-mono">{alert.woundAreaCm2 || 3.5} cm²</strong>
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="relative z-10 flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute Audio Chime' : 'Mute Audio Chime'}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-[#aceba7]" />}
            </button>

            <button
              onClick={() => onReview(alert.patientId)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all cursor-pointer"
            >
              <span>Review Case Immediately</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDismiss}
              title="Dismiss Alert"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
