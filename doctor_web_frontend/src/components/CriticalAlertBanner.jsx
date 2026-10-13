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

  const isCritical = Boolean(
    alert?.isCritical ||
    (alert?.sinbadScore !== undefined && alert.sinbadScore >= 4) ||
    (alert?.calculatedSinbad !== undefined && alert.calculatedSinbad >= 4)
  )

  useEffect(() => {
    if (alert && !isMuted) {
      playMedicalAlertChime()
    }
  }, [alert])

  // Auto-dismiss standard/non-critical report arrival alerts after 15 seconds
  useEffect(() => {
    if (alert && !isCritical && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss()
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [alert, isCritical, onDismiss])

  if (!alert) return null

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Clinical Triage Alert Notification"
        initial={{ y: -80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl pointer-events-auto"
      >
        <div
          className={`relative overflow-hidden rounded-2xl bg-[#0e120f]/95 border-2 shadow-2xl backdrop-blur-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white ${
            isCritical
              ? 'border-rose-500/70 shadow-[0_12px_40px_rgba(244,63,94,0.35)]'
              : 'border-[#aceba7]/70 shadow-[0_12px_40px_rgba(172,235,167,0.25)]'
          }`}
        >
          {/* Ambient radial pulse */}
          <div
            className={`absolute -inset-1 pointer-events-none animate-pulse ${
              isCritical
                ? 'bg-gradient-to-r from-rose-600/20 via-transparent to-rose-600/20'
                : 'bg-gradient-to-r from-[#aceba7]/15 via-transparent to-[#aceba7]/15'
            }`}
          />

          {/* Left: Icon + Demographics + Report Details */}
          <div className="relative z-10 flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                isCritical
                  ? 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-[#aceba7]/20 border-[#aceba7]/50 shadow-[0_0_15px_rgba(172,235,167,0.4)]'
              }`}
            >
              {isCritical ? (
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
              ) : (
                <Sparkles className="w-6 h-6 text-[#aceba7] animate-pulse" />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isCritical
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-[#12464e] text-[#aceba7] border border-[#aceba7]/40'
                  }`}
                >
                  {isCritical ? 'CRITICAL SURGICAL EMERGENCY' : 'NEW SCREENING REPORT ARRIVED'}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    isCritical ? 'text-rose-300' : 'text-[#aceba7]'
                  }`}
                >
                  SINBAD: {alert.sinbadScore ?? 0}/6
                </span>
                {alert.reportNumber && (
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                    • {alert.reportNumber}
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>{alert.patientName || 'New Patient Intake'}</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({alert.patientId}) {alert.age ? `• ${alert.age}y` : ''}
                </span>
              </h4>

              <p className="text-xs text-slate-300 line-clamp-1">
                {alert.locationLabel || 'Plantar Foot Ulcer'} • Area:{' '}
                <strong
                  className={`font-mono ${
                    isCritical ? 'text-rose-400' : 'text-[#aceba7]'
                  }`}
                >
                  {alert.woundAreaCm2 ?? 0} cm²
                </strong>
                {alert.triageLevel && (
                  <span className="text-slate-400 ml-1.5 font-sans">
                    [{alert.triageLevel}]
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="relative z-10 flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute Audio Chime' : 'Mute Audio Chime'}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-[#aceba7]" />}
            </button>

            <button
              onClick={() => onReview(alert.patientId, alert.patientData)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                isCritical
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                  : 'bg-[#aceba7] text-[#0e120f] hover:bg-[#8ed988] shadow-[0_0_15px_rgba(172,235,167,0.4)]'
              }`}
            >
              <span>{isCritical ? 'Review Case Immediately' : 'View Live Report Now'}</span>
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
