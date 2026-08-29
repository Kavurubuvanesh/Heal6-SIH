import React, { useState } from 'react'
import {
  Layers,
  Search,
  Filter,
  Download,
  Plus,
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

export const WOUND_REGISTRY_DATA = [
  {
    woundId: 'WND-2026-084',
    patientName: 'Robert Vance',
    mrn: 'DFU-8842',
    icd10: 'E11.621 / L97.412',
    icd10Label: 'T2D with chronic deep ulcer of right heel/hindfoot',
    anatomicalSite: 'Right Plantar Hindfoot (Heel)',
    sinbadBaseline: 5,
    sinbadCurrent: 4,
    areaBaseline: 3.80,
    areaCurrent: 2.45,
    par4Week: '-35.5%',
    tissueState: { gran: 45, slough: 35, necr: 20 },
    microbiology: 'Staph. aureus (MRSA-) • Moderate Exudate',
    offloadingDevice: 'Total Contact Cast (TCC)',
    lastAssessed: 'Aug 26, 2026',
    status: 'High Risk (Active Care)',
    statusColor: 'bg-[#fff1f2] text-[#f43f5e] dark:bg-rose-950/60 dark:text-rose-400 border-[#f43f5e]/40 dark:border-rose-800'
  },
  {
    woundId: 'WND-2026-062',
    patientName: 'Elena Rostova',
    mrn: 'DFU-5104',
    icd10: 'E10.621 / L97.511',
    icd10Label: 'T1D with superficial ulcer of other part of left foot',
    anatomicalSite: 'Left 1st Metatarsal Head',
    sinbadBaseline: 3,
    sinbadCurrent: 2,
    areaBaseline: 2.10,
    areaCurrent: 1.20,
    par4Week: '-42.8%',
    tissueState: { gran: 75, slough: 20, necr: 5 },
    microbiology: 'Scant Colonization (Non-Invasive)',
    offloadingDevice: 'Custom Molded Neuropathic Orthotic',
    lastAssessed: 'Aug 24, 2026',
    status: 'Granulating / Healing',
    statusColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
  },
  {
    woundId: 'WND-2026-019',
    patientName: 'Arthur Pendelton',
    mrn: 'DFU-9311',
    icd10: 'E11.621 / M14.672',
    icd10Label: 'T2D with Charcot arthropathy & deep midfoot collapse ulcer',
    anatomicalSite: 'Left Midfoot (Rocker-bottom)',
    sinbadBaseline: 6,
    sinbadCurrent: 6,
    areaBaseline: 5.10,
    areaCurrent: 4.80,
    par4Week: '-5.8%',
    tissueState: { gran: 20, slough: 45, necr: 35 },
    microbiology: 'Polymicrobial (Pseudomonas + Strep) • Purulent',
    offloadingDevice: 'Bivalved Pneumatic Cast Walker (Non-WB)',
    lastAssessed: 'Aug 26, 2026',
    status: 'Critical / Vascular Consult',
    statusColor: 'bg-[#fff1f2] text-[#f43f5e] dark:bg-rose-950/60 dark:text-rose-400 border-[#f43f5e]/40 dark:border-rose-800'
  },
  {
    woundId: 'WND-2026-041',
    patientName: 'Sarah Jenkins',
    mrn: 'DFU-3290',
    icd10: 'E11.621 / L97.521',
    icd10Label: 'T2D with ulcer of right toe apex',
    anatomicalSite: 'Right Hallux Distal Apex',
    sinbadBaseline: 2,
    sinbadCurrent: 1,
    areaBaseline: 0.95,
    areaCurrent: 0.35,
    par4Week: '-63.1%',
    tissueState: { gran: 90, slough: 10, necr: 0 },
    microbiology: 'Sterile Culture (Post-Antibiotic)',
    offloadingDevice: 'Wedge Toe Offloading Shoe',
    lastAssessed: 'Aug 20, 2026',
    status: 'Near Resolution',
    statusColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
  },
  {
    woundId: 'WND-2026-077',
    patientName: 'Michael Chang',
    mrn: 'DFU-7721',
    icd10: 'E11.621 / I70.261',
    icd10Label: 'T2D with Atherosclerosis & lateral malleolus ischemic ulcer',
    anatomicalSite: 'Left Lateral Malleolus',
    sinbadBaseline: 4,
    sinbadCurrent: 3,
    areaBaseline: 2.80,
    areaCurrent: 2.05,
    par4Week: '-26.7%',
    tissueState: { gran: 50, slough: 30, necr: 20 },
    microbiology: 'Staph. epidermidis • Moderate Serosanguinous',
    offloadingDevice: 'Padded Ankle Stirrup + Foam Dressing',
    lastAssessed: 'Aug 22, 2026',
    status: 'Moderate Neuro-Ischemic',
    statusColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800'
  }
]

export default function WoundRegistryView({ onSelectPatientWound, onNewAssessment }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const filteredWounds = WOUND_REGISTRY_DATA.filter((w) => {
    const matchesSearch =
      w.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.woundId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.icd10.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.anatomicalSite.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedFilter === 'critical') return matchesSearch && (w.sinbadCurrent >= 4)
    if (selectedFilter === 'healing') return matchesSearch && (w.sinbadCurrent <= 2)
    return matchesSearch
  })

  const exportCSV = () => {
    const headers = ['Wound ID', 'Patient', 'MRN', 'ICD-10', 'Site', 'SINBAD Base', 'SINBAD Current', 'Area Base', 'Area Current', 'PAR 4W', 'Status']
    const rows = filteredWounds.map((w) => [
      w.woundId,
      `"${w.patientName}"`,
      w.mrn,
      `"${w.icd10}"`,
      `"${w.anatomicalSite}"`,
      w.sinbadBaseline,
      w.sinbadCurrent,
      w.areaBaseline,
      w.areaCurrent,
      `"${w.par4Week}"`,
      `"${w.status}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'heal6_wound_registry_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full">
      {/* Registry Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md">
              ICD-10 Clinical Database
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Longitudinal Wound Bed Registry
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Diabetic Foot Ulcer Registry & Progression
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export Registry (CSV)</span>
          </button>

          <button
            onClick={onNewAssessment}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] rounded-xl shadow-md shadow-[#0d9488]/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Wound</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Stats (Realistically Synced to the 5 Registered Patients) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Tracked Ulcers</span>
            <div className="text-xl font-black text-slate-800 dark:text-white mt-0.5">5 Active Cases</div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">100% Telemetry Enrolled</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">4-Wk Area Reduction</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">2 / 5 (40%)</div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Achieved ≥ 40% Target</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">High-Risk SINBAD (≥4)</span>
            <div className="text-xl font-black text-[#f43f5e] dark:text-rose-400 mt-0.5">2 Cases (40%)</div>
            <span className="text-[10px] text-[#f43f5e] dark:text-rose-400 font-semibold">Under Vascular Protocol</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#fff1f2] dark:bg-rose-950 text-[#f43f5e] dark:text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Offloading Compliance</span>
            <div className="text-xl font-black text-[#0d9488] dark:text-teal-400 mt-0.5">5 / 5 (100%)</div>
            <span className="text-[10px] text-[#0d9488] dark:text-teal-400 font-semibold">Active TCC / Orthotics</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient, MRN, ICD-10, Site or Wound ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:outline-hidden focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Registered ({WOUND_REGISTRY_DATA.length})
          </button>
          <button
            onClick={() => setSelectedFilter('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'critical'
                ? 'bg-[#f43f5e] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Urgent SINBAD ≥ 4
          </button>
          <button
            onClick={() => setSelectedFilter('healing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'healing'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Granulating / Healing
          </button>
        </div>
      </div>

      {/* Main Wound Registry Data Table */}
      <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden w-full">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10.5px] tracking-wider">
            <tr>
              <th className="px-3.5 py-3.5 text-left w-[16%]">Wound & Patient ID</th>
              <th className="px-3.5 py-3.5 text-left w-[24%]">ICD-10 Clinical Coding</th>
              <th className="px-3.5 py-3.5 text-left w-[18%]">Anatomical Site</th>
              <th className="px-3 py-3.5 text-center w-[12%]">SINBAD (Base → Cur)</th>
              <th className="px-3 py-3.5 text-center w-[10%]">Area (PAR)</th>
              <th className="px-3 py-3.5 text-center w-[10%]">Tissue Composition</th>
              <th className="px-3.5 py-3.5 text-center w-[10%]">Active Offloading</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
            {filteredWounds.map((wound) => (
              <tr
                key={wound.woundId}
                onClick={() => onSelectPatientWound(wound.mrn)}
                className="hover:bg-[#0d9488]/5 dark:hover:bg-teal-950/20 transition-colors cursor-pointer group"
              >
                {/* Wound ID & Patient */}
                <td className="px-3.5 py-3.5 text-left">
                  <div className="flex flex-col">
                    <span className="font-mono font-black text-[#0d9488] dark:text-teal-400 group-hover:underline text-xs flex items-center gap-1">
                      {wound.woundId}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 group-hover:text-[#0d9488] dark:group-hover:text-teal-300 transition-colors">
                      {wound.patientName}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      MRN: {wound.mrn}
                    </span>
                  </div>
                </td>

                {/* ICD-10 Code & Diagnostic Label */}
                <td className="px-3.5 py-3.5 text-left">
                  <div className="flex flex-col">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-[#0d9488] dark:text-teal-400 text-[11px] bg-[#0d9488]/10 dark:bg-teal-950/60 px-2 py-0.5 rounded-md w-fit">
                      <Tag className="w-3 h-3" />
                      {wound.icd10}
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {wound.icd10Label}
                    </span>
                  </div>
                </td>

                {/* Anatomical Site */}
                <td className="px-3.5 py-3.5 text-left">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block leading-snug">
                    {wound.anatomicalSite}
                  </span>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Assessed: {wound.lastAssessed}
                  </div>
                </td>

                {/* SINBAD Delta */}
                <td className="px-3 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-slate-400 line-through text-xs font-semibold">
                      {wound.sinbadBaseline}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 font-bold">→</span>
                    <span className={`font-black text-xs px-2 py-0.5 rounded-lg tracking-tight ${
                      wound.sinbadCurrent >= 4
                        ? 'bg-[#fff1f2] dark:bg-rose-950 text-[#f43f5e] dark:text-rose-400 border border-[#f43f5e]/30'
                        : wound.sinbadCurrent <= 2
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40'
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300/40'
                    }`}>
                      {wound.sinbadCurrent} / 6
                    </span>
                  </div>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${wound.statusColor}`}>
                    {wound.status}
                  </span>
                </td>

                {/* Area Delta & PAR % */}
                <td className="px-3 py-3.5 text-center">
                  <div className="font-black text-slate-900 dark:text-white text-xs tracking-tight">
                    {wound.areaCurrent} <span className="text-[10px] font-semibold text-slate-400">cm²</span>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    Base: {wound.areaBaseline} cm²
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight inline-block mt-0.5">
                    PAR: {wound.par4Week}
                  </span>
                </td>

                {/* Tissue Breakdown */}
                <td className="px-3 py-3.5 text-center">
                  <div className="w-full max-w-[100px] mx-auto h-2 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div style={{ width: `${wound.tissueState.gran}%` }} className="bg-emerald-500 h-full" title={`Granulation: ${wound.tissueState.gran}%`} />
                    <div style={{ width: `${wound.tissueState.slough}%` }} className="bg-amber-400 h-full" title={`Slough: ${wound.tissueState.slough}%`} />
                    <div style={{ width: `${wound.tissueState.necr}%` }} className="bg-slate-900 dark:bg-slate-400 h-full" title={`Necrotic: ${wound.tissueState.necr}%`} />
                  </div>
                  <div className="flex justify-between max-w-[100px] mx-auto text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                    <span>{wound.tissueState.gran}%G</span>
                    <span>{wound.tissueState.slough}%S</span>
                    <span>{wound.tissueState.necr}%N</span>
                  </div>
                </td>

                {/* Offloading */}
                <td className="px-3.5 py-3.5 text-center">
                  <span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg inline-block leading-tight" title={wound.offloadingDevice}>
                    {wound.offloadingDevice}
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
