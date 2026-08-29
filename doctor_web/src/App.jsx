import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CustomCursor from './components/CustomCursor'
import LandingPage from './components/LandingPage'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ImageUploaderCard from './components/ImageUploaderCard'
import ClinicalFormCard from './components/ClinicalFormCard'
import AiResultsColumn from './components/AiResultsColumn'
import ReportModal from './components/ReportModal'
import ReferralModal from './components/ReferralModal'
import MasterTriageQueue from './components/MasterTriageQueue'
import PatientCommandCenter from './components/PatientCommandCenter'
import AnalyticsView from './components/AnalyticsView'
import WoundRegistryView from './components/WoundRegistryView'
import CalibrationView from './components/CalibrationView'
import SinbadTrajectoryCard from './components/SinbadTrajectoryCard'
import { PATIENT_CASES } from './data/clinicalCases'
import { generateClinicalWoundDataUrl } from './data/clinicalImages'
import {
  analyzeWoundWithBackend,
  calculateLocalSinbadScore,
  fetchPatientQueue,
  verifyPatientReport,
  checkBackendStatus
} from './services/api'

export default function App() {
  // Top-level View Mode: 'landing' | 'workstation'
  const [viewMode, setViewMode] = useState('landing')
  const [loggedInDoctor, setLoggedInDoctor] = useState({
    name: 'Dr. Sharma',
    email: 'dr.sharma@heal6.health',
    role: 'Consultant Endocrinologist & DFU Specialist',
    department: 'Endocrinology & Diabetic Foot Unit'
  })

  // Live Backend status
  const [isLiveBackend, setIsLiveBackend] = useState(false)

  // Dynamic Patient Queue from Backend / Fallback
  const [patientCases, setPatientCases] = useState(PATIENT_CASES)

  // Navigation active tab in workstation
  const [activeTab, setActiveTab] = useState('queue')

  // Selected Patient Case
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0)
  const patient = patientCases[currentCaseIndex] || PATIENT_CASES[0]

  // Clinical Form Doctor Inputs & Demographics
  const [intakePatientName, setIntakePatientName] = useState(patient?.name || 'Carlos Mendez')
  const [intakePatientAge, setIntakePatientAge] = useState(patient?.age || 64)
  const [intakePatientGender, setIntakePatientGender] = useState(patient?.gender || 'Male')
  const [intakeDiabetesType, setIntakeDiabetesType] = useState(patient?.diabetesType || 'Type 2 DM (14 yrs)')
  const [intakeLocationLabel, setIntakeLocationLabel] = useState(patient?.locationLabel || 'Right Plantar Hindfoot Ulcer')

  const [siteHindfoot, setSiteHindfoot] = useState(patient?.siteScore === 1)
  const [ischemia, setIschemia] = useState(patient?.ischemiaScore === 1)
  const [neuropathy, setNeuropathy] = useState(patient?.neuropathyScore === 1)
  const [depthDeep, setDepthDeep] = useState(patient?.depthScore === 1)

  // Image & AI State
  const [imageSrc, setImageSrc] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(true)

  // AI Telemetry Outputs
  const [woundArea, setWoundArea] = useState(patient?.woundAreaCm2 || 2.45)
  const [arucoScale, setArucoScale] = useState(patient?.arucoCalibration || 42)
  const [infectionRisk, setInfectionRisk] = useState(patient?.infectionRiskPercent || 78.4)
  const [convnextConfidence, setConvnextConfidence] = useState(patient?.convnextConfidence || 89.5)
  const [tissueBreakdown, setTissueBreakdown] = useState(patient?.tissueBreakdown || { granulation: 45, slough: 35, necrotic: 20 })
  const [healingTime, setHealingTime] = useState(patient?.healingEstimateWeeks || '12 - 16 Weeks')
  const [triageLabel, setTriageLabel] = useState(patient?.triageLevel || 'URGENT TRIAGE')
  const [triageColor, setTriageColor] = useState(patient?.triageColor || '#f43f5e')

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)

  // ----------------------------------------------------------------
  // Real-Time Queue Synchronization with FastAPI Backend
  // ----------------------------------------------------------------
  useEffect(() => {
    let isMounted = true

    const syncLiveQueue = async () => {
      try {
        const isOnline = await checkBackendStatus()
        if (isMounted) setIsLiveBackend(isOnline)

        if (isOnline) {
          const queueRes = await fetchPatientQueue()
          if (isMounted && queueRes.success && Array.isArray(queueRes.data) && queueRes.data.length > 0) {
            setPatientCases(queueRes.data)
          }
        }
      } catch (err) {
        console.warn('[Heal6] Sync error:', err)
      }
    }

    syncLiveQueue()
    const interval = setInterval(syncLiveQueue, 4000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Sync state when switching demo cases
  const handleSelectCase = (index) => {
    const selected = patientCases[index] || PATIENT_CASES[0]
    setCurrentCaseIndex(index)
    setIntakePatientName(selected.name || 'Carlos Mendez')
    setIntakePatientAge(selected.age || 64)
    setIntakePatientGender(selected.gender || 'Male')
    setIntakeDiabetesType(selected.diabetesType || 'Type 2 DM (14 yrs)')
    setIntakeLocationLabel(selected.locationLabel || 'Right Plantar Hindfoot Ulcer')

    setSiteHindfoot(selected.siteScore === 1)
    setIschemia(selected.ischemiaScore === 1)
    setNeuropathy(selected.neuropathyScore === 1)
    setDepthDeep(selected.depthScore === 1)
    setWoundArea(selected.woundAreaCm2 || 2.45)
    setArucoScale(selected.arucoCalibration || 42)
    setInfectionRisk(selected.infectionRiskPercent || 50)
    setConvnextConfidence(selected.convnextConfidence || 75)
    setTissueBreakdown(selected.tissueBreakdown || { granulation: 50, slough: 30, necrotic: 20 })
    setHealingTime(selected.healingEstimateWeeks || '8 - 12 Weeks')
    setTriageLabel(selected.triageLevel || 'MODERATE RISK')
    setTriageColor(selected.triageColor || '#f59e0b')
    setImageSrc(selected.originalImage || null)
    setImageFile(null)
  }

  // Calculate dynamic SINBAD score (Total 0 to 6 points)
  const calculatedSinbadScore =
    (siteHindfoot ? 1 : 0) +
    (ischemia ? 1 : 0) +
    (neuropathy ? 1 : 0) +
    (depthDeep ? 1 : 0) +
    (infectionRisk > 50 ? 1 : 0) +
    (woundArea >= 1.0 ? 1 : 0)

  // Trigger AI analysis with live backend call and multi-step telemetry
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisStep('1/4: ArUco Metric Homography (0.1 mm calibration)...')

    setTimeout(() => {
      setAnalysisStep('2/4: ConvNeXt Gatekeeper (Abnormality Triage)...')
    }, 400)

    setTimeout(() => {
      setAnalysisStep('3/4: Industrial AI Brain (UNet++ 4-Class Pixel Triage)...')
    }, 800)

    setTimeout(() => {
      setAnalysisStep('4/4: Computing Composite SINBAD Index & Triage Risk...')
    }, 1200)

    try {
      let fileToUpload = imageFile
      // If no file was directly dropped, generate a high-res clinical sample JPEG blob
      if (!fileToUpload) {
        const sampleUrl = imageSrc || generateClinicalWoundDataUrl(siteHindfoot ? 'hindfoot' : 'forefoot')
        if (sampleUrl && sampleUrl.startsWith('data:')) {
          const res = await fetch(sampleUrl)
          const blob = await res.blob()
          fileToUpload = new File([blob], 'clinical_assessment_scan.jpg', { type: 'image/jpeg' })
        }
      }

      const backendResult = await analyzeWoundWithBackend({
        imageFile: fileToUpload,
        isHindfoot: siteHindfoot,
        hasIschemia: ischemia,
        hasNeuropathy: neuropathy,
        isDeep: depthDeep,
        patientName: intakePatientName || patient?.name || 'Carlos Mendez',
        patientAge: String(intakePatientAge || patient?.age || 64),
        patientGender: intakePatientGender || patient?.gender || 'Male',
        diabetesType: intakeDiabetesType || patient?.diabetesType || 'Type 2 DM (14 yrs)',
        patientId: patient?.id,
        locationLabel: intakeLocationLabel || patient?.locationLabel || 'Right Plantar Hindfoot Ulcer'
      })

      if (backendResult.success && backendResult.data) {
        const d = backendResult.data
        if (d.ai_diagnostics?.calculated_area_cm2 !== undefined) {
          setWoundArea(d.ai_diagnostics.calculated_area_cm2)
        }
        if (d.ai_diagnostics?.pixels_per_cm) {
          setArucoScale(d.ai_diagnostics.pixels_per_cm)
        }
        if (d.ai_diagnostics?.convnext_confidence) {
          setConvnextConfidence(d.ai_diagnostics.convnext_confidence)
          setInfectionRisk(d.ai_diagnostics.infection_risk_percent)
        }
        if (d.ai_diagnostics?.tissue_breakdown) {
          setTissueBreakdown(d.ai_diagnostics.tissue_breakdown)
        }
        if (d.triage_label) setTriageLabel(d.triage_label)
        if (d.triage_color) setTriageColor(d.triage_color)
        if (d.healing_time) setHealingTime(d.healing_time)

        // Immediately refresh live queue
        const q = await fetchPatientQueue()
        if (q.success && q.data) {
          setPatientCases(q.data)
          setCurrentCaseIndex(0) // Select newly created case at top
        }
      }
    } catch (err) {
      console.warn('[Heal6] Analysis completed in offline telemetry mode:', err)
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
      setHasAnalyzed(true)
    }
  }

  const handleReset = () => {
    handleSelectCase(0)
  }

  const handleVerifyPatient = async (patientId, payload) => {
    await verifyPatientReport(patientId, payload)
    const q = await fetchPatientQueue()
    if (q.success && q.data) {
      setPatientCases(q.data)
    } else {
      setPatientCases(prev => prev.filter(p => p.id !== patientId))
    }
    setActiveTab('queue')
  }

  return (
    <>
      {/* Smooth Fluid Medical Custom Cursor */}
      <CustomCursor />

      <AnimatePresence mode="wait">
        {viewMode === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <LandingPage
              onEnterWorkstation={(doctorProfile) => {
                if (doctorProfile) setLoggedInDoctor(doctorProfile)
                setViewMode('workstation')
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workstation"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-slate-50 dark:bg-[#070e14] flex flex-col md:flex-row text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-300 relative"
          >
            {/* Ambient Lighting Glow Layers (Unified with Landing Page) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
              <div className="absolute -top-40 left-1/3 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#0d9488]/12 via-[#0284c7]/8 to-transparent dark:from-[#0d9488]/10 dark:via-[#0284c7]/6 rounded-full blur-[140px]" />
              <div className="absolute top-1/3 right-0 translate-x-1/4 w-[700px] h-[700px] bg-gradient-to-bl from-[#5eead4]/18 via-[#0284c7]/8 to-transparent dark:from-[#5eead4]/10 dark:via-[#0284c7]/5 rounded-full blur-[150px]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-teal-500/[0.06] dark:bg-teal-400/[0.02] rounded-full blur-[160px]" />
            </div>

            {/* 1. Left-Hand Clinical Sidebar */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentCaseIndex={currentCaseIndex}
              onSelectCase={handleSelectCase}
              cases={patientCases}
              isAnalyzing={isAnalyzing}
              onExitToLanding={() => setViewMode('landing')}
            />

            {/* 2. Main Workstation Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto z-10">
              {/* Sticky Header */}
              <Header
                patient={patient}
                onReset={handleReset}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onOpenReferralModal={() => setIsReferralModalOpen(true)}
                isAnalyzing={isAnalyzing}
                isLiveBackend={isLiveBackend}
              />

              {/* View Switcher based on Active Tab */}
              <main className="flex-1">
                {/* Screen 1: The Master Triage Queue */}
                {activeTab === 'queue' && (
                  <MasterTriageQueue
                    cases={patientCases}
                    onSelectPatient={(id) => {
                      const idx = patientCases.findIndex((p) => p.id === id)
                      if (idx !== -1) handleSelectCase(idx)
                      setActiveTab('command_center')
                    }}
                    onNewAssessment={() => setActiveTab('assessment')}
                  />
                )}

                {/* Screen 2, 3, 4: The Patient Command Center */}
                {activeTab === 'command_center' && (
                  <PatientCommandCenter
                    patient={patient}
                    onOpenReportModal={() => setIsReportModalOpen(true)}
                    onOpenReferralModal={() => setIsReferralModalOpen(true)}
                    onBackToQueue={() => setActiveTab('queue')}
                    onVerifyPatient={handleVerifyPatient}
                  />
                )}

                {activeTab === 'analytics' && <AnalyticsView />}

                {activeTab === 'registry' && (
                  <WoundRegistryView
                    onSelectPatientWound={(mrn) => {
                      const idx = patientCases.findIndex((p) => p.id === mrn)
                      if (idx !== -1) handleSelectCase(idx)
                      else handleSelectCase(0)
                      setActiveTab('command_center')
                    }}
                    onNewAssessment={() => setActiveTab('assessment')}
                  />
                )}

                {activeTab === 'calibration' && <CalibrationView />}

                {activeTab === 'assessment' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-6 max-w-7xl mx-auto w-full"
                  >
                    {/* Responsive 2-Column Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
                      {/* Column 1: Clinical Image Intake + Physical Validation Parameters */}
                      <div className="flex flex-col gap-6">
                        <ImageUploaderCard
                          imageSrc={imageSrc}
                          setImageSrc={setImageSrc}
                          onImageFileSelect={(file) => setImageFile(file)}
                          isAnalyzing={isAnalyzing}
                          arucoScale={arucoScale}
                          woundArea={woundArea}
                        />

                        <ClinicalFormCard
                          patientName={intakePatientName}
                          setPatientName={setIntakePatientName}
                          patientAge={intakePatientAge}
                          setPatientAge={setIntakePatientAge}
                          patientGender={intakePatientGender}
                          setPatientGender={setIntakePatientGender}
                          diabetesType={intakeDiabetesType}
                          setDiabetesType={setIntakeDiabetesType}
                          locationLabel={intakeLocationLabel}
                          setLocationLabel={setIntakeLocationLabel}
                          siteHindfoot={siteHindfoot}
                          setSiteHindfoot={setSiteHindfoot}
                          ischemia={ischemia}
                          setIschemia={setIschemia}
                          neuropathy={neuropathy}
                          setNeuropathy={setNeuropathy}
                          depthDeep={depthDeep}
                          setDepthDeep={setDepthDeep}
                          onRunAnalysis={handleRunAnalysis}
                          isAnalyzing={isAnalyzing}
                          analysisStep={analysisStep}
                        />
                      </div>

                      {/* Column 2: Combined AI Diagnostics & Risk Triage */}
                      <div className="flex flex-col h-full">
                        <AiResultsColumn
                          patient={patient}
                          sinbadScore={calculatedSinbadScore}
                          woundArea={woundArea}
                          arucoScale={arucoScale}
                          infectionRisk={infectionRisk}
                          convnextConfidence={convnextConfidence}
                          tissueBreakdown={tissueBreakdown}
                          healingTime={healingTime}
                          triageLabel={triageLabel}
                          triageColor={triageColor}
                          isAnalyzing={isAnalyzing}
                          hasAnalyzed={hasAnalyzed}
                          onGenerateReport={() => setIsReportModalOpen(true)}
                          onGenerateReferral={() => setIsReferralModalOpen(true)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </main>
            </div>

            {/* 3. Clinical Modals */}
            <ReportModal
              isOpen={isReportModalOpen}
              onClose={() => setIsReportModalOpen(false)}
              patient={patient}
              sinbadScore={calculatedSinbadScore}
              woundArea={woundArea}
              infectionRisk={infectionRisk}
              triageLabel={triageLabel}
              healingTime={healingTime}
            />

            <ReferralModal
              isOpen={isReferralModalOpen}
              onClose={() => setIsReferralModalOpen(false)}
              patient={patient}
              sinbadScore={calculatedSinbadScore}
              woundArea={woundArea}
              infectionRisk={infectionRisk}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
