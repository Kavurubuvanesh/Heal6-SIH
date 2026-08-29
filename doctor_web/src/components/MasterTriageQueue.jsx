import React, { useState } from 'react'
import {
  Users,
  Search,
  ChevronRight,
  ShieldAlert,
  Flame,
  Activity
} from 'lucide-react'
import { generateClinicalWoundDataUrl } from '../data/clinicalImages'

export default function MasterTriageQueue({ cases = [], onSelectPatient, onNewAssessment }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Always sorted by SINBAD severity score descending
  const sortedCases = [...cases].sort((a, b) => (b.calculatedSinbad || 0) - (a.calculatedSinbad || 0))

  const filteredQueue = sortedCases.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.locationLabel.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeFilter === 'critical') return matchesSearch && (item.calculatedSinbad >= 4)
    return matchesSearch
  })

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* 1. Master Triage Header: Title & AI Sorting Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Emergency Master Triage Queue
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] animate-pulse" />
            <span>AI Sorting: <strong className="text-slate-900 dark:text-white font-extrabold">Severity Descending</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Filter and Search Bar */}
      <div className="bg-white/90 dark:bg-[#0c1524]/85 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, MRN, anatomical site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white text-xs focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-gradient-to-r from-[#0d9488] to-[#0284c7] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({sortedCases.length})
            </button>
            <button
              onClick={() => setActiveFilter('critical')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'critical'
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-500'
              }`}
            >
              Urgent (SINBAD ≥ 4)
            </button>
          </div>
        </div>
      </div>

      {/* 3. Master Triage Patient Queue Table with Middle / Centered Alignment */}
      <div className="bg-white/90 dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-center text-xs min-w-[950px]">
            <thead className="bg-slate-50/80 dark:bg-[#0f1d2e]/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-4.5 text-center w-28">Priority Rank</th>
                <th className="px-4 py-4.5 text-center w-60">Patient & MRN</th>
                <th className="px-4 py-4.5 text-center w-64">Anatomical Site</th>
                <th className="px-4 py-4.5 text-center w-32">AI Wound Area</th>
                <th className="px-4 py-4.5 text-center w-36">ConvNeXt Infection</th>
                <th className="px-4 py-4.5 text-center w-28">SINBAD Score</th>
                <th className="px-4 py-4.5 text-center w-52">Triage Status</th>
                <th className="px-4 py-4.5 text-center w-44">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-medium text-slate-700 dark:text-slate-300">
              {filteredQueue.map((item, index) => {
                const isCritical = (item.calculatedSinbad || 0) >= 4

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectPatient(item.id)}
                    className={`transition-all cursor-pointer group ${
                      isCritical
                        ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.06] hover:bg-rose-500/[0.08] dark:hover:bg-rose-500/[0.12] border-l-4 border-l-rose-500'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Priority Rank */}
                    <td className="px-4 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                            index === 0
                              ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30'
                              : isCritical
                              ? 'bg-rose-500/15 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold border border-rose-500/20'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold'
                          }`}
                        >
                          #{index + 1}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                            TOP STAT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Patient & MRN (Centered with Visual Scan Thumbnail) */}
                    <td className="px-4 py-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Visual Wound Thumbnail */}
                        <div className="relative w-11 h-11 rounded-xl bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                          <img
                            src={item.originalImage || item.raw_image_base64 || generateClinicalWoundDataUrl(item.siteScore === 1 ? 'hindfoot' : 'forefoot')}
                            alt="Wound Scan Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col items-start justify-center gap-1 text-left">
                          <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#0d9488] dark:group-hover:text-teal-400 transition-colors">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap">
                            <span className="font-mono bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                              {item.id}
                            </span>
                            <span>•</span>
                            <span className="whitespace-nowrap">{item.age}y/{item.gender}</span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">{item.hba1c || '8.9%'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Anatomical Site (Centered) */}
                    <td className="px-4 py-6 text-center">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-relaxed max-w-[220px] mx-auto">
                        {item.locationLabel}
                      </div>
                    </td>

                    {/* AI Wound Area */}
                    <td className="px-4 py-6 text-center">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                        {item.woundAreaCm2} <span className="text-xs font-semibold text-slate-500">cm²</span>
                      </span>
                    </td>

                    {/* ConvNeXt Infection */}
                    <td className="px-4 py-6 text-center">
                      <span className={`font-bold text-sm tracking-tight ${
                        item.infectionRiskPercent > 60 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {item.infectionRiskPercent}%
                      </span>
                    </td>

                    {/* SINBAD Score */}
                    <td className="px-4 py-6 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[68px] px-3 py-1.5 rounded-xl text-xs font-black tracking-tight shadow-xs ${
                          isCritical
                            ? 'bg-rose-500 text-white shadow-rose-500/25'
                            : 'bg-gradient-to-r from-[#0d9488] to-[#0284c7] text-white shadow-teal-500/25'
                        }`}
                      >
                        {item.calculatedSinbad} / 6
                      </span>
                    </td>

                    {/* Triage Status */}
                    <td className="px-4 py-6 text-center">
                      <div className="flex items-center justify-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[10.5px] font-black tracking-wider uppercase border leading-tight shadow-2xs text-center ${
                            isCritical
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {item.triageLevel}
                        </span>
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="px-4 py-6 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectPatient(item.id)
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer ${
                            isCritical
                              ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/20'
                              : 'bg-gradient-to-r from-[#0d9488] to-[#0284c7] hover:from-[#0f766e] hover:to-[#0369a1] text-white shadow-teal-500/20'
                          }`}
                        >
                          <span>Open Patient</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
