import React, { useState, useEffect } from 'react'
import {
  FileText,
  User,
  RefreshCw,
  Clock,
  Calendar,
  Tag,
  Activity,
  MapPin,
  Flame,
  AlertTriangle
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Header({
  patient,
  onReset,
  onOpenReportModal,
  onOpenReferralModal,
  isAnalyzing,
  isLiveBackend = false
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  const reportId = patient.reportId || `REP-2026-${patient.id?.replace(/[^0-9]/g, '') || '8842'}`

  return (
    <header className="bg-white/85 dark:bg-[#070e14]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 md:px-8 py-4 md:py-5 sticky top-0 z-20 shadow-xs transition-colors duration-200">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
        {/* Left Side: Avatar + Clinical Identity + Triage Badge + Demographics */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Patient Profile Picture / Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0d9488]/15 to-[#0284c7]/15 dark:from-teal-950/60 dark:to-cyan-950/40 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-bold text-base shadow-2xs border border-teal-500/25 dark:border-teal-800">
              <User className="w-6 h-6" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            {/* Top / Upper Row: Patient Name & Urgent Triage Status Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight shrink-0">
                {patient.name}
              </h1>

              {patient.triageLevel && (
                <span
                  className="text-[11px] px-2.5 py-0.5 rounded-lg font-black uppercase tracking-wide border shadow-2xs shrink-0"
                  style={{
                    backgroundColor: `${patient.triageColor || '#f43f5e'}15`,
                    borderColor: `${patient.triageColor || '#f43f5e'}40`,
                    color: patient.triageColor || '#f43f5e'
                  }}
                >
                  {patient.triageLevel}
                </span>
              )}

              {/* Live Backend Connection Indicator */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border shadow-2xs ${
                isLiveBackend
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{isLiveBackend ? 'Live ML Backend Connected' : 'Offline Telemetry Simulation'}</span>
              </span>
            </div>

            {/* Downwards / Lower Row: Patient ID & Report ID side-by-side, then Demographics & History */}
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap font-medium">
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md font-bold shrink-0">
                Patient ID: <span className="font-mono text-[#0d9488] dark:text-teal-400">{patient.id}</span>
              </span>

              <span className="text-[11px] bg-teal-500/10 dark:bg-teal-500/15 border border-teal-600/25 dark:border-teal-400/30 text-[#0f766e] dark:text-teal-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0">
                <Tag className="w-3 h-3" />
                Report ID: <span className="font-mono">{reportId}</span>
              </span>

              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-200 font-semibold shrink-0">
                {patient.age} yrs • {patient.gender}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200/90 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1 shrink-0">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                HbA1c {patient.hba1c}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-200 font-semibold shrink-0">
                {patient.diabetesType}
              </span>
              {patient.locationLabel && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#0d9488] shrink-0" />
                    {patient.locationLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Real-time Date, Time & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end shrink-0">
          {/* Live Date & Time Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold shadow-2xs">
            <div className="flex items-center gap-1 text-[#0d9488] dark:text-teal-400 font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-100 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedTime}</span>
            </div>
          </div>

          <ThemeToggle className="w-8 h-8" />

          <button
            onClick={onReset}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-teal-500/30 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Reset Form to Defaults"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-[#0d9488] to-[#0284c7] hover:from-[#0f766e] hover:to-[#0369a1] border border-teal-400/30 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-teal-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Summary</span>
          </button>
        </div>
      </div>
    </header>
  )
}
