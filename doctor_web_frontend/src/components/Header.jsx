import React, { useState, useEffect } from 'react'
import {
  User,
  RefreshCw,
  Clock,
  Calendar,
  Tag,
  MapPin,
  Flame,
  Plus,
  Sparkles,
  Lock,
  FileText
} from 'lucide-react'

export default function Header({
  patient,
  loggedInDoctor,
  onOpenAuthModal,
  onReset,
  onOpenReportModal,
  onOpenReferralModal,
  onOpenArchitectureModal,
  onOpenFhirModal,
  onOpenScribeModal,
  onOpenFederatedModal,
  isAnalyzing,
  isLiveBackend = false,
  streamStatus = { isConnected: false, protocol: 'DISCONNECTED', latencyMs: 0 }
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

  const reportId = patient.reportId || `REP-2026-${patient.id?.replace(/[^0-9]/g, '') || '9311'}`

  // Format triage string to clean Sentence case (e.g. "Critical surgical emergency")
  const formatTriageText = (str) => {
    if (!str) return 'Critical surgical emergency'
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  return (
    <header className="px-4 sm:px-6 py-3.5 sticky top-0 z-20 transition-all duration-300 bg-[#f4f8f5]/90 dark:bg-[#0e120f]/90 backdrop-blur-xl border-b border-[#12464e]/10 dark:border-[#223229]">
      {/* Patient Header Card */}
      <div className="w-full rounded-2xl bg-white/90 dark:bg-[#141c17]/95 border border-slate-200/90 dark:border-[#223229] p-3.5 sm:p-4 shadow-sm flex flex-col gap-3">
        
        {/* ROW 1: Identity & Status Up Top + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Avatar + Identity + Status Badges */}
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            {/* Avatar with Status Dot */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-[#1f3a2c] border border-emerald-500/30 text-emerald-600 dark:text-[#aceba7] flex items-center justify-center font-bold text-sm shadow-2xs">
                <User className="w-5 h-5 text-emerald-600 dark:text-[#aceba7]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 dark:bg-[#aceba7] border-2 border-white dark:border-[#141c17] rounded-full shadow-[0_0_6px_#aceba7]" />
            </div>

            {/* Patient Name */}
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight shrink-0">
              {patient.name}
            </h1>

            {/* Badges Inline Strip */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Triage Level Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 dark:border-rose-800/60 text-rose-600 dark:text-rose-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                <span>{formatTriageText(patient.triageLevel)}</span>
              </span>

              {/* Simulation / AI Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border shrink-0 ${
                isLiveBackend
                  ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveBackend ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'}`} />
                <span>{isLiveBackend ? 'PyTorch AI active' : 'Offline simulation'}</span>
              </span>

              {/* Doctor Status Badge */}
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-100 dark:bg-[#101813] border-slate-300/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
                title={`Physician: ${loggedInDoctor?.name || 'Dr. Sharma'}\nClick to switch doctor profile`}
              >
                <User className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                <span className="font-semibold">{loggedInDoctor?.name || 'Dr. Sharma'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800/80 font-bold">
                  H5256
                </span>
              </button>
            </div>
          </div>

          {/* Right: Date/Time + Reset + Clinical Report CTA */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {/* Live Date & Time */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-[#0e120f]/80 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 font-medium shadow-2xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={onReset}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 dark:bg-[#0e120f]/80 border border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Reset Form to Defaults"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>

            {/* Primary CTA: Clinical Report */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#1f6343] hover:bg-[#257751] dark:bg-[#1f6343] dark:hover:bg-[#257751] border border-[#2d8d5f] rounded-xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Clinical Report</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Metadata as a Single Aligned Strip */}
        <div className="flex items-center gap-3.5 flex-wrap text-xs text-slate-600 dark:text-slate-300 pt-2.5 border-t border-slate-200/80 dark:border-white/10">
          {/* MRN */}
          <div className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">MRN</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{patient.id}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>

          {/* Report ID */}
          <div className="inline-flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Report</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{reportId}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>

          {/* Age & Sex */}
          <span className="font-bold text-slate-900 dark:text-white">
            {patient.age} yrs · {patient.gender}
          </span>

          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>

          {/* HbA1c */}
          <div className="inline-flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-amber-600 dark:text-amber-400 font-medium">HbA1c</span>
            <span className="font-bold text-amber-700 dark:text-amber-300 font-mono">{patient.hba1c}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-700 select-none">|</span>

          {/* Diabetes Type */}
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {patient.diabetesType}
          </span>

          {patient.locationLabel && (
            <>
              <span className="text-slate-300 dark:text-slate-700 select-none">|</span>

              {/* Location */}
              <div className="inline-flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                  {patient.locationLabel}
                </span>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  )
}

