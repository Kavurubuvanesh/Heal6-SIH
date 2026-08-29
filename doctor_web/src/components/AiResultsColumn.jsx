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
    <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-5 transition-all hover:shadow-md h-full w-full">
      {/* 1. Header with Title & Safety Strip */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
                AI Diagnostic Telemetry & Risk Index
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SINBAD Staging & 12-Week Predictive Trajectory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#f43f5e] dark:text-rose-400 bg-[#f43f5e]/10 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-lg border border-[#f43f5e]/20">
              ConvNeXt: {convnextConfidence}%
            </span>
          </div>
        </div>

        {/* Safety Alert Strip */}
        <div className="bg-[#fff1f2] dark:bg-rose-950/40 border border-[#f43f5e]/40 dark:border-rose-700/60 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#f43f5e] shrink-0 animate-pulse" />
            <p className="text-[11px] text-slate-700 dark:text-slate-200 font-semibold leading-tight">
              Clinical Telemetry: SOTA UNet++ segmentation & ArUco calibration live.
            </p>
          </div>

          <button
            onClick={() => setAlertAcknowledged(!alertAcknowledged)}
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              alertAcknowledged
                ? 'bg-emerald-600 text-white'
                : 'bg-[#f43f5e] text-white hover:bg-[#e11d48]'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>{alertAcknowledged ? 'Confirmed' : 'Acknowledge'}</span>
          </button>
        </div>
      </div>

      {/* 2. Compact SINBAD Radar & 12-Week Healing Trajectory */}
      <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              SINBAD Radar & 12-Week Healing Trajectory
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950 px-2 py-0.5 rounded-md tracking-tight font-mono">
              Score: {sinbadScore}/6
            </span>
            <span
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border"
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

        {/* 2-Column Side-by-Side: Radar on Left, Line Chart on Right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Radar Chart Column */}
          <div className="flex flex-col items-center justify-between">
            <div className="w-36 h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Hexagon Grid Rings */}
                {[0.33, 0.66, 1].map((scale, i) => (
                  <polygon
                    key={i}
                    points="100,20 170,60 170,140 100,180 30,140 30,60"
                    transform={`scale(${scale})`}
                    transform-origin="100 100"
                    fill="none"
                    stroke="#cbd5e1"
                    className="dark:stroke-slate-700"
                    strokeWidth="1"
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
                  fill="rgba(36, 149, 131, 0.4)"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
            </div>

            <div className="grid grid-cols-6 gap-1 text-[8px] font-mono font-bold text-center w-full mt-1">
              <span className={`py-1 rounded border ${radarPoints[4].active ? 'text-[#0d9488] bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800' : 'text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Site:{radarPoints[4].pt}</span>
              <span className={`py-1 rounded border ${radarPoints[3].active ? 'text-[#f43f5e] bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800' : 'text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Isch:{radarPoints[3].pt}</span>
              <span className={`py-1 rounded border ${radarPoints[5].active ? 'text-[#0d9488] bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800' : 'text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Neur:{radarPoints[5].pt}</span>
              <span className={`py-1 rounded border ${radarPoints[0].active ? 'text-[#f43f5e] bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800' : 'text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Bact:{radarPoints[0].pt}</span>
              <span className={`py-1 rounded border ${radarPoints[2].active ? 'text-[#0d9488] bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800' : 'text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Area:{radarPoints[2].pt}</span>
              <span className={`py-1 rounded border ${radarPoints[1].active ? 'text-[#f43f5e] bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800' : 'text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>Depth:{radarPoints[1].pt}</span>
            </div>
          </div>

          {/* Area Reduction Trajectory Line Chart */}
          <div className="flex flex-col justify-between h-full">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Area Reduction Trajectory</span>
              <span className="text-[9.5px] font-bold text-[#f43f5e] bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded border border-rose-200">
                12-Wk Horizon
              </span>
            </div>

            <div className="w-full h-32 relative my-1">
              <svg className="w-full h-full" viewBox="0 0 240 100" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="240" y2="20" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="1" />
                <line x1="0" y1="50" x2="240" y2="50" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="1" />
                <line x1="0" y1="80" x2="240" y2="80" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="1" />

                <path
                  d="M 20,20 C 60,25 120,45 220,70"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                <path
                  d="M 20,20 C 60,35 120,75 220,95"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                />

                <circle cx="20" cy="20" r="3.5" fill="#f43f5e" />
                <text x="25" y="16" fill="#f43f5e" fontSize="8" fontWeight="bold">W0: {woundArea}cm²</text>

                <circle cx="220" cy="95" r="3.5" fill="#0d9488" />
                <text x="175" y="90" fill="#0d9488" fontSize="8" fontWeight="bold">W12: Closed</text>
              </svg>
            </div>

            <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-1 bg-[#0d9488] rounded-full" />
                <span>Heal6 ({healingTime})</span>
              </div>
              <div className="flex items-center gap-1 font-medium text-slate-400">
                <span className="w-2.5 h-0.5 bg-slate-400 border-b border-dashed" />
                <span>Standard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Combined 3-Metric Sub-Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Metric 1: Wound Area */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Wound Area</span>
            <span className="p-1 rounded-md bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300">
              <Target className="w-3 h-3" />
            </span>
          </div>

          <div className="my-0.5">
            <div className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {woundArea} <span className="text-xs font-semibold text-slate-500">cm²</span>
            </div>
            <p className="text-[10px] font-semibold text-[#0d9488] dark:text-teal-400 mt-0.5 font-mono">
              Calibrated: {arucoScale} px/cm
            </p>
          </div>

          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[9.5px] text-slate-400 flex items-center justify-between font-mono">
            <span>Major: {majorAxis}cm</span>
            <span>Minor: {minorAxis}cm</span>
          </div>
        </div>

        {/* Metric 2: Infection Risk */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Infection Risk</span>
            <span className="p-1 rounded-md bg-[#f43f5e]/10 dark:bg-rose-950 text-[#f43f5e] dark:text-rose-400">
              <Activity className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-center justify-between my-0.5">
            <div className="flex flex-col">
              <div className="text-lg font-black text-[#f43f5e] dark:text-rose-400 tracking-tight">
                {infectionRisk}%
              </div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                Bacterial
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 transform -rotate-90" viewBox="0 0 66 66">
                <circle
                  cx="33"
                  cy="33"
                  r={radius}
                  stroke="#fee2e2"
                  className="dark:stroke-slate-800"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="33"
                  cy="33"
                  r={radius}
                  stroke="#f43f5e"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-[9px] font-black text-slate-700 dark:text-slate-200">
                {Math.round(infectionRisk)}%
              </span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[9.5px] text-slate-400 font-mono">
            ConvNeXt activation
          </div>
        </div>

        {/* Metric 3: UNet++ SOTA Multiclass Tissue Breakdown */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">UNet++ SOTA</span>
            <span className="p-1 rounded-md bg-teal-50 dark:bg-teal-950 text-[#0d9488] dark:text-teal-400">
              <Layers className="w-3 h-3" />
            </span>
          </div>

          <div className="my-0.5">
            <div className="text-[10.5px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]" />
                <span>Tissue Classes</span>
              </div>
              <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">EffNet-B4</span>
            </div>

            {/* Multi-segmented 4-class tissue bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden mt-1.5 border border-slate-300 dark:border-slate-600 shadow-inner">
              <div
                style={{ width: `${tissueBreakdown.granulation || 45}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Granulation (Healthy): ${tissueBreakdown.granulation}%`}
              />
              <div
                style={{ width: `${tissueBreakdown.slough || 35}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`Slough (Infection): ${tissueBreakdown.slough}%`}
              />
              <div
                style={{ width: `${tissueBreakdown.necrotic || 20}%` }}
                className="bg-rose-600 h-full transition-all duration-500"
                title={`Necrotic (Amputation Risk): ${tissueBreakdown.necrotic}%`}
              />
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[9px] text-slate-500 flex items-center justify-between font-semibold">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{tissueBreakdown.granulation || 45}% Gran</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold">{tissueBreakdown.slough || 35}% Slough</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">{tissueBreakdown.necrotic || 20}% Necr</span>
          </div>
        </div>
      </div>

      {/* 4. Action CTAs */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={onGenerateReport}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-sm cursor-pointer"
        >
          <FileText className="w-4 h-4 text-[#0d9488]" />
          <span>Clinical Report</span>
        </button>

        <button
          onClick={onGenerateReferral}
          className="w-full py-3 px-4 rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Siren className="w-4 h-4" />
          <span>Vascular Referral</span>
        </button>
      </div>
    </div>
  )
}
