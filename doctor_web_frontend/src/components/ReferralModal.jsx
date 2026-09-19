import React, { useState } from 'react'
import {
  X,
  Siren,
  CheckCircle2,
  AlertTriangle,
  Building,
  Send,
  Loader2,
  Clock,
  FileCheck,
  ShieldAlert
} from 'lucide-react'

export default function ReferralModal({
  isOpen,
  onClose,
  patient,
  sinbadScore,
  woundArea,
  infectionRisk
}) {
  const [department, setDepartment] = useState('limb_salvage')
  const [priority, setPriority] = useState('urgent')
  const [isDispatching, setIsDispatching] = useState(false)
  const [dispatched, setDispatched] = useState(false)
  const [clinicalNotes, setClinicalNotes] = useState(
    `Patient presents with SINBAD score ${sinbadScore}/6 (High-Risk DFU). Hindfoot location with reduced pedal pulses, deep fascial probing, and ${woundArea} cm² ulceration with ${infectionRisk}% infection probability. Requesting urgent duplex arterial mapping and revascularization consult.`
  )

  if (!isOpen) return null

  const handleDispatch = () => {
    setIsDispatching(true)
    setTimeout(() => {
      setIsDispatching(false)
      setDispatched(true)
    }, 1200)
  }

  const handleResetAndClose = () => {
    setDispatched(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="bg-[#f43f5e] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Urgent Vascular Surgery Referral Dispatch</h3>
              <p className="text-[11px] text-white/80">Direct EMR / FHIR Inter-Hospital Referral</p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-800 dark:text-slate-200 text-xs bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl">
          {dispatched ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
                Referral Successfully Dispatched
              </h4>
              <p className="text-slate-600 dark:text-slate-300 max-w-sm text-xs">
                Vascular On-Call Surgical Team has been notified. Direct pager confirmation code: <strong className="font-mono text-emerald-700 dark:text-emerald-400">#VS-TRIAGE-9042</strong>.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                EMR HL7 Message ID: 6375-VAS-STAT-SENT
              </div>
              <button
                onClick={handleResetAndClose}
                className="mt-2 px-6 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Return to Assessment
              </button>
            </div>
          ) : (
            <>
              {/* Patient and Risk Summary Pill */}
              <div className="bg-[#fff1f2] dark:bg-rose-950/40 border border-[#f43f5e]/30 dark:border-rose-900 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#f43f5e] dark:text-rose-400">
                    Emergency Triage Candidate
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {patient.name} ({patient.id})
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    SINBAD Score: <strong className="text-[#f43f5e] dark:text-rose-400">{sinbadScore}/6</strong> | Area: {woundArea} cm² | Infection: {infectionRisk}%
                  </span>
                </div>
                <div className="px-2.5 py-1 bg-[#f43f5e] text-white rounded-lg text-[10px] font-black tracking-wider uppercase">
                  STAT PRIORITY
                </div>
              </div>

              {/* Department Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Receiving Surgical Specialty Service
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] cursor-pointer"
                >
                  <option value="limb_salvage">St. Jude Acute Limb Salvage & Revascularization Unit (On-Call)</option>
                  <option value="vascular_surgery">Metro Endovascular Surgery Department</option>
                  <option value="podiatric_surgery">Regional Advanced Podiatric Surgery & Trauma</option>
                </select>
              </div>

              {/* Priority Routing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setPriority('urgent')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    priority === 'urgent'
                      ? 'border-[#f43f5e] bg-[#fff1f2] dark:bg-rose-950/40 dark:border-rose-700'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                    <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                    <span>Immediate STAT (&lt; 24h)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">For acute ischemia and high amputation risk</p>
                </div>

                <div
                  onClick={() => setPriority('expedited')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    priority === 'expedited'
                      ? 'border-[#0d9488] bg-[#0d9488]/5 dark:bg-teal-950/40 dark:border-teal-700'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                    <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
                    <span>Expedited (&lt; 48-72h)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">For stable neuro-ischemic ulceration</p>
                </div>
              </div>

              {/* Clinical Handover Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Clinical Handover Notes (Auto-Populated from SINBAD Telemetry)
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:outline-hidden focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={isDispatching}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#f43f5e] hover:bg-[#e11d48] rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  {isDispatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Transmitting via EMR...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmit Referral Now</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
