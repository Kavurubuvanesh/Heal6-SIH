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
    <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-5 transition-all hover:shadow-md h-full w-full">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
            <span>Physician Clinical Parameters</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            IWGDF 6-Factor SINBAD Classification Matrix
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
          <span>Clinical Inputs:</span>
          <span className="text-[#0d9488] dark:text-teal-400 font-bold">{clinicalTally} / 4 pts</span>
        </div>
      </div>

      {/* Patient Demographics Intake Inputs */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
          Patient Demographics & Anatomical Target:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Patient Name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName && setPatientName(e.target.value)}
              placeholder="e.g. Carlos Mendez"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-hidden"
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
                className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-hidden"
              />
              <select
                value={patientGender}
                onChange={(e) => setPatientGender && setPatientGender(e.target.value)}
                className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-hidden"
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
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-hidden"
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
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-2xs ${
                item.checked
                  ? 'bg-[#0d9488]/5 dark:bg-teal-950/30 border-[#0d9488]/50 dark:border-teal-700'
                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Top Row: Icon + Badge on Left, Toggle on Right */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      item.checked
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.checked
                        ? 'bg-[#0d9488] text-white'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.checked ? item.badge : item.altLabel}
                  </span>
                </div>

                {/* Modern iOS Toggle Switch */}
                <div className="relative inline-flex items-center shrink-0">
                  <div
                    className={`w-9 h-5 rounded-full transition-colors duration-200 ease-in-out ${
                      item.checked ? 'bg-[#0d9488]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center translate-y-0.5 ${
                        item.checked ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    >
                      {item.checked && <Check className="w-2.5 h-2.5 text-[#0d9488] stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Clear Title & Crisp Subtitle */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
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
          className={`w-full py-3 px-6 rounded-2xl font-bold text-sm tracking-wide text-white transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg cursor-pointer ${
            isAnalyzing
              ? 'bg-[#0d9488]/80 cursor-wait'
              : 'bg-gradient-to-r from-[#0d9488] to-[#0284c7] hover:from-[#0f766e] hover:to-[#0369a1] shadow-[#0d9488]/25 hover:shadow-xl hover:shadow-[#0d9488]/30 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{analysisStep || 'Executing PyTorch ConvNeXt & UNet++ Pipeline...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>Execute SOTA SINBAD Analysis</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 mt-2 px-1">
          <span>Combines Physician Inputs + Calibrated Homography + Infection Gatekeeper</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">IWGDF Standard</span>
        </div>
      </div>
    </div>
  )
}
