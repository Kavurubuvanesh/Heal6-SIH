import React, { useState } from 'react'
import { AlertTriangle, Activity, Target, Layers, FileText, Siren } from 'lucide-react'

export default function AiResultsColumn({
  patient, sinbadScore = 4, woundArea = 2.45,
  arucoScale = 42, infectionRisk = 78.4, convnextConfidence = 62.0,
  tissueBreakdown = { granulation: 45, slough: 35, necrotic: 20 },
  healingTime = '12-16 Weeks', triageLabel = 'URGENT', triageColor,
  isAnalyzing = false, onGenerateReport, onGenerateReferral
}) {
  const [activeVizTab, setActiveVizTab] = useState('mask')
  const [maskOpacity, setMaskOpacity] = useState(65)
  const radius = 32; const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (infectionRisk / 100) * circumference

  if (isAnalyzing) return <div className="animate-pulse space-y-4"><div className="h-28 bg-white/5 rounded-2xl"/><div className="h-40 bg-white/5 rounded-2xl"/></div>

  return (
    <div className="flex flex-col gap-6">
      {/* Alert Banner */}
      <div className="bg-[#ff3366]/10 border-2 border-[#ff3366]/50 rounded-2xl p-4 shadow-[0_0_20px_rgba(255,51,102,0.1)]">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-[#ff3366] animate-pulse" />
          <div>
            <h4 className="text-xs font-black uppercase text-[#ff3366] tracking-widest">SYSTEM ALERT: HUMAN-IN-THE-LOOP REQUIRED</h4>
            <p className="text-[11px] text-white/80 mt-1">ConvNeXt anomaly detected (Conf: {convnextConfidence}%). Visual override mandated.</p>
          </div>
        </div>
      </div>

      {/* Main Score Banner */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-black/60 border border-white/20 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <span className="text-2xl font-black text-white">{sinbadScore}<span className="text-sm text-white/50">/6</span></span>
            <span className="text-[9px] text-[#00e5ff] font-mono">SINBAD</span>
          </div>
          <div className="flex flex-col">
            <span className={`px-2.5 py-1 rounded-sm text-[10px] font-black tracking-widest border ${triageColor} w-max mb-2`}>
              {triageLabel}
            </span>
            <h2 className="text-lg font-bold text-white">Diagnostic Output</h2>
            <p className="text-xs text-white/50 font-mono mt-1">EST. RECOVERY: {healingTime}</p>
          </div>
        </div>
      </div>

      {/* Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-white/10">
          <div className="text-[10px] font-bold uppercase text-white/50 mb-2">Calculated Area</div>
          <div className="text-2xl font-black text-white">{woundArea}<span className="text-sm text-white/50">cm²</span></div>
          <div className="text-[10px] text-[#00e5ff] font-mono mt-2">Scale: {arucoScale}px/cm</div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-white/10 flex justify-between">
          <div className="flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase text-white/50">Pathogen Risk</div>
            <div className="text-2xl font-black text-[#ff3366]">{infectionRisk}%</div>
          </div>
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 74 74">
            <circle cx="37" cy="37" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
            <circle cx="37" cy="37" r={radius} stroke="#ff3366" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" />
          </svg>
        </div>

        {/* Card 3 */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border-white/10">
          <div className="text-[10px] font-bold uppercase text-white/50 mb-2">Tissue Matrix</div>
          <div className="w-full h-2 bg-black rounded-full overflow-hidden mt-3 flex">
            <div style={{width: `${tissueBreakdown.granulation}%`}} className="bg-[#00e5ff] h-full" />
            <div style={{width: `${tissueBreakdown.slough}%`}} className="bg-amber-400 h-full" />
            <div style={{width: `${tissueBreakdown.necrotic}%`}} className="bg-[#ff3366] h-full" />
          </div>
          <div className="flex justify-between text-[9px] mt-2 font-mono text-white/60">
            <span>GRN:{tissueBreakdown.granulation}%</span>
            <span>NEC:{tissueBreakdown.necrotic}%</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={onGenerateReport} className="py-3 px-5 rounded-xl font-bold text-xs bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:border-[#00e5ff] transition-all flex items-center justify-center gap-2">
          <FileText className="w-4 h-4 text-[#00e5ff]" /> EXPORT REPORT
        </button>
        <button onClick={onGenerateReferral} className="py-3 px-5 rounded-xl font-bold text-xs bg-[#ff3366] text-white hover:bg-[#cc2952] shadow-[0_0_15px_rgba(255,51,102,0.4)] transition-all flex items-center justify-center gap-2">
          <Siren className="w-4 h-4" /> INITIATE REFERRAL
        </button>
      </div>
    </div>
  )
}