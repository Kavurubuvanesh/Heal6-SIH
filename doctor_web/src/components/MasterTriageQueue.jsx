import React, { useState } from 'react'
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
  Sparkles,
  Layers,
  HeartCrack,
  Clock,
  Boxes,
  Database
} from 'lucide-react'
import { generateClinicalWoundDataUrl } from '../data/clinicalImages'

export default function MasterTriageQueue({
  cases = [],
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

  const filteredQueue = sortedCases.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.locationLabel.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeFilter === 'critical') return matchesSearch && (item.calculatedSinbad >= 4)
    if (activeFilter === 'moderate') return matchesSearch && (item.calculatedSinbad >= 2 && item.calculatedSinbad < 4)
    return matchesSearch
  })

  return (
    <div className="relative flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Volumetric Ethereal Ambient Light Ray (Screenshot 1 & 3 inspired) */}
      <div className="ambient-light-ray opacity-60" />

      {/* 1. Header: Executive Doctor Welcome & 3D Holographic Scan Banner (Docx & Ania Cywińska Inspired) */}
      <div className="relative z-10 spotlight-card glass-panel-luxury p-6 sm:p-7 rounded-3xl border border-[#12464e]/12 dark:border-white/10 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-hidden">
        {/* Left: Greeting & Status Badges */}
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#aceba7] shadow-[0_0_8px_#aceba7] animate-pulse" />
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-[#12464e] dark:text-[#aceba7]">
              SIH Endocrinology Command Center
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
              Shift: Acute Limb Preservation
            </span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-normal text-[#12464e] dark:text-white tracking-tight leading-tight">
            Good Evening, Dr. Sharma!
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Continuous PyTorch ConvNeXt-V2 & UNet++ telemetry is active. There are <strong className="text-rose-600 dark:text-rose-400 font-extrabold">{criticalCount} urgent surgical triage cases</strong> requiring limb salvage verification today.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] border border-[#aceba7]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#aceba7]" />
              {sortedCases.length} Total Patients
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {criticalCount} Surgical Immediate
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Clock className="w-3 h-3" />
              Edge Sync: Online (0.1ms)
            </span>
            {onOpenArchitectureModal && (
              <button
                onClick={onOpenArchitectureModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#12464e] dark:bg-[#aceba7] text-white dark:text-[#0e120f] hover:brightness-110 transition-all cursor-pointer shadow-xs"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>5 Pillars Hub</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: 3D Holographic Anatomical Scan & Quick Action (Docx 3D Organ Scan Inspired) */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-[#12464e]/10 to-[#aceba7]/10 dark:from-[#141c17] dark:to-[#0e120f] border border-[#aceba7]/30 flex items-center justify-center overflow-hidden shadow-inner group">
            {/* Holographic Concentric Orbital Ring */}
            <div className="absolute inset-2 rounded-full border border-dashed border-[#aceba7]/40 animate-orbit-slow pointer-events-none" />
            <div className="laser-scanner-line" />
            <svg className="w-20 h-20 text-[#12464e] dark:text-[#aceba7] drop-shadow-[0_0_10px_rgba(172,235,167,0.4)]" viewBox="0 0 100 100" fill="none">
              <path
                d="M 35 15 C 45 12, 65 12, 75 22 C 82 30, 85 45, 78 60 C 72 70, 65 80, 55 90 C 45 88, 35 78, 30 65 C 22 50, 25 25, 35 15 Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="2 2"
              />
              <circle cx="55" cy="55" r="8" fill="#f43f5e" fillOpacity="0.5" stroke="#f43f5e" strokeWidth="1.5" className="animate-pulse" />
              <line x1="20" y1="55" x2="90" y2="55" stroke="#aceba7" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.6" />
              <line x1="55" y1="20" x2="55" y2="90" stroke="#aceba7" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.6" />
            </svg>
            <span className="absolute bottom-1 right-1.5 text-[8.5px] font-mono font-bold text-[#12464e] dark:text-[#aceba7]">PLANTAR 3D</span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onNewAssessment}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#12464e] dark:bg-[#aceba7] text-white dark:text-[#0e120f] text-xs font-bold hover:shadow-lg hover:shadow-[#12464e]/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#aceba7] dark:text-[#12464e]" />
              <span>New Intake Scan</span>
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-black/40 border border-slate-200/70 dark:border-white/5 text-[10.5px] font-mono text-center text-slate-500 dark:text-slate-400">
              Auto SINBAD Staging
            </div>
          </div>
        </div>
      </div>

      {/* 1.5 Interactive Clinical Shift Timeline Ribbon (Ania Cywińska Inspired) */}
      <div className="relative z-10 flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 shrink-0 mr-2">
          Clinical Schedule:
        </span>
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {[
            { day: 'Mon', date: '08', count: 5, active: false },
            { day: 'Tue', date: '09', count: 8, active: false },
            { day: 'Wed', date: '10', count: 6, active: false },
            { day: 'Thu', date: '11', count: 4, active: false },
            { day: 'Fri', date: '12', count: 9, active: false },
            { day: 'Sat', date: '13', count: 6, active: true, today: true },
            { day: 'Sun', date: '14', count: 2, active: false }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`px-3.5 py-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 shrink-0 ${
                item.active
                  ? 'bg-[#12464e] text-white dark:bg-[#aceba7] dark:text-[#0e120f] border-[#aceba7]/40 shadow-sm'
                  : 'bg-white/80 dark:bg-[#141c17] text-slate-700 dark:text-slate-300 border-[#12464e]/10 dark:border-[#223229] hover:border-[#aceba7]/40'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono uppercase font-semibold opacity-75">{item.day}</span>
                <span className="text-sm font-bold font-serif-luxury leading-none">{item.date}</span>
              </div>
              <span
                className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  item.active
                    ? 'bg-white/20 dark:bg-black/20 text-current'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.today ? 'Today • 6' : `${item.count} pts`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. High-Tech Metric KPI Spotlight Cards (Inspired by Screenshot 2 & 5) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Queue */}
        <div className="spotlight-card p-5 rounded-3xl bg-white/85 dark:bg-[#141c17]/90 border border-[#12464e]/10 dark:border-[#223229] shadow-xs hover:shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Monitored Cases</span>
            <div className="p-2 rounded-xl bg-[#12464e]/10 dark:bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#12464e] dark:text-white font-serif-luxury">{sortedCases.length}</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-[#aceba7] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Active Triage
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Real-time edge sync connected</p>
        </div>

        {/* KPI 2: Critical Surgical */}
        <div className="spotlight-card p-5 rounded-3xl bg-white/85 dark:bg-[#141c17]/90 border border-rose-200 dark:border-rose-950/60 shadow-xs hover:shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Surgical Immediate (≥4)</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-serif-luxury">{criticalCount}</span>
            <span className="text-[10.5px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
              Priority Escalation
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Requires emergency limb salvage review</p>
        </div>

        {/* KPI 3: High Infection Sepsis Risk */}
        <div className="spotlight-card p-5 rounded-3xl bg-white/85 dark:bg-[#141c17]/90 border border-[#12464e]/10 dark:border-[#223229] shadow-xs hover:shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Infection Gatekeeper</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 dark:text-white font-serif-luxury">{infectedCount}</span>
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
              ConvNeXt &gt; 60%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Prescribed bacteriological culture</p>
        </div>

        {/* KPI 4: Mean Wound Area */}
        <div className="spotlight-card p-5 rounded-3xl bg-white/85 dark:bg-[#141c17]/90 border border-[#12464e]/10 dark:border-[#223229] shadow-xs hover:shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Mean Wound Area</span>
            <div className="p-2 rounded-xl bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#12464e] dark:text-[#aceba7] font-serif-luxury">{avgWoundArea} <span className="text-sm font-sans font-normal text-slate-400">cm²</span></span>
            <span className="text-[11px] font-mono text-slate-500">ArUco Calibrated</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Sub-millimeter planar precision</p>
        </div>
      </div>

      {/* 2.5 Industrial Telemetry Visuals (Inspired by Ania Cywińska Multi-Wave Chart & Docx Donut Gauge) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 12-Week Area Healing Trajectory Wave (Ania Cywińska & Arounda Inspired) */}
        <div className="lg:col-span-7 spotlight-card glass-panel-luxury p-6 sm:p-7 rounded-3xl border border-[#12464e]/12 dark:border-white/10 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-[#12464e]/8 dark:border-white/5 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#aceba7]" />
                <h3 className="font-serif-luxury text-lg font-bold text-[#12464e] dark:text-white tracking-wide">
                  12-Week Predictive Trajectory & Offloading Compliance
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Area reduction dynamics comparing Heal6 AI Offloading vs Standard of Care
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] border border-[#aceba7]/30">
                -40.8% Closure Time
              </span>
            </div>
          </div>

          {/* SVG Multi-Wave Curve Chart */}
          <div className="w-full h-44 relative my-2">
            <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="triageCurveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#aceba7" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#aceba7" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="triageStandardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Gridlines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" strokeDasharray="3 3" />

              {/* Standard of Care Curve Area Fill */}
              <path
                d="M 30,35 C 140,45 280,75 470,110 L 470,150 L 30,150 Z"
                fill="url(#triageStandardGrad)"
              />
              <path
                d="M 30,35 C 140,45 280,75 470,110"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.75"
              />

              {/* Heal6 Accelerated Trajectory Wave Fill */}
              <path
                d="M 30,35 C 130,55 240,115 470,145 L 470,150 L 30,150 Z"
                fill="url(#triageCurveGrad)"
              />
              <path
                d="M 30,35 C 130,55 240,115 470,145"
                fill="none"
                stroke="#aceba7"
                strokeWidth="3"
                className="drop-shadow-[0_0_8px_rgba(172,235,167,0.8)]"
              />

              {/* Data Nodes */}
              <circle cx="30" cy="35" r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              <text x="35" y="28" fill="currentColor" className="text-slate-700 dark:text-slate-300 font-mono font-bold text-[9px]">W0: 3.24cm²</text>

              <circle cx="160" cy="65" r="4" fill="#aceba7" stroke="#12464e" strokeWidth="1.5" />
              <text x="165" y="60" fill="currentColor" className="text-slate-700 dark:text-slate-300 font-mono text-[8.5px]">W4: 1.82cm²</text>

              <circle cx="310" cy="120" r="4" fill="#aceba7" stroke="#12464e" strokeWidth="1.5" />
              <text x="315" y="115" fill="currentColor" className="text-slate-700 dark:text-slate-300 font-mono text-[8.5px]">W8: 0.65cm²</text>

              <circle cx="470" cy="145" r="5" fill="#aceba7" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
              <text x="415" y="140" fill="#aceba7" className="font-mono font-bold text-[9.5px]">W12: Closed</text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#12464e]/8 dark:border-white/5 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-[#aceba7] rounded-full" />
              <span className="font-bold text-[#12464e] dark:text-[#aceba7]">Heal6 Precision Offloading</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-3 h-0.5 bg-[#f43f5e] border-b border-dashed" />
              <span>Conventional Standard of Care</span>
            </div>
          </div>
        </div>

        {/* Right: Population Triage Donut (Ania Cywińska & Docx Inspired) */}
        <div className="lg:col-span-5 spotlight-card glass-panel-luxury p-6 sm:p-7 rounded-3xl border border-[#12464e]/12 dark:border-white/10 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between border-b border-[#12464e]/8 dark:border-white/5 pb-3">
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-[#12464e] dark:text-white tracking-wide">
                Patient Population Risk
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Stratified by SINBAD 6-Factor index
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#15221b] text-slate-600 dark:text-slate-300">
              Cohort: 51
            </span>
          </div>

          {/* Donut Chart Visual with Center Metric */}
          <div className="flex items-center justify-around my-2">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              {/* Outer Dashed Orbit */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#aceba7]/30 animate-orbit-slow pointer-events-none" />
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="40" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="10" fill="transparent" />
                {/* Mint Arc: Low Risk (58%) */}
                <circle cx="50" cy="50" r="40" stroke="#aceba7" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset="105" strokeLinecap="round" fill="transparent" />
                {/* Amber Arc: Moderate (30%) */}
                <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset="175" strokeLinecap="round" fill="transparent" />
                {/* Rose Arc: Critical (12%) */}
                <circle cx="50" cy="50" r="40" stroke="#f43f5e" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset="221" strokeLinecap="round" fill="transparent" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-serif-luxury text-[#12464e] dark:text-white leading-none">51</span>
                <span className="text-[9px] font-mono uppercase text-slate-400 font-bold mt-0.5">Monitored</span>
              </div>
            </div>

            {/* Breakdown Legend with Progress Bars */}
            <div className="flex flex-col gap-2.5 flex-1 max-w-[170px] text-xs">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-[#aceba7]" /> Low Risk
                  </span>
                  <span className="font-mono font-bold text-[#12464e] dark:text-[#aceba7]">58%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[58%] h-full bg-[#aceba7] rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate
                  </span>
                  <span className="font-mono font-bold text-amber-500">30%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[30%] h-full bg-amber-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-[#f43f5e]" /> Urgent
                  </span>
                  <span className="font-mono font-bold text-rose-500">12%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[12%] h-full bg-[#f43f5e] rounded-full" />
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
      <div className="relative z-10 glass-panel-luxury rounded-3xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-center text-xs min-w-[950px]">
            <thead className="bg-[#12464e]/5 dark:bg-[#15221b] border-b border-[#12464e]/10 dark:border-[#223229] text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="px-4 py-4.5 text-center w-24">Rank</th>
                <th className="px-4 py-4.5 text-center w-64">Patient & Scan</th>
                <th className="px-4 py-4.5 text-center w-60">Ulcer Site Location</th>
                <th className="px-4 py-4.5 text-center w-36">AI Surface Area</th>
                <th className="px-4 py-4.5 text-center w-36">ConvNeXt Sepsis</th>
                <th className="px-4 py-4.5 text-center w-28">SINBAD</th>
                <th className="px-4 py-4.5 text-center w-52">Triage Risk Level</th>
                <th className="px-4 py-4.5 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#223229]/60">
              {filteredQueue.map((item, index) => {
                const score = item.calculatedSinbad || 0
                const isUrgent = score >= 4
                const isModerate = score >= 2 && score < 4

                // Wound image thumbnail
                const woundThumbnail =
                  item.originalImage ||
                  item.raw_image_base64 ||
                  item.imageSrc ||
                  generateClinicalWoundDataUrl(item.siteScore === 1 ? 'hindfoot' : 'forefoot')

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
                    <td className="px-4 py-4 text-center">
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

                    {/* Patient Name, MRN & Scanned Photo Thumbnail */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 justify-center">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-[#223229] shadow-2xs shrink-0 group scanner-target">
                          <img
                            src={woundThumbnail}
                            alt="Wound Scan Thumbnail"
                            className="w-full h-full object-cover transform transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="text-left">
                          <p className="font-serif-luxury text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.isOfflineEdge ? (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded" title="Pillar 4: Offline Edge Inference via ONNX Runtime WebGL">
                                ⚡ Edge WebGL
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#aceba7]/20 text-[#12464e] dark:text-[#aceba7] border border-[#aceba7]/40 rounded" title="Pillar 1: SOTA PyTorch Cloud Telemetry">
                                ☁️ PyTorch
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{item.id} • {item.age}y</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5" title="Pillar 1: Stored in PostgreSQL 16 Relational Engine">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>PostgreSQL</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location Site */}
                    <td className="px-4 py-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#15221b] border border-slate-200 dark:border-[#223229] text-xs">
                        {item.locationLabel}
                      </span>
                    </td>

                    {/* Wound Area */}
                    <td className="px-4 py-4 text-center font-bold font-mono text-[#12464e] dark:text-[#aceba7] text-xs">
                      {item.woundAreaCm2 ? `${item.woundAreaCm2.toFixed(2)} cm²` : 'N/A'}
                    </td>

                    {/* ConvNeXt Infection */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-black font-mono ${
                          (item.infectionRiskPercent || 0) > 60 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.infectionRiskPercent ? `${item.infectionRiskPercent.toFixed(1)}%` : 'N/A'}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (item.infectionRiskPercent || 0) > 60 ? 'bg-rose-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${Math.min(item.infectionRiskPercent || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* SINBAD Score */}
                    <td className="px-4 py-4 text-center font-black text-sm">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-mono ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : isModerate
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {score} / 6
                      </span>
                    </td>

                    {/* Triage Status Pill */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider border shadow-2xs inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${item.triageColor || '#f43f5e'}18`,
                          borderColor: `${item.triageColor || '#f43f5e'}50`,
                          color: item.triageColor || '#f43f5e'
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.triageColor || '#f43f5e' }} />
                        {item.triageLevel}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectPatient(item.id)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12464e] dark:bg-[#aceba7] text-white dark:text-[#0e120f] font-bold text-xs hover:scale-105 transition-transform cursor-pointer shadow-xs"
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
