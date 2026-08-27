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
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="bg-[#FA7373] text-white px-6 py-4 flex items-center justify-between">
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
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-800 text-xs">
          {dispatched ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800">
                Referral Successfully Dispatched
              </h4>
              <p className="text-slate-600 max-w-sm text-xs">
                Vascular On-Call Surgical Team has been notified. Direct pager confirmation code: <strong className="font-mono text-emerald-700">#VS-TRIAGE-9042</strong>.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 font-mono">
                EMR HL7 Message ID: 6375-VAS-STAT-SENT
              </div>
              <button
                onClick={handleResetAndClose}
                className="mt-2 px-6 py-2.5 bg-[#249583] hover:bg-[#1b7a6b] text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                Return to Assessment
              </button>
            </div>
          ) : (
            <>
              {/* Patient and Risk Summary Pill */}
              <div className="bg-[#fff1f1] border border-[#FA7373]/30 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#FA7373]">
                    Emergency Triage Candidate
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {patient.name} ({patient.id})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    SINBAD Score: <strong className="text-[#FA7373]">{sinbadScore}/6</strong> | Area: {woundArea} cm² | Infection: {infectionRisk}%
                  </span>
                </div>
                <div className="px-2.5 py-1 bg-[#FA7373] text-white rounded-lg text-[10px] font-black tracking-wider uppercase">
                  STAT PRIORITY
                </div>
              </div>

              {/* Department Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Receiving Surgical Specialty Service
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-hidden focus:border-[#249583] focus:ring-1 focus:ring-[#249583]"
                >
                  <option value="limb_salvage">St. Jude Acute Limb Salvage & Revascularization Unit (On-Call)</option>
                  <option value="vascular_surgery">Metro Endovascular Surgery Department</option>
                  <option value="podiatric_surgery">Regional Advanced Podiatric Surgery & Trauma</option>
                </select>
              </div>

              {/* Priority Routing */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setPriority('urgent')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    priority === 'urgent'
                      ? 'border-[#FA7373] bg-[#fff1f1]'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-[#FA7373]" />
                    <span>Immediate STAT (&lt; 24h)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">For acute ischemia and high amputation risk</p>
                </div>

                <div
                  onClick={() => setPriority('expedited')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    priority === 'expedited'
                      ? 'border-[#249583] bg-[#249583]/5'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-[#249583]" />
                    <span>Expedited (&lt; 48-72h)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">For stable neuro-ischemic ulceration</p>
                </div>
              </div>

              {/* Clinical Handover Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Clinical Handover Notes (Auto-Populated from SINBAD Telemetry)
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:outline-hidden focus:border-[#249583] focus:ring-1 focus:ring-[#249583]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={isDispatching}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#FA7373] hover:bg-[#e55c5c] rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
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
