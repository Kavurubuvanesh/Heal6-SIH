import React from 'react'
import { Activity, Sparkles, TrendingDown } from 'lucide-react'

export default function SinbadTrajectoryCard({
  sinbadScore = 4,
  woundArea = 2.45,
  siteHindfoot = true,
  ischemia = true,
  neuropathy = true,
  depthDeep = true,
  infectionRisk = 78.4
}) {
  return (
    <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:shadow-md w-full">
      {/* Header Bar */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
              SINBAD Radar & 12-Week Healing Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multidimensional risk topology & predictive area reduction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/60 px-3.5 py-1.5 rounded-xl border border-[#0d9488]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>IWGDF 2026 Telemetry</span>
        </div>
      </div>

      {/* Content: 6-Axis Radar (Left) + 12-Wk Trajectory (Right) */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* 6-Axis SINBAD Radar Chart */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between items-center shadow-2xs">
          <div className="w-full flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">6-Axis Risk Topology</span>
            <span className="text-xs font-bold text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950 px-2.5 py-0.5 rounded-md tracking-tight">
              Score: {sinbadScore}/6
            </span>
          </div>

          {/* SVG 6-Axis Radar Graphic */}
          <div className="w-48 h-48 relative flex items-center justify-center my-2">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {/* Hexagon Grid Rings */}
              {[0.25, 0.5, 0.75, 1].map((scale, i) => (
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
              {/* Axis lines */}
              <line x1="100" y1="100" x2="100" y2="20" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="100" y1="100" x2="170" y2="60" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="100" y1="100" x2="170" y2="140" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="100" y1="100" x2="100" y2="180" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="100" y1="100" x2="30" y2="140" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="100" y1="100" x2="30" y2="60" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

              {/* Patient SINBAD Radar Polygon */}
              <polygon
                points="100,25 165,65 160,135 100,175 35,135 40,65"
                fill="rgba(36, 149, 131, 0.35)"
                stroke="#0d9488"
                strokeWidth="2.5"
              />

              {/* Data Points */}
              <circle cx="100" cy="25" r="4" fill="#0d9488" />
              <circle cx="165" cy="65" r="4" fill="#0d9488" />
              <circle cx="160" cy="135" r="4" fill="#0d9488" />
              <circle cx="100" cy="175" r="4" fill="#0d9488" />
              <circle cx="35" cy="135" r="4" fill="#0d9488" />
              <circle cx="40" cy="65" r="4" fill="#0d9488" />
            </svg>
          </div>

          <div className="grid grid-cols-6 gap-1.5 text-[9.5px] text-slate-600 dark:text-slate-400 font-bold text-center w-full mt-1">
            <span className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" title="Site: Hindfoot / Midfoot (1 pt)">
              Site: {siteHindfoot ? '1' : '0'}
            </span>
            <span className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" title="Ischemia: Reduced pulses (1 pt)">
              Isch: {ischemia ? '1' : '0'}
            </span>
            <span className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" title="Neuropathy: Loss of sensation (1 pt)">
              Neur: {neuropathy ? '1' : '0'}
            </span>
            <span className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" title="Bacterial: Infection present (1 pt)">
              Bact: {infectionRisk > 50 ? '1' : '0'}
            </span>
            <span className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" title="Area: >= 1 cm² (1 pt)">
              Area: {woundArea >= 1.0 ? '1' : '0'}
            </span>
            <span className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs" title="Depth: Deep tissue/bone (1 pt)">
              Depth: {depthDeep ? '1' : '0'}
            </span>
          </div>
        </div>

        {/* Wound Area Healing Trajectory Line Chart */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="w-full flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Area Reduction Trajectory</span>
            <span className="text-[10px] font-bold text-[#f43f5e] dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
              12-Wk Horizon
            </span>
          </div>

          {/* Line Chart SVG */}
          <div className="w-full h-44 relative my-1">
            <svg className="w-full h-full" viewBox="0 0 240 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="240" y2="20" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="1" />
              <line x1="0" y1="50" x2="240" y2="50" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="1" />
              <line x1="0" y1="80" x2="240" y2="80" stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="1" />

              {/* Standard of Care Curve */}
              <path
                d="M 20,20 C 60,25 120,45 220,70"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="3 3"
              />

              {/* Heal6 Multidisciplinary Protocol Curve */}
              <path
                d="M 20,20 C 60,35 120,75 220,95"
                fill="none"
                stroke="#0d9488"
                strokeWidth="3"
              />

              {/* Baseline Today Point */}
              <circle cx="20" cy="20" r="4" fill="#f43f5e" />
              <text x="25" y="16" fill="#f43f5e" fontSize="8" fontWeight="bold">W0: {woundArea}cm²</text>

              {/* 12-Week Target Point */}
              <circle cx="220" cy="95" r="4" fill="#0d9488" />
              <text x="180" y="90" fill="#0d9488" fontSize="8" fontWeight="bold">W12: Closed</text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-3 h-1 bg-[#0d9488] rounded-full" />
              <span>Heal6 Protocol</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-500">
              <span className="w-3 h-0.5 bg-slate-400 border-b border-dashed" />
              <span>Standard Care</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
