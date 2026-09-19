import React, { useState, useEffect } from 'react'
import {
  Layers,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Tag,
  ShieldAlert,
  ArrowUpDown,
  Eye
} from 'lucide-react'
import { SCHEDULE_DAYS, SCHEDULE_CASES_BY_DATE } from '../data/scheduleData'

export default function WoundRegistryView({
  cases = [],
  selectedDate = '2026-09-18',
  onSelectDate,
  onSelectPatientWound,
  onNewAssessment
}) {
  const [activeDateFilter, setActiveDateFilter] = useState(selectedDate || '2026-09-18')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('patientName')
  const [sortDirection, setSortDirection] = useState('asc')

  useEffect(() => {
    if (selectedDate) {
      setActiveDateFilter(selectedDate)
    }
  }, [selectedDate])

  const handleDateChange = (dateKey) => {
    setActiveDateFilter(dateKey)
    if (onSelectDate && dateKey !== 'all') {
      onSelectDate(dateKey)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const allWoundsList = Object.values(SCHEDULE_CASES_BY_DATE).flat()
  const sourceCases = activeDateFilter === 'all'
    ? allWoundsList
    : (SCHEDULE_CASES_BY_DATE[activeDateFilter] || cases)

  const dynamicRegistryData = sourceCases.map((c, i) => {
    const isCritical = (c.calculatedSinbad || 0) >= 4
    const isHealing = (c.calculatedSinbad || 0) <= 2
    return {
      woundId: c.woundId || `WND-2026-${String(101 + i).padStart(3, '0')}`,
      patientName: c.name || 'Unknown Patient',
      mrn: c.id || `DFU-${Math.floor(1000 + Math.random() * 9000)}`,
      icd10: c.icd10 || (isCritical ? 'E11.621 / M14.672' : 'E11.621 / L97.412'),
      icd10Label: c.icd10Label || (isCritical ? 'T2D with Charcot arthropathy & deep ulcer' : 'T2D with chronic foot ulcer'),
      anatomicalSite: c.locationLabel || 'Unknown Site',
      sinbadBaseline: (c.calculatedSinbad || 0) + 1,
      sinbadCurrent: c.calculatedSinbad || 0,
      areaBaseline: ((c.woundAreaCm2 || 0) + (isHealing ? 0.8 : 0.4)).toFixed(2),
      areaCurrent: Number(c.woundAreaCm2 || 0).toFixed(2),
      par4Week: c.par4Week || (isHealing ? '-48.2%' : isCritical ? '-12.5%' : '-28.0%'),
      tissueState: c.tissueBreakdown || { gran: 45, slough: 35, necr: 20 },
      microbiology: c.microbiology || (isCritical ? 'Polymicrobial • Purulent' : 'Staph. epidermidis'),
      offloadingDevice: c.offloadingDevice || 'Total Contact Cast (TCC)',
      lastAssessed: c.dateAssessed || c.lastAssessed || 'Sep 18, 2026',
      status: isCritical ? 'High Risk' : isHealing ? 'Healing' : 'Moderate',
      statusColor: isCritical 
        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900' 
        : isHealing 
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' 
        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900'
    }
  })

  const filteredWounds = dynamicRegistryData
    .filter((w) => {
      const matchesSearch =
        w.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.woundId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.icd10.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.anatomicalSite.toLowerCase().includes(searchTerm.toLowerCase())

      if (selectedFilter === 'critical') return matchesSearch && w.sinbadCurrent >= 4
      if (selectedFilter === 'healing') return matchesSearch && w.sinbadCurrent <= 2
      return matchesSearch
    })
    .sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (sortField === 'sinbadCurrent' || sortField === 'areaCurrent') {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const exportCSV = () => {
    const headers = ['Wound ID', 'Patient', 'MRN', 'Site', 'SINBAD Base', 'SINBAD Current', 'Area Base', 'Area Current', 'PAR 4W', 'Status', 'Date Assessed']
    const rows = filteredWounds.map((w) => [
      w.woundId,
      `"${w.patientName}"`,
      w.mrn,
      `"${w.anatomicalSite}"`,
      w.sinbadBaseline,
      w.sinbadCurrent,
      w.areaBaseline,
      w.areaCurrent,
      `"${w.par4Week}"`,
      `"${w.status}"`,
      `"${w.lastAssessed}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `heal6_wound_registry_${activeDateFilter}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full">
      {/* Registry Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#12464e]/10 dark:border-[#223229] pb-4">
        <div>
          <h2 className="text-2xl font-serif-luxury font-bold text-slate-900 dark:text-white tracking-wide">
            Diabetic Foot Ulcer Registry & Progression
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold font-serif-luxury text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-[#0e120f]/90 border border-slate-200/80 dark:border-white/10 hover:border-[#aceba7]/50 rounded-2xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-[#12464e] dark:text-[#aceba7]" />
            <span>Export Registry (CSV)</span>
          </button>
        </div>
      </div>

      {/* Clinical Schedule Date Filter Ribbon */}
      <div className="glass-panel-luxury px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto">
        <span className="text-xs font-bold text-[#12464e] dark:text-[#aceba7] shrink-0 flex items-center gap-2 font-serif-luxury tracking-wide">
          <Calendar className="w-4 h-4 text-[#12464e] dark:text-[#aceba7]" />
          <span>Filter Wounds by Date:</span>
        </span>
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => handleDateChange('all')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 font-mono ${
              activeDateFilter === 'all'
                ? 'bg-[#12464e] text-white dark:bg-[#aceba7] dark:text-[#0e120f] border-[#aceba7]/40 shadow-xs'
                : 'bg-white/90 dark:bg-[#141c17] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#aceba7]/40'
            }`}
          >
            All Dates ({allWoundsList.length})
          </button>

          {SCHEDULE_DAYS.map((item) => {
            const isActive = activeDateFilter === item.dateKey
            return (
              <button
                key={item.dateKey}
                type="button"
                onClick={() => handleDateChange(item.dateKey)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-[#12464e] text-white dark:bg-[#aceba7] dark:text-[#0e120f] border-[#aceba7]/40 shadow-xs'
                    : 'bg-white/90 dark:bg-[#141c17] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#aceba7]/40'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-mono uppercase font-semibold opacity-75">{item.day}</span>
                  <span className="text-xs font-bold leading-none">{item.date}</span>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 dark:bg-black/20 text-current'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.isToday ? 'Today • 6' : `${item.count}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Metric Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel-luxury p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono font-bold text-slate-400 dark:text-slate-500">Tracked Ulcers</span>
            <div className="text-2xl font-bold font-serif-luxury text-slate-900 dark:text-white mt-0.5">{dynamicRegistryData.length} Active Cases</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#aceba7]/20 dark:bg-[#aceba7]/10 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel-luxury p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono font-bold text-slate-400 dark:text-slate-500">4-Wk Area Reduction</span>
            <div className="text-2xl font-bold font-serif-luxury text-emerald-600 dark:text-emerald-400 mt-0.5">
              {dynamicRegistryData.filter(w => parseFloat(w.par4Week) <= -40).length} / {dynamicRegistryData.length} ({Math.round((dynamicRegistryData.filter(w => parseFloat(w.par4Week) <= -40).length / Math.max(dynamicRegistryData.length, 1)) * 100)}%)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-300 dark:border-emerald-800 shadow-xs">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel-luxury p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono font-bold text-slate-400 dark:text-slate-500">High-Risk SINBAD (≥4)</span>
            <div className="text-2xl font-bold font-serif-luxury text-rose-600 dark:text-rose-400 mt-0.5">
              {dynamicRegistryData.filter(w => w.sinbadCurrent >= 4).length} Cases ({Math.round((dynamicRegistryData.filter(w => w.sinbadCurrent >= 4).length / Math.max(dynamicRegistryData.length, 1)) * 100)}%)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold border border-rose-300 dark:border-rose-800 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel-luxury p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono font-bold text-slate-400 dark:text-slate-500">Offloading Adherence</span>
            <div className="text-2xl font-bold font-serif-luxury text-[#12464e] dark:text-[#aceba7] mt-0.5">{dynamicRegistryData.length} / {dynamicRegistryData.length} (100%)</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#aceba7]/20 dark:bg-[#aceba7]/10 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center font-bold border border-[#aceba7]/30 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white/90 dark:bg-[#0c1524]/85 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient, MRN, Site or Wound ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-[#aceba7] focus:ring-1 focus:ring-[#aceba7] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer font-mono ${
              selectedFilter === 'all'
                ? 'bg-[#12464e] text-[#aceba7] border border-[#aceba7]/30 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({dynamicRegistryData.length})
          </button>
          <button
            onClick={() => setSelectedFilter('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer font-mono ${
              selectedFilter === 'critical'
                ? 'bg-rose-600 text-white shadow-xs border border-rose-400/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Urgent SINBAD ≥ 4
          </button>
          <button
            onClick={() => setSelectedFilter('healing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer font-mono ${
              selectedFilter === 'healing'
                ? 'bg-emerald-600 text-white shadow-xs border border-emerald-400/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Granulating / Healing
          </button>
        </div>
      </div>

      {/* Main Redesigned Decluttered Wound Registry Table */}
      <div className="bg-white/95 dark:bg-[#0c1524]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-md overflow-hidden w-full">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10.5px] tracking-wider font-mono">
            <tr>
              <th
                onClick={() => handleSort('patientName')}
                className="px-4 py-3.5 text-left w-[24%] cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Patient & ID</span>
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('anatomicalSite')}
                className="px-4 py-3.5 text-left w-[24%] cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Anatomical Site</span>
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sinbadCurrent')}
                className="px-3.5 py-3.5 text-center w-[11%] cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>SINBAD</span>
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th
                onClick={() => handleSort('areaCurrent')}
                className="px-3.5 py-3.5 text-center w-[11%] cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Area (PAR)</span>
                  <ArrowUpDown className="w-3 h-3 opacity-50" />
                </div>
              </th>
              <th className="px-3.5 py-3.5 text-center w-[10%]">Tissue</th>
              <th className="px-4 py-3.5 text-left w-[10%]">Active Offloading</th>
              <th className="px-4 py-3.5 text-center w-[10%]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
            {filteredWounds.map((wound) => (
              <tr
                key={wound.woundId}
                onClick={() => onSelectPatientWound(wound.mrn)}
                className="hover:bg-[#aceba7]/10 dark:hover:bg-[#12464e]/25 transition-colors cursor-pointer group"
              >
                {/* 1. Merged Patient Name (Bold 14px) + MRN/WoundID (Muted 12px) */}
                <td className="px-4 py-3.5 text-left align-top">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-[#12464e] dark:group-hover:text-[#aceba7] transition-colors leading-tight">
                      {wound.patientName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      MRN: {wound.mrn} • {wound.woundId}
                    </span>
                  </div>
                </td>

                {/* 2. Anatomical Site (Placed directly in place of old ICD-10 column) */}
                <td className="px-4 py-3.5 text-left align-top">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {wound.anatomicalSite}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Assessed: {wound.lastAssessed}
                    </span>
                  </div>
                </td>

                {/* 3. Simplified SINBAD Column (Base -> Current as plain text) */}
                <td className="px-3.5 py-3.5 text-center align-top">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {wound.sinbadBaseline} → {wound.sinbadCurrent}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      / 6
                    </span>
                  </div>
                </td>

                {/* 4. Simplified Area (PAR) */}
                <td className="px-3.5 py-3.5 text-center align-top">
                  <div className="flex flex-col items-center font-mono">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {wound.areaCurrent} cm²
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      PAR: {wound.par4Week}
                    </span>
                  </div>
                </td>

                {/* 5. Simplified Tissue Breakdown (Compact stacked bar with hover tooltip) */}
                <td className="px-3.5 py-3.5 text-center align-top">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-18 h-2 rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden cursor-help shadow-inner"
                      title={`Granulation: ${wound.tissueState.gran}% | Slough: ${wound.tissueState.slough}% | Necrotic: ${wound.tissueState.necr}%`}
                    >
                      <div style={{ width: `${wound.tissueState.gran}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${wound.tissueState.slough}%` }} className="bg-amber-400 h-full" />
                      <div style={{ width: `${wound.tissueState.necr}%` }} className="bg-rose-500 h-full" />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      {wound.tissueState.gran}% G
                    </span>
                  </div>
                </td>

                {/* 6. Active Offloading (Plain Text, No Box) */}
                <td className="px-4 py-3.5 text-left align-top">
                  <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug block">
                    {wound.offloadingDevice}
                  </span>
                </td>

                {/* 7. Single Primary Risk Status Badge (Only colored badge in the row) */}
                <td className="px-4 py-3.5 text-center align-top">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-block whitespace-nowrap font-mono ${wound.statusColor}`}>
                    {wound.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
