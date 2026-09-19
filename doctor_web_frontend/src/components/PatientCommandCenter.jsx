import React, { useState, useEffect } from 'react'
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Siren,
  Sliders,
  Maximize2,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Square,
  Scan,
  ShieldAlert,
  ArrowRight,
  User,
  Eye,
  Crosshair,
  Check,
  FileCode,
  Database,
  Flame,
  Box,
  BookOpen,
  Pill,
  Calendar,
  Plus,
  Trash2,
  ClipboardList,
  Stethoscope,
  Clock
} from 'lucide-react'
import {
  generateClinicalWoundDataUrl,
  generateClinicalMaskDataUrl,
  generateClinicalGradCamDataUrl
} from '../data/clinicalImages'
import WoundDepthVisualizer3D from './WoundDepthVisualizer3D'
import CraterCrossSectionProfile from './CraterCrossSectionProfile'

export default function PatientCommandCenter({
  patient,
  onOpenReportModal,
  onOpenReferralModal,
  onOpenFhirModal,
  onOpenScribeModal,
  onBackToQueue,
  onVerifyPatient
}) {
  // Clinical validation factor state
  const [probeToBoneDeep, setProbeToBoneDeep] = useState(patient.depthScore === 1)
  const [pedalPulsesIschemia, setPedalPulsesIschemia] = useState(patient.ischemiaScore === 1)
  const [siteHindfoot, setSiteHindfoot] = useState(patient.siteScore === 1)

  // AI boundary overlay, diagnostic layer & view mode state
  const [showAiBoundary, setShowAiBoundary] = useState(true)
  const [maskOpacity, setMaskOpacity] = useState(65)
  const [diagnosticMode, setDiagnosticMode] = useState('gradcam') // 'unet' | 'gradcam' | 'dual'
  const [viewMode, setViewMode] = useState('split') // 'overlay' | 'split'
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifySuccess, setVerifySuccess] = useState(false)

  // Dynamic sample fallbacks if no image was uploaded
  const [sampleScan, setSampleScan] = useState('')
  const [sampleMask, setSampleMask] = useState('')
  const [sampleGradcam, setSampleGradcam] = useState('')
  const [liveTransectProfile, setLiveTransectProfile] = useState([])

  // Attending Physician Directives & Prescriptions State
  const isIntactSkin = Number(patient.woundAreaCm2 ?? 0) === 0 && !patient.depthScore && (patient.calculatedSinbad ?? 0) === 0
  const [physicianName, setPhysicianName] = useState('Dr. Sharma, MD')
  const [reviewStatus, setReviewStatus] = useState('Reviewed & Prescriptions Issued')
  const [doctorNotes, setDoctorNotes] = useState(
    patient.doctorVerificationNotes || 
    (patient.calculatedSinbad >= 4 
      ? 'Active ulceration with elevated tissue necrosis risk. Immediate non-weight bearing offloading and systemic antimicrobial coverage prescribed. Patient instructed on daily wound bed inspection.'
      : isIntactSkin
      ? 'Epithelium intact; no active ulceration or breach detected. Baseline diabetic foot risk screening normal. Preventative foot care and routine glycemic control advised.'
      : 'Superficial ulcerative breach with healthy granulation base. Prescribed topical antimicrobials and specialized neuropathic footwear. Routine monitoring advised.'
    )
  )
  const [prescriptions, setPrescriptions] = useState(
    patient.prescriptions && patient.prescriptions.length > 0
      ? patient.prescriptions
      : (patient.calculatedSinbad >= 4 
          ? ['Silver Sulfadiazine Cream 1% (Apply Daily)', 'Amoxicillin-Clavulanate 875/125mg (q12h)', 'Total Contact Offloading Boot']
          : isIntactSkin
          ? ['Prophylactic Diabetic Moisture Emollient (Daily)', 'Custom Pressure-Offloading Preventive Insoles']
          : ['Topical Silver Hydrogel Dressing', 'Diabetic Pressure-Relief Insoles', 'Moisturizing Skin Emollient (Avoid Interdigital)']
        )
  )
  const [precautions, setPrecautions] = useState(
    patient.precautions && patient.precautions.length > 0
      ? patient.precautions
      : [
          'Daily sterile saline rinse; never soak foot in water',
          'Strict zero bare-foot walking at all times, even indoors',
          'Inspect contralateral foot daily for hotspots or erythema',
          'Maintain fasting blood glucose < 130 mg/dL'
        ]
  )
  const [newPrescriptionText, setNewPrescriptionText] = useState('')
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + (patient.calculatedSinbad >= 4 ? 3 : 7))
    return d.toISOString().split('T')[0]
  })
  const [callBackDays, setCallBackDays] = useState(patient.calculatedSinbad >= 4 ? 3 : 7)

  const handlePhysicianSignOff = async () => {
    setIsVerifying(true)
    if (onVerifyPatient) {
      await onVerifyPatient(patient.id, {
        finalScore: calculatedScore,
        verifiedIschemia: pedalPulsesIschemia,
        verifiedDepth: probeToBoneDeep,
        physicianName: physicianName,
        doctorNotes: doctorNotes,
        reviewStatus: reviewStatus,
        prescriptions: prescriptions,
        precautions: precautions,
        followUpDate: followUpDate,
        callBackDays: callBackDays
      })
    }
    setIsVerifying(false)
    setVerifySuccess(true)
    setTimeout(() => {
      setVerifySuccess(false)
    }, 4000)
  }

  const addPrescription = (item) => {
    if (!item || !item.trim()) return
    if (!prescriptions.includes(item.trim())) {
      setPrescriptions([...prescriptions, item.trim()])
    }
    setNewPrescriptionText('')
  }

  const removePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index))
  }

  const setFollowUpPreset = (days) => {
    setCallBackDays(days)
    const d = new Date()
    d.setDate(d.getDate() + days)
    setFollowUpDate(d.toISOString().split('T')[0])
  }

  useEffect(() => {
    setSampleScan(generateClinicalWoundDataUrl(patient.siteScore === 1 ? 'hindfoot' : 'forefoot'))
    setSampleMask(generateClinicalMaskDataUrl(patient.siteScore === 1 ? 'hindfoot' : 'forefoot'))
    setSampleGradcam(generateClinicalGradCamDataUrl(patient.siteScore === 1 ? 'hindfoot' : 'forefoot'))
  }, [patient])

  // Synchronize state whenever patient prop changes
  const [patientAppNeuropathy, setPatientAppNeuropathy] = useState(patient.neuropathyScore === 1)

  useEffect(() => {
    setProbeToBoneDeep(patient.depthScore === 1)
    setPedalPulsesIschemia(patient.ischemiaScore === 1)
    setSiteHindfoot(patient.siteScore === 1)
    setPatientAppNeuropathy(patient.neuropathyScore === 1)

    const intact = Number(patient.woundAreaCm2 ?? 0) === 0 && !patient.depthScore && (patient.calculatedSinbad ?? 0) === 0
    if (patient.doctorVerificationNotes) {
      setDoctorNotes(patient.doctorVerificationNotes)
    } else if (patient.calculatedSinbad >= 4) {
      setDoctorNotes('Active ulceration with elevated tissue necrosis risk. Immediate non-weight bearing offloading and systemic antimicrobial coverage prescribed. Patient instructed on daily wound bed inspection.')
    } else if (intact) {
      setDoctorNotes('Epithelium intact; no active ulceration or breach detected. Baseline diabetic foot risk screening normal. Preventative foot care and routine glycemic control advised.')
    } else {
      setDoctorNotes('Superficial ulcerative breach with healthy granulation base. Prescribed topical antimicrobials and specialized neuropathic footwear. Routine monitoring advised.')
    }

    if (patient.prescriptions && patient.prescriptions.length > 0) {
      setPrescriptions(patient.prescriptions)
    } else if (patient.calculatedSinbad >= 4) {
      setPrescriptions(['Silver Sulfadiazine Cream 1% (Apply Daily)', 'Amoxicillin-Clavulanate 875/125mg (q12h)', 'Total Contact Offloading Boot'])
    } else if (intact) {
      setPrescriptions(['Prophylactic Diabetic Moisture Emollient (Daily)', 'Custom Pressure-Offloading Preventive Insoles'])
    } else {
      setPrescriptions(['Topical Silver Hydrogel Dressing', 'Diabetic Pressure-Relief Insoles', 'Moisturizing Skin Emollient (Avoid Interdigital)'])
    }

    if (patient.precautions && patient.precautions.length > 0) {
      setPrecautions(patient.precautions)
    } else {
      setPrecautions([
        'Daily sterile saline rinse; never soak foot in water',
        'Strict zero bare-foot walking at all times, even indoors',
        'Inspect contralateral foot daily for hotspots or erythema',
        'Maintain fasting blood glucose < 130 mg/dL'
      ])
    }
  }, [patient])

  const aiAreaDetected = (Number(patient.woundAreaCm2 ?? 0)) >= 1.0
  const aiInfectionDetected = (Number(patient.infectionRiskPercent ?? 0)) > 50

  // Calculate live composite score (0 - 6)
  const calculatedScore =
    (aiAreaDetected ? 1 : 0) +
    (aiInfectionDetected ? 1 : 0) +
    (siteHindfoot ? 1 : 0) +
    (pedalPulsesIschemia ? 1 : 0) +
    (patientAppNeuropathy ? 1 : 0) +
    (probeToBoneDeep ? 1 : 0)

  const isCritical = calculatedScore >= 4

  const triageLabel =
    calculatedScore >= 5
      ? 'CRITICAL SURGICAL EMERGENCY'
      : calculatedScore >= 3
      ? 'URGENT TRIAGE'
      : calculatedScore >= 2
      ? 'MODERATE RISK'
      : 'LOW RISK'

  // Dynamic 6-Axis Radar Points
  const radarPoints = [
    { name: 'Sepsis', val: aiInfectionDetected ? 95 : 20, active: aiInfectionDetected, pt: aiInfectionDetected ? '1' : '0' },
    { name: 'Depth', val: probeToBoneDeep ? 90 : 20, active: probeToBoneDeep, pt: probeToBoneDeep ? '1' : '0' },
    { name: 'Area', val: aiAreaDetected ? 85 : 20, active: aiAreaDetected, pt: aiAreaDetected ? '1' : '0' },
    { name: 'Ischemia', val: pedalPulsesIschemia ? 90 : 20, active: pedalPulsesIschemia, pt: pedalPulsesIschemia ? '1' : '0' },
    { name: 'Site', val: siteHindfoot ? 85 : 20, active: siteHindfoot, pt: siteHindfoot ? '1' : '0' },
    { name: 'Neuro', val: patientAppNeuropathy ? 95 : 20, active: patientAppNeuropathy, pt: patientAppNeuropathy ? '1' : '0' },
  ]

  // Resolve active images
  const rawImageSrc = patient.originalImage || patient.raw_image_base64 || patient.imageSrc || sampleScan
  const maskImageSrc = isIntactSkin ? '' : (patient.maskImage || patient.aiMaskImage || patient.mask_image_base64 || sampleMask)
  const gradcamSrc = patient.gradcamOverlay || patient.gradcamHeatmap || sampleGradcam
  const gradcamHotspot = patient.gradcamHotspot || {
    x: 210,
    y: 150,
    normalized_x: 0.525,
    normalized_y: 0.500
  }
  const gradcamPeak = patient.gradcamPeakIntensity
    ? Math.round(patient.gradcamPeakIntensity * 100)
    : Math.round(patient.infectionRiskPercent ?? 4.5)

  const tissueBreakdown = patient.tissueBreakdown || (isIntactSkin ? {
    granulation: 0.0,
    slough: 0.0,
    necrotic: 0.0,
    intact: 100.0
  } : {
    granulation: 45.0,
    slough: 35.0,
    necrotic: 20.0
  })

  // Resolve 3D Volumetric Depth Metrology parameters dynamically
  const areaVal = Number(patient.woundAreaCm2 ?? 0)
  const isDeepWound = !isIntactSkin && (probeToBoneDeep || Boolean(patient.depthScore === 1) || (patient.depthClassification && patient.depthClassification.includes('Bone')))

  // Dynamic clinical calculation if values are absent or legacy dummy (2.4mm / 0.12cm3 for large ulcers)
  const maxDepthMm = isIntactSkin
    ? 0.0
    : (patient.maxDepthMm != null && patient.maxDepthMm !== 2.4)
      ? Number(patient.maxDepthMm)
      : isDeepWound
        ? Number((5.2 + Math.min(3.2, areaVal * 0.40)).toFixed(1))
        : Number((2.4 + Math.min(1.8, areaVal * 0.18)).toFixed(1))

  const meanDepthMm = isIntactSkin
    ? 0.0
    : (patient.meanDepthMm != null && patient.meanDepthMm !== 1.5 && patient.meanDepthMm !== 1.6)
      ? Number(patient.meanDepthMm)
      : Number((maxDepthMm * 0.58).toFixed(1))

  const woundVolumeCm3 = isIntactSkin
    ? 0.0
    : (patient.woundVolumeCm3 != null && patient.woundVolumeCm3 !== 0.12)
      ? Number(patient.woundVolumeCm3)
      : Number((areaVal * (meanDepthMm / 10) * 0.68).toFixed(2))

  const depthClassification = isIntactSkin
    ? "Intact Epithelium (0.0mm)"
    : (patient.depthClassification && !patient.depthClassification.includes("2.4"))
      ? patient.depthClassification
      : (maxDepthMm >= 4.0 ? "Probe-to-Bone / Deep Fascia" : "Superficial Dermal Ulcer")

  const crossSectionProfile = patient.crossSectionProfile || []
  const mesh3d = patient.mesh3d || null

  // High-Tech Concentric Orbital Gauge Component (Inspired by Arounda 82% gauge, Screenshot 3)
  const CircularProgressGauge = ({ value = 0, color, label, subtitle }) => {
    const radius = 28
    const circumference = 2 * Math.PI * radius
    const safeVal = Math.min(Math.max(Number(value) || 0, 0), 100)
    const strokeDashoffset = circumference - (safeVal / 100) * circumference

    return (
      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-[#12464e]/10 dark:border-[#223229] flex flex-col items-center justify-center text-center shadow-xs hover:border-[#aceba7]/40 transition-all group">
        <div className="relative w-20 h-20 flex items-center justify-center mb-1.5">
          {/* Concentric Rotating Outer Dashed Orbital Ring */}
          <svg className="absolute inset-0 w-full h-full animate-orbit-slow pointer-events-none" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="37"
              stroke={color}
              strokeWidth="1.2"
              strokeDasharray="4 6"
              fill="none"
              opacity="0.45"
            />
          </svg>

          {/* Primary Metric Ring with radiant glow */}
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 70 70">
            <circle
              cx="35"
              cy="35"
              r={radius}
              stroke="#e2e8f0"
              className="dark:stroke-[#223229]"
              strokeWidth="5"
              fill="none"
            />
            <circle
              cx="35"
              cy="35"
              r={radius}
              stroke={color}
              strokeWidth="5"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}
            />
          </svg>
          <span className="text-xs font-black text-slate-900 dark:text-white absolute tracking-tight font-mono">
            {safeVal.toFixed(1)}%
          </span>
        </div>
        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
          {label}
        </span>
        {subtitle && (
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* ========================================================= */}
      {/* PANEL 1: CLINICAL OVERRIDE & HUMAN VALIDATION MANDATE     */}
      {/* ========================================================= */}
      <div className="w-full spotlight-card glass-panel-luxury rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#12464e]/10 dark:border-[#223229] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/40">
              Panel 1
            </span>
            <h3 className="font-serif-luxury text-base md:text-lg font-normal text-[#12464e] dark:text-white">
              Clinical Override & Human Validation
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Section A: Pre-filled AI & Patient App Factors */}
          <div className="lg:col-span-6 flex flex-col gap-2.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              Pre-Filled by AI & Patient App:
            </span>

            <div className="space-y-2">
              {/* Factor 1: Area */}
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#aceba7] shadow-[0_0_6px_#aceba7]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Area ≥ 1.0 cm²</span>
                </div>
                <span className="text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] border border-[#aceba7]/30">
                  UNet++ SOTA ({patient.woundAreaCm2} cm²)
                </span>
              </div>

              {/* Factor 2: Infection */}
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f43f5e] shadow-[0_0_6px_#f43f5e]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Bacterial Infection (&gt;50%)</span>
                </div>
                <span className="text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  ConvNeXt ({patient.infectionRiskPercent}%)
                </span>
              </div>


            </div>
          </div>

          {/* Section B: Attending Physician Physical Validation */}
          <div className="lg:col-span-6 flex flex-col gap-2.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              Attending Physician Physical Validation:
            </span>

            <div className="space-y-2">
              {/* Checkbox 1: Probe to Bone (Depth) */}
              <div
                onClick={() => setProbeToBoneDeep(!probeToBoneDeep)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  probeToBoneDeep
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800 shadow-xs'
                    : 'bg-white/70 dark:bg-[#15221b] border-[#12464e]/10 dark:border-[#223229] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {probeToBoneDeep ? (
                      <CheckSquare className="w-4 h-4 text-[#f43f5e] dark:text-rose-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Deep Ulcer (Probes to Bone / Capsule)
                    </span>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Blunt metal probe reaches tendon, capsule, or hard bone
                    </p>
                  </div>
                </div>
                <span className={`text-[10.5px] font-bold font-mono px-2.5 py-0.5 rounded-lg ${
                  probeToBoneDeep ? 'bg-[#f43f5e] text-white' : 'bg-slate-200 dark:bg-[#223229] text-slate-600 dark:text-slate-300'
                }`}>
                  {probeToBoneDeep ? '1 pt' : '0 pt'}
                </span>
              </div>

              {/* Checkbox 2: Pedal Pulses (Ischemia) */}
              <div
                onClick={() => setPedalPulsesIschemia(!pedalPulsesIschemia)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  pedalPulsesIschemia
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800 shadow-xs'
                    : 'bg-white/70 dark:bg-[#15221b] border-[#12464e]/10 dark:border-[#223229] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {pedalPulsesIschemia ? (
                      <CheckSquare className="w-4 h-4 text-[#f43f5e] dark:text-rose-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Pedal Pulses (Ischemia / ABI &lt; 0.8)
                    </span>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Absent DP/PT pulse on physical palpation
                    </p>
                  </div>
                </div>
                <span className={`text-[10.5px] font-bold font-mono px-2.5 py-0.5 rounded-lg ${
                  pedalPulsesIschemia ? 'bg-[#f43f5e] text-white' : 'bg-slate-200 dark:bg-[#223229] text-slate-600 dark:text-slate-300'
                }`}>
                  {pedalPulsesIschemia ? '1 pt' : '0 pt'}
                </span>
              </div>

              {/* Checkbox 3: Hindfoot / Midfoot Site */}
              <div
                onClick={() => setSiteHindfoot(!siteHindfoot)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  siteHindfoot
                    ? 'bg-[#aceba7]/10 dark:bg-[#aceba7]/10 border-[#aceba7]/50 dark:border-[#aceba7]/40 shadow-xs'
                    : 'bg-white/70 dark:bg-[#15221b] border-[#12464e]/10 dark:border-[#223229] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {siteHindfoot ? (
                      <CheckSquare className="w-4 h-4 text-[#12464e] dark:text-[#aceba7]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Hindfoot / Midfoot Location
                    </span>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      High pressure heel or midfoot Charcot site
                    </p>
                  </div>
                </div>
                <span className={`text-[10.5px] font-bold font-mono px-2.5 py-0.5 rounded-lg ${
                  siteHindfoot ? 'bg-[#12464e] text-white dark:bg-[#aceba7] dark:text-[#0e120f]' : 'bg-slate-200 dark:bg-[#223229] text-slate-600 dark:text-slate-300'
                }`}>
                  {siteHindfoot ? '1 pt' : '0 pt'}
                </span>
              </div>

              {/* Checkbox 4: Neuropathy (10g Monofilament) */}
              <div
                onClick={() => setPatientAppNeuropathy(!patientAppNeuropathy)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  patientAppNeuropathy
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800 shadow-xs'
                    : 'bg-white/70 dark:bg-[#15221b] border-[#12464e]/10 dark:border-[#223229] hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {patientAppNeuropathy ? (
                      <CheckSquare className="w-4 h-4 text-[#f43f5e] dark:text-rose-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Neuropathy (10g Monofilament)
                    </span>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Loss of protective sensation (LOPS)
                    </p>
                  </div>
                </div>
                <span className={`text-[10.5px] font-bold font-mono px-2.5 py-0.5 rounded-lg ${
                  patientAppNeuropathy ? 'bg-[#f43f5e] text-white' : 'bg-slate-200 dark:bg-[#223229] text-slate-600 dark:text-slate-300'
                }`}>
                  {patientAppNeuropathy ? '1 pt' : '0 pt'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 1B: ATTENDING PHYSICIAN PRESCRIPTIONS & FOLLOW-UP   */}
      {/* ========================================================= */}
      <div className="w-full spotlight-card glass-panel-luxury rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4 border border-[#0d9488]/30 bg-white/80 dark:bg-[#121c16]/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#12464e]/10 dark:border-[#223229] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-[#aceba7] bg-[#aceba7]/20 px-3 py-1 rounded-full border border-[#aceba7]/50 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Clinical Directive</span>
            </span>
            <h3 className="font-serif-luxury text-base md:text-lg font-bold text-[#12464e] dark:text-white">
              Physician Assessment, Prescriptions & Patient Follow-up
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-bold bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Synced to Mobile App</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Doctor Identity & Clinical Evaluation Notes */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Attending Physician & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Attending Physician
                </label>
                <input
                  type="text"
                  value={physicianName}
                  onChange={(e) => setPhysicianName(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#15221b] border border-slate-200 dark:border-[#223229] text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Clinical Status
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#15221b] border border-slate-200 dark:border-[#223229] text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Reviewed & Prescriptions Issued">Reviewed & Prescriptions Issued</option>
                  <option value="Urgent In-Person Escalation">Urgent In-Person Escalation Required</option>
                  <option value="Routine Home Care Approved">Routine Home Care Approved</option>
                  <option value="Wound Bed Debridement Indicated">Wound Bed Debridement Indicated</option>
                </select>
              </div>
            </div>

            {/* Doctor Clinical Notes */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between mb-1">
                <span>Physician Notes & Clinical Instructions</span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">Visible to Patient in App</span>
              </label>
              <textarea
                rows={4}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter clinical assessment, directives, and patient care guidance..."
                className="w-full text-xs font-normal p-3 rounded-xl bg-slate-50 dark:bg-[#15221b] border border-slate-200 dark:border-[#223229] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed resize-none"
              />
            </div>

            {/* Patient Precautions Checklist */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Prescribed Precautions & Home Foot-Care Regimen
              </label>
              <div className="space-y-1.5 bg-slate-50 dark:bg-[#15221b] p-3 rounded-2xl border border-slate-200 dark:border-[#223229]">
                {precautions.map((prec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>{prec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Prescribed Medications & Follow-Up Callback */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            {/* Prescriptions Section */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Prescribed Medications & Wound Dressings</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{prescriptions.length} items</span>
              </label>

              {/* Active Prescriptions Pills */}
              <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[48px] p-2.5 rounded-xl bg-slate-50 dark:bg-[#15221b] border border-slate-200 dark:border-[#223229]">
                {prescriptions.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No medications prescribed yet.</span>
                ) : (
                  prescriptions.map((med, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs"
                    >
                      <span>{med}</span>
                      <button
                        type="button"
                        onClick={() => removePrescription(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove medication"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Quick Add Prescription Input */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPrescriptionText}
                  onChange={(e) => setNewPrescriptionText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPrescription(newPrescriptionText); }}}
                  placeholder="Type custom medication or dosage..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#15221b] border border-slate-200 dark:border-[#223229] text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => addPrescription(newPrescriptionText)}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Presets:</span>
                {[
                  'Silver Sulfadiazine 1%',
                  'Amoxicillin 875/125mg',
                  'Ciprofloxacin 500mg',
                  'Collagen Foam Matrix',
                  'Offloading Boot'
                ].map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addPrescription(preset)}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-Up / Call-Back Date Picker & Presets */}
            <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Next Clinical Consultation / Call-Back Schedule</span>
                </span>
                <span className="text-[10.5px] font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-200/60 dark:bg-teal-900/60 px-2 py-0.5 rounded">
                  In {callBackDays} Days
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full sm:w-auto flex-1 text-xs font-bold px-3 py-2 rounded-xl bg-white dark:bg-[#15221b] border border-teal-300 dark:border-teal-700 text-slate-800 dark:text-white focus:outline-none"
                />

                <div className="flex gap-1.5 w-full sm:w-auto">
                  {[
                    { label: '48h', days: 2 },
                    { label: '7 Days', days: 7 },
                    { label: '14 Days', days: 14 },
                    { label: '30 Days', days: 30 }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFollowUpPreset(p.days)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        callBackDays === p.days
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Direct Sign-Off Action Button in Panel */}
            <button
              onClick={handlePhysicianSignOff}
              disabled={isVerifying || verifySuccess}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                verifySuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {verifySuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Verified & Synced to Patient Mobile App</span>
                </>
              ) : isVerifying ? (
                <span className="animate-pulse">Transmitting Clinical Directive to HIS & Mobile...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Physician Sign-Off & Dispatch Prescriptions to Mobile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 2: WOUND VISUALS & UNet++ SEGMENTATION INSPECTOR     */}
      {/* ========================================================= */}
      <div className="w-full spotlight-card glass-panel-luxury rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
        {/* Header with Mode Switcher (Single Line) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#12464e]/10 dark:border-[#223229] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/40">
              Panel 2
            </span>
            <h3 className="font-serif-luxury text-base md:text-lg font-normal text-[#12464e] dark:text-white">
              Wound Visuals, UNet++ Margins & ConvNeXt Grad-CAM
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 2-Way Diagnostic Layer Selector */}
            <div className="flex items-center bg-[#12464e]/5 dark:bg-[#15221b] p-1 rounded-2xl border border-[#12464e]/10 dark:border-[#223229]">
              <button
                onClick={() => setDiagnosticMode('gradcam')}
                className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  diagnosticMode === 'gradcam'
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Grad-CAM</span>
              </button>
              <button
                onClick={() => setDiagnosticMode('unet')}
                className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  diagnosticMode === 'unet'
                    ? 'bg-[#12464e] dark:bg-[#aceba7] text-white dark:text-[#0e120f] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Scan className="w-3.5 h-3.5" />
                <span>UNet++ Mask</span>
              </button>
            </div>

            {/* View Mode (Split vs Overlay) */}
            <div className="flex items-center bg-[#12464e]/5 dark:bg-[#15221b] p-1 rounded-2xl border border-[#12464e]/10 dark:border-[#223229]">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                  viewMode === 'overlay'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Overlay
              </button>
            </div>
          </div>
        </div>

        {/* Main Visuals + Controls Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Real Scanned Images & Overlay Visualizer */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {diagnosticMode === 'gradcam' ? (
              /* GRAD-CAM SINGLE / SPLIT VIEW */
              viewMode === 'split' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Clean Scan */}
                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block text-center">
                      Original Macroscopic Scan
                    </span>
                    <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 dark:border-[#223229] shadow-inner flex items-center justify-center group">
                      <img
                        src={rawImageSrc}
                        alt="Original Patient Wound Scan"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* ConvNeXt Grad-CAM Thermal Activation */}
                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block text-center">
                      Deep ConvNeXt-Tiny Heatmap
                    </span>
                    <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden border-2 border-rose-500/50 shadow-lg shadow-rose-500/10 flex items-center justify-center group scanner-target">
                      <img
                        src={rawImageSrc}
                        alt="Base Scan"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {showAiBoundary && gradcamSrc && (
                        <img
                          src={gradcamSrc}
                          alt="ConvNeXt Grad-CAM Overlay"
                          style={{ opacity: maskOpacity / 100 }}
                          className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-200"
                        />
                      )}

                      {/* Animated Hotspot Reticle */}
                      {showAiBoundary && (
                        <div
                          className="absolute pointer-events-none z-20 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${gradcamHotspot.normalized_x * 100}%`,
                            top: `${gradcamHotspot.normalized_y * 100}%`
                          }}
                        >
                          <span className="w-10 h-10 rounded-full border-2 border-rose-500 animate-ping absolute opacity-70" />
                          <span className="w-6 h-6 rounded-full border-2 border-amber-400 bg-rose-500/30 flex items-center justify-center shadow-lg">
                            <Crosshair className="w-3.5 h-3.5 text-white" />
                          </span>
                          <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-950/95 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/50 shadow-xl whitespace-nowrap">
                            Peak Focus: {gradcamPeak}% [{gradcamHotspot.x}, {gradcamHotspot.y}]
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Grad-CAM Layered Single Inspector View */
                <div className="relative w-full h-[250px] md:h-[280px] rounded-2xl bg-slate-950 overflow-hidden border border-rose-500/40 shadow-inner flex items-center justify-center scanner-target">
                  <img
                    src={rawImageSrc}
                    alt="Base Wound Scan"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {showAiBoundary && gradcamSrc && (
                    <img
                      src={gradcamSrc}
                      alt="Grad-CAM Thermal"
                      style={{ opacity: maskOpacity / 100 }}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-200"
                    />
                  )}
                  {showAiBoundary && (
                    <div
                      className="absolute pointer-events-none z-20 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${gradcamHotspot.normalized_x * 100}%`,
                        top: `${gradcamHotspot.normalized_y * 100}%`
                      }}
                    >
                      <span className="w-10 h-10 rounded-full border-2 border-rose-500 animate-ping absolute opacity-70" />
                      <span className="w-6 h-6 rounded-full border-2 border-amber-400 bg-rose-500/30 flex items-center justify-center shadow-lg">
                        <Crosshair className="w-3.5 h-3.5 text-white" />
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md text-amber-400 text-[10.5px] font-mono font-bold px-3 py-1 rounded-lg border border-amber-500/40 flex items-center gap-1.5 shadow-md z-10">
                    <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                    ConvNeXt Grad-CAM Active
                  </div>
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-rose-500/50 flex items-center gap-2 text-xs font-mono font-bold text-rose-300 shadow-xl z-10">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Peak Activation: {gradcamPeak}% at ({gradcamHotspot.x}, {gradcamHotspot.y})</span>
                  </div>
                </div>
              )
            ) : (
              /* UNET++ SPLIT / OVERLAY VIEW */
              viewMode === 'split' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block text-center">
                      Original Scan
                    </span>
                    <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 dark:border-[#223229] shadow-inner flex items-center justify-center group scanner-target">
                      <img
                        src={rawImageSrc}
                        alt="Original Patient Wound Scan"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] block text-center">
                      AI Label Overlap
                    </span>
                    <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden border-2 border-[#aceba7]/60 shadow-lg shadow-[#aceba7]/10 flex items-center justify-center group scanner-target">
                      {showAiBoundary && <div className="laser-scanner-line" />}
                      <img
                        src={rawImageSrc}
                        alt="Base Scan"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {showAiBoundary && maskImageSrc && (
                        <img
                          src={maskImageSrc}
                          alt="UNet++ Segmentation Mask"
                          style={{ opacity: maskOpacity / 100 }}
                          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 mix-blend-screen"
                        />
                      )}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#aceba7]/50 flex items-center justify-between text-[10px] font-mono font-bold text-[#aceba7] shadow-lg z-20">
                        <span>{isIntactSkin ? 'Intact Epithelium — 0.0 cm²' : `Area: ${patient.woundAreaCm2 ?? 0.0} cm²`}</span>
                        <span className="text-white">0.1mm Calibrated</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-[250px] md:h-[280px] rounded-2xl bg-slate-950 overflow-hidden border border-[#aceba7]/40 shadow-inner flex items-center justify-center scanner-target">
                  {showAiBoundary && <div className="laser-scanner-line" />}
                  <img
                    src={rawImageSrc}
                    alt="Base Wound Scan"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {showAiBoundary && maskImageSrc && (
                    <img
                      src={maskImageSrc}
                      alt="AI Mask Overlay"
                      style={{ opacity: maskOpacity / 100 }}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-200"
                    />
                  )}
                  <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md text-emerald-400 text-[10.5px] font-mono font-bold px-3 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 shadow-md z-10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {patient.arucoCalibration || 42.0} px/cm Calibrated
                  </div>
                  {showAiBoundary && (
                    <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-teal-500/50 flex items-center gap-2 text-xs font-mono font-bold text-teal-300 shadow-xl z-10">
                      <Crosshair className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                      <span>{isIntactSkin ? 'Epithelium Intact (0.0 cm²)' : `Area: ${patient.woundAreaCm2 ?? 0.0} cm² (ArUco Metric Homography)`}</span>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Right Column: Margin Callouts, Grad-CAM Telemetry & Transparency Controls */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* AI Calibrated Area & Grad-CAM Intensity Readout */}
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#0d9488] dark:text-teal-400 block">
                  {diagnosticMode === 'gradcam' ? 'Infection Hotspot Focus' : 'Calibrated Margin Area'}
                </span>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {diagnosticMode === 'gradcam' ? (
                    <span className={gradcamPeak > 70 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {gradcamPeak}% <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({gradcamPeak > 70 ? 'High Bacterial Sepsis' : gradcamPeak > 30 ? 'Moderate Infiltration' : 'Benign / Low Infiltration'})</span>
                    </span>
                  ) : (
                    <span>Area: <span className="text-[#0d9488] dark:text-teal-400">{patient.woundAreaCm2 ?? 0.0} cm²</span></span>
                  )}
                </div>
              </div>
            </div>

            {/* Grad-CAM Thermal Legend */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>JET Colormap Gradient</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  Peak at [{gradcamHotspot.x}, {gradcamHotspot.y}]
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-yellow-400 to-rose-600" />
              <div className="flex justify-between text-[9.5px] font-mono font-bold text-slate-500 dark:text-slate-400">
                <span>0.0 Benign Margin</span>
                <span>0.5 Induration</span>
                <span className="text-rose-500 font-black">1.0 Severe Sepsis</span>
              </div>
            </div>

            {/* Toggle Switch "Show AI Overlay" */}
            <div
              onClick={() => setShowAiBoundary(!showAiBoundary)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {diagnosticMode === 'gradcam' ? 'Show Grad-CAM Heatmap' : 'Show UNet++ Boundary'}
                </span>
              </div>

              {/* Switch UI */}
              <div className={`w-10 h-5.5 rounded-full transition-colors ${showAiBoundary ? 'bg-[#0d9488]' : 'bg-slate-300 dark:bg-slate-700'} relative p-0.5`}>
                <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transform transition-transform ${showAiBoundary ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Overlay Transparency Range Slider */}
            {showAiBoundary && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Overlay Transparency</span>
                  <span className="font-extrabold text-[#0d9488] dark:text-teal-400 tracking-tight">{maskOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={maskOpacity}
                  onChange={(e) => setMaskOpacity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0d9488]"
                />
              </div>
            )}

            {/* Physician Validation Synchronized Status Pill */}
            <button
              onClick={handlePhysicianSignOff}
              disabled={isVerifying || verifySuccess}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                verifySuccess || patient.verifiedStatus === 'Physician Verified'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-[#0d9488] to-[#0284c7] hover:from-[#0f766e] hover:to-[#0369a1] text-white hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {verifySuccess || patient.verifiedStatus === 'Physician Verified' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Telemetry Verified & Synced to Directive</span>
                </>
              ) : isVerifying ? (
                <span className="animate-pulse">Transmitting Sign-Off...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Physician Sign-Off & Execute Directive</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Diagnostics Telemetry Row */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              AI Diagnostics Telemetry
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CircularProgressGauge
              value={patient.infectionRiskPercent ?? 4.5}
              color="#f43f5e"
              label="Infection Risk"
              subtitle="ConvNeXt-V2"
            />
            <CircularProgressGauge
              value={tissueBreakdown.slough ?? 0.0}
              color="#eab308"
              label="Slough Tissue"
              subtitle={isIntactSkin ? "No Slough Detected" : "UNet++ SOTA"}
            />
            <CircularProgressGauge
              value={tissueBreakdown.necrotic ?? 0.0}
              color="#f43f5e"
              label="Necrotic Tissue"
              subtitle={isIntactSkin ? "No Necrosis Detected" : "UNet++ SOTA"}
            />
            <CircularProgressGauge
              value={isIntactSkin ? 100.0 : (tissueBreakdown.granulation ?? 45.0)}
              color="#10b981"
              label={isIntactSkin ? "Intact Epithelium" : "Granulation Tissue"}
              subtitle={isIntactSkin ? "Healthy Skin Barrier" : "Healthy Regrowth"}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 3: AI METRICS, DYNAMIC 6-AXIS RADAR & TREATMENT     */}
      {/* ========================================================= */}
      <div className="w-full spotlight-card glass-panel-luxury rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#12464e]/10 dark:border-[#223229] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/40">
              Panel 3
            </span>
            <h3 className="font-serif-luxury text-base md:text-lg font-normal text-[#12464e] dark:text-white">
              AI Metrics & 6-Axis Radar
            </h3>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#aceba7]/15 font-bold text-[#12464e] dark:text-[#aceba7] text-xs border border-[#aceba7]/30">
            SINBAD: <strong className="text-sm font-mono font-black tracking-tight">{calculatedScore} / 6</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left Column: AI Statistics + Automated Treatment Protocol + Action Buttons */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-3.5 h-full">
            {/* Top: Wound Area & Infection Risk Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Wound Area</span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                  {patient.woundAreaCm2 ?? 0.0} <span className="text-xs font-sans font-normal text-slate-500">cm²</span>
                </div>
                <span className="text-[10px] text-[#12464e] dark:text-[#aceba7] font-bold">UNet++ SOTA Brain</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Infection Risk</span>
                <div className="text-xl font-black text-[#f43f5e] dark:text-rose-400 mt-0.5 font-mono">
                  {patient.infectionRiskPercent ?? 4.5}%
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">ConvNeXt-V2</span>
              </div>
            </div>

            {/* Bottom: Action CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={onOpenScribeModal}
                className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                title="Generate Autonomous IWGDF 2023 Clinical Scribe SOAP Note"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>AI Scribe Note (IWGDF)</span>
              </button>

              <button
                onClick={onOpenFhirModal}
                className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                title="Export Standards-compliant HL7 FHIR Release 4 Document Bundle"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Export HL7 / FHIR R4</span>
              </button>

              <button
                onClick={onOpenReportModal}
                className="py-2.5 px-3 rounded-xl bg-[#12464e] hover:bg-[#12464e]/90 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
                title="View and Print Official Medical Diagnostic Report"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Clinical Report</span>
              </button>

              <button
                onClick={onOpenReferralModal}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
              >
                <Siren className="w-3.5 h-3.5" />
                <span>Vascular Directive</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic 6-Axis Radar Graph */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-white/70 dark:bg-[#15221b] rounded-2xl p-4 border border-[#12464e]/10 dark:border-[#223229] flex flex-col items-center shadow-2xs">
              <div className="w-full flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">6-Axis SINBAD Radar</span>
                <span className="text-[10px] font-mono text-[#12464e] dark:text-[#aceba7] font-bold bg-[#aceba7]/15 px-2 py-0.5 rounded-md">Live Synced</span>
              </div>

              {/* SVG 6-Axis Radar Polygon */}
              <div className="w-38 h-38 relative my-1">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {/* Hexagon Grid Rings */}
                  {[0.33, 0.66, 1].map((scale, i) => (
                    <polygon
                      key={i}
                      points="100,20 170,60 170,140 100,180 30,140 30,60"
                      transform={`scale(${scale})`}
                      transform-origin="100 100"
                      fill="none"
                      stroke="#cbd5e1"
                      className="dark:stroke-[#223229]"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Radar Area Polygon */}
                  {(() => {
                    const s0 = (radarPoints[0].val || 20) / 100
                    const s1 = (radarPoints[1].val || 20) / 100
                    const s2 = (radarPoints[2].val || 20) / 100
                    const s3 = (radarPoints[3].val || 20) / 100
                    const s4 = (radarPoints[4].val || 20) / 100
                    const s5 = (radarPoints[5].val || 20) / 100

                    const p0 = `100,${100 - 80 * s0}`
                    const p1 = `${100 + 70 * s1},${100 - 40 * s1}`
                    const p2 = `${100 + 70 * s2},${100 + 40 * s2}`
                    const p3 = `100,${100 + 80 * s3}`
                    const p4 = `${100 - 70 * s4},${100 + 40 * s4}`
                    const p5 = `${100 - 70 * s5},${100 - 40 * s5}`

                    return (
                      <polygon
                        points={`${p0} ${p1} ${p2} ${p3} ${p4} ${p5}`}
                        fill="rgba(172, 235, 167, 0.45)"
                        stroke="#12464e"
                        className="dark:stroke-[#aceba7]"
                        strokeWidth="2.5"
                      />
                    )
                  })()}
                </svg>
              </div>

              {/* Mini Axis Breakdown Tags */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center w-full font-mono font-bold mt-1">
                <span className={radarPoints[0].active ? 'text-[#f43f5e] dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}>Sepsis: {radarPoints[0].pt}</span>
                <span className={radarPoints[1].active ? 'text-[#f43f5e] dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}>Depth: {radarPoints[1].pt}</span>
                <span className={radarPoints[2].active ? 'text-[#12464e] dark:text-[#aceba7]' : 'text-slate-400 dark:text-slate-600'}>Area: {radarPoints[2].pt}</span>
                <span className={radarPoints[3].active ? 'text-[#f43f5e] dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}>Ischemia: {radarPoints[3].pt}</span>
                <span className={radarPoints[4].active ? 'text-[#12464e] dark:text-[#aceba7]' : 'text-slate-400 dark:text-slate-600'}>Site: {radarPoints[4].pt}</span>
                <span className={radarPoints[5].active ? 'text-[#12464e] dark:text-[#aceba7]' : 'text-slate-400 dark:text-slate-600'}>Neuro: {radarPoints[5].pt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 4: 3D VOLUMETRIC DEPTH METROLOGY                    */}
      {/* ========================================================= */}
      <div id="panel-4-depth-metrology" className="w-full spotlight-card glass-panel-luxury rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
        {/* Panel 4 Header (Clean Single Line) */}
        <div className="flex items-center justify-between border-b border-[#12464e]/10 dark:border-[#223229] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/40">
              Panel 4
            </span>
            <h3 className="font-serif-luxury text-base md:text-lg font-normal text-[#12464e] dark:text-white">
              3D Volumetric Depth Metrology
            </h3>
          </div>
        </div>

        {/* 2-Column Grid: Expanded 3D Canvas (Left - 8 cols) + Volumetric Cards & Transect Profile (Right - 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Expanded Interactive 3D Crater Canvas */}
          <div className="lg:col-span-8 flex flex-col gap-3 min-w-0">
            <WoundDepthVisualizer3D
              meshData={mesh3d}
              maxDepthMm={maxDepthMm}
              meanDepthMm={meanDepthMm}
              woundVolumeCm3={woundVolumeCm3}
              depthClassification={depthClassification}
              calibrationPxPerCm={patient.arucoCalibration || 42.0}
              rawImageSrc={rawImageSrc}
              maskImageSrc={maskImageSrc}
              woundAreaCm2={areaVal}
              hotspot={gradcamHotspot}
              onProfileGenerated={setLiveTransectProfile}
            />
          </div>

          {/* Right: Volumetric Metrics Cards + 2D Cross-Sectional Transect Profile */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3.5 min-w-0 h-full">
            {/* Top Stat Cards: Excavated Volume & Max Depth side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 block">
                  Excavated Volume
                </span>
                <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 font-mono">
                  {woundVolumeCm3} <span className="text-xs font-sans font-normal text-slate-500">cm³</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Total tissue loss volume
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                    Max Depth
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    maxDepthMm >= 4.0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {maxDepthMm >= 4.0 ? 'HIGH RISK' : 'STABLE'}
                  </span>
                </div>
                <div className="text-2xl font-black text-[#f43f5e] dark:text-rose-400 mt-1 font-mono">
                  {maxDepthMm} <span className="text-xs font-sans font-normal text-slate-500">mm</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Mean depth: {meanDepthMm} mm
                </span>
              </div>
            </div>

            {/* Below Both: 2D Ulcer Crater Transect Profile (Flex-1 to fill space evenly) */}
            <div className="w-full flex-1 flex flex-col min-h-0">
              <CraterCrossSectionProfile
                profile={liveTransectProfile && liveTransectProfile.length > 0 ? liveTransectProfile : crossSectionProfile}
                maxDepthMm={maxDepthMm}
                isDeep={probeToBoneDeep || maxDepthMm >= 4.0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
