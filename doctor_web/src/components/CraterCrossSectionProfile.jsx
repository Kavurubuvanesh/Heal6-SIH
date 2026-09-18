import React, { useState } from 'react'
import { Activity, AlertTriangle, Crosshair, ArrowDown } from 'lucide-react'

export default function CraterCrossSectionProfile({
  profile = [],
  maxDepthMm = 2.4,
  isDeep = false,
  className = ''
}) {
  const [hoverPoint, setHoverPoint] = useState(null)

  // Generate fallback synthetic profile if array is empty
  const safeProfile = (profile && profile.length > 0)
    ? profile
    : Array.from({ length: 40 }, (_, i) => {
        const x = Number((i * 0.7).toFixed(1))
        const center = 14
        const dist = Math.abs(x - center)
        const depth = Math.max(0, (maxDepthMm * Math.exp(-(dist * dist) / 32)))
        return { x_mm: x, depth_mm: Number(depth.toFixed(2)) }
      })

  const xValues = safeProfile.map(p => p.x_mm)
  const depthValues = safeProfile.map(p => p.depth_mm)

  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues, 10)
  const maxD = Math.max(...depthValues, maxDepthMm, 4.5)

  // SVG viewBox coordinates
  const svgWidth = 500
  const svgHeight = 180
  const padding = { top: 25, right: 30, bottom: 35, left: 45 }

  const plotW = svgWidth - padding.left - padding.right
  const plotH = svgHeight - padding.top - padding.bottom

  const scaleX = (x) => padding.left + ((x - minX) / (maxX - minX || 1)) * plotW
  // Invert Y so 0mm (skin surface) is at top of plot, deep crater is down
  const scaleY = (depth) => padding.top + (depth / maxD) * plotH

  // Build SVG Path string
  const points = safeProfile.map(p => `${scaleX(p.x_mm)},${scaleY(p.depth_mm)}`)
  const linePath = `M ${points.join(' L ')}`

  // Closed area polygon down from surface line (0 mm)
  const startX = scaleX(safeProfile[0].x_mm)
  const endX = scaleX(safeProfile[safeProfile.length - 1].x_mm)
  const surfaceY = scaleY(0)
  const areaPath = `M ${startX},${surfaceY} L ${points.join(' L ')} L ${endX},${surfaceY} Z`

  // 4.0 mm probe-to-bone threshold line Y
  const threshold4mmY = scaleY(4.0)

  return (
    <div className={`p-4 rounded-2xl bg-white/80 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] shadow-xs flex flex-col gap-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#223229] pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Ulcer Crater Transect Profile
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              1D topographical cross-section along the principal ulcer excavation axis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDeep || maxDepthMm >= 4.0 ? (
            <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-black flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Deep Subcutaneous (≥ 4mm)</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-[#aceba7] text-[10px] font-mono font-black">
              Superficial Margin (&lt; 4mm)
            </span>
          )}
        </div>
      </div>

      {/* SVG Elevation Chart */}
      <div className="relative w-full aspect-[500/180] select-none bg-slate-950/40 dark:bg-slate-950/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          onMouseLeave={() => setHoverPoint(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth
            // Find closest sample point
            let closest = null
            let minDist = Infinity
            safeProfile.forEach(p => {
              const px = scaleX(p.x_mm)
              const d = Math.abs(px - mouseX)
              if (d < minDist) {
                minDist = d
                closest = p
              }
            })
            if (minDist < 40) setHoverPoint(closest)
            else setHoverPoint(null)
          }}
        >
          <defs>
            {/* Crater Cavity Fill Gradient */}
            <linearGradient id="craterFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.65" />
            </linearGradient>

            {/* Transect Line Stroke Gradient */}
            <linearGradient id="craterStrokeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal depth increments) */}
          {[0, 2, 4, 6].map(d => {
            if (d > maxD) return null
            const y = scaleY(d)
            return (
              <g key={`grid-${d}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                  strokeDasharray={d === 0 ? "none" : "2 3"}
                />
                <text
                  x={padding.left - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="rgba(255,255,255,0.5)"
                >
                  {d === 0 ? "0mm" : `-${d}mm`}
                </text>
              </g>
            )
          })}

          {/* Healthy skin surface reference line */}
          <line
            x1={padding.left}
            y1={surfaceY}
            x2={svgWidth - padding.right}
            y2={surfaceY}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text
            x={svgWidth - padding.right}
            y={surfaceY - 6}
            textAnchor="end"
            fontSize="8.5"
            fontFamily="sans-serif"
            fontWeight="bold"
            fill="#10b981"
          >
            Skin Surface Baseline (0 mm)
          </text>

          {/* 4mm Bone/Deep Fascia Critical Threshold Line */}
          {threshold4mmY <= svgHeight - padding.bottom && (
            <g>
              <line
                x1={padding.left}
                y1={threshold4mmY}
                x2={svgWidth - padding.right}
                y2={threshold4mmY}
                stroke="#f43f5e"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.85"
              />
              <text
                x={svgWidth - padding.right}
                y={threshold4mmY - 5}
                textAnchor="end"
                fontSize="8"
                fontFamily="sans-serif"
                fontWeight="bold"
                fill="#f43f5e"
              >
                4.0mm Fascial / Bone Barrier
              </text>
            </g>
          )}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#craterFillGrad)" />

          {/* Excavation Profile Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#craterStrokeGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Peak Depression Marker */}
          {safeProfile.length > 0 && (() => {
            const deepest = safeProfile.reduce((prev, curr) => (curr.depth_mm > prev.depth_mm ? curr : prev), safeProfile[0])
            const px = scaleX(deepest.x_mm)
            const py = scaleY(deepest.depth_mm)
            return (
              <g>
                <circle cx={px} cy={py} r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx={px} cy={py} r="8" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6">
                  <animate attributeName="r" values="4.5;10;4.5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            )
          })()}

          {/* Hover Crosshair Marker */}
          {hoverPoint && (() => {
            const hx = scaleX(hoverPoint.x_mm)
            const hy = scaleY(hoverPoint.depth_mm)
            return (
              <g>
                <line x1={hx} y1={padding.top} x2={hx} y2={svgHeight - padding.bottom} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx={hx} cy={hy} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                <rect x={Math.min(Math.max(hx - 45, 10), svgWidth - 100)} y={hy - 26} width="90" height="20" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" opacity="0.95" />
                <text x={Math.min(Math.max(hx, 55), svgWidth - 55)} y={hy - 13} textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#ffffff">
                  {hoverPoint.x_mm}mm : -{hoverPoint.depth_mm}mm
                </text>
              </g>
            )
          })()}

          {/* X-axis distance labels */}
          {[minX, (minX + maxX) / 2, maxX].map((val, idx) => (
            <text
              key={`x-label-${idx}`}
              x={scaleX(val)}
              y={svgHeight - 12}
              textAnchor="middle"
              fontSize="9"
              fontFamily="monospace"
              fill="rgba(255,255,255,0.4)"
            >
              {val.toFixed(0)}mm
            </text>
          ))}
        </svg>
      </div>

      {/* Footer Metrics Summary */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1c2921] border border-slate-200 dark:border-[#2b3d32] text-center">
          <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Max Depth</span>
          <span className="text-sm font-black font-mono text-[#f43f5e]">{maxDepthMm} mm</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1c2921] border border-slate-200 dark:border-[#2b3d32] text-center">
          <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Transect Span</span>
          <span className="text-sm font-black font-mono text-teal-600 dark:text-[#aceba7]">{maxX.toFixed(1)} mm</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1c2921] border border-slate-200 dark:border-[#2b3d32] text-center">
          <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Excavation Index</span>
          <span className="text-sm font-black font-mono text-amber-500">
            {((maxDepthMm / (maxX || 1)) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}
