import React, { useState } from 'react'
import {
  VideoCamera,
  X,
  PlayCircle,
  PauseCircle,
  PhoneCall,
  Printer,
  CheckSquare,
  Square,
  ShieldCheck,
  Heartbeat,
  Info
} from '@phosphor-icons/react'

export default function CareModal({ isOpen, onClose, data }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoProgress, setVideoProgress] = useState(45)
  const [checkedSteps, setCheckedSteps] = useState({
    1: true,
    2: false,
    3: false
  })
  const [callInitiated, setCallInitiated] = useState(false)

  if (!isOpen) return null

  const toggleStep = (num) => {
    setCheckedSteps(prev => ({ ...prev, [num]: !prev[num] }))
  }

  const handleNursingCall = () => {
    setCallInitiated(true)
    setTimeout(() => setCallInitiated(false), 5000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-teal-500/20 max-h-[90vh] flex flex-col">

        {/* Modal Header */}
        <div className="bg-teal-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <VideoCamera weight="bold" className="text-2xl" />
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Home Care & Pulse Examination Guide</h3>
              <p className="text-xs text-teal-100">Step-by-step ischemia & offloading protocols</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold"
          >
            <X weight="bold" className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {callInitiated && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <PhoneCall weight="fill" className="text-xl text-emerald-600 animate-bounce" />
              <div>
                <p>Connecting to 24/7 Heal6 Nursing Hotline (1-800-555-HEAL)...</p>
                <p className="text-[10px] text-emerald-700 font-normal">A triage nurse is reviewing your scan telemetry now.</p>
              </div>
            </div>
          )}

          {/* Interactive Simulated Video Player */}
          <div
            onClick={() => setIsPlaying(!isPlaying)}
            className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center group cursor-pointer border border-slate-800 shadow-inner"
          >
            {/* Clinical demonstration graphic */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950 flex items-center justify-center">
              <Heartbeat weight="thin" className="text-teal-500/20 text-9xl absolute" />
            </div>

            {/* Play/Pause Button */}
            <div className="w-14 h-14 bg-teal-600/90 hover:bg-teal-500 text-white rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(13,148,136,0.5)]">
              {isPlaying ? (
                <PauseCircle weight="fill" className="text-3xl" />
              ) : (
                <PlayCircle weight="fill" className="text-3xl" />
              )}
            </div>

            {/* Video Overlays */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-teal-300 border border-teal-500/30 z-10">
              {isPlaying ? 'PLAYING TUTORIAL' : 'HOW TO PALPATE DP PULSE'}
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1 z-10">
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  style={{ width: `${isPlaying ? 72 : videoProgress}%` }}
                  className="h-full bg-teal-400 transition-all duration-500"
                />
              </div>
              <div className="flex justify-between text-[10.5px] text-slate-300 font-mono pt-1">
                <span>Checking Dorsalis Pedis Pulse</span>
                <span>{isPlaying ? '02:14 / 03:45' : '03:45'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl space-y-3">
            <h4 className="font-extrabold text-teal-900 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Step-by-Step Daily Checklist:</span>
              <span className="text-[10px] text-teal-700 font-mono">Tap item to check off</span>
            </h4>

            <div className="space-y-2">
              <div
                onClick={() => toggleStep(1)}
                className="flex items-start gap-2.5 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-teal-200/60 hover:bg-teal-50/50 transition-colors"
              >
                {checkedSteps[1] ? (
                  <CheckSquare weight="fill" className="text-teal-600 text-lg shrink-0 mt-0.5" />
                ) : (
                  <Square weight="regular" className="text-slate-400 text-lg shrink-0 mt-0.5" />
                )}
                <div className="text-xs text-slate-800">
                  <strong>1. Total Offloading:</strong> Keep 100% weight off the ulcerated foot. Use pneumatic walker or crutches.
                </div>
              </div>

              <div
                onClick={() => toggleStep(2)}
                className="flex items-start gap-2.5 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-teal-200/60 hover:bg-teal-50/50 transition-colors"
              >
                {checkedSteps[2] ? (
                  <CheckSquare weight="fill" className="text-teal-600 text-lg shrink-0 mt-0.5" />
                ) : (
                  <Square weight="regular" className="text-slate-400 text-lg shrink-0 mt-0.5" />
                )}
                <div className="text-xs text-slate-800">
                  <strong>2. Leg Elevation:</strong> Elevate the foot above chest level when sitting or lying down to reduce edema.
                </div>
              </div>

              <div
                onClick={() => toggleStep(3)}
                className="flex items-start gap-2.5 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-teal-200/60 hover:bg-teal-50/50 transition-colors"
              >
                {checkedSteps[3] ? (
                  <CheckSquare weight="fill" className="text-teal-600 text-lg shrink-0 mt-0.5" />
                ) : (
                  <Square weight="regular" className="text-slate-400 text-lg shrink-0 mt-0.5" />
                )}
                <div className="text-xs text-slate-800">
                  <strong>3. Keep Wound Clean & Dry:</strong> Avoid soaking in foot baths; apply sterile saline wash and prescribed dressings.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5 shrink-0">
          <button
            onClick={handleNursingCall}
            className="flex-1 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <PhoneCall weight="bold" className="text-base" />
            <span>Call 24/7 Triage Nurse</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer weight="bold" className="text-base text-teal-600" />
            <span>Print Home Instructions</span>
          </button>
        </div>
      </div>
    </div>
  )
}