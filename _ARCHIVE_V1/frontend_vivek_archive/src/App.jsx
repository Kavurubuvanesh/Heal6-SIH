import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ImageUploaderCard from './components/ImageUploaderCard'
import ClinicalFormCard from './components/ClinicalFormCard'
import AiResultsColumn from './components/AiResultsColumn'
import ReportModal from './components/ReportModal'
import ReferralModal from './components/ReferralModal'
import PatientQueueView from './components/PatientQueueView'
import AnalyticsView from './components/AnalyticsView'
import CalibrationView from './components/CalibrationView'
import { PATIENT_CASES } from './data/clinicalCases'

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState('assessment') // 'assessment' | 'queue' | 'analytics' | 'registry' | 'calibration'

  // Selected Patient Case
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0)
  const patient = PATIENT_CASES[currentCaseIndex]

  // Clinical Form Doctor Inputs (Initialised to current case)
  const [siteHindfoot, setSiteHindfoot] = useState(patient.siteScore === 1)
  const [ischemia, setIschemia] = useState(patient.ischemiaScore === 1)
  const [neuropathy, setNeuropathy] = useState(patient.neuropathyScore === 1)
  const [depthDeep, setDepthDeep] = useState(patient.depthScore === 1)

  // Image & AI State
  const [imageSrc, setImageSrc] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(true)

  // AI Telemetry Outputs
  const [woundArea, setWoundArea] = useState(patient.woundAreaCm2)
  const [arucoScale, setArucoScale] = useState(patient.arucoCalibration)
  const [infectionRisk, setInfectionRisk] = useState(patient.infectionRiskPercent)
  const [convnextConfidence, setConvnextConfidence] = useState(patient.convnextConfidence)
  const [tissueBreakdown, setTissueBreakdown] = useState(patient.tissueBreakdown)
  const [healingTime, setHealingTime] = useState(patient.healingEstimateWeeks)
  const [triageLabel, setTriageLabel] = useState(patient.triageLevel)
  const [triageColor, setTriageColor] = useState(patient.triageColor)

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false)

  // Sync state when switching demo cases
  const handleSelectCase = (index) => {
    const selected = PATIENT_CASES[index]
    setCurrentCaseIndex(index)
    setSiteHindfoot(selected.siteScore === 1)
    setIschemia(selected.ischemiaScore === 1)
    setNeuropathy(selected.neuropathyScore === 1)
    setDepthDeep(selected.depthScore === 1)
    setWoundArea(selected.woundAreaCm2)
    setArucoScale(selected.arucoCalibration)
    setInfectionRisk(selected.infectionRiskPercent)
    setConvnextConfidence(selected.convnextConfidence)
    setTissueBreakdown(selected.tissueBreakdown)
    setHealingTime(selected.healingEstimateWeeks)
    setTriageLabel(selected.triageLevel)
    setTriageColor(selected.triageColor)
    setActiveTab('assessment')
  }

  // Calculate dynamic SINBAD score (Total 0 to 6 points)
  const calculatedSinbadScore =
    (siteHindfoot ? 1 : 0) +
    (ischemia ? 1 : 0) +
    (neuropathy ? 1 : 0) +
    (depthDeep ? 1 : 0) +
    (infectionRisk > 50 ? 1 : 0) +
    (woundArea >= 1.0 ? 1 : 0)

  // Trigger AI analysis with REAL FastAPI backend connection
  const handleRunAnalysis = async () => {
    if (!imageSrc) {
      alert("Please upload or capture a foot image first.");
      return;
    }

    setIsAnalyzing(true)
    setAnalysisStep('1/4: Homography & ArUco Fiducial Matrix...')

    try {
      // 1. Convert the imageSrc (Base64) from the uploader into a File Blob
      const response = await fetch(imageSrc);
      const imageBlob = await response.blob();

      // 2. Build the exact FormData payload our Python engine expects
      const formData = new FormData();
      formData.append("file", imageBlob, "patient_scan.jpg");
      formData.append("is_deep", depthDeep);
      formData.append("has_ischemia", ischemia);
      formData.append("has_neuropathy", neuropathy);
      formData.append("is_hindfoot", siteHindfoot);

      setAnalysisStep('2/4: ConvNeXt-V2 Infection Segmentation...')

      // 3. Hit the local Uvicorn Server
      const apiRes = await fetch("http://127.0.0.1:8000/api/v1/sinbad/analyze-wound", {
        method: "POST",
        body: formData
      });

      if (!apiRes.ok) throw new Error("FastAPI Connection Failed");

      setAnalysisStep('3/4: DeepLabV3+ Wound Boundary Contouring...')
      const data = await apiRes.json();

      setAnalysisStep('4/4: Computing Composite SINBAD Index...')

      // 4. Inject the real Python AI data directly into Vivek's React state
      setWoundArea(data.ai_diagnostics.calculated_area_cm2);

      const infectionStatus = data.ai_diagnostics.task1_classification;
      if (infectionStatus.includes("Severe")) setInfectionRisk(88);
      else if (infectionStatus.includes("Mild")) setInfectionRisk(45);
      else setInfectionRisk(12);

      setTriageLabel(data.severity_tier.toUpperCase());

      if (data.sinbad_score >= 4) {
        setHealingTime('20 - 28 Weeks');
        setTriageColor('bg-[#fff1f1] text-[#FA7373] border-[#FA7373]/30');
      } else if (data.sinbad_score >= 2) {
        setHealingTime('8 - 12 Weeks');
        setTriageColor('bg-amber-50 text-amber-700 border-amber-300');
      } else {
        setHealingTime('3 - 4 Weeks');
        setTriageColor('bg-emerald-50 text-emerald-700 border-emerald-300');
      }

    } catch (error) {
      console.error(error);
      alert("AI Engine offline. Ensure 'python -m uvicorn app.main:app' is running on port 8000.");
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
      setHasAnalyzed(true)
    }
  }

  // Reset form to baseline
  const handleReset = () => {
    handleSelectCase(0)
  }

  // Framer Motion Animation Variants for Staggered Fade-in
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 18
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* 1. Left-Hand Clinical Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentCaseIndex={currentCaseIndex}
        onSelectCase={handleSelectCase}
        cases={PATIENT_CASES}
        isAnalyzing={isAnalyzing}
      />

      {/* 2. Main Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Header */}
        <Header
          patient={patient}
          onReset={handleReset}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenReferralModal={() => setIsReferralModalOpen(true)}
          isAnalyzing={isAnalyzing}
        />

        {/* View Switcher based on Active Tab */}
        <main className="flex-1">
          {activeTab === 'queue' && (
            <PatientQueueView
              onSelectPatient={(id) => {
                const idx = PATIENT_CASES.findIndex((p) => p.id === id)
                if (idx !== -1) handleSelectCase(idx)
              }}
              onNewAssessment={() => setActiveTab('assessment')}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'registry' && <AnalyticsView />}

          {activeTab === 'calibration' && <CalibrationView />}

          {activeTab === 'assessment' && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="p-6 max-w-7xl mx-auto w-full"
            >
              {/* Responsive 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Column 1: Clinical Intake (Left Side - 5 Columns) */}
                <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-6">
                  {/* Image Uploader Card with Live ArUco CV Bounding Box */}
                  <ImageUploaderCard
                    imageSrc={imageSrc}
                    setImageSrc={setImageSrc}
                    isAnalyzing={isAnalyzing}
                    arucoDetected={true}
                    arucoScale={arucoScale}
                    woundArea={woundArea}
                  />

                  {/* Clinical Form Card (4 Modern Toggles + Run SINBAD Analysis Button) */}
                  <ClinicalFormCard
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
                </motion.div>

                {/* Column 2: AI Diagnostic Results & "Wow Factors" (Right Side - 7 Columns) */}
                <motion.div variants={itemVariants} className="lg:col-span-7">
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
                </motion.div>
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
    </div>
  )
}
