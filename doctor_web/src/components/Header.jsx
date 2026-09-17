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
  AlertTriangle,
  Search,
  Sparkles,
  Command,
  FileCode,
  Boxes
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Header({
  patient,
  onReset,
  onOpenReportModal,
  onOpenReferralModal,
  onOpenArchitectureModal,
  onOpenFhirModal,
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

  const reportId = patient.reportId || `REP-2026-${patient.id?.replace(/[^0-9]/g, '') || '8842'}`

  return (
    <header className="glass-panel-luxury px-6 md:px-8 py-4 md:py-4.5 sticky top-0 z-20 transition-all duration-300">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
        {/* Left Side: Avatar + Clinical Identity + Triage Badge + Demographics */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Patient Profile Picture / Avatar with Bioluminescent Halo */}
          <div className="relative shrink-0 group">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#12464e]/10 via-[#aceba7]/20 to-[#12464e]/20 dark:from-[#12464e]/40 dark:to-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold text-base shadow-sm border border-[#12464e]/20 dark:border-[#aceba7]/30 transition-transform group-hover:scale-105">
              <User className="w-6 h-6 text-[#12464e] dark:text-[#aceba7]" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#aceba7] border-2 border-white dark:border-[#0e120f] rounded-full shadow-[0_0_8px_#aceba7]" />
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            {/* Top / Upper Row: Patient Name & Urgent Triage Status Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Baskervville Serif Heading (Inspired by Arounda Wellness AI) */}
              <h1 className="font-serif-luxury text-2xl md:text-[26px] font-normal text-[#12464e] dark:text-[#aceba7] tracking-tight shrink-0 flex items-center gap-2">
                <span>{patient.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#aceba7] inline-block shadow-[0_0_6px_#aceba7]" />
              </h1>

              {patient.triageLevel && (
                <span
                  className="text-[11px] px-3 py-1 rounded-full font-extrabold uppercase tracking-wider border shadow-xs shrink-0 flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${patient.triageColor || '#f43f5e'}18`,
                    borderColor: `${patient.triageColor || '#f43f5e'}50`,
                    color: patient.triageColor || '#f43f5e'
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: patient.triageColor || '#f43f5e' }} />
                  {patient.triageLevel}
                </span>
              )}

              {/* Live Backend Connection Indicator (Bioluminescent Mint Glow) */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-xs transition-colors ${
                isLiveBackend
                  ? 'bg-[#aceba7]/15 dark:bg-[#aceba7]/10 text-[#12464e] dark:text-[#aceba7] border-[#aceba7]/50 shadow-[0_0_12px_rgba(172,235,167,0.15)]'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLiveBackend ? 'bg-[#aceba7] shadow-[0_0_8px_#aceba7] animate-pulse' : 'bg-amber-500'}`} />
                <span>{isLiveBackend ? 'SOTA PyTorch AI Active' : 'Offline Simulation'}</span>
              </span>
            </div>

            {/* Downwards / Lower Row: Patient ID & Report ID side-by-side, then Demographics & History */}
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap font-medium">
              <span className="text-[11px] bg-white dark:bg-[#15221b] border border-[#12464e]/15 dark:border-[#223229] text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-lg font-bold shrink-0 shadow-2xs">
                MRN: <span className="font-mono text-[#12464e] dark:text-[#aceba7]">{patient.id}</span>
              </span>

              <span className="text-[11px] bg-[#12464e]/8 dark:bg-[#aceba7]/10 border border-[#12464e]/20 dark:border-[#aceba7]/25 text-[#12464e] dark:text-[#aceba7] px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 shrink-0">
                <Tag className="w-3 h-3 text-[#12464e] dark:text-[#aceba7]" />
                Report: <span className="font-mono">{reportId}</span>
              </span>

              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="bg-slate-100/80 dark:bg-[#15221b] px-2.5 py-0.5 rounded-lg text-slate-700 dark:text-slate-200 font-semibold shrink-0">
                {patient.age} yrs • {patient.gender}
              </span>

              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-lg font-extrabold flex items-center gap-1 shrink-0">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                HbA1c {patient.hba1c}
              </span>

              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="bg-slate-100/80 dark:bg-[#15221b] px-2.5 py-0.5 rounded-lg text-slate-700 dark:text-slate-200 font-semibold shrink-0">
                {patient.diabetesType}
              </span>

              {patient.locationLabel && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-semibold truncate bg-white dark:bg-[#15221b] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-[#223229]">
                    <MapPin className="w-3.5 h-3.5 text-[#12464e] dark:text-[#aceba7] shrink-0" />
                    {patient.locationLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Real-time Date, Time, Command Pill & Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-end shrink-0">
          {/* Real-time Streaming Pulse Indicator (Clickable to open Architecture Hub) */}
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-[11px] font-mono font-bold shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{
              backgroundColor: streamStatus?.isConnected ? 'rgba(172, 235, 167, 0.12)' : 'rgba(244, 63, 94, 0.08)',
              borderColor: streamStatus?.isConnected ? 'rgba(172, 235, 167, 0.3)' : 'rgba(244, 63, 94, 0.2)',
              color: streamStatus?.isConnected ? '#12464e' : '#f43f5e'
            }}
            title="Open 5-Pillar Architecture & Stream Telemetry Hub"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${streamStatus?.isConnected ? 'bg-[#aceba7] shadow-[0_0_8px_#aceba7] animate-ping' : 'bg-rose-500'}`} />
            <span className="dark:text-[#aceba7]">
              {streamStatus?.isConnected
                ? `${streamStatus.protocol} STREAM • ${streamStatus.latencyMs || 4}ms`
                : 'EDGE LOCAL'}
            </span>
          </button>

          {/* 5-Pillar Architecture Hub Launch Button */}
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 dark:bg-[#aceba7]/10 hover:bg-[#aceba7]/25 border border-[#aceba7]/40 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer"
            title="Inspect 5 Enterprise Pillars (PostgreSQL, WebSocket, FHIR R4, ONNX Edge, Docker)"
          >
            <Boxes className="w-3.5 h-3.5 text-[#12464e] dark:text-[#aceba7]" />
            <span className="font-extrabold">5 Pillars</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* High-Tech Live Date & Time Ribbon */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#15221b] border border-[#12464e]/12 dark:border-[#223229] text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-1.5 text-[#12464e] dark:text-[#aceba7] font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#12464e] dark:text-[#aceba7]" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedTime}</span>
            </div>
          </div>

          <ThemeToggle className="w-8 h-8" />

          {/* Reset button */}
          <button
            onClick={onReset}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#12464e] dark:hover:text-[#aceba7] bg-white dark:bg-[#15221b] border border-slate-200 dark:border-[#223229] hover:border-[#aceba7]/50 rounded-xl hover:bg-[#aceba7]/5 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs disabled:opacity-50 cursor-pointer"
            title="Reset Form to Defaults"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>

          {/* HL7 / FHIR R4 Standards Export Button (Pillar 3) */}
          <button
            onClick={onOpenFhirModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-300 dark:border-teal-700/60 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs"
            title="Export Standardized HL7 FHIR Release 4 Document Bundle (LOINC & SNOMED CT)"
          >
            <FileCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="font-extrabold">FHIR R4</span>
          </button>

          {/* Summary / Report Modal Action Button (High-Tech Mint / Deep Teal Glow) */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-4.5 py-2 text-xs font-extrabold text-slate-900 bg-gradient-to-r from-[#aceba7] via-[#8ee287] to-[#aceba7] hover:brightness-105 border border-[#aceba7] rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_15px_rgba(172,235,167,0.35)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#12464e]" />
            <span className="text-[#12464e] font-black tracking-tight">Clinical Report</span>
          </button>
        </div>
      </div>
    </header>
  )
}
