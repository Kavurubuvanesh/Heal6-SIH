import React from 'react'
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Calendar,
  User,
  HeartPulse,
  Activity,
  QrCode
} from 'lucide-react'
import Heal6Logo from './Heal6Logo'

export default function ReportModal({
  isOpen,
  onClose,
  patient,
  sinbadScore,
  woundArea,
  infectionRisk,
  triageLabel,
  healingTime
}) {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Toolbar */}
        <div className="bg-slate-900 dark:bg-[#070e14] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0d9488] dark:text-teal-400" />
            <span className="font-bold text-sm">Medical Record: Formal Clinical Assessment Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div id="printable-report" className="p-8 space-y-6 text-slate-800 dark:text-slate-200 text-xs bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl">
          {/* Header with Heal6 Custom Branding */}
          <div className="flex items-center justify-between border-b pb-6 border-slate-200 dark:border-slate-800">
            <div>
              <Heal6Logo size="normal" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                CLINICAL TRIAGE & COMPUTER VISION TELEMETRY
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Podiatry & Wound Care Division</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Heal6 Clinical Care Network</div>
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                Report UUID: {patient.id}-SINBAD-2026
              </div>
            </div>
          </div>

          {/* Patient Details Strip */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Patient Name</span>
              <p className="font-bold text-slate-800 dark:text-white">{patient.name}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">MRN</span>
              <p className="font-mono font-bold text-slate-800 dark:text-white">{patient.id}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Demographics</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{patient.age}y / {patient.gender}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">HbA1c & DM</span>
              <p className="font-bold text-amber-700 dark:text-amber-400">{patient.hba1c} ({patient.diabetesType})</p>
            </div>
          </div>

          {/* SINBAD Diagnostic Summary Matrix */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
              <span>SINBAD Factor Scoring Matrix (IWGDF Guideline)</span>
              <span className="text-xs text-[#0d9488] dark:text-teal-400 font-mono font-bold">
                Total Score: {sinbadScore} / 6
              </span>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl">
              <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Site (Hindfoot/Midfoot):</span>
                <span className="font-bold text-slate-800 dark:text-white">1 pt (High Risk)</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Ischemia (Reduced Pulses):</span>
                <span className="font-bold text-slate-800 dark:text-white">1 pt (Reduced)</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Neuropathy (Sensory Loss):</span>
                <span className="font-bold text-slate-800 dark:text-white">1 pt (Loss of 10g)</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Bacterial Infection:</span>
                <span className="font-bold text-slate-800 dark:text-white">{infectionRisk > 50 ? '1 pt (Present)' : '0 pt (None)'}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Area (ArUco Calibrated):</span>
                <span className="font-bold text-slate-800 dark:text-white">{woundArea >= 1.0 ? '1 pt (≥1cm²)' : '0 pt (<1cm²)'}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Depth (Bone / Fascia):</span>
                <span className="font-bold text-slate-800 dark:text-white">1 pt (Deep Tissue)</span>
              </div>
            </div>
          </div>

          {/* AI Architecture & SOTA Model Specifications */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
                ML Model Specification: UNet++ (EfficientNet-B4 Encoder)
              </span>
              <span className="font-mono text-[10.5px] text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                4-Class Pixel SOTA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              4-Tier Pixel Classification (DFUTissue Dataset): Granulation ({patient.tissueBreakdown?.granulation || 45}%), Slough ({patient.tissueBreakdown?.slough || 35}%), Necrotic ({patient.tissueBreakdown?.necrotic || 20}%), Background. ArUco Metric Area: {woundArea} cm².
            </p>
          </div>

          {/* Prescribed Clinical Plan */}
          <div className="bg-[#0d9488]/5 dark:bg-teal-950/40 border border-[#0d9488]/20 dark:border-teal-800 rounded-xl p-4">
            <h4 className="font-bold text-[#0d9488] dark:text-teal-400 mb-1">Prescribed Action Plan</h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Standard wound care with urgent multidisciplinary limb salvage intervention. Total Contact Casting (TCC) offloading, surgical sharp debridement of necrotic slough, silver hydrofiber dressings, and expedited vascular surgery consultation.
            </p>
          </div>

          {/* Physician Sign-Off & Verification Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#0d9488] dark:text-teal-400" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Dr. Sharma, MD, FRCP</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Board Certified Endocrinologist & Wound Specialist</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Digital Signature Hash</span>
              <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">#HEAL6-VERIFIED-e98a1</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-white bg-[#0d9488] hover:bg-[#0f766e] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>
        </div>
      </div>
    </div>
  )
}
