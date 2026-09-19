import React, { useState } from 'react'
import {
  Activity,
  ShieldCheck,
  HeartPulse,
  Crosshair,
  Download
} from 'lucide-react'
import { SCHEDULE_CASES_BY_DATE } from '../data/scheduleData'
import { PATIENT_CASES } from '../data/clinicalCases'

export default function AnalyticsView({ cases = [] }) {
  // Combine and deduplicate sample cases across schedules and active clinical cases
  const scheduleCases = Object.values(SCHEDULE_CASES_BY_DATE).flat()
  const combinedMap = new Map()
  scheduleCases.forEach((c) => combinedMap.set(c.id, c))
  PATIENT_CASES.forEach((c) => combinedMap.set(c.id, { ...combinedMap.get(c.id), ...c }))
  cases.forEach((c) => combinedMap.set(c.id, { ...combinedMap.get(c.id), ...c }))

  const sampleCohort = Array.from(combinedMap.values())
  const totalCount = sampleCohort.length || 1

  // 1. Mean SINBAD Score
  const totalSinbadSum = sampleCohort.reduce((acc, c) => acc + (Number(c.calculatedSinbad) || 0), 0)
  const meanSinbad = (totalSinbadSum / totalCount).toFixed(1)

  // 2. Mean Wound Area (cm²)
  const totalAreaSum = sampleCohort.reduce((acc, c) => acc + (Number(c.woundAreaCm2) || 0), 0)
  const meanArea = (totalAreaSum / totalCount).toFixed(2)

  // 3. Estimated Healing Duration (Weeks) calculated from sample data strings
  const parseHealingWeeks = (str) => {
    if (!str) return 8
    const nums = str.match(/\d+(\.\d+)?/g)
    if (!nums || nums.length === 0) return 8
    if (nums.length === 1) return parseFloat(nums[0])
    return (parseFloat(nums[0]) + parseFloat(nums[1])) / 2
  }
  const totalHealingSum = sampleCohort.reduce((acc, c) => acc + parseHealingWeeks(c.healingEstimateWeeks), 0)
  const meanHealingWeeks = (totalHealingSum / totalCount).toFixed(1)

  // 4. SINBAD Stratified Distribution
  const sinbad0to1 = sampleCohort.filter((c) => (c.calculatedSinbad || 0) <= 1)
  const sinbad2to3 = sampleCohort.filter((c) => (c.calculatedSinbad || 0) >= 2 && (c.calculatedSinbad || 0) <= 3)
  const sinbad4to5 = sampleCohort.filter((c) => (c.calculatedSinbad || 0) >= 4 && (c.calculatedSinbad || 0) <= 5)
  const sinbad6 = sampleCohort.filter((c) => (c.calculatedSinbad || 0) === 6)

  const pct0to1 = Math.round((sinbad0to1.length / totalCount) * 100)
  const pct2to3 = Math.round((sinbad2to3.length / totalCount) * 100)
  const pct4to5 = Math.round((sinbad4to5.length / totalCount) * 100)
  const pct6 = Math.round((sinbad6.length / totalCount) * 100)

  // 5. Clinical Etiology Breakdown
  const pureNeuropathic = sampleCohort.filter((c) => c.neuropathyScore === 1 && c.ischemiaScore === 0)
  const neuroIschemic = sampleCohort.filter((c) => c.neuropathyScore === 1 && c.ischemiaScore === 1)
  const pureIschemic = sampleCohort.filter((c) => c.neuropathyScore === 0 && c.ischemiaScore === 1)
  const charcotOrDeep = sampleCohort.filter(
    (c) =>
      c.locationLabel?.toLowerCase().includes('charcot') ||
      (c.siteScore === 1 && c.depthScore === 1 && c.neuropathyScore === 1 && c.ischemiaScore === 0)
  )

  const pctNeuropathic = Math.round((pureNeuropathic.length / totalCount) * 100)
  const pctNeuroIschemic = Math.round((neuroIschemic.length / totalCount) * 100)
  const pctIschemic = Math.round((pureIschemic.length / totalCount) * 100)
  const pctCharcot = Math.max(100 - (pctNeuropathic + pctNeuroIschemic + pctIschemic), 0)

  // 6. Mean Infection Risk
  const totalInfectionSum = sampleCohort.reduce((acc, c) => acc + (Number(c.infectionRiskPercent) || 0), 0)
  const meanInfectionRisk = (totalInfectionSum / totalCount).toFixed(1)

  // 7. Tissue Composition Averages
  const totalGran = sampleCohort.reduce(
    (acc, c) => acc + (c.tissueBreakdown?.granulation ?? c.tissueBreakdown?.gran ?? 50),
    0
  )
  const totalSlough = sampleCohort.reduce(
    (acc, c) => acc + (c.tissueBreakdown?.slough ?? 30),
    0
  )
  const totalNecr = sampleCohort.reduce(
    (acc, c) => acc + (c.tissueBreakdown?.necrotic ?? c.tissueBreakdown?.necr ?? 20),
    0
  )
  const avgGranulation = Math.round(totalGran / totalCount)
  const avgSlough = Math.round(totalSlough / totalCount)
  const avgNecrotic = Math.round(totalNecr / totalCount)

  // 8. Offloading Breakdown
  const tccCases = sampleCohort.filter((c) => c.offloadingDevice?.includes('TCC') || c.offloadingDevice?.includes('Total Contact Cast'))
  const walkerCases = sampleCohort.filter((c) => c.offloadingDevice?.includes('Walker') || c.offloadingDevice?.includes('RCW'))
  const shoeCases = sampleCohort.filter((c) => c.offloadingDevice?.includes('Shoe') || c.offloadingDevice?.includes('Orthotics'))

  // Export dynamically calculated sample analytics
  const exportAnalyticsData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Ulcers in Cohort,${sampleCohort.length}\n` +
      `Mean SINBAD Severity,${meanSinbad} / 6\n` +
      `Mean Wound Area,${meanArea} cm²\n` +
      `Mean Estimated Healing Duration,${meanHealingWeeks} Weeks\n` +
      `Mean Infection Risk,${meanInfectionRisk}%\n` +
      `Urgent Cases (SINBAD >= 4),${sinbad4to5.length + sinbad6.length} (${pct4to5 + pct6}%)\n` +
      `Mean Tissue Granulation,${avgGranulation}%\n` +
      `Mean Tissue Slough,${avgSlough}%\n` +
      `Mean Tissue Necrotic,${avgNecrotic}%\n`

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'heal6_sample_data_analytics.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif-luxury font-bold text-slate-900 dark:text-white tracking-tight">
            Population Health & Clinical Telemetry
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Cases Badge */}
          <div className="flex items-center gap-2 bg-white/80 dark:bg-[#0e120f]/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {sampleCohort.length} Active Tracked Ulcers
            </span>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 text-xs font-serif-luxury font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-[#0e120f]/80 border border-slate-200/80 dark:border-white/10 hover:border-[#aceba7]/50 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#12464e]/30 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#12464e] dark:text-[#aceba7]" />
            <span>Export Analytics (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Clinical Outcome KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="spotlight-card glass-panel-luxury p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all hover:border-[#aceba7]/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">Cohort Sample Size</span>
            <div className="text-3xl font-bold font-serif-luxury text-slate-900 dark:text-white mt-1">
              {sampleCohort.length} Cases
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="spotlight-card glass-panel-luxury p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all hover:border-[#aceba7]/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">Mean Healing Time</span>
            <div className="text-3xl font-bold font-serif-luxury text-[#12464e] dark:text-[#aceba7] mt-1">
              {meanHealingWeeks} Wks
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30">
            <HeartPulse className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="spotlight-card glass-panel-luxury p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all hover:border-rose-400/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">Urgent SINBAD (≥4)</span>
            <div className="text-3xl font-bold font-serif-luxury text-rose-600 dark:text-rose-400 mt-1">
              {sinbad4to5.length + sinbad6.length} ({pct4to5 + pct6}%)
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold border border-rose-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="spotlight-card glass-panel-luxury p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between transition-all hover:border-[#aceba7]/40">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500">Mean Wound Area</span>
            <div className="text-3xl font-bold font-serif-luxury text-slate-900 dark:text-white mt-1">
              {meanArea} cm²
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30">
            <Crosshair className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Second Section: Tissue Composition & Infection Telemetry */}
      <div className="spotlight-card glass-panel-luxury p-5.5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-3">
          <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white">
            Mean Tissue Morphometry & Infection Telemetry
          </h3>
          <span className="text-xs font-mono font-bold text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/30">
            Mean SINBAD: {meanSinbad} / 6
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tissue Breakdown Aggregate */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0e120f]/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between gap-2.5 shadow-xs">
            <span className="text-xs font-serif-luxury text-slate-700 dark:text-slate-300 font-semibold">
              Mean Tissue Morphometry
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {avgGranulation}% Granulation
              </span>
              <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs font-mono font-bold text-amber-500">
                {avgSlough}% Slough
              </span>
              <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs font-mono font-bold text-rose-500">
                {avgNecrotic}% Necrotic
              </span>
            </div>
            {/* Stacked Visual Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden shadow-inner">
              <div style={{ width: `${avgGranulation}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${avgSlough}%` }} className="bg-amber-400 h-full" />
              <div style={{ width: `${avgNecrotic}%` }} className="bg-rose-500 h-full" />
            </div>
          </div>

          {/* Infection Risk Telemetry */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0e120f]/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between gap-2.5 shadow-xs">
            <span className="text-xs font-serif-luxury text-slate-700 dark:text-slate-300 font-semibold">
              Cohort Infection Risk Mean
            </span>
            <div className="text-2xl font-bold font-serif-luxury text-[#12464e] dark:text-[#aceba7] mt-0.5">
              {meanInfectionRisk}%
            </div>
          </div>

          {/* Active Offloading Prescription */}
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#0e120f]/60 border border-slate-200/70 dark:border-white/5 flex flex-col justify-between gap-2.5 shadow-xs">
            <span className="text-xs font-serif-luxury text-slate-700 dark:text-slate-300 font-semibold">
              Offloading Prescriptions
            </span>
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono mt-0.5">
              <span className="px-2.5 py-1 rounded-lg bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] font-bold">
                TCC: {tccCases.length}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                Walker: {walkerCases.length}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                Shoes: {shoeCases.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Third Section: Score Distribution & Etiology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: SINBAD Score Distribution */}
        <div className="lg:col-span-6 spotlight-card glass-panel-luxury p-5.5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white">
              SINBAD Score Distribution
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                score: 'Score 0 - 1',
                label: 'Low Risk',
                count: sinbad0to1.length,
                percent: pct0to1,
                color: 'bg-[#aceba7]',
                badgeColor: 'bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] border-[#aceba7]/40'
              },
              {
                score: 'Score 2 - 3',
                label: 'Moderate Risk',
                count: sinbad2to3.length,
                percent: pct2to3,
                color: 'bg-amber-400',
                badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              },
              {
                score: 'Score 4 - 5',
                label: 'Urgent Triage',
                count: sinbad4to5.length,
                percent: pct4to5,
                color: 'bg-[#f43f5e]',
                badgeColor: 'bg-[#fff1f2] text-[#f43f5e] dark:bg-rose-950/60 dark:text-rose-400 border-[#f43f5e]/30 dark:border-rose-800'
              },
              {
                score: 'Score 6',
                label: 'Critical / Multi-Domain',
                count: sinbad6.length,
                percent: pct6,
                color: 'bg-red-700',
                badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800'
              }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-serif-luxury text-slate-900 dark:text-slate-100">{item.score}</span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 font-mono font-bold">
                    {item.count} ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(item.percent, item.count > 0 ? 5 : 0)}%` }}
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Etiology & Underlying Pathology */}
        <div className="lg:col-span-6 spotlight-card glass-panel-luxury p-5.5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white">
              Etiology & Underlying Pathology
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Etiology 1 */}
            <div className="p-4 bg-white/70 dark:bg-[#0e120f]/60 rounded-2xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Pure Neuropathic</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#aceba7]" />
              </div>
              <div className="text-2xl font-bold font-serif-luxury text-slate-900 dark:text-white">
                {pureNeuropathic.length} ({pctNeuropathic}%)
              </div>
            </div>

            {/* Etiology 2 */}
            <div className="p-4 bg-white/70 dark:bg-[#0e120f]/60 rounded-2xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Neuro-Ischemic</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
              </div>
              <div className="text-2xl font-bold font-serif-luxury text-rose-600 dark:text-rose-400">
                {neuroIschemic.length} ({pctNeuroIschemic}%)
              </div>
            </div>

            {/* Etiology 3 */}
            <div className="p-4 bg-white/70 dark:bg-[#0e120f]/60 rounded-2xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Pure Ischemic</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-bold font-serif-luxury text-amber-600 dark:text-amber-400">
                {pureIschemic.length} ({pctIschemic}%)
              </div>
            </div>

            {/* Etiology 4 */}
            <div className="p-4 bg-white/70 dark:bg-[#0e120f]/60 rounded-2xl border border-slate-200/70 dark:border-white/5 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Charcot / Hindfoot</span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              </div>
              <div className="text-2xl font-bold font-serif-luxury text-purple-700 dark:text-purple-400">
                {charcotOrDeep.length} ({pctCharcot}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
