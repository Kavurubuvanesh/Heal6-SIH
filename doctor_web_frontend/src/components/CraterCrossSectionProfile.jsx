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
    : maxDepthMm === 0
    ? Array.from({ length: 40 }, (_, i) => ({ x_mm: Number((i * 0.7).toFixed(1)), depth_mm: 0.0 }))
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
  const maxX = Math.max(...xValues, 25)
  const maxD = maxDepthMm === 0 ? 4.0 : Math.max(...depthValues, maxDepthMm, 4.5)

  // SVG viewBox coordinates
  const svgWidth = 500
  const svgHeight = 220
  const padding = { top: 28, right: 30, bottom: 35, left: 45 }

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
    <div className={`p-4 rounded-2xl bg-white/80 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] shadow-xs flex flex-col justify-between flex-1 h-full gap-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#223229] pb-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 whitespace-nowrap">
            Ulcer Crater Profile
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDeep || maxDepthMm >= 4.0 ? (
            <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>Deep (≥ 4mm)</span>
            </span>
          ) : maxDepthMm === 0 ? (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-[#aceba7] text-[10px] font-mono font-bold shrink-0 whitespace-nowrap">
              Intact Skin (0.0mm)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-[#aceba7] text-[10px] font-mono font-bold shrink-0 whitespace-nowrap">
              Superficial (&lt; 4mm)
            </span>
          )}
        </div>
      </div>

      {/* SVG Elevation Chart */}
      <div className="relative w-full aspect-[500/220] select-none bg-slate-100/90 dark:bg-slate-950/90 rounded-xl overflow-hidden border border-slate-300/80 dark:border-slate-800 shadow-inner flex-1">
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
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.75" />
            </linearGradient>

            {/* Transect Line Stroke Gradient */}
            <linearGradient id="craterStrokeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#e11d48" />
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
                  className="stroke-slate-300 dark:stroke-slate-800"
                  strokeWidth="1"
                  strokeDasharray={d === 0 ? "none" : "3 3"}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4.5}
                  textAnchor="end"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="800"
                  className="fill-slate-800 dark:fill-slate-100"
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
            stroke="#059669"
            strokeWidth="1.8"
            strokeDasharray="4 2"
          />
          <text
            x={svgWidth - padding.right}
            y={surfaceY - 8}
            textAnchor="end"
            fontSize="11"
            fontFamily="sans-serif"
            fontWeight="800"
            className="fill-emerald-800 dark:fill-emerald-300"
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
                stroke="#e11d48"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.95"
              />
              <text
                x={svgWidth - padding.right}
                y={threshold4mmY - 6}
                textAnchor="end"
                fontSize="11"
                fontFamily="sans-serif"
                fontWeight="800"
                className="fill-rose-700 dark:fill-rose-300"
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
                <circle cx={px} cy={py} r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                <circle cx={px} cy={py} r="9" fill="none" stroke="#e11d48" strokeWidth="1.2" opacity="0.7">
                  <animate attributeName="r" values="5;11;5" dur="2s" repeatCount="indefinite" />
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
                <line x1={hx} y1={padding.top} x2={hx} y2={svgHeight - padding.bottom} stroke="#0284c7" strokeWidth="1.2" strokeDasharray="2 2" />
                <circle cx={hx} cy={hy} r="5.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <rect x={Math.min(Math.max(hx - 55, 10), svgWidth - 120)} y={hy - 30} width="110" height="24" rx="5" className="fill-slate-900 dark:fill-slate-950 stroke-sky-400" strokeWidth="1.2" opacity="0.95" />
                <text x={Math.min(Math.max(hx, 65), svgWidth - 65)} y={hy - 14} textAnchor="middle" fontSize="11" fontFamily="monospace" fontWeight="800" fill="#ffffff">
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
              y={svgHeight - 10}
              textAnchor="middle"
              fontSize="13"
              fontFamily="monospace"
              fontWeight="800"
              className="fill-slate-800 dark:fill-slate-100"
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
          <span className="text-sm font-black font-mono text-teal-600 dark:text-[#aceba7]">{maxDepthMm === 0 ? '0.0' : maxX.toFixed(1)} mm</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1c2921] border border-slate-200 dark:border-[#2b3d32] text-center">
          <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Excavation Index</span>
          <span className="text-sm font-black font-mono text-amber-500">
            {maxDepthMm === 0 ? '0.0%' : `${((maxDepthMm / (maxX || 1)) * 100).toFixed(1)}%`}
          </span>
        </div>
      </div>
    </div>
  )
}
