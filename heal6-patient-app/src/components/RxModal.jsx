import React, { useState } from 'react'
import {
  Pill,
  WarningCircle,
  CheckCircle,
  DownloadSimple,
  Printer,
  Buildings,
  ArrowRight,
  ShieldCheck,
  X,
  PhoneCall
} from '@phosphor-icons/react'

export default function RxModal({ isOpen, onClose, data }) {
  const [selectedPharmacy, setSelectedPharmacy] = useState('cvs')
  const [isRouted, setIsRouted] = useState(false)
  const [callbackRequested, setCallbackRequested] = useState(false)

  if (!isOpen) return null

  const medsList = data?.medications && data.medications.length > 0
    ? data.medications
    : [
        "Topical Silver Sulfadiazine 1% Cream (Apply q24h to ulcer bed)",
        "Amoxicillin-Clavulanate 875/125mg PO BID x 10 Days",
        "Strict Glycemic Control Regime (Target HbA1c < 7.0%)"
      ]

  const handleRouteToPharmacy = () => {
    setIsRouted(true)
    setTimeout(() => setIsRouted(false), 5000)
  }

  const handleDownloadRx = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-blue-200 max-h-[90vh] flex flex-col">

        {/* Modal Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Pill weight="fill" className="text-2xl" />
            <div>
              <h2 className="font-extrabold text-base tracking-tight">Electronic Prescription & Pharmacy Router</h2>
              <p className="text-xs text-blue-100">Prescribing Physician: {data?.reviewingPhysician || "Dr. S. Sharma, MD"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold">
            <X weight="bold" className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isRouted && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle weight="fill" className="text-xl text-emerald-600 shrink-0" />
              <div>
                <p>Digital Prescription Transmitted to {selectedPharmacy.toUpperCase()}!</p>
                <p className="text-[10px] text-emerald-700 font-normal">Your local pharmacy will text you when the medication is ready for pickup.</p>
              </div>
            </div>
          )}

          {callbackRequested && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-300 text-blue-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <PhoneCall weight="fill" className="text-xl text-blue-600 shrink-0" />
              <div>
                <p>Pharmacist Consultation Requested</p>
                <p className="text-[10px] text-blue-700 font-normal">A clinical pharmacist will call you within 15 minutes to review dosage and drug interactions.</p>
              </div>
            </div>
          )}

          {/* Prescriber License Metadata */}
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center text-xs">
            <div>
              <p className="font-extrabold text-slate-900">{data?.reviewingPhysician || "Dr. S. Sharma, MD, Podiatric Surgery"}</p>
              <p className="text-slate-500 font-mono text-[11px]">NPI: 1948201948 • DEA: BS9842194</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-blue-200">
              E-Rx Active
            </span>
          </div>

          {/* Prescribed Items List */}
          <div>
            <h4 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
              Prescribed Medications & Dosages:
            </h4>
            <div className="space-y-2.5">
              {medsList.map((med, index) => (
                <div key={index} className="flex gap-3 items-start bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-snug">{med}</p>
                    <p className="text-[10px] text-blue-700 mt-0.5 font-medium">Refills: 2 • Dispense as Written</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pharmacy Selection & Routing */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-[10.5px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Buildings weight="fill" className="text-blue-600 text-sm" />
              Route Prescription to Pharmacy:
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cvs', name: 'CVS Pharmacy', est: 'Ready in 2h' },
                { id: 'walgreens', name: 'Walgreens', est: 'Ready in 1.5h' },
                { id: 'express', name: 'Home Delivery', est: 'Overnight' }
              ].map((pharm) => (
                <button
                  key={pharm.id}
                  onClick={() => setSelectedPharmacy(pharm.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPharmacy === pharm.id
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{pharm.name}</p>
                  <p className="text-[10px] text-blue-700 font-medium mt-0.5">{pharm.est}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleRouteToPharmacy}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowRight weight="bold" />
              <span>Send E-Prescription to {selectedPharmacy.toUpperCase()}</span>
            </button>
          </div>

          {/* Pharmacy Consultation CTA */}
          <div className="bg-yellow-50 p-3 rounded-2xl flex gap-2.5 items-start border border-yellow-200 text-yellow-900 text-xs">
            <WarningCircle weight="fill" className="text-yellow-600 text-lg shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Drug Allergy & Interaction Advisory</p>
              <p className="text-[11px] text-yellow-800 leading-snug mt-0.5">
                Always inform your pharmacist of any penicillin or sulfa allergies prior to taking these medications.
              </p>
              <button
                onClick={() => setCallbackRequested(true)}
                className="mt-2 text-[10.5px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <PhoneCall weight="bold" /> Request Free Pharmacist Advisory Call
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleDownloadRx}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer weight="bold" className="text-base text-blue-400" />
            <span>Print Official Rx Slip</span>
          </button>
        </div>
      </div>
    </div>
  )
}