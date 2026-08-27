import React from 'react'
import {
  BarChart3,
  TrendingDown,
  Activity,
  ShieldCheck,
  Zap,
  Target,
  ArrowUpRight,
  PieChart
} from 'lucide-react'

export default function AnalyticsView() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">SINBAD Population Health & Clinical Metrics</h2>
        <p className="text-xs text-slate-500">Longitudinal diabetic foot ulceration registry & healing outcomes</p>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Assessed</span>
          <div className="text-2xl font-black text-slate-800 mt-1">1,428</div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +14.2% this month
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Mean Healing Time</span>
          <div className="text-2xl font-black text-[#249583] mt-1">8.4 Wks</div>
          <span className="text-[11px] text-[#249583] font-semibold flex items-center gap-1 mt-1">
            Reduced by 3.2 wks with Heal6
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Major Amputation Rate</span>
          <div className="text-2xl font-black text-[#FA7373] mt-1">1.8%</div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
            -48% vs national average
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">ArUco CV Precision</span>
          <div className="text-2xl font-black text-slate-800 mt-1">99.4%</div>
          <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1 mt-1">
            Sub-millimeter calibrated
          </span>
        </div>
      </div>

      {/* SINBAD Distribution Visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">SINBAD Score Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Patient risk distribution across 6-point scale</p>
          </div>

          <div className="space-y-2.5">
            {[
              { score: 'Score 0-1 (Low Risk)', count: 420, percent: 30, color: 'bg-emerald-500' },
              { score: 'Score 2-3 (Moderate)', count: 540, percent: 38, color: 'bg-amber-400' },
              { score: 'Score 4-5 (Urgent Triage)', count: 360, percent: 25, color: 'bg-[#FA7373]' },
              { score: 'Score 6 (Critical Emergent)', count: 108, percent: 7, color: 'bg-red-700' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.score}</span>
                  <span className="text-slate-500 font-mono">{item.count} pts ({item.percent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${item.percent}%` }} className={`h-full ${item.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Etiology & Co-Morbidities</h3>
            <p className="text-xs text-slate-500 mb-4">Underlying pathology correlation with delayed healing</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pure Neuropathic</span>
              <div className="text-lg font-bold text-slate-800">48%</div>
              <span className="text-[10px] text-slate-500">Favorable prognosis</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Neuro-Ischemic</span>
              <div className="text-lg font-bold text-[#FA7373]">36%</div>
              <span className="text-[10px] text-slate-500">Requires revascularization</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pure Ischemic (PAD)</span>
              <div className="text-lg font-bold text-amber-600">12%</div>
              <span className="text-[10px] text-slate-500">High amputation risk</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Charcot Neuroarthropathy</span>
              <div className="text-lg font-bold text-purple-700">4%</div>
              <span className="text-[10px] text-slate-500">Deformity reconstruction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
