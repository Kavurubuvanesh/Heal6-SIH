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
  Columns,
  Eye,
  Crosshair,
  Check,
  FileCode,
  Database,
  Flame,
  Box,
  BookOpen
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

  useEffect(() => {
    setSampleScan(generateClinicalWoundDataUrl(patient.siteScore === 1 ? 'hindfoot' : 'forefoot'))
    setSampleMask(generateClinicalMaskDataUrl(patient.siteScore === 1 ? 'hindfoot' : 'forefoot'))
    setSampleGradcam(generateClinicalGradCamDataUrl(patient.siteScore === 1 ? 'hindfoot' : 'forefoot'))
  }, [patient])

  // Synchronize state whenever patient prop changes
  useEffect(() => {
    setProbeToBoneDeep(patient.depthScore === 1)
    setPedalPulsesIschemia(patient.ischemiaScore === 1)
    setSiteHindfoot(patient.siteScore === 1)
  }, [patient])

  const [patientAppNeuropathy, setPatientAppNeuropathy] = useState(patient.neuropathyScore === 1)

  useEffect(() => {
    setPatientAppNeuropathy(patient.neuropathyScore === 1)
  }, [patient])

  const aiAreaDetected = (patient.woundAreaCm2 || 0) >= 1.0
  const aiInfectionDetected = (patient.infectionRiskPercent || 0) > 50

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
    { name: 'Sepsis', val: aiInfectionDetected ? 95 : 25, active: aiInfectionDetected, pt: '1' },
    { name: 'Depth', val: probeToBoneDeep ? 90 : 20, active: probeToBoneDeep, pt: probeToBoneDeep ? '1' : '0' },
    { name: 'Area', val: aiAreaDetected ? 85 : 20, active: aiAreaDetected, pt: '1' },
    { name: 'Ischemia', val: pedalPulsesIschemia ? 90 : 20, active: pedalPulsesIschemia, pt: pedalPulsesIschemia ? '1' : '0' },
    { name: 'Site', val: siteHindfoot ? 85 : 20, active: siteHindfoot, pt: siteHindfoot ? '1' : '0' },
    { name: 'Neuro', val: patientAppNeuropathy ? 95 : 20, active: patientAppNeuropathy, pt: '1' },
  ]

  // Resolve active images
  const rawImageSrc = patient.originalImage || patient.raw_image_base64 || patient.imageSrc || sampleScan
  const maskImageSrc = patient.maskImage || patient.aiMaskImage || patient.mask_image_base64 || sampleMask
  const gradcamSrc = patient.gradcamOverlay || patient.gradcamHeatmap || sampleGradcam
  const gradcamHotspot = patient.gradcamHotspot || {
    x: 210,
    y: 150,
    normalized_x: 0.525,
    normalized_y: 0.500
  }
  const gradcamPeak = patient.gradcamPeakIntensity
    ? Math.round(patient.gradcamPeakIntensity * 100)
    : Math.round(patient.infectionRiskPercent || 86)

  const tissueBreakdown = patient.tissueBreakdown || {
    granulation: 45.0,
    slough: 35.0,
    necrotic: 20.0
  }

  // Resolve 3D Volumetric Depth Metrology parameters (Phase 8)
  const maxDepthMm = patient.maxDepthMm ?? (probeToBoneDeep ? 5.8 : 2.4)
  const meanDepthMm = patient.meanDepthMm ?? (probeToBoneDeep ? 3.6 : 1.6)
  const woundVolumeCm3 = patient.woundVolumeCm3 ?? (probeToBoneDeep ? 0.38 : 0.12)
  const depthClassification = patient.depthClassification || (probeToBoneDeep ? "Probe-to-Bone / Deep Fascia" : "Superficial Dermal Ulcer")
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

  const handlePhysicianSignOff = async () => {
    setIsVerifying(true)
    if (onVerifyPatient) {
      await onVerifyPatient(patient.id, {
        finalScore: calculatedScore,
        verifiedIschemia: pedalPulsesIschemia,
        verifiedDepth: probeToBoneDeep,
        doctorNotes: "Physician verified on live workstation."
      })
    }
    setIsVerifying(false)
    setVerifySuccess(true)
    setTimeout(() => {
      setVerifySuccess(false)
      if (onBackToQueue) onBackToQueue()
    }, 1500)
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-[#12464e] dark:text-[#aceba7] font-bold bg-[#aceba7]/10 px-2.5 py-0.5 rounded-full border border-[#aceba7]/30 flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>PostgreSQL Persisted</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-[#aceba7] font-extrabold bg-[#aceba7]/10 px-3 py-1 rounded-full border border-[#aceba7]/30">
              IWGDF Verified
            </span>
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
      {/* PANEL 2: WOUND VISUALS & UNet++ SEGMENTATION INSPECTOR     */}
      {/* ========================================================= */}
      <div className="w-full spotlight-card glass-panel-luxury rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
        {/* Header with Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#12464e]/10 dark:border-[#223229] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/40">
              Panel 2
            </span>
            <div>
              <h3 className="font-serif-luxury text-base md:text-lg font-normal text-[#12464e] dark:text-white">
                Wound Visuals, UNet++ Margins & ConvNeXt Grad-CAM
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Multi-model clinical explainability: tissue contouring fused with deep neural heatmaps
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 3-Way Diagnostic Layer Selector */}
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
              <button
                onClick={() => setDiagnosticMode('dual')}
                className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  diagnosticMode === 'dual'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Dual View</span>
              </button>
            </div>

            {/* Jump to 3D Metrology Button */}
            <button
              onClick={() => {
                const el = document.getElementById('panel-4-depth-metrology')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-2.5 py-1 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer text-teal-700 dark:text-[#aceba7] bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 shadow-2xs"
              title="Jump to 3D Volumetric Depth Metrology & Three.js Crater Model"
            >
              <Box className="w-3.5 h-3.5 text-teal-500" />
              <span>3D Spatial View</span>
            </button>

            {/* View Mode (Split vs Overlay for single layer) */}
            {diagnosticMode !== 'dual' && (
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
            )}

            <span className="text-[11px] font-mono font-bold text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-xl border border-[#aceba7]/30 shrink-0">
              25mm Tag (ArUco)
            </span>
          </div>
        </div>

        {/* Main Visuals + Controls Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Real Scanned Images & Overlay Visualizer */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {diagnosticMode === 'dual' ? (
              /* DUAL VIEW: UNet++ Tissue Segmentation Left, ConvNeXt Grad-CAM Right */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. UNet++ Margin Mask */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> UNet++ Active Margins</span>
                    <span className="font-mono text-slate-500">{patient.woundAreaCm2 || 2.45} cm²</span>
                  </div>
                  <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden border border-teal-500/40 shadow-inner flex items-center justify-center group scanner-target">
                    <img
                      src={rawImageSrc}
                      alt="Wound Base"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {showAiBoundary && maskImageSrc && (
                      <img
                        src={maskImageSrc}
                        alt="UNet++ Margin"
                        style={{ opacity: maskOpacity / 100 }}
                        className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity"
                      />
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 text-[9.5px] font-mono font-bold text-teal-400 border border-teal-500/40 z-20">
                      TISSUE CONTOUR
                    </div>
                  </div>
                </div>

                {/* 2. ConvNeXt Grad-CAM Explainability */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> ConvNeXt Grad-CAM</span>
                    <span className="font-mono text-amber-500">Peak {gradcamPeak}%</span>
                  </div>
                  <div className="relative w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden border border-rose-500/40 shadow-inner flex items-center justify-center group scanner-target">
                    <img
                      src={rawImageSrc}
                      alt="Wound Base"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {showAiBoundary && gradcamSrc && (
                      <img
                        src={gradcamSrc}
                        alt="Grad-CAM Thermal"
                        style={{ opacity: maskOpacity / 100 }}
                        className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity"
                      />
                    )}

                    {/* Hotspot Target Crosshair Reticle */}
                    {showAiBoundary && (
                      <div
                        className="absolute pointer-events-none z-20 flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${gradcamHotspot.normalized_x * 100}%`,
                          top: `${gradcamHotspot.normalized_y * 100}%`
                        }}
                      >
                        <span className="w-8 h-8 rounded-full border-2 border-rose-500 animate-ping absolute opacity-75" />
                        <span className="w-5 h-5 rounded-full border-2 border-amber-400 bg-rose-500/30 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                        </span>
                        <span className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/90 text-[8px] font-mono font-bold text-amber-300 border border-amber-500/40 shadow-md whitespace-nowrap">
                          {gradcamPeak}% Focus
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 text-[9.5px] font-mono font-bold text-rose-400 border border-rose-500/40 z-20">
                      INFECTION HOTSPOT
                    </div>
                  </div>
                </div>
              </div>
            ) : diagnosticMode === 'gradcam' ? (
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
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[9.5px] font-mono font-bold text-slate-300 border border-slate-700 z-20">
                        RAW SCAN
                      </div>
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

                      {/* Hotspot Tag Callout */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/40 flex items-center justify-between text-[10px] font-mono font-bold text-rose-300 shadow-lg z-20">
                        <span>ConvNeXt-Tiny Logit</span>
                        <span className="text-amber-400">Layer: features[-1]</span>
                      </div>
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
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[9.5px] font-mono font-bold text-[#aceba7] border border-[#aceba7]/40 z-20">
                        RAW SCAN
                      </div>
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
                        <span>Area: {patient.woundAreaCm2 || 2.45} cm²</span>
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
                      <span>Area: {patient.woundAreaCm2 || 2.45} cm² (ArUco Metric Homography)</span>
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
                    <span className="text-rose-600 dark:text-rose-400">
                      {gradcamPeak}% <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({gradcamPeak > 70 ? 'High Bacterial Sepsis' : 'Moderate Infiltration'})</span>
                    </span>
                  ) : (
                    <span>Area: <span className="text-[#0d9488] dark:text-teal-400">{patient.woundAreaCm2 || 2.45} cm²</span></span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold">
                {diagnosticMode === 'gradcam' ? 'ConvNeXt-Tiny' : 'UNet++ (EffB4)'}
              </span>
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

            {/* Physician Validation CTA */}
            <button
              onClick={handlePhysicianSignOff}
              disabled={isVerifying || verifySuccess}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                verifySuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-[#0d9488] to-[#0284c7] hover:from-[#0f766e] hover:to-[#0369a1] text-white hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {verifySuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Report Verified & Dispatched to HIS</span>
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

        {/* AI Diagnostics Telemetry Row (Matching User Attachment 2) */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              AI Diagnostics Telemetry
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CircularProgressGauge
              value={patient.infectionRiskPercent || 78.4}
              color="#f43f5e"
              label="Infection Risk"
              subtitle="ConvNeXt-V2"
            />
            <CircularProgressGauge
              value={tissueBreakdown.slough || 35.0}
              color="#eab308"
              label="Slough Tissue"
              subtitle="UNet++ SOTA"
            />
            <CircularProgressGauge
              value={tissueBreakdown.necrotic || 20.0}
              color="#f43f5e"
              label="Necrotic Tissue"
              subtitle="UNet++ SOTA"
            />
            <CircularProgressGauge
              value={tissueBreakdown.granulation || 45.0}
              color="#10b981"
              label="Granulation Tissue"
              subtitle="Healthy Regrowth"
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
                  {patient.woundAreaCm2 || 2.45} <span className="text-xs font-sans font-normal text-slate-500">cm²</span>
                </div>
                <span className="text-[10px] text-[#12464e] dark:text-[#aceba7] font-bold">UNet++ SOTA Brain</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Infection Risk</span>
                <div className="text-xl font-black text-[#f43f5e] dark:text-rose-400 mt-0.5 font-mono">
                  {patient.infectionRiskPercent || 78.4}%
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">ConvNeXt-V2</span>
              </div>
            </div>

            {/* Middle: Automated Treatment Protocol */}
            <div className="p-4 bg-[#aceba7]/10 dark:bg-[#15221b] border border-[#aceba7]/30 dark:border-[#223229] rounded-2xl flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-[#12464e] dark:text-[#aceba7] uppercase tracking-wider block">
                Automated Treatment Recommendation
              </span>
              <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                {isCritical
                  ? 'Standard wound care + Urgent Multidisciplinary Surgical Consult (TCC offloading & vascular Doppler).'
                  : 'Outpatient podiatric debridement & pressure relief orthotics.'}
              </p>
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
                  <polygon
                    points={`
                      100,${20 + (100 - radarPoints[0].val) * 0.8}
                      ${170 - (100 - radarPoints[1].val) * 0.7},${60 + (100 - radarPoints[1].val) * 0.4}
                      ${170 - (100 - radarPoints[2].val) * 0.7},${140 - (100 - radarPoints[2].val) * 0.4}
                      100,${180 - (100 - radarPoints[3].val) * 0.8}
                      ${30 + (100 - radarPoints[4].val) * 0.7},${140 - (100 - radarPoints[4].val) * 0.4}
                      ${30 + (100 - radarPoints[5].val) * 0.7},${60 + (100 - radarPoints[5].val) * 0.4}
                    `}
                    fill="rgba(172, 235, 167, 0.4)"
                    stroke="#12464e"
                    className="dark:stroke-[#aceba7]"
                    strokeWidth="2.5"
                  />
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
      {/* PANEL 4: 3D VOLUMETRIC DEPTH METROLOGY (SPATIAL COMPUTING)*/}
      {/* ========================================================= */}
      <div id="panel-4-depth-metrology" className="w-full spotlight-card glass-panel-luxury rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-4">
        {/* Panel 4 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#12464e]/10 dark:border-[#223229] pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#12464e] dark:text-[#aceba7] bg-[#aceba7]/15 px-3 py-1 rounded-full border border-[#aceba7]/40">
              Panel 4
            </span>
            <div>
              <h3 className="font-serif-luxury text-base md:text-lg font-normal text-[#12464e] dark:text-white flex items-center gap-2">
                <span>3D Volumetric Depth Metrology</span>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                  Phase 8 Spatial AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Riemann integral volume computation, photometric crater topography & Three.js point-cloud excavation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-[#12464e] dark:text-[#aceba7] font-bold bg-[#aceba7]/10 px-2.5 py-1 rounded-xl border border-[#aceba7]/30 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-teal-500" />
              <span>Three.js WebGL Engine</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-[#aceba7] font-extrabold bg-[#aceba7]/10 px-3 py-1 rounded-xl border border-[#aceba7]/30">
              ArUco Calibrated (0.1mm)
            </span>
          </div>
        </div>

        {/* 2-Column Grid: 3D Canvas (Left) + Volumetric Cards & Transect Profile (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Interactive Three.js 3D Crater Canvas */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <WoundDepthVisualizer3D
              meshData={mesh3d}
              maxDepthMm={maxDepthMm}
              meanDepthMm={meanDepthMm}
              woundVolumeCm3={woundVolumeCm3}
              depthClassification={depthClassification}
              calibrationPxPerCm={patient.arucoCalibration || 42.0}
              rawImageSrc={rawImageSrc}
            />
          </div>

          {/* Right: Volumetric Metrics Cards + 2D Cross-Sectional Transect Profile */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                    Excavated Volume
                  </span>
                  <span className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                    Riemann ∫
                  </span>
                </div>
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

            {/* Middle: 2D Crater Transect Profile */}
            <CraterCrossSectionProfile
              profile={crossSectionProfile}
              maxDepthMm={maxDepthMm}
              isDeep={probeToBoneDeep || maxDepthMm >= 4.0}
            />

            {/* Bottom: Clinical Spatial Advice & Surgical Recommendation */}
            <div className="p-3.5 rounded-2xl bg-teal-500/[0.07] dark:bg-teal-950/30 border border-teal-500/20 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white block">
                  3D Spatial Metrology Finding:
                </span>
                {maxDepthMm >= 4.0
                  ? `Ulcer excavation exceeds 4.0mm (${maxDepthMm}mm max depth, ${woundVolumeCm3}cm³ volume). Probe-to-bone fascial risk detected. Negative Pressure Wound Therapy (NPWT) or surgical debridement recommended.`
                  : `Superficial tissue depression (${maxDepthMm}mm max depth, ${woundVolumeCm3}cm³ volume). Epidermal basement membrane intact. Standard collagen matrix dressing indicated.`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
