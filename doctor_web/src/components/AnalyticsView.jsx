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
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md">
              SINBAD Analytics
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Population Health Metrics
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Population Health & Clinical Telemetry
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {[
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: '1y', label: '1 Year' },
              { id: 'all', label: 'All Time' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-[#0d9488] text-white shadow-xs'
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
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Clinical Outcome KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500">Total Assessed</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">1,428</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% this month
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500">Mean Healing Time</span>
            <div className="text-2xl font-black text-[#0d9488] dark:text-teal-400 mt-0.5">8.4 Wks</div>
            <span className="text-[11px] text-[#0d9488] dark:text-teal-400 font-semibold flex items-center gap-1 mt-1">
              <TrendingDown className="w-3.5 h-3.5" /> -3.2 wks with Heal6
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500">Major Amputation Rate</span>
            <div className="text-2xl font-black text-[#f43f5e] dark:text-rose-400 mt-0.5">1.8%</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> -48% vs national average
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#fff1f2] dark:bg-rose-950 text-[#f43f5e] dark:text-rose-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500">Limb Salvage Rate</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">98.2%</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs Standard Care
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Second Section (Moved Up): Heal6 vs. Conventional Standard of Care Benchmark */}
      <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-lg">
              Clinical Benchmark
            </span>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
              Heal6 Clinical Protocol Impact vs. Standard of Care
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
            IWGDF 2026 Aligned
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Benchmark 1 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Median Time to Wound Closure
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#0d9488] dark:text-teal-400">8.4 Wks</span>
              <span className="text-xs text-slate-400 line-through">14.2 Wks Standard</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ⚡ 40.8% Faster Healing Resolution
            </div>
          </div>

          {/* Benchmark 2 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Secondary Severe Infection Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">4.2%</span>
              <span className="text-xs text-slate-400 line-through">18.6% Standard</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              🛡️ 77.4% Sepsis Prevention Rate
            </div>
          </div>

          {/* Benchmark 3 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              4-Week Area Reduction (PAR ≥ 40%)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#0d9488] dark:text-teal-400">68.5%</span>
              <span className="text-xs text-slate-400 line-through">38.2% Standard</span>
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              📈 +30.3% Predictive Trajectory
            </div>
          </div>
        </div>
      </div>

      {/* 4. Third Section: Distribution & Etiology Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: SINBAD Score Distribution */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
              SINBAD Score Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Stratified risk breakdown across 6-point clinical severity index
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              { score: 'Score 0-1', label: 'Low Risk', count: 420, percent: 30, color: 'bg-emerald-500', badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
              { score: 'Score 2-3', label: 'Moderate Risk', count: 540, percent: 38, color: 'bg-amber-400', badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
              { score: 'Score 4-5', label: 'Urgent Triage', count: 360, percent: 25, color: 'bg-[#f43f5e]', badgeColor: 'bg-[#fff1f2] text-[#f43f5e] dark:bg-rose-950/60 dark:text-rose-400 border-[#f43f5e]/30 dark:border-rose-800' },
              { score: 'Score 6', label: 'Critical Emergency', count: 108, percent: 7, color: 'bg-red-700', badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.score}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-mono font-bold">
                    {item.count} pts <span className="text-slate-400">({item.percent}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: `${item.percent}%` }} className={`h-full ${item.color} rounded-full transition-all duration-500`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Etiology & Underlying Co-Morbidities */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
              Etiology & Co-Morbidities
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Underlying pathology correlation with delayed tissue regeneration
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Etiology 1 */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400">Pure Neuropathic</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-white">48%</div>
              <span className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                Favorable offloading prognosis
              </span>
            </div>

            {/* Etiology 2 */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400">Neuro-Ischemic</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
              </div>
              <div className="text-xl font-black text-[#f43f5e] dark:text-rose-400">36%</div>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Requires early Doppler review
              </span>
            </div>

            {/* Etiology 3 */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400">Pure Ischemic (PAD)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">12%</div>
              <span className="text-[10.5px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                High limb threat risk
              </span>
            </div>

            {/* Etiology 4 */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400">Charcot Arthropathy</span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              </div>
              <div className="text-xl font-black text-purple-700 dark:text-purple-400">4%</div>
              <span className="text-[10.5px] text-purple-700 dark:text-purple-400 font-medium mt-0.5">
                Rocker-bottom reconstruction
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
