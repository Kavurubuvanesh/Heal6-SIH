import React from 'react'
import {
  FileText,
  User,
  RefreshCw,
  Clock,
  Activity
} from 'lucide-react'

export default function Header({
  patient,
  onReset,
  onOpenReportModal,
  onOpenReferralModal,
  isAnalyzing
}) {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    // Changed bg-white to glass-panel, removed heavy borders
    <header className="glass-panel border-b border-white/10 border-l-0 border-r-0 border-t-0 px-6 py-4 sticky top-0 z-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Screen Title and Clinical Breadcrumbs */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 rounded-md">
              SINBAD AI Protocol
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#00e5ff]" />
              Automated Telemetry v2.4
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Clinical Triage Assessment
          </h1>
        </div>

        {/* Center: Patient Identity Badge */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2">
          <div className="w-8 h-8 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{patient.name}</span>
              <span className="text-[10px] bg-white/10 text-white/70 font-mono px-1.5 py-0.2 rounded font-semibold">
                {patient.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <span>{patient.age}y / {patient.gender}</span>
              <span>•</span>
              <span className="text-[#ff3366] font-semibold">HbA1c {patient.hba1c}</span>
              <span>•</span>
              <span className="text-white/60 truncate max-w-[140px]">{patient.diabetesType}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onReset}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs disabled:opacity-50"
            title="Reset Form to Defaults"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#00e5ff] bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Summary</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-white/40 pl-2 border-l border-white/10">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </header>
  )
}