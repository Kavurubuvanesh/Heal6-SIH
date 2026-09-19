import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  ChevronRight,
  ShieldAlert,
  Flame,
  Activity,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  HeartCrack,
  Calendar,
  Database
} from 'lucide-react'
import { generateClinicalWoundDataUrl } from '../data/clinicalImages'
import { SCHEDULE_DAYS } from '../data/scheduleData'

export default function MasterTriageQueue({
  cases = [],
  selectedDate = '2026-09-18',
  onSelectDate,
  streamStatus,
  onSelectPatient,
  onNewAssessment,
  onOpenArchitectureModal
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Always sorted by SINBAD severity score descending
  const sortedCases = [...cases].sort((a, b) => (b.calculatedSinbad || 0) - (a.calculatedSinbad || 0))

  const criticalCount = sortedCases.filter((c) => (c.calculatedSinbad || 0) >= 4).length
  const infectedCount = sortedCases.filter((c) => (c.infectionRiskPercent || 0) >= 60).length
  const avgWoundArea = (
    sortedCases.reduce((acc, c) => acc + (c.woundAreaCm2 || 0), 0) / (sortedCases.length || 1)
  ).toFixed(2)

  const lowRiskCases = sortedCases.filter((c) => (c.calculatedSinbad || 0) <= 2)
  const modRiskCases = sortedCases.filter((c) => (c.calculatedSinbad || 0) === 3)
  const urgentRiskCases = sortedCases.filter((c) => (c.calculatedSinbad || 0) >= 4)

  const cohortTotal = sortedCases.length || 1
  const lowPercent = Math.round((lowRiskCases.length / cohortTotal) * 100)
  const modPercent = Math.round((modRiskCases.length / cohortTotal) * 100)
  const urgentPercent = Math.max(0, 100 - lowPercent - modPercent)

  const filteredQueue = sortedCases.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.locationLabel.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeFilter === 'critical') return matchesSearch && (item.calculatedSinbad >= 4)
    if (activeFilter === 'moderate') return matchesSearch && (item.calculatedSinbad >= 2 && item.calculatedSinbad < 4)
    return matchesSearch
  })

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const hour = currentTime.getHours()
  let greeting = 'Good Evening'
  if (hour >= 5 && hour < 12) greeting = 'Good Morning'
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon'

  return (
    <div className="relative flex flex-col gap-5 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 pb-12">
      {/* 1. Combined Doctor Greeting & Clinical Schedule Card */}
      <div className="relative z-10 glass-panel-luxury p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#12464e]/10 dark:border-white/10 shadow-xs flex flex-col gap-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#12464e]/8 dark:border-white/5 pb-3.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#12464e] dark:text-white tracking-tight">
            {greeting}, Dr. Sharma!
          </h2>
          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-[#12464e]/5 dark:bg-[#aceba7]/10 text-[#12464e] dark:text-[#aceba7] border border-[#12464e]/10 dark:border-[#aceba7]/20 w-fit">
            Endocrinology & DFU Specialist
          </span>
        </div>

        {/* Schedule Ribbon Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-[#12464e] dark:text-[#aceba7] shrink-0 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#12464e] dark:text-[#aceba7]" />
            <span>Clinical Schedule:</span>
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
            {SCHEDULE_DAYS.map((item) => {
              const isActive = selectedDate === item.dateKey
              return (
                <button
                  key={item.dateKey}
                  type="button"
                  onClick={() => onSelectDate && onSelectDate(item.dateKey)}
                  className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
                    isActive
                      ? 'bg-[#12464e] text-white dark:bg-[#aceba7] dark:text-[#0e120f] border-[#aceba7]/40 shadow-xs scale-[1.02]'
                      : 'bg-white/90 dark:bg-[#141c17] text-slate-700 dark:text-slate-300 border-[#12464e]/10 dark:border-[#223229] hover:border-[#aceba7]/50 hover:bg-slate-50 dark:hover:bg-[#18231c]'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono uppercase font-semibold opacity-75">{item.day}</span>
                    <span className="text-xs font-bold leading-none">{item.date}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 dark:bg-black/20 text-current'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.isToday ? 'Today • 6' : `${item.count} pts`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. Metric KPIs (2x2 Grid) + Patient Population Risk Card (Side-by-Side as per user sketch) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Side: 2x2 Grid of 4 KPI Metric Cards (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Total Monitored Cases */}
          <div className="spotlight-card p-5 rounded-3xl bg-white/85 dark:bg-[#141c17]/90 border border-[#12464e]/10 dark:border-[#223229] shadow-xs hover:shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Monitored Cases</span>
              <div className="p-2 rounded-xl bg-[#12464e]/10 dark:bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#12464e] dark:text-white">{sortedCases.length}</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-[#aceba7] flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> {streamStatus?.isConnected ? '1 Active Stream' : '0 Active Streams'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Real-time edge sync connected</p>
          </div>

          {/* Card 2: Surgical Immediate */}
          <div className="spotlight-card p-5 rounded-3xl bg-white/85 dark:bg-[#141c17]/90 border border-rose-200 dark:border-rose-950/60 shadow-xs hover:shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Surgical Immediate (≥4)</span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{criticalCount}</span>
              <span className="text-[10.5px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                Priority Escalation
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Requires emergency limb salvage review</p>
          </div>

          {/* Card 3: Infection Gatekeeper */}
          <div className="spotlight-card p-5 rounded-3xl bg-white/85 dark:bg-[#141c17]/90 border border-[#12464e]/10 dark:border-[#223229] shadow-xs hover:shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Infection Gatekeeper</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{infectedCount}</span>
              <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                ConvNeXt &gt; 60%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Prescribed bacteriological culture</p>
          </div>

          {/* Card 4: Mean Wound Area */}
          <div className="spotlight-card p-5 rounded-3xl bg-white/85 dark:bg-[#141c17]/90 border border-[#12464e]/10 dark:border-[#223229] shadow-xs hover:shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Mean Wound Area</span>
              <div className="p-2 rounded-xl bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7]">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#12464e] dark:text-[#aceba7]">{avgWoundArea} <span className="text-sm font-sans font-normal text-slate-400">cm²</span></span>
              <span className="text-[11px] font-mono text-slate-500">ArUco Calibrated</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Sub-millimeter planar precision</p>
          </div>
        </div>

        {/* Right Side: Patient Population Risk Card (5 cols, full height) */}
        <div className="lg:col-span-5 spotlight-card glass-panel-luxury p-6 sm:p-7 rounded-3xl border border-[#12464e]/12 dark:border-white/10 shadow-sm flex flex-col justify-between gap-4 h-full">
          <div className="flex items-center justify-between border-b border-[#12464e]/8 dark:border-white/5 pb-3">
            <div>
              <h3 className="text-lg font-bold text-[#12464e] dark:text-white tracking-wide">
                Patient Population Risk
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Stratified by SINBAD 6-Factor index
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#15221b] text-slate-600 dark:text-slate-300">
              Cohort: {sortedCases.length}
            </span>
          </div>

          {/* Donut Chart Visual with Center Metric & Breakdown */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto py-2">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full border border-dashed border-[#aceba7]/30 animate-orbit-slow pointer-events-none" />
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="10" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#aceba7" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (lowPercent / 100))} strokeLinecap="round" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * ((lowPercent + modPercent) / 100))} strokeLinecap="round" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#f43f5e" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * ((lowPercent + modPercent + urgentPercent) / 100))} strokeLinecap="round" fill="transparent" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-[#12464e] dark:text-white leading-none">{sortedCases.length}</span>
                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold mt-0.5">Monitored</span>
              </div>
            </div>

            {/* Breakdown Legend with Progress Bars */}
            <div className="flex flex-col gap-2.5 flex-1 max-w-[200px] w-full text-xs">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-[#aceba7]" /> Low Risk
                  </span>
                  <span className="font-mono font-bold text-[#12464e] dark:text-[#aceba7]">{lowPercent}% ({lowRiskCases.length})</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#aceba7] rounded-full transition-all duration-500" style={{ width: `${lowPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate
                  </span>
                  <span className="font-mono font-bold text-amber-500">{modPercent}% ({modRiskCases.length})</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${modPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-[#f43f5e]" /> Urgent
                  </span>
                  <span className="font-mono font-bold text-rose-500">{urgentPercent}% ({urgentRiskCases.length})</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#f43f5e] rounded-full transition-all duration-500" style={{ width: `${urgentPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10.5px] font-mono text-center text-slate-400 border-t border-[#12464e]/8 dark:border-white/5 pt-2">
            Limb Salvage Efficacy: <strong className="text-emerald-600 dark:text-[#aceba7]">98.2% Protocol Compliance</strong>
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="relative z-10 glass-panel-luxury p-4 rounded-3xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by patient name, MRN, ulcer site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#223229] dark:bg-[#15221b] dark:text-white text-xs focus:outline-hidden focus:border-[#aceba7] focus:ring-1 focus:ring-[#aceba7] font-medium transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-[#12464e]/5 dark:bg-[#15221b] p-1.5 rounded-2xl border border-[#12464e]/10 dark:border-[#223229]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#12464e] dark:bg-[#aceba7] text-white dark:text-[#0e120f] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#12464e] dark:hover:text-white'
              }`}
            >
              All Cases ({sortedCases.length})
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'critical'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
              }`}
            >
              Critical (≥4)
            </button>
            <button
              onClick={() => setActiveFilter('moderate')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'moderate'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
              }`}
            >
              Moderate (2-3)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Master Triage Patient Queue Table */}
      <div className="relative z-10 glass-panel-luxury rounded-3xl shadow-sm overflow-hidden border border-[#12464e]/10 dark:border-white/10">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-center text-xs min-w-[1000px]">
            <thead className="bg-[#12464e]/5 dark:bg-[#15221b] border-b border-[#12464e]/10 dark:border-[#223229] text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="px-4 py-4.5 text-center w-20">Rank</th>
                <th className="px-6 py-4.5 text-left w-64">Patient Details</th>
                <th className="px-5 py-4.5 text-center w-56">Ulcer Site Location</th>
                <th className="px-4 py-4.5 text-center w-36">AI Surface Area</th>
                <th className="px-4 py-4.5 text-center w-40">ConvNeXt Sepsis</th>
                <th className="px-5 py-4.5 text-center w-44">SINBAD Severity</th>
                <th className="px-5 py-4.5 text-center w-52">Triage Risk Level</th>
                <th className="px-4 py-4.5 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#223229]/60">
              {filteredQueue.map((item, index) => {
                const score = item.calculatedSinbad || 0
                const isUrgent = score >= 4
                const isModerate = score >= 2 && score < 4

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectPatient(item.id)}
                    className={`transition-colors cursor-pointer hover:bg-[#aceba7]/8 dark:hover:bg-[#aceba7]/5 ${
                      index === 0
                        ? 'bg-rose-50/20 dark:bg-rose-950/10'
                        : 'bg-transparent'
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="px-4 py-4.5 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold font-mono text-xs ${
                        index === 0
                          ? 'bg-rose-600 text-white shadow-xs'
                          : index === 1
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-[#15221b] text-slate-600 dark:text-slate-300'
                      }`}>
                        #{index + 1}
                      </span>
                    </td>

                    {/* Patient Name & MRN ID Only */}
                    <td className="px-6 py-4.5 text-left">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {item.name}
                        </span>
                        <div className="flex items-center font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span className="bg-slate-100 dark:bg-[#15221b] px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-[#223229] font-bold text-slate-700 dark:text-slate-300">
                            MRN: {item.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location Site */}
                    <td className="px-5 py-4.5 text-center text-slate-700 dark:text-slate-300 font-medium">
                      <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#15221b] border border-slate-200 dark:border-[#223229] text-xs font-semibold">
                        {item.locationLabel}
                      </span>
                    </td>

                    {/* Wound Area */}
                    <td className="px-4 py-4.5 text-center font-bold font-mono text-[#12464e] dark:text-[#aceba7] text-xs">
                      {item.woundAreaCm2 ? `${item.woundAreaCm2.toFixed(2)} cm²` : 'N/A'}
                    </td>

                    {/* ConvNeXt Infection */}
                    <td className="px-4 py-4.5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`text-xs font-black font-mono ${
                          (item.infectionRiskPercent || 0) > 60 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.infectionRiskPercent ? `${item.infectionRiskPercent.toFixed(1)}%` : 'N/A'}
                        </span>
                        <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              (item.infectionRiskPercent || 0) > 60 ? 'bg-rose-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${Math.min(item.infectionRiskPercent || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* SINBAD Severity Score (Clean single line without 'Score' label) */}
                    <td className="px-5 py-4.5 text-center">
                      <span
                        className={`inline-block px-3.5 py-1 rounded-xl font-mono font-black text-xs tracking-wide whitespace-nowrap ${
                          isUrgent
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : isModerate
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        }`}
                      >
                        {score} / 6
                      </span>
                    </td>

                    {/* Triage Status Pill */}
                    <td className="px-5 py-4.5 text-center">
                      <span
                        className="text-[10px] px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider border shadow-2xs inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${item.triageColor || '#f43f5e'}18`,
                          borderColor: `${item.triageColor || '#f43f5e'}50`,
                          color: item.triageColor || '#f43f5e'
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.triageColor || '#f43f5e' }} />
                        <span>{item.triageLevel}</span>
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-4 py-4.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectPatient(item.id)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#12464e] dark:bg-[#aceba7] text-white dark:text-[#0e120f] font-bold text-xs hover:scale-105 transition-transform cursor-pointer shadow-xs"
                      >
                        <span>Examine</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
