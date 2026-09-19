import React from 'react'
import {
  MapPin,
  HeartCrack,
  Activity,
  AlertCircle,
  Layers,
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
  User,
  Calendar,
  Tag,
  Stethoscope,
  ClipboardList
} from 'lucide-react'

export default function ClinicalFormCard({
  patientName = 'Rajesh Verma',
  setPatientName,
  patientAge = 64,
  setPatientAge,
  patientGender = 'Male',
  setPatientGender,
  diabetesType = 'Type 2 DM (14 yrs)',
  setDiabetesType,
  locationLabel = 'Right Plantar Hindfoot Ulcer',
  setLocationLabel,
  siteHindfoot,
  setSiteHindfoot,
  ischemia,
  setIschemia,
  neuropathy,
  setNeuropathy,
  depthDeep,
  setDepthDeep,
  onRunAnalysis,
  isAnalyzing,
  analysisStep = ''
}) {
  const toggleItems = [
    {
      id: 'site',
      label: 'Hindfoot / Midfoot Location',
      description: 'Heel or midfoot lesion (Deep space infection risk)',
      badge: 'Site: 1 pt',
      checked: siteHindfoot,
      onChange: setSiteHindfoot,
      icon: MapPin,
      altLabel: 'Forefoot (0 pt)'
    },
    {
      id: 'ischemia',
      label: 'Ischemia (Reduced Pulses)',
      description: 'Absent pedal pulses (ABI < 0.8) / limb ischemia',
      badge: 'Ischemia: 1 pt',
      checked: ischemia,
      onChange: setIschemia,
      icon: HeartCrack,
      altLabel: 'Intact (0 pt)'
    },
    {
      id: 'neuropathy',
      label: 'Neuropathy (Sensory Loss)',
      description: 'Insensate to 10g monofilament / vibration loss',
      badge: 'Neuropathy: 1 pt',
      checked: neuropathy,
      onChange: setNeuropathy,
      icon: Activity,
      altLabel: 'Intact (0 pt)'
    },
    {
      id: 'depth',
      label: 'Deep Tissue / Bone Depth',
      description: 'Ulcer probes to capsule, tendon, or visible bone',
      badge: 'Depth: 1 pt',
      checked: depthDeep,
      onChange: setDepthDeep,
      icon: Layers,
      altLabel: 'Superficial (0 pt)'
    }
  ]

  return (
    <div className="spotlight-card glass-panel-luxury rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-xl flex flex-col justify-between gap-4 transition-all h-full w-full relative overflow-hidden group">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#12464e]/10 dark:border-[#223229] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center border border-[#aceba7]/30 shadow-inner">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white tracking-wide">
              Physician Clinical Parameters
            </h3>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/20 dark:bg-[#aceba7]/10 px-2.5 py-0.5 rounded-full border border-[#aceba7]/30">
          Patient Intake & SINBAD
        </span>
      </div>

      {/* 1. Patient Details & Clinical Registry Fields */}
      <div className="bg-white/60 dark:bg-[#0c1524]/60 rounded-2xl p-3.5 border border-slate-200/70 dark:border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-[#12464e] dark:text-[#aceba7]" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Patient & Registry Intake Details
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Patient Name */}
          <div>
            <label className="block text-[10px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Patient Full Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName && setPatientName(e.target.value)}
                placeholder="e.g. Rajesh Verma"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#aceba7] transition-all"
              />
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Age
              </label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge && setPatientAge(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#aceba7] transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Gender
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender && setPatientGender(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#aceba7] transition-all cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Diabetes History */}
          <div>
            <label className="block text-[10px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Diabetes History & Duration
            </label>
            <div className="relative">
              <Activity className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={diabetesType}
                onChange={(e) => setDiabetesType && setDiabetesType(e.target.value)}
                placeholder="e.g. Type 2 DM (14 yrs)"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#aceba7] transition-all"
              />
            </div>
          </div>

          {/* Anatomical Wound Site */}
          <div>
            <label className="block text-[10px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Anatomical Wound Site
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationLabel}
                onChange={(e) => setLocationLabel && setLocationLabel(e.target.value)}
                placeholder="e.g. Right Plantar Hindfoot / Heel"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#aceba7] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 Physician SINBAD Parameter Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {toggleItems.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.id}
              onClick={() => item.onChange(!item.checked)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-xs ${
                item.checked
                  ? 'bg-[#aceba7]/10 dark:bg-[#12464e]/40 border-[#aceba7]/60 dark:border-[#aceba7]/40 shadow-sm'
                  : 'bg-white/70 dark:bg-[#0e120f]/60 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
              }`}
            >
              {/* Top Row: Icon + Badge on Left, Toggle on Right */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-lg transition-colors ${
                      item.checked
                        ? 'bg-[#12464e] dark:bg-[#aceba7] text-[#aceba7] dark:text-[#0e120f] shadow-xs'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                      item.checked
                        ? 'bg-[#aceba7]/20 border-[#aceba7]/40 text-[#12464e] dark:text-[#aceba7]'
                        : 'bg-slate-200/80 dark:bg-slate-800/80 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.checked ? item.badge : item.altLabel}
                  </span>
                </div>

                {/* Modern iOS Toggle Switch */}
                <div className="relative inline-flex items-center shrink-0">
                  <div
                    className={`w-8 h-4.5 rounded-full transition-colors duration-200 ease-in-out ${
                      item.checked ? 'bg-[#aceba7]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center translate-y-0.5 ${
                        item.checked ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    >
                      {item.checked && <Check className="w-2.5 h-2.5 text-[#12464e] stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Title & Subtitle */}
              <div>
                <h4 className="text-xs font-serif-luxury font-bold text-slate-900 dark:text-slate-100 tracking-wide">
                  {item.label}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. Primary Action Button */}
      <div>
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className={`w-full py-3 px-6 rounded-2xl font-serif-luxury text-sm tracking-wide text-[#0e120f] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl cursor-pointer ${
            isAnalyzing
              ? 'bg-[#aceba7]/70 cursor-wait'
              : 'bg-[#aceba7] hover:bg-[#bbf0b7] hover:shadow-2xl hover:shadow-[#aceba7]/30 hover:scale-[1.01] active:scale-[0.99] border border-[#aceba7]/40'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#0e120f]" />
              <span className="font-sans font-bold text-xs">{analysisStep || 'Executing PyTorch ConvNeXt & UNet++ Pipeline...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#12464e]" />
              <span className="font-bold text-[#12464e]">Execute SOTA SINBAD Analysis</span>
              <ArrowRight className="w-4 h-4 ml-1 text-[#12464e]" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
