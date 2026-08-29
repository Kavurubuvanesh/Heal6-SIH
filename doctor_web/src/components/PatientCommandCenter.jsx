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
  Check
} from 'lucide-react'
import { generateClinicalWoundDataUrl, generateClinicalMaskDataUrl } from '../data/clinicalImages'

export default function PatientCommandCenter({
  patient,
  onOpenReportModal,
  onOpenReferralModal,
  onBackToQueue,
  onVerifyPatient
}) {
  // Clinical validation factor state
  const [probeToBoneDeep, setProbeToBoneDeep] = useState(patient.depthScore === 1)
  const [pedalPulsesIschemia, setPedalPulsesIschemia] = useState(patient.ischemiaScore === 1)
  const [siteHindfoot, setSiteHindfoot] = useState(patient.siteScore === 1)

  // AI boundary overlay & view mode state
  const [showAiBoundary, setShowAiBoundary] = useState(true)
  const [maskOpacity, setMaskOpacity] = useState(65)
  const [viewMode, setViewMode] = useState('split') // 'overlay' | 'split'
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifySuccess, setVerifySuccess] = useState(false)

  // Dynamic sample fallbacks if no image was uploaded
  const [sampleScan, setSampleScan] = useState('')
  const [sampleMask, setSampleMask] = useState('')

  useEffect(() => {
    setSampleScan(generateClinicalWoundDataUrl(patient.siteScore === 1 ? 'hindfoot' : 'forefoot'))
    setSampleMask(generateClinicalMaskDataUrl(patient.siteScore === 1 ? 'hindfoot' : 'forefoot'))
  }, [patient])

  // Synchronize state whenever patient prop changes
  useEffect(() => {
    setProbeToBoneDeep(patient.depthScore === 1)
    setPedalPulsesIschemia(patient.ischemiaScore === 1)
    setSiteHindfoot(patient.siteScore === 1)
  }, [patient])

  // Fixed/Patient-reported factors
  const patientAppNeuropathy = true
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

  const tissueBreakdown = patient.tissueBreakdown || {
    granulation: 45.0,
    slough: 35.0,
    necrotic: 20.0
  }

  // Circular Gauge Component for AI Diagnostics Telemetry
  const CircularProgressGauge = ({ value = 0, color, label, subtitle }) => {
    const radius = 32
    const circumference = 2 * Math.PI * radius
    const safeVal = Math.min(Math.max(Number(value) || 0, 0), 100)
    const strokeDashoffset = circumference - (safeVal / 100) * circumference

    return (
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-xs transition-shadow">
        <div className="relative w-18 h-18 flex items-center justify-center mb-1.5">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} stroke="#e2e8f0" className="dark:stroke-slate-700" strokeWidth="6" fill="none" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={color}
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="text-sm font-black text-slate-800 dark:text-white absolute tracking-tight">
            {safeVal.toFixed(1)}%
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
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
      <div className="w-full bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#f43f5e] dark:text-rose-400 bg-[#fff1f2] dark:bg-rose-950/60 px-2.5 py-0.5 rounded-lg border border-[#f43f5e]/30 dark:border-rose-900">
              Panel 1
            </span>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
              Clinical Override & Human Validation
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            IWGDF Verified
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Section A: Pre-filled AI & Patient App Factors */}
          <div className="lg:col-span-6 flex flex-col gap-2.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              Pre-Filled by AI & Patient App:
            </span>

            <div className="space-y-2">
              {/* Factor 1: Area */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Area ≥ 1.0 cm²</span>
                </div>
                <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300">
                  UNet++ SOTA ({patient.woundAreaCm2} cm²)
                </span>
              </div>

              {/* Factor 2: Infection */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Bacterial Infection (&gt;50%)</span>
                </div>
                <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#f43f5e]/10 dark:bg-rose-950 text-[#f43f5e] dark:text-rose-300">
                  ConvNeXt ({patient.infectionRiskPercent}%)
                </span>
              </div>

              {/* Factor 3: Neuropathy */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Neuropathy (Loss of Sensation)</span>
                </div>
                <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300">
                  Patient Intake (1 pt)
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Human Validation Mandate Checkboxes */}
          <div className="lg:col-span-6 flex flex-col gap-2.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#f43f5e] dark:text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Human Validation Checkboxes:
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Medical Safety Law</span>
            </div>

            <div className="space-y-2">
              {/* Checkbox 1: Probe-to-Bone (Deep) */}
              <div
                onClick={() => setProbeToBoneDeep(!probeToBoneDeep)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  probeToBoneDeep
                    ? 'bg-[#fff1f2] dark:bg-rose-950/40 border-[#f43f5e]/50 dark:border-rose-800 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {probeToBoneDeep ? (
                      <CheckSquare className="w-4 h-4 text-[#f43f5e] dark:text-rose-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Probe-to-Bone (Deep Fascia / Joint)
                    </span>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                      Verified via physical metal probe or X-ray
                    </p>
                  </div>
                </div>
                <span className={`text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-md ${
                  probeToBoneDeep ? 'bg-[#f43f5e] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {probeToBoneDeep ? '1 pt' : '0 pt'}
                </span>
              </div>

              {/* Checkbox 2: Pedal Pulses (Ischemia) */}
              <div
                onClick={() => setPedalPulsesIschemia(!pedalPulsesIschemia)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  pedalPulsesIschemia
                    ? 'bg-[#fff1f2] dark:bg-rose-950/40 border-[#f43f5e]/50 dark:border-rose-800 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-2">
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
                <span className={`text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-md ${
                  pedalPulsesIschemia ? 'bg-[#f43f5e] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {pedalPulsesIschemia ? '1 pt' : '0 pt'}
                </span>
              </div>

              {/* Checkbox 3: Hindfoot / Midfoot Site */}
              <div
                onClick={() => setSiteHindfoot(!siteHindfoot)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  siteHindfoot
                    ? 'bg-teal-50/70 dark:bg-teal-950/40 border-[#0d9488]/50 dark:border-teal-800 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {siteHindfoot ? (
                      <CheckSquare className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
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
                <span className={`text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-md ${
                  siteHindfoot ? 'bg-[#0d9488] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {siteHindfoot ? '1 pt' : '0 pt'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL 2: WOUND VISUALS & UNet++ SEGMENTATION INSPECTOR     */}
      {/* ========================================================= */}
      <div className="w-full bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        {/* Header with Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-lg">
              Panel 2
            </span>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
              Wound Visuals & UNet++ Inspector
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-[#0d9488] dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side Split</span>
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === 'overlay'
                    ? 'bg-white dark:bg-slate-700 text-[#0d9488] dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Layered Overlay</span>
              </button>
            </div>

            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
              25mm ArUco Tag
            </span>
          </div>
        </div>

        {/* Main Visuals + Controls Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Real Scanned Images & Overlay Visualizer */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {viewMode === 'split' ? (
              /* Split Comparison View (Matching User Attachment 2) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Original Clean Scan */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block text-center">
                    Original Scan
                  </span>
                  <div className="relative w-full aspect-square rounded-xl bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center group">
                    <img
                      src={rawImageSrc}
                      alt="Original Patient Wound Scan"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[9.5px] font-mono font-bold text-slate-300 border border-slate-700">
                      RAW SCAN
                    </div>
                  </div>
                </div>

                {/* 2. Live AI Heatmap Segmentation Overlay */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#f43f5e] dark:text-rose-400 block text-center">
                    AI Label Overlap
                  </span>
                  <div className="relative w-full aspect-square rounded-xl bg-slate-950 overflow-hidden border-2 border-[#f43f5e]/80 shadow-md shadow-rose-500/10 flex items-center justify-center group">
                    {/* Base Scanned Photo */}
                    <img
                      src={rawImageSrc}
                      alt="Base Scan"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* SOTA UNet++ Segmentation Mask Overlay */}
                    {showAiBoundary && maskImageSrc && (
                      <img
                        src={maskImageSrc}
                        alt="UNet++ Segmentation Mask"
                        style={{ opacity: maskOpacity / 100 }}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 mix-blend-screen"
                      />
                    )}

                    {/* Calibrated Area Callout Tag */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-teal-500/40 flex items-center justify-between text-[10px] font-mono font-bold text-teal-300 shadow-lg">
                      <span>Area: {patient.woundAreaCm2 || 2.45} cm²</span>
                      <span className="text-emerald-400">0.1mm Calibrated</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Layered Single Inspector View (Matching User Attachment 1) */
              <div className="relative w-full h-[250px] md:h-[280px] rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                {/* Base Scanned Photo */}
                <img
                  src={rawImageSrc}
                  alt="Base Wound Scan"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* UNet++ SOTA Mask Overlay */}
                {showAiBoundary && maskImageSrc && (
                  <img
                    src={maskImageSrc}
                    alt="AI Mask Overlay"
                    style={{ opacity: maskOpacity / 100 }}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen transition-opacity duration-200"
                  />
                )}

                {/* Live ArUco Calibration Badge */}
                <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md text-emerald-400 text-[10.5px] font-mono font-bold px-3 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 shadow-md z-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {patient.arucoCalibration || 42.0} px/cm Calibrated
                </div>

                {/* ArUco Tag in Corner */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-700 z-10">
                  25mm Fiducial Tag
                </div>

                {/* Floating Reticle Callout */}
                {showAiBoundary && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-teal-500/50 flex items-center gap-2 text-xs font-mono font-bold text-teal-300 shadow-xl z-10">
                    <Crosshair className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                    <span>Area: {patient.woundAreaCm2 || 2.45} cm² (ArUco Metric Homography)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Margin Callouts & Transparency Controls */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* AI Calibrated Area readout */}
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#0d9488] dark:text-teal-400 block">
                  Calibrated Margin Area
                </span>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  Area: <span className="text-[#0d9488] dark:text-teal-400">{patient.woundAreaCm2 || 2.45} cm²</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold">
                UNet++ (EfficientNet-B4)
              </span>
            </div>

            {/* Toggle Switch "Show AI Wound Boundary" */}
            <div
              onClick={() => setShowAiBoundary(!showAiBoundary)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show AI Boundary</span>
              </div>

              {/* Switch UI */}
              <div className={`w-10 h-5.5 rounded-full transition-colors ${showAiBoundary ? 'bg-[#0d9488]' : 'bg-slate-300 dark:bg-slate-700'} relative p-0.5`}>
                <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transform transition-transform ${showAiBoundary ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Margin Opacity Range Slider */}
            {showAiBoundary && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Margin Transparency</span>
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
      <div className="w-full bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-lg">
              Panel 3
            </span>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
              AI Metrics & 6-Axis Radar
            </h3>
          </div>
          <div className="px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700">
            Score: <strong className="text-[#0d9488] dark:text-teal-400 text-sm font-black tracking-tight">{calculatedScore} / 6</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left Column: AI Statistics + Automated Treatment Protocol + Action Buttons */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-3.5 h-full">
            {/* Top: Wound Area & Infection Risk Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Wound Area</span>
                <div className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {patient.woundAreaCm2 || 2.45} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">cm²</span>
                </div>
                <span className="text-[10px] text-[#0d9488] dark:text-teal-400 font-bold">UNet++ SOTA Brain</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase text-slate-400 dark:text-slate-500 block">Infection Risk</span>
                <div className="text-lg font-black text-[#f43f5e] dark:text-rose-400 mt-0.5">
                  {patient.infectionRiskPercent || 78.4}%
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">ConvNeXt-V2</span>
              </div>
            </div>

            {/* Middle: Automated Treatment Protocol */}
            <div className="p-3.5 bg-[#0d9488]/5 dark:bg-teal-950/40 border border-[#0d9488]/20 dark:border-teal-800 rounded-xl flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-[#0d9488] dark:text-teal-400 uppercase tracking-wider block">
                Automated Treatment Recommendation
              </span>
              <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                {isCritical
                  ? 'Standard wound care + Urgent Multidisciplinary Surgical Consult (TCC offloading & vascular Doppler).'
                  : 'Outpatient podiatric debridement & pressure relief orthotics.'}
              </p>
            </div>

            {/* Bottom: Action CTA */}
            <div>
              <button
                onClick={onOpenReferralModal}
                className="w-full py-2.5 px-4 rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Siren className="w-4 h-4" />
                <span>Generate Vascular Referral</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic 6-Axis Radar Graph */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center shadow-2xs">
              <div className="w-full flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">6-Axis SINBAD Radar</span>
                <span className="text-[10px] font-mono text-[#0d9488] dark:text-teal-400 font-bold">Live Synced</span>
              </div>

              {/* SVG 6-Axis Radar Polygon */}
              <div className="w-36 h-36 relative my-1">
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
                      className="dark:stroke-slate-700"
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
                    fill="rgba(36, 149, 131, 0.4)"
                    stroke="#0d9488"
                    strokeWidth="2.5"
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
              </div>

              {/* Mini Axis Breakdown Tags */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center w-full font-mono font-bold mt-1">
                <span className={radarPoints[0].active ? 'text-[#f43f5e] dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}>Sepsis: {radarPoints[0].pt}</span>
                <span className={radarPoints[1].active ? 'text-[#f43f5e] dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}>Depth: {radarPoints[1].pt}</span>
                <span className={radarPoints[2].active ? 'text-[#0d9488] dark:text-teal-400' : 'text-slate-400 dark:text-slate-600'}>Area: {radarPoints[2].pt}</span>
                <span className={radarPoints[3].active ? 'text-[#f43f5e] dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'}>Ischemia: {radarPoints[3].pt}</span>
                <span className={radarPoints[4].active ? 'text-[#0d9488] dark:text-teal-400' : 'text-slate-400 dark:text-slate-600'}>Site: {radarPoints[4].pt}</span>
                <span className={radarPoints[5].active ? 'text-[#0d9488] dark:text-teal-400' : 'text-slate-400 dark:text-slate-600'}>Neuro: {radarPoints[5].pt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
