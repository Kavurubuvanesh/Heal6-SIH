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
import FhirExportModal from './components/FhirExportModal'
import ArchitectureHubModal from './components/ArchitectureHubModal'
import MasterTriageQueue from './components/MasterTriageQueue'
import PatientCommandCenter from './components/PatientCommandCenter'
import AnalyticsView from './components/AnalyticsView'
import WoundRegistryView from './components/WoundRegistryView'
import CalibrationView from './components/CalibrationView'
import SinbadTrajectoryCard from './components/SinbadTrajectoryCard'
import DoctorAuthModal from './components/DoctorAuthModal'
import ClinicalRAGScribeModal from './components/ClinicalRAGScribeModal'
import FederatedLearningModal from './components/FederatedLearningModal'
import { PATIENT_CASES } from './data/clinicalCases'
import { SCHEDULE_DAYS, SCHEDULE_CASES_BY_DATE, getCasesForDate, getWoundsForDate } from './data/scheduleData'
import { generateClinicalWoundDataUrl } from './data/clinicalImages'
import {
  analyzeWoundWithBackend,
  calculateLocalSinbadScore,
  fetchPatientQueue,
  verifyPatientReport,
  checkBackendStatus,
  verifyDoctorSession
} from './services/api'
import { triageStream } from './services/websocket'
import CriticalAlertBanner from './components/CriticalAlertBanner'

export default function App() {
  // Top-level View Mode: 'landing' | 'workstation'
  const [viewMode, setViewMode] = useState('landing')
  const [loggedInDoctor, setLoggedInDoctor] = useState({
    name: 'Dr. Sharma',
    email: 'dr.sharma@heal6.health',
    role: 'Endocrinology & DFU Specialist',
    department: 'Endocrinology & DFU Specialist'
  })

  // Live Backend status
  const [isLiveBackend, setIsLiveBackend] = useState(false)

  // Clinical Schedule Selected Date ('2026-09-18' = Friday Today)
  const [selectedDate, setSelectedDate] = useState('2026-09-18')

  // Dynamic Patient Queue from Schedule / Backend
  const [patientCases, setPatientCases] = useState(() => getCasesForDate('2026-09-18'))

  // Navigation active tab in workstation
  const [activeTab, setActiveTab] = useState('queue')

  // Selected Patient Case
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0)
  const patient = patientCases[currentCaseIndex] || PATIENT_CASES[0]

  // Clinical Form Doctor Inputs & Demographics
  const [intakePatientName, setIntakePatientName] = useState(patient?.name || 'Rajesh Verma')
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
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false)
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false)
  const [isDoctorAuthModalOpen, setIsDoctorAuthModalOpen] = useState(false)
  const [isScribeModalOpen, setIsScribeModalOpen] = useState(false)
  const [isFederatedModalOpen, setIsFederatedModalOpen] = useState(false)

  // Real-Time Streaming & Emergency Alerting State
  const [activeAlert, setActiveAlert] = useState(null)
  const [streamStatus, setStreamStatus] = useState({ isConnected: false, protocol: 'DISCONNECTED', latencyMs: 0 })

  // ----------------------------------------------------------------
  // Real-Time Queue Synchronization via WebSocket & Fallback Polling
  // ----------------------------------------------------------------
  useEffect(() => {
    let isMounted = true

    // Check active cryptographic doctor session from localStorage/sessionStorage
    const checkActiveDoctorSession = async () => {
      try {
        const verifyRes = await verifyDoctorSession()
        if (isMounted && verifyRes.success && verifyRes.doctor) {
          setLoggedInDoctor(verifyRes.doctor)
        }
      } catch (err) {
        // Fallback default maintained
      }
    }
    checkActiveDoctorSession()

    // 1. Initial snapshot fetch from relational database
    const syncInitialQueue = async () => {
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
        console.warn('[Heal6] Initial sync error:', err)
      }
    }
    syncInitialQueue()

    // 2. Initialize Real-Time WebSocket Connection
    triageStream.connect()

    const unsubStatus = triageStream.on('status', (status) => {
      if (isMounted) {
        setStreamStatus(status)
        setIsLiveBackend(status.isConnected)
      }
    })

    // Sub-50ms Patient Intake Push Event
    const unsubIntake = triageStream.on('intake', (newPatient) => {
      console.log('⚡ [STREAM EVENT] New patient intake received via WebSocket:', newPatient)
      if (!isMounted) return
      setPatientCases((prev) => {
        const exists = prev.some((p) => p.id === newPatient.id)
        const updated = exists
          ? prev.map((p) => (p.id === newPatient.id ? newPatient : p))
          : [newPatient, ...prev]
        return updated.sort((a, b) => (b.calculatedSinbad || 0) - (a.calculatedSinbad || 0))
      })
    })

    // Emergency Critical Alert (SINBAD >= 4)
    const unsubCritical = triageStream.on('critical', (alertData) => {
      console.warn('🚨 [STREAM CRITICAL ALERT]', alertData)
      if (isMounted) {
        setActiveAlert(alertData)
      }
    })

    // Patient Verified Event
    const unsubVerified = triageStream.on('verified', ({ patientId }) => {
      if (!isMounted) return
      setPatientCases((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, verifiedByDoctor: true } : p))
      )
    })

    // Patient Reverify Request Event
    const unsubReverify = triageStream.on('reverify', ({ patientId, patientNotes }) => {
      if (!isMounted) return
      setPatientCases((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                reverificationRequested: true,
                patientNotes,
                triageLevel: 'MANUAL RE-VERIFY REQUESTED',
                triageColor: '#e11d48'
              }
            : p
        )
      )
    })

    // 3. Fallback Heartbeat (every 15s, only active if WebSocket stream drops)
    const fallbackInterval = setInterval(async () => {
      if (!triageStream.isConnected) {
        const isOnline = await checkBackendStatus()
        if (isMounted) setIsLiveBackend(isOnline)
        if (isOnline) {
          const queueRes = await fetchPatientQueue()
          if (isMounted && queueRes.success && Array.isArray(queueRes.data) && queueRes.data.length > 0) {
            setPatientCases(queueRes.data)
          }
        }
      }
    }, 15000)

    return () => {
      isMounted = false
      unsubStatus()
      unsubIntake()
      unsubCritical()
      unsubVerified()
      unsubReverify()
      clearInterval(fallbackInterval)
    }
  }, [])

  // Clinical Schedule Date Selector Handler
  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey)
    const newCases = getCasesForDate(dateKey)
    setPatientCases(newCases)
    if (newCases && newCases.length > 0) {
      const selected = newCases[0]
      setCurrentCaseIndex(0)
      setIntakePatientName(selected.name || 'Rajesh Verma')
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
  }

  // Sync state when switching demo cases
  const handleSelectCase = (index) => {
    const selected = patientCases[index] || PATIENT_CASES[0]
    setCurrentCaseIndex(index)
    setIntakePatientName(selected.name || 'Rajesh Verma')
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
        patientName: intakePatientName || patient?.name || 'Rajesh Verma',
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
      const updatedIdx = q.data.findIndex(p => p.id === patientId)
      if (updatedIdx !== -1) {
        setSelectedCaseIndex(updatedIdx)
      }
    } else {
      setPatientCases(prev => prev.map(p => p.id === patientId ? {
        ...p,
        doctorVerificationNotes: payload.doctorNotes,
        reviewStatus: payload.reviewStatus,
        prescriptions: payload.prescriptions,
        precautions: payload.precautions,
        followUpDate: payload.followUpDate,
        verifiedStatus: 'Physician Verified'
      } : p))
    }
  }

  return (
    <>
      {/* Smooth Fluid Medical Custom Cursor */}
      <CustomCursor />

      {/* Real-Time Emergency Critical Alert Banner (SINBAD >= 4) */}
      <CriticalAlertBanner
        alert={activeAlert}
        onReview={(patientId) => {
          const idx = patientCases.findIndex((p) => p.id === patientId)
          if (idx !== -1) handleSelectCase(idx)
          setActiveTab('command_center')
          setActiveAlert(null)
        }}
        onDismiss={() => setActiveAlert(null)}
      />

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
            className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0e120f] flex flex-col md:flex-row text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-300 relative"
          >
            {/* Ambient Lighting Glow Layers & Volumetric Light Rays */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
              <div className="ambient-light-ray opacity-70" />
              <div className="absolute -top-40 left-1/3 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-emerald-100/50 via-teal-50/30 to-transparent dark:from-[#aceba7]/12 dark:via-[#12464e]/20 rounded-full blur-[140px]" />
              <div className="absolute top-1/3 right-0 translate-x-1/4 w-[700px] h-[700px] bg-gradient-to-bl from-cyan-100/40 via-blue-50/20 to-transparent dark:from-[#aceba7]/10 dark:via-[#12464e]/15 rounded-full blur-[150px]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-slate-200/20 dark:bg-[#aceba7]/[0.03] rounded-full blur-[160px]" />
            </div>

            {/* 1. Left-Hand Clinical Sidebar */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentCaseIndex={currentCaseIndex}
              onSelectCase={handleSelectCase}
              cases={patientCases}
              loggedInDoctor={loggedInDoctor}
              isAnalyzing={isAnalyzing}
              onExitToLanding={() => setViewMode('landing')}
              onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
            />

            {/* 2. Main Workstation Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden z-10">
              {/* Sticky Header */}
              <Header
                patient={patient}
                loggedInDoctor={loggedInDoctor}
                onOpenAuthModal={() => setIsDoctorAuthModalOpen(true)}
                onReset={handleReset}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onOpenReferralModal={() => setIsReferralModalOpen(true)}
                onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
                onOpenFhirModal={() => setIsFhirModalOpen(true)}
                onOpenScribeModal={() => setIsScribeModalOpen(true)}
                onOpenFederatedModal={() => setIsFederatedModalOpen(true)}
                isAnalyzing={isAnalyzing}
                isLiveBackend={isLiveBackend}
                streamStatus={streamStatus}
              />

              {/* View Switcher based on Active Tab */}
              <main className="flex-1 min-w-0">
                {/* Screen 1: The Master Triage Queue */}
                {activeTab === 'queue' && (
                  <MasterTriageQueue
                    cases={patientCases}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                    streamStatus={streamStatus}
                    onSelectPatient={(id) => {
                      const idx = patientCases.findIndex((p) => p.id === id)
                      if (idx !== -1) {
                        handleSelectCase(idx)
                      } else {
                        const allWounds = Object.values(SCHEDULE_CASES_BY_DATE).flat()
                        const found = allWounds.find(p => p.id === id)
                        if (found) {
                          setPatientCases(prev => [found, ...prev.filter(p => p.id !== id)])
                          setCurrentCaseIndex(0)
                        }
                      }
                      setActiveTab('command_center')
                    }}
                    onNewAssessment={() => setActiveTab('assessment')}
                    onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
                  />
                )}

                {/* Screen 2, 3, 4: The Patient Command Center */}
                {activeTab === 'command_center' && (
                  <PatientCommandCenter
                    patient={patient}
                    onOpenReportModal={() => setIsReportModalOpen(true)}
                    onOpenReferralModal={() => setIsReferralModalOpen(true)}
                    onOpenFhirModal={() => setIsFhirModalOpen(true)}
                    onOpenScribeModal={() => setIsScribeModalOpen(true)}
                    onBackToQueue={() => setActiveTab('queue')}
                    onVerifyPatient={handleVerifyPatient}
                  />
                )}

                {activeTab === 'analytics' && <AnalyticsView cases={patientCases} />}

                {activeTab === 'registry' && (
                  <WoundRegistryView
                    cases={patientCases}
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                    onSelectPatientWound={(mrn) => {
                      const idx = patientCases.findIndex((p) => p.id === mrn)
                      if (idx !== -1) {
                        handleSelectCase(idx)
                      } else {
                        const allWounds = Object.values(SCHEDULE_CASES_BY_DATE).flat()
                        const found = allWounds.find(p => p.id === mrn)
                        if (found) {
                          setPatientCases(prev => [found, ...prev.filter(p => p.id !== mrn)])
                          setCurrentCaseIndex(0)
                        } else {
                          handleSelectCase(0)
                        }
                      }
                      setActiveTab('command_center')
                    }}
                    onNewAssessment={() => setActiveTab('assessment')}
                  />
                )}

                {activeTab === 'calibration' && <CalibrationView streamStatus={streamStatus} arucoScale={arucoScale} />}

                {activeTab === 'assessment' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-6 max-w-7xl mx-auto w-full"
                  >
                    {/* 2-Row Layout: Top (Image Intake Left + Physician Parameters Right) & Bottom (Full-Width AI Telemetry) */}
                    <div className="flex flex-col gap-6 w-full">
                      {/* Top Row: Clinical Image Intake (Left) & Physician Clinical Parameters (Right) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
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

                      {/* Bottom Row: Full-Width AI Diagnostic Telemetry & Risk Index */}
                      <div className="w-full">
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

            {/* Pillar 3: HL7 / FHIR Release 4 Document Bundle Modal */}
            <FhirExportModal
              isOpen={isFhirModalOpen}
              onClose={() => setIsFhirModalOpen(false)}
              patient={patient}
              sinbadScore={calculatedSinbadScore}
              woundArea={woundArea}
              infectionRisk={infectionRisk}
            />

            {/* Pillar 1-5: Enterprise Architecture & Cluster Telemetry Hub */}
            <ArchitectureHubModal
              isOpen={isArchitectureModalOpen}
              onClose={() => setIsArchitectureModalOpen(false)}
              onOpenFhirModal={() => setIsFhirModalOpen(true)}
              streamStatus={streamStatus}
              isLiveBackend={isLiveBackend}
              patientCases={patientCases}
            />

            {/* Phase 4: Cryptographic Security & Doctor Authentication Modal */}
            <DoctorAuthModal
              isOpen={isDoctorAuthModalOpen}
              onClose={() => setIsDoctorAuthModalOpen(false)}
              onLoginSuccess={(doctorProfile) => {
                if (doctorProfile) setLoggedInDoctor(doctorProfile)
                setIsDoctorAuthModalOpen(false)
              }}
            />

            {/* Phase 9: Autonomous Clinical RAG Agent & IWGDF Scribe Note Generator */}
            <ClinicalRAGScribeModal
              isOpen={isScribeModalOpen}
              onClose={() => setIsScribeModalOpen(false)}
              activePatient={patient}
              isLiveBackend={isLiveBackend}
            />

            {/* Phase 10: Federated Learning Consortium & Topology Hub */}
            <FederatedLearningModal
              isOpen={isFederatedModalOpen}
              onClose={() => setIsFederatedModalOpen(false)}
              isLiveBackend={isLiveBackend}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
