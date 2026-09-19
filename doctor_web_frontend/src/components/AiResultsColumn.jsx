import React, { useState } from 'react'
import {
  AlertTriangle,
  Activity,
  Maximize2,
  Sliders,
  TrendingDown,
  FileText,
  Siren,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Eye,
  AlertCircle,
  TrendingUp,
  BarChart2
} from 'lucide-react'

export default function AiResultsColumn({
  patient,
  sinbadScore = 4,
  woundArea = 2.45,
  arucoScale = 42,
  infectionRisk = 78.4,
  convnextConfidence = 89.5,
  tissueBreakdown = { granulation: 45, slough: 35, necrotic: 20 },
  healingTime = '12 - 16 Weeks',
  triageLabel = 'URGENT TRIAGE',
  triageColor = '#f43f5e',
  siteHindfoot = true,
  ischemia = true,
  neuropathy = true,
  depthDeep = true,
  isAnalyzing = false,
  hasAnalyzed = true,
  onGenerateReport,
  onGenerateReferral
}) {
  // Safety alert acknowledgment state
  const [alertAcknowledged, setAlertAcknowledged] = useState(false)

  // Compute circular gauge parameters for Infection Risk
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(Math.max(infectionRisk, 0), 100) / 100) * circumference

  // Dynamic 6-Axis Radar Points calculation
  const isBacterialInfected = infectionRisk > 50
  const isAreaSignificant = woundArea >= 1.0

  const radarPoints = [
    { name: 'Sepsis', val: isBacterialInfected ? 95 : 25, active: isBacterialInfected, pt: isBacterialInfected ? '1' : '0' },
    { name: 'Depth', val: depthDeep ? 90 : 20, active: depthDeep, pt: depthDeep ? '1' : '0' },
    { name: 'Area', val: isAreaSignificant ? 85 : 20, active: isAreaSignificant, pt: isAreaSignificant ? '1' : '0' },
    { name: 'Ischemia', val: ischemia ? 90 : 20, active: ischemia, pt: ischemia ? '1' : '0' },
    { name: 'Site', val: siteHindfoot ? 85 : 20, active: siteHindfoot, pt: siteHindfoot ? '1' : '0' },
    { name: 'Neuro', val: neuropathy ? 95 : 20, active: neuropathy, pt: neuropathy ? '1' : '0' },
  ]

  // Calculated Caliper Major & Minor Dimensions
  const majorAxis = (Math.sqrt(Math.max(woundArea, 0.1) / Math.PI) * 2 * 1.22).toFixed(1)
  const minorAxis = (Math.sqrt(Math.max(woundArea, 0.1) / Math.PI) * 2 * 0.82).toFixed(1)

  if (isAnalyzing) {
    return (
      <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4 h-full animate-pulse select-none">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl h-16" />
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl h-48" />
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl h-28" />
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl h-28" />
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl h-28" />
        </div>
      </div>
    )
  }

  return (
    <div className="spotlight-card glass-panel-luxury rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-white/10 shadow-xl flex flex-col gap-4.5 transition-all w-full relative overflow-hidden group">
      {/* 1. Clean Single-Line Header (No Subtitle, No SOTA strip) */}
      <div className="flex items-center justify-between border-b border-[#12464e]/10 dark:border-[#223229] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-serif-luxury font-bold text-slate-900 dark:text-white tracking-wide">
            AI Diagnostic Telemetry
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/20 dark:bg-[#aceba7]/10 px-3.5 py-1.5 rounded-full border border-[#aceba7]/30 shadow-xs">
            ConvNeXt: {convnextConfidence}%
          </span>
        </div>
      </div>

      {/* 2. Middle Row: Large SINBAD Radar (Left) + 3 Vertically Stacked Metric Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Large SINBAD Radar Card (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/5 pb-2.5">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-[#12464e] dark:text-[#aceba7]" />
              <span className="text-sm font-serif-luxury font-bold text-slate-900 dark:text-slate-100 tracking-wide">
                SINBAD Clinical Radar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/20 dark:bg-[#aceba7]/15 px-3 py-1 rounded-full tracking-tight font-mono border border-[#aceba7]/35">
                Score: {sinbadScore}/6
              </span>
              <span
                className="text-xs font-bold uppercase px-3 py-1 rounded-full border"
                style={{
                  color: triageColor,
                  backgroundColor: `${triageColor}15`,
                  borderColor: `${triageColor}30`
                }}
              >
                {triageLabel}
              </span>
            </div>
          </div>

          {/* Large Radar Chart (Centered) */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Hexagon Grid Rings */}
                {[0.33, 0.66, 1].map((scale, i) => (
                  <polygon
                    key={i}
                    points="100,20 170,60 170,140 100,180 30,140 30,60"
                    transform={`scale(${scale})`}
                    transformOrigin="100 100"
                    fill="none"
                    stroke="#cbd5e1"
                    className="dark:stroke-slate-700/70"
                    strokeWidth="1.2"
                  />
                ))}
                <line x1="100" y1="100" x2="100" y2="20" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="100" y1="100" x2="170" y2="60" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="100" y1="100" x2="170" y2="140" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="100" y1="100" x2="100" y2="180" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="100" y1="100" x2="30" y2="140" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="100" y1="100" x2="30" y2="60" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

                {/* Patient Dynamic Radar Polygon */}
                <polygon
                  points={`
                    100,${20 + (100 - radarPoints[0].val) * 0.8}
                    ${170 - (100 - radarPoints[1].val) * 0.7},${60 + (100 - radarPoints[1].val) * 0.4}
                    ${170 - (100 - radarPoints[2].val) * 0.7},${140 - (100 - radarPoints[2].val) * 0.4}
                    100,${180 - (100 - radarPoints[3].val) * 0.8}
                    ${30 + (100 - radarPoints[4].val) * 0.7},${140 - (100 - radarPoints[4].val) * 0.4}
                    ${30 + (100 - radarPoints[5].val) * 0.7},${60 + (100 - radarPoints[5].val) * 0.4}
                  `}
                  fill="rgba(172, 235, 167, 0.3)"
                  stroke="#aceba7"
                  strokeWidth="2.5"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
            </div>

            {/* Clear & Legible 6 Factor Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs font-mono font-bold text-center w-full mt-3">
              <span className={`py-1.5 px-2 rounded-xl border ${radarPoints[4].active ? 'text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/20 border-[#aceba7]/40 shadow-xs' : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Site: {radarPoints[4].pt}</span>
              <span className={`py-1.5 px-2 rounded-xl border ${radarPoints[3].active ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 shadow-xs' : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Ischemia: {radarPoints[3].pt}</span>
              <span className={`py-1.5 px-2 rounded-xl border ${radarPoints[5].active ? 'text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/20 border-[#aceba7]/40 shadow-xs' : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Neuro: {radarPoints[5].pt}</span>
              <span className={`py-1.5 px-2 rounded-xl border ${radarPoints[0].active ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 shadow-xs' : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Bacterial: {radarPoints[0].pt}</span>
              <span className={`py-1.5 px-2 rounded-xl border ${radarPoints[2].active ? 'text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/20 border-[#aceba7]/40 shadow-xs' : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Area: {radarPoints[2].pt}</span>
              <span className={`py-1.5 px-2 rounded-xl border ${radarPoints[1].active ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 shadow-xs' : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Depth: {radarPoints[1].pt}</span>
            </div>
          </div>
        </div>

        {/* Right: 3 Vertically Stacked Metric Cards (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
          {/* Metric 1: Wound Area */}
          <div className="spotlight-card bg-white/90 dark:bg-[#0e120f]/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 flex flex-col justify-between shadow-sm transition-all hover:border-[#aceba7]/50">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Wound Area</span>
              <span className="p-1.5 rounded-xl bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] border border-[#aceba7]/30">
                <Target className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-center justify-between my-2">
              <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-slate-900 dark:text-white tracking-tight">
                {woundArea} <span className="text-sm font-sans font-normal text-slate-500">cm²</span>
              </div>
              <p className="text-xs font-bold text-[#12464e] dark:text-[#aceba7] font-mono bg-[#aceba7]/15 px-2.5 py-1 rounded-lg border border-[#aceba7]/25">
                {arucoScale} px/cm
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono font-semibold">
              <span>Major: {majorAxis} cm</span>
              <span>Minor: {minorAxis} cm</span>
            </div>
          </div>

          {/* Metric 2: Infection Risk */}
          <div className="spotlight-card bg-white/90 dark:bg-[#0e120f]/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 flex flex-col justify-between shadow-sm transition-all hover:border-rose-400/50">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Infection Risk</span>
              <span className="p-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                <Activity className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-center justify-between my-2">
              <div className="flex flex-col">
                <div className="text-2xl sm:text-3xl font-bold font-serif-luxury text-rose-600 dark:text-rose-400 tracking-tight">
                  {infectionRisk}%
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  Bacterial Focus Detected
                </span>
              </div>

              {/* Circular Concentric Gauge */}
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border border-dashed border-rose-400/40 animate-orbit-slow pointer-events-none" />
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 66 66">
                  <circle
                    cx="33"
                    cy="33"
                    r={radius}
                    stroke="rgba(244, 63, 94, 0.15)"
                    strokeWidth="5.5"
                    fill="transparent"
                  />
                  <circle
                    cx="33"
                    cy="33"
                    r={radius}
                    stroke="#f43f5e"
                    strokeWidth="5.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                  {Math.round(infectionRisk)}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold flex items-center justify-between">
              <span>ConvNeXt Classifier</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">High Risk</span>
            </div>
          </div>

          {/* Metric 3: UNet++ SOTA Multiclass Tissue Breakdown */}
          <div className="spotlight-card bg-white/90 dark:bg-[#0e120f]/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 flex flex-col justify-between shadow-sm transition-all hover:border-[#aceba7]/50">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">UNet++ Margins</span>
              <span className="p-1.5 rounded-xl bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] border border-[#aceba7]/30">
                <Layers className="w-4 h-4" />
              </span>
            </div>

            <div className="my-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#aceba7] shadow-xs" />
                  <span className="font-serif-luxury font-bold text-sm">Tissue Segments</span>
                </div>
                <span className="text-xs font-mono text-[#12464e] dark:text-[#aceba7] font-bold">EffNet-B4</span>
              </div>

              {/* Multi-segmented 4-class tissue bar */}
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden mt-2 border border-slate-300 dark:border-white/10 shadow-inner">
                <div
                  style={{ width: `${tissueBreakdown.granulation || 45}%` }}
                  className="bg-[#aceba7] h-full transition-all duration-500"
                  title={`Granulation: ${tissueBreakdown.granulation}%`}
                />
                <div
                  style={{ width: `${tissueBreakdown.slough || 35}%` }}
                  className="bg-amber-400 h-full transition-all duration-500"
                  title={`Slough: ${tissueBreakdown.slough}%`}
                />
                <div
                  style={{ width: `${tissueBreakdown.necrotic || 20}%` }}
                  className="bg-rose-600 h-full transition-all duration-500"
                  title={`Necrotic: ${tissueBreakdown.necrotic}%`}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between font-mono font-bold">
              <span className="text-[#12464e] dark:text-[#aceba7]">{tissueBreakdown.granulation || 45}% Gran</span>
              <span className="text-amber-600 dark:text-amber-400">{tissueBreakdown.slough || 35}% Slough</span>
              <span className="text-rose-600 dark:text-rose-400">{tissueBreakdown.necrotic || 20}% Necr</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action CTAs */}
      <div className="grid grid-cols-2 gap-3.5 pt-1">
        <button
          onClick={onGenerateReport}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#12464e] hover:bg-[#12464e]/90 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all border border-[#aceba7]/30 shadow-lg shadow-[#12464e]/20 cursor-pointer group/btn"
        >
          <FileText className="w-5 h-5 text-[#aceba7] transition-transform group-hover/btn:scale-110" />
          <span className="font-serif-luxury tracking-wide text-sm text-[#aceba7]">Clinical Report</span>
        </button>

        <button
          onClick={onGenerateReferral}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-rose-900/20 cursor-pointer group/btn border border-rose-400/30"
        >
          <Siren className="w-5 h-5 transition-transform group-hover/btn:rotate-12" />
          <span className="font-serif-luxury tracking-wide text-sm">Vascular Referral</span>
        </button>
      </div>
    </div>
  )
}
