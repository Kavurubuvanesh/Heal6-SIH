import React from 'react'
import { FilePdf, X, DownloadSimple, Printer, ShieldCheck, CheckSquare, FirstAid, Warning, Heart } from '@phosphor-icons/react'

export default function ToolkitModal({ isOpen, onClose, data }) {
  if (!isOpen) return null

  const phase = data?.currentPhase || "Urgent Care"
  const isCritical = data?.ulcerationRisk > 60 || data?.tissueDamage > 30

  const handlePrintOrDownload = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-teal-500/20 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-teal-700 p-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FilePdf weight="fill" className="text-2xl" />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg tracking-tight">
                Clinical Care Toolkit & Dressing Protocol
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                Personalized Protocol for: <span className="font-bold underline">{phase}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold"
          >
            <X weight="bold" className="text-lg" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Summary Box */}
          <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-4 flex items-start gap-3.5">
            <ShieldCheck weight="fill" className="text-teal-600 text-2xl shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-teal-900">
              <p className="font-extrabold text-sm text-teal-950">Patient-Specific Protocol Summary</p>
              <p>
                Patient: <strong>{data?.name || "Patient"}</strong> (MRN: {data?.id}) • Ulcer Risk: <strong>{Number(data?.ulcerationRisk || 0).toFixed(1)}%</strong> • Area: <strong>{data?.currentArea || 2.45} cm²</strong>
              </p>
              <p className="text-teal-700">
                This clinical guide outlines mandatory daily dressing, mechanical offloading, and infection surveillance steps.
              </p>
            </div>
          </div>

          {/* Step-by-Step Dressing Protocol */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FirstAid weight="fill" className="text-teal-600 text-base" />
              1. Daily Dressing & Cleansing Procedure (q24h / q48h)
            </h4>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-bold text-slate-900 text-xs">Saline Irrigation</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Gently cleanse the wound bed with sterile 0.9% Normal Saline wash. Avoid tap water, hydrogen peroxide, or harsh alcohol scrubs.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-bold text-slate-900 text-xs">Antimicrobial Barrier Application</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Apply prescribed topical antimicrobial ointment or Silver Alginate hydrofiber dressing directly to the central ulcer bed.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-bold text-slate-900 text-xs">Secondary Moisture-Control Foam</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Cover with a sterile non-adherent polyurethane foam pad and secure with tubular elastic bandage. Do not wrap tightly around digits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Offloading & Safety Rules */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Heart weight="fill" className="text-rose-500 text-base" />
              2. Mechanical Pressure Offloading Rules
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="font-bold">Zero Barefoot Walking</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Never walk barefoot, even indoors on soft carpets. Micro-trauma can rapidly accelerate tissue necrosis.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                <p className="font-bold">Specialized Offloader</p>
                <p className="mt-1 text-blue-800 leading-relaxed">
                  Wear prescribed pneumatic walking boot or custom neuropathic rocker-bottom orthotics at all times during weight-bearing.
                </p>
              </div>
            </div>
          </div>

          {/* Red Flag Warning Signs */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5">
            <Warning weight="fill" className="text-rose-600 text-2xl shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 space-y-1">
              <p className="font-bold text-sm text-rose-950">Emergency Red-Flag Symptoms</p>
              <p className="leading-relaxed">
                Contact your surgical team immediately or visit the Emergency Department if you notice:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-rose-800 pt-1 font-medium">
                <li>Body temperature exceeding 38.0°C (100.4°F) or unexplained chills</li>
                <li>Rapidly spreading redness &gt;2 cm beyond ulcer margins</li>
                <li>Foul-smelling purulent exudate or black necrotic eschar expansion</li>
                <li>Sudden numbness, cold pale toes, or severe throbbing rest pain</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Close Guide
          </button>
          <button
            onClick={handlePrintOrDownload}
            className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer weight="bold" className="text-base" />
            <span>Print / Save as PDF Guide</span>
          </button>
        </div>
      </div>
    </div>
  )
}
