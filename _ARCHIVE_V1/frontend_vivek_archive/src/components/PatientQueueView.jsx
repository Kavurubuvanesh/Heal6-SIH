import React, { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Layers,
  Activity,
  Plus
} from 'lucide-react'

export default function PatientQueueView({ onSelectPatient, onNewAssessment }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('all')

  const queueList = [
    {
      id: 'DFU-8842',
      name: 'Robert Vance',
      age: 61,
      gender: 'Male',
      site: 'Right Heel (Hindfoot)',
      sinbad: 4,
      triage: 'URGENT TRIAGE',
      triageColor: 'bg-[#fff1f1] text-[#FA7373] border-[#FA7373]/30',
      time: '10 mins ago',
      status: 'Awaiting Surgical Review'
    },
    {
      id: 'DFU-5104',
      name: 'Elena Rostova',
      age: 54,
      gender: 'Female',
      site: 'Left 1st Metatarsal',
      sinbad: 2,
      triage: 'MODERATE RISK',
      triageColor: 'bg-amber-50 text-amber-700 border-amber-300',
      time: '42 mins ago',
      status: 'Dressing Change Scheduled'
    },
    {
      id: 'DFU-9311',
      name: 'Arthur Pendelton',
      age: 72,
      gender: 'Male',
      site: 'Left Midfoot (Charcot)',
      sinbad: 6,
      triage: 'CRITICAL STAT',
      triageColor: 'bg-[#fff1f1] text-[#FA7373] border-[#FA7373]/30',
      time: '1 hr ago',
      status: 'Vascular Referral Dispatched'
    },
    {
      id: 'DFU-3290',
      name: 'Sarah Jenkins',
      age: 49,
      gender: 'Female',
      site: 'Right Hallux Apex',
      sinbad: 1,
      triage: 'LOW RISK',
      triageColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      time: '2 hrs ago',
      status: 'Offloaded with Orthotic'
    },
    {
      id: 'DFU-7721',
      name: 'Michael Chang',
      age: 65,
      gender: 'Male',
      site: 'Left Lateral Malleolus',
      sinbad: 3,
      triage: 'HIGH RISK',
      triageColor: 'bg-orange-50 text-orange-700 border-orange-300',
      time: '3 hrs ago',
      status: 'ArUco Calibrated'
    }
  ]

  const filteredQueue = queueList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.site.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clinical Patient Triage Queue</h2>
          <p className="text-xs text-slate-500">Live active admissions pending SINBAD validation & care pathways</p>
        </div>

        <button
          onClick={onNewAssessment}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#249583] hover:bg-[#1b7a6b] text-white text-xs font-bold shadow-md shadow-[#249583]/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, MRN, anatomical site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#249583] focus:ring-1 focus:ring-[#249583]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Showing <strong>{filteredQueue.length}</strong> active patients</span>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Patient Details</th>
                <th className="px-6 py-3.5">Anatomical Site</th>
                <th className="px-6 py-3.5">SINBAD Score</th>
                <th className="px-6 py-3.5">Triage Level</th>
                <th className="px-6 py-3.5">Status & Time</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredQueue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.id} • {item.age}y/{item.gender}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-semibold">{item.site}</td>
                  <td className="px-6 py-4">
                    <span className="font-black text-sm text-slate-800 font-mono">
                      {item.sinbad} <span className="text-slate-400 text-xs">/ 6</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${item.triageColor}`}>
                      {item.triage}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-slate-700">{item.status}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{item.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={onNewAssessment}
                      className="px-3 py-1.5 rounded-lg bg-[#249583]/10 hover:bg-[#249583] text-[#249583] hover:text-white font-bold transition-all text-[11px]"
                    >
                      Open Assessment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
