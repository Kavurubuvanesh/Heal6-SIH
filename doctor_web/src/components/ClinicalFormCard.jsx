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
  Stethoscope
} from 'lucide-react'

export default function ClinicalFormCard({
  patientName = 'Carlos Mendez',
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

  // Calculate clinical tally from physician toggles
  const clinicalTally = (siteHindfoot ? 1 : 0) + (ischemia ? 1 : 0) + (neuropathy ? 1 : 0) + (depthDeep ? 1 : 0)

  return (
    <div className="spotlight-card glass-panel-luxury rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xl flex flex-col justify-between gap-5 transition-all h-full w-full relative overflow-hidden group">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-wide">
            <div className="w-8 h-8 rounded-xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center border border-[#aceba7]/30">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span>Physician Clinical Parameters</span>
          </h3>
          <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 mt-0.5">
            IWGDF 6-Factor SINBAD Classification Matrix
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#aceba7]/15 dark:bg-[#12464e]/50 border border-[#aceba7]/30 text-[#12464e] dark:text-[#aceba7] text-xs font-bold font-mono">
          <span>Inputs:</span>
          <span className="font-bold">{clinicalTally} / 4 pts</span>
        </div>
      </div>

      {/* Patient Demographics Intake Inputs */}
      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-black/40 border border-slate-200/70 dark:border-white/5 space-y-3 shadow-inner">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 block font-bold">
          Patient Profile & Target:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Patient Name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName && setPatientName(e.target.value)}
              placeholder="e.g. Carlos Mendez"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-serif-luxury text-slate-800 dark:text-slate-100 focus:border-[#aceba7] focus:ring-1 focus:ring-[#aceba7] focus:outline-hidden transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Age & Gender</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge && setPatientAge(e.target.value)}
                placeholder="Age"
                className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:border-[#aceba7] focus:outline-hidden transition-all"
              />
              <select
                value={patientGender}
                onChange={(e) => setPatientGender && setPatientGender(e.target.value)}
                className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-[#aceba7] focus:outline-hidden transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Ulcer Site Location</label>
            <input
              type="text"
              value={locationLabel}
              onChange={(e) => setLocationLabel && setLocationLabel(e.target.value)}
              placeholder="e.g. Right Plantar Hindfoot"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-[#0e120f]/80 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-[#aceba7] focus:outline-hidden transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4 Spacious, Uncluttered Parameter Cards in a Clean 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {toggleItems.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.id}
              onClick={() => item.onChange(!item.checked)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs ${
                item.checked
                  ? 'bg-[#aceba7]/10 dark:bg-[#12464e]/40 border-[#aceba7]/60 dark:border-[#aceba7]/40 shadow-sm'
                  : 'bg-white/70 dark:bg-[#0e120f]/60 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
              }`}
            >
              {/* Top Row: Icon + Badge on Left, Toggle on Right */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      item.checked
                        ? 'bg-[#12464e] dark:bg-[#aceba7] text-[#aceba7] dark:text-[#0e120f] shadow-xs'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                      item.checked
                        ? 'bg-[#aceba7]/20 border-[#aceba7]/40 text-[#12464e] dark:text-[#aceba7]'
                        : 'bg-slate-200/80 dark:bg-slate-800/80 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.checked ? item.badge : item.altLabel}
                  </span>
                </div>

                {/* Modern iOS Toggle Switch with Arounda tones */}
                <div className="relative inline-flex items-center shrink-0">
                  <div
                    className={`w-9 h-5 rounded-full transition-colors duration-200 ease-in-out ${
                      item.checked ? 'bg-[#aceba7]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center translate-y-0.5 ${
                        item.checked ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    >
                      {item.checked && <Check className="w-2.5 h-2.5 text-[#12464e] stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Clear Title & Crisp Subtitle */}
              <div>
                <h4 className="text-xs font-serif-luxury font-bold text-slate-900 dark:text-slate-100 tracking-wide">
                  {item.label}
                </h4>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Primary Action Button: "Run SINBAD Analysis" */}
      <div className="pt-1">
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className={`w-full py-3.5 px-6 rounded-2xl font-serif-luxury text-sm tracking-wide text-[#0e120f] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl cursor-pointer ${
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

        <div className="flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 mt-2 px-1 font-mono">
          <span>Physician Inputs + Homography + Infection Gatekeeper</span>
          <span className="font-bold text-[#12464e] dark:text-[#aceba7]">IWGDF 2026 Standard</span>
        </div>
      </div>
    </div>
  )
}
