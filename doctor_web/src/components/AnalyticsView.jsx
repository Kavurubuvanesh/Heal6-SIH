import React, { useState } from 'react'
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Activity,
  ShieldCheck,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Brain,
  Crosshair,
  Sparkles
} from 'lucide-react'

export default function AnalyticsView() {
  const [timeframe, setTimeframe] = useState('90d')

  const exportAnalyticsData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value,Benchmark,Status\n' +
      'Total Patients Assessed,1428,+14.2% MoM,Active\n' +
      'Mean Healing Time,8.4 Weeks,-3.2 Wks vs Standard,Optimal\n' +
      'Major Amputation Rate,1.8%,-48% vs National Avg,Exceptional\n' +
      'Limb Salvage Rate,98.2%,+12.4% vs Conventional,Target Exceeded\n'
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'heal6_sinbad_population_analytics.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* 1. Header & Timeframe Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-0.5 rounded-full border border-[#aceba7]/30">
              SINBAD Analytics
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
              Population Health Telemetry
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif-luxury font-bold text-slate-900 dark:text-white tracking-tight">
            Population Health & Clinical Telemetry
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-white/70 dark:bg-[#0e120f]/80 backdrop-blur-xl p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
            {[
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: '1y', label: '1 Year' },
              { id: 'all', label: 'All Time' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-serif-luxury transition-all cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-[#12464e] text-[#aceba7] font-bold shadow-sm border border-[#aceba7]/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Report Button */}
          <button
            onClick={exportAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 text-xs font-serif-luxury text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-[#0e120f]/80 border border-slate-200/80 dark:border-white/10 hover:border-[#aceba7]/50 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#12464e]/30 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#12464e] dark:text-[#aceba7]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Clinical Outcome KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="spotlight-card glass-panel-luxury p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all hover:border-[#aceba7]/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">Total Assessed</span>
            <div className="text-3xl font-bold font-serif-luxury text-slate-900 dark:text-white mt-1">1,428</div>
            <span className="text-[11px] text-[#12464e] dark:text-[#aceba7] font-bold flex items-center gap-1 mt-1 font-mono">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% this month
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="spotlight-card glass-panel-luxury p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all hover:border-[#aceba7]/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">Mean Healing Time</span>
            <div className="text-3xl font-bold font-serif-luxury text-[#12464e] dark:text-[#aceba7] mt-1">8.4 Wks</div>
            <span className="text-[11px] text-[#12464e] dark:text-[#aceba7] font-semibold flex items-center gap-1 mt-1 font-mono">
              <TrendingDown className="w-3.5 h-3.5" /> -3.2 wks with Heal6
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30">
            <HeartPulse className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="spotlight-card glass-panel-luxury p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all hover:border-rose-400/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">Major Amputation Rate</span>
            <div className="text-3xl font-bold font-serif-luxury text-rose-600 dark:text-rose-400 mt-1">1.8%</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1 font-mono">
              <ArrowDownRight className="w-3.5 h-3.5" /> -48% vs benchmark
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold border border-rose-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="spotlight-card glass-panel-luxury p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all hover:border-[#aceba7]/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">Limb Salvage Rate</span>
            <div className="text-3xl font-bold font-serif-luxury text-slate-900 dark:text-white mt-1">98.2%</div>
            <span className="text-[11px] text-[#12464e] dark:text-[#aceba7] font-bold flex items-center gap-1 mt-1 font-mono">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs Standard
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Second Section: Heal6 vs. Conventional Standard of Care Benchmark */}
      <div className="spotlight-card glass-panel-luxury p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/30">
              Clinical Benchmark
            </span>
            <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white">
              Heal6 Clinical Protocol Impact vs. Standard of Care
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/30">
            IWGDF 2026 Aligned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Benchmark 1 */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0e120f]/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between gap-2 shadow-xs">
            <span className="text-xs font-serif-luxury text-slate-700 dark:text-slate-300">
              Median Time to Wound Closure
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif-luxury text-[#12464e] dark:text-[#aceba7]">8.4 Wks</span>
              <span className="text-xs text-slate-400 line-through font-mono">14.2 Wks Standard</span>
            </div>
            <div className="text-[11px] font-bold text-[#12464e] dark:text-[#aceba7] font-mono">
              ⚡ 40.8% Faster Healing Resolution
            </div>
          </div>

          {/* Benchmark 2 */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0e120f]/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between gap-2 shadow-xs">
            <span className="text-xs font-serif-luxury text-slate-700 dark:text-slate-300">
              Secondary Severe Infection Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif-luxury text-[#12464e] dark:text-[#aceba7]">4.2%</span>
              <span className="text-xs text-slate-400 line-through font-mono">18.6% Standard</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              🛡️ 77.4% Sepsis Prevention Rate
            </div>
          </div>

          {/* Benchmark 3 */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0e120f]/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between gap-2 shadow-xs">
            <span className="text-xs font-serif-luxury text-slate-700 dark:text-slate-300">
              4-Week Area Reduction (PAR ≥ 40%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif-luxury text-[#12464e] dark:text-[#aceba7]">68.5%</span>
              <span className="text-xs text-slate-400 line-through font-mono">38.2% Standard</span>
            </div>
            <div className="text-[11px] font-bold text-[#12464e] dark:text-[#aceba7] font-mono">
              📈 +30.3% Predictive Trajectory
            </div>
          </div>
        </div>
      </div>

      {/* 4. Third Section: Distribution & Etiology Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: SINBAD Score Distribution */}
        <div className="lg:col-span-6 spotlight-card glass-panel-luxury p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white">
              SINBAD Score Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Stratified risk breakdown across 6-point clinical severity index
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              { score: 'Score 0-1', label: 'Low Risk', count: 420, percent: 30, color: 'bg-[#aceba7]', badgeColor: 'bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] border-[#aceba7]/40' },
              { score: 'Score 2-3', label: 'Moderate Risk', count: 540, percent: 38, color: 'bg-amber-400', badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
              { score: 'Score 4-5', label: 'Urgent Triage', count: 360, percent: 25, color: 'bg-[#f43f5e]', badgeColor: 'bg-[#fff1f2] text-[#f43f5e] dark:bg-rose-950/60 dark:text-rose-400 border-[#f43f5e]/30 dark:border-rose-800' },
              { score: 'Score 6', label: 'Critical Emergency', count: 108, percent: 7, color: 'bg-red-700', badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-serif-luxury text-slate-900 dark:text-slate-100">{item.score}</span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono font-bold">
                    {item.count} pts <span className="text-slate-400">({item.percent}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: `${item.percent}%` }} className={`h-full ${item.color} rounded-full transition-all duration-500`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Etiology & Underlying Co-Morbidities */}
        <div className="lg:col-span-6 spotlight-card glass-panel-luxury p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white">
              Etiology & Co-Morbidities
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Underlying pathology correlation with delayed tissue regeneration
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Etiology 1 */}
            <div className="p-4 bg-white/70 dark:bg-[#0e120f]/60 rounded-2xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Pure Neuropathic</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#aceba7]" />
              </div>
              <div className="text-2xl font-bold font-serif-luxury text-slate-900 dark:text-white">48%</div>
              <span className="text-[10.5px] text-[#12464e] dark:text-[#aceba7] font-medium mt-0.5 font-mono">
                Favorable offloading prognosis
              </span>
            </div>

            {/* Etiology 2 */}
            <div className="p-4 bg-white/70 dark:bg-[#0e120f]/60 rounded-2xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Neuro-Ischemic</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
              </div>
              <div className="text-2xl font-bold font-serif-luxury text-rose-600 dark:text-rose-400">36%</div>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 font-mono">
                Requires Doppler review
              </span>
            </div>

            {/* Etiology 3 */}
            <div className="p-4 bg-white/70 dark:bg-[#0e120f]/60 rounded-2xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Pure Ischemic (PAD)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-bold font-serif-luxury text-amber-600 dark:text-amber-400">12%</div>
              <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-medium mt-0.5 font-mono">
                High limb threat risk
              </span>
            </div>

            {/* Etiology 4 */}
            <div className="p-4 bg-white/70 dark:bg-[#0e120f]/60 rounded-2xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Charcot Joint</span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              </div>
              <div className="text-2xl font-bold font-serif-luxury text-purple-700 dark:text-purple-400">4%</div>
              <span className="text-[10.5px] text-purple-700 dark:text-purple-400 font-medium mt-0.5 font-mono">
                Rocker-bottom reconstruction
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
