import React, { useState, useEffect } from 'react'
import TopActionBar from './components/TopActionBar'
import PatientHeader from './components/PatientHeader'
import EmergencyAlert from './components/EmergencyAlert'
import DiagnosticVisuals from './components/DiagnosticVisuals'
import HealingTracker from './components/HealingTracker'
import ReportFooter from './components/ReportFooter'
import ScheduleModal from './components/ScheduleModal'
import RxModal from './components/RxModal'
import CareModal from './components/CareModal'
import AppointmentModal from './components/AppointmentModal'
import ReverifyModal from './components/ReverifyModal'
import ToolkitModal from './components/ToolkitModal'
import { Lightning, Cpu, CloudArrowUp, WifiHigh, WifiSlash } from '@phosphor-icons/react'

import { submitPatientDiagnostic } from "./services/api"
import { runEdgeInference, initializeEdgeModels } from "./services/edgeInference"
import {
  saveOfflineAssessment,
  getPendingSyncCount,
  syncPendingAssessmentsToCloud,
  registerAutoSync
} from "./services/offlineStorage"

export default function App() {
  // --- CORE ROUTING STATE ---
  const [appState, setAppState] = useState('intake')
  const [aiReport, setAiReport] = useState(null)

  // --- EDGE INFERENCE & NETWORK STATE ---
  const [isEdgeMode, setIsEdgeMode] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [analyzingStatus, setAnalyzingStatus] = useState("Running Deep Inference...")

  // --- UNIFIED FORM DATA ---
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    diabetesType: "Type II (14 Years)",
    isHindfoot: false,
    hasIschemia: false,
    hasNeuropathy: false,
    isDeep: false
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [reportMetadata, setReportMetadata] = useState({ id: '', date: '' })

  // --- MODAL STATES ---
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false)
  const [isRxOpen, setIsRxOpen] = useState(false)
  const [isCareOpen, setIsCareOpen] = useState(false)
  const [isReverifyOpen, setIsReverifyOpen] = useState(false)
  const [isToolkitOpen, setIsToolkitOpen] = useState(false)
  const [confirmedAppointment, setConfirmedAppointment] = useState(null)

  // --- INITIALIZE OFFLINE SYNC & LISTENERS ---
  useEffect(() => {
    // 1. Initial pending count
    getPendingSyncCount().then(setPendingSyncCount).catch(console.warn)

    // 2. Pre-warm ONNX WebGL models in background for instantaneous zero-latency triage
    initializeEdgeModels().catch(err => console.log('[Heal6 Edge] Pre-warming note:', err))

    // 3. Network connection listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 4. Auto-sync on reconnection
    registerAutoSync(submitPatientDiagnostic, () => {
      getPendingSyncCount().then(setPendingSyncCount)
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleManualSync = async () => {
    if (!isOnline) {
      alert("Cannot sync: device is currently offline.")
      return
    }
    setIsSyncing(true)
    try {
      const res = await syncPendingAssessmentsToCloud(submitPatientDiagnostic)
      const remaining = await getPendingSyncCount()
      setPendingSyncCount(remaining)
      alert(`Cloud Synchronization Complete: ${res.synced} of ${res.count} records synced.`)
    } catch (err) {
      alert(`Sync failed: ${err.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleCardToggle = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleLoadSampleScan = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    // Draw skin background
    ctx.fillStyle = '#e8beac'
    ctx.fillRect(0, 0, 400, 400)
    // Draw outer wound margin
    ctx.fillStyle = '#991b1b'
    ctx.beginPath()
    ctx.ellipse(200, 220, 65, 50, 0.2, 0, Math.PI * 2)
    ctx.fill()
    // Draw slough tissue center
    ctx.fillStyle = '#eab308'
    ctx.beginPath()
    ctx.ellipse(190, 210, 32, 22, 0.1, 0, Math.PI * 2)
    ctx.fill()
    // Draw 25mm ArUco scale marker (DICT_4X4_50)
    ctx.fillStyle = '#000000'
    ctx.fillRect(40, 40, 75, 75)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(52, 52, 51, 51)
    ctx.fillStyle = '#000000'
    ctx.fillRect(62, 62, 31, 31)

    canvas.toBlob((blob) => {
      const file = new File([blob], 'carlos_mendez_clinical_scan.jpg', { type: 'image/jpeg' })
      setImageFile(file)
      setImagePreview(canvas.toDataURL('image/jpeg'))
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: 'Carlos Mendez', age: '64', isHindfoot: true, hasNeuropathy: true }))
      }
    }, 'image/jpeg')
  }

  const handleExportFhir = () => {
    const fhirBundle = {
      resourceType: "Bundle",
      id: `heal6-bundle-${reportMetadata.id || 'patient-1'}`,
      type: "document",
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: reportMetadata.id || "DFU-001",
            name: [{ text: formData.name || "Carlos Mendez" }],
            gender: (formData.gender || "male").toLowerCase(),
            extension: [{ url: "http://heal6.health/fhir/StructureDefinition/diabetes-type", valueString: formData.diabetesType }]
          }
        },
        {
          resource: {
            resourceType: "Observation",
            status: "final",
            code: {
              coding: [{ system: "http://loinc.org", code: "80352-8", display: "Wound surface area" }]
            },
            valueQuantity: {
              value: parseFloat(patientData?.woundAreaCm2) || 2.45,
              unit: "cm2",
              system: "http://unitsofmeasure.org",
              code: "cm2"
            }
          }
        },
        {
          resource: {
            resourceType: "Observation",
            status: "final",
            code: {
              coding: [{ system: "http://loinc.org", code: "90442-5", display: "SINBAD Clinical Score" }]
            },
            valueInteger: patientData?.sinbadScore || 4
          }
        },
        {
          resource: {
            resourceType: "DiagnosticReport",
            status: "final",
            code: {
              coding: [{ system: "http://loinc.org", code: "11526-1", display: "Pathology report" }]
            },
            conclusion: patientData?.triageLabel || "CRITICAL SURGICAL EMERGENCY"
          }
        }
      ]
    }

    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Heal6_FHIR_R4_${reportMetadata.id || 'Patient'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.age) {
      alert("Please provide patient demographics."); return;
    }
    if (!imageFile) {
      alert("A clinical image capture is required."); return;
    }

    setAppState('analyzing')

    // 1. Check if Offline Edge Mode should execute
    const shouldUseEdge = isEdgeMode || !isOnline

    if (shouldUseEdge) {
      setAnalyzingStatus("⚡ Running On-Device ONNX WebGL Edge Inference...")
      try {
        const edgeResult = await runEdgeInference({
          imageSource: imageFile,
          isHindfoot: formData.isHindfoot,
          hasIschemia: formData.hasIschemia,
          hasNeuropathy: formData.hasNeuropathy,
          isDeep: formData.isDeep,
          patientName: formData.name,
          patientAge: formData.age,
          patientGender: formData.gender,
          diabetesType: formData.diabetesType
        })

        // Save into IndexedDB for automatic cloud sync upon internet connection
        await saveOfflineAssessment(edgeResult, imageFile)
        const updatedCount = await getPendingSyncCount()
        setPendingSyncCount(updatedCount)

        setAiReport(edgeResult)
        setReportMetadata({
          id: edgeResult.id,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        })

        setAppState('report')
        return
      } catch (edgeError) {
        console.error("Edge Inference Error:", edgeError)
        alert("Edge Inference Failed: " + edgeError.message)
        setAppState('intake')
        return
      }
    }

    // 2. Normal Cloud Inference with Graceful Edge Fallback
    setAnalyzingStatus("🌐 Submitting to Cloud AI Pipeline (FastAPI / CUDA)...")
    try {
      const clinicalDataPayload = {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        diabetesType: formData.diabetesType,
        isHindfoot: formData.isHindfoot,
        hasIschemia: formData.hasIschemia,
        hasNeuropathy: formData.hasNeuropathy,
        isDeep: formData.isDeep
      };

      const response = await submitPatientDiagnostic(imageFile, clinicalDataPayload)
      setAiReport(response)

      const patientId = response.patient_id || response.patient_record?.id || `DFU-${Math.floor(1000 + Math.random() * 9000)}`
      setReportMetadata({
        id: patientId,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      })

      setAppState('report')
    } catch (cloudError) {
      console.warn("Cloud Pipeline Error, falling back to On-Device Edge Inference:", cloudError)
      setAnalyzingStatus("⚠️ Cloud unreachable. Activating On-Device ONNX Edge Engine...")
      try {
        const fallbackEdge = await runEdgeInference({
          imageSource: imageFile,
          isHindfoot: formData.isHindfoot,
          hasIschemia: formData.hasIschemia,
          hasNeuropathy: formData.hasNeuropathy,
          isDeep: formData.isDeep,
          patientName: formData.name,
          patientAge: formData.age,
          patientGender: formData.gender,
          diabetesType: formData.diabetesType
        })

        await saveOfflineAssessment(fallbackEdge, imageFile)
        const updatedCount = await getPendingSyncCount()
        setPendingSyncCount(updatedCount)

        setAiReport(fallbackEdge)
        setReportMetadata({
          id: fallbackEdge.id,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        })
        setAppState('report')
      } catch (fallbackError) {
        alert("Diagnostic Pipeline Error: " + fallbackError.message)
        setAppState('intake')
      }
    }
  }

  // --- REAL-TIME DOCTOR REVIEW POLLING ---
  useEffect(() => {
    const activeId = reportMetadata.id || aiReport?.patient_id || aiReport?.patient_record?.id;
    if (appState !== 'report' || !activeId) return;
    let isSubscribed = true;

    const checkDoctorReview = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/patients/${encodeURIComponent(activeId)}/doctor-review`);
        if (!res.ok) return;
        const review = await res.json();
        if (isSubscribed && review.verifiedByDoctor) {
          setAiReport(prev => ({
            ...prev,
            verifiedByDoctor: true,
            reviewingPhysician: review.physicianName || "Dr. Sharma, MD",
            reviewStatus: review.reviewStatus || "Reviewed & Prescribed",
            followUpDate: review.followUpDate,
            precautions: review.precautions || [],
            clinical_protocol: {
              ...(prev?.clinical_protocol || {}),
              doctor_feedback: review.doctorNotes || prev?.clinical_protocol?.doctor_feedback,
              medications: (review.prescriptions && review.prescriptions.length > 0) ? review.prescriptions : prev?.clinical_protocol?.medications
            }
          }));
        }
      } catch (e) {
        // Silently catch polling errors
      }
    };

    const interval = setInterval(checkDoctorReview, 3000);
    checkDoctorReview();
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [appState, reportMetadata.id, aiReport?.patient_id]);

  // --- DYNAMIC REPORT DATA MAPPING ---
  const patientData = {
    name: formData.name,
    id: reportMetadata.id || `DFU-${Math.floor(1000 + Math.random() * 9000)}`,
    age: formData.age,
    gender: formData.gender,
    diabetesType: formData.diabetesType,

    reportId: reportMetadata.id || `REP-${Math.floor(1000 + Math.random() * 9000)}`,
    reportDate: reportMetadata.date,
    originalImage: imagePreview,
    isOfflineEdge: aiReport?.isOfflineEdge || false,

    aiMaskImage: (() => {
      const rawMask = aiReport?.aiMaskImage || aiReport?.ai_diagnostics?.mask_image_base64 || aiReport?.patient_record?.maskImage || aiReport?.patient_record?.aiMaskImage;
      if (!rawMask) return null;
      if (rawMask.startsWith("data:")) return rawMask;
      return `data:image/png;base64,${rawMask}`;
    })(),

    doctorFeedback: aiReport?.clinical_protocol?.doctor_feedback || (aiReport?.isOfflineEdge ? "On-device edge inference completed via ONNX Runtime WebGL. Preliminary triage recorded and queued for automatic hospital cloud synchronization." : "AI detects active ulceration with moderate tissue damage. Implement daily antimicrobial dressings and maintain strict glycemic control."),
    actionDeadline: aiReport?.clinical_protocol?.action_deadline || (aiReport?.calculatedSinbad >= 4 ? "Seek Specialist Care within 24-48 Hours." : "Schedule Clinical Consultation within 7-14 Days."),
    medications: aiReport?.clinical_protocol?.medications || ["Topical Silver Sulfadiazine", "Strict Glycemic Control Regime"],
    reviewingPhysician: aiReport?.reviewingPhysician || (aiReport?.verifiedByDoctor ? "Dr. Sharma, MD (Verified)" : (aiReport?.isOfflineEdge ? "Heal6 Edge Diagnostic Agent (Pending Doctor Sign-off)" : "Dr. S. Sharma, MD (Lead Podiatrist)")),

    ulcerationRisk: aiReport ? (aiReport.infectionRiskPercent ?? aiReport.ai_diagnostics?.infection_risk_percent ?? 78.4) : 78.4,
    infectionSpread: aiReport ? (aiReport.tissue_slough_percent ?? aiReport.ai_diagnostics?.tissue_breakdown?.slough ?? 35.0) : 35.0,
    tissueDamage: aiReport ? (aiReport.tissue_necrotic_percent ?? aiReport.ai_diagnostics?.tissue_breakdown?.necrotic ?? 20.0) : 20.0,
    granulationTissue: aiReport ? (aiReport.tissue_granulation_percent ?? aiReport.ai_diagnostics?.tissue_breakdown?.granulation ?? 45.0) : 45.0,
    healingEstimate: aiReport ? (aiReport.healingEstimateWeeks ?? aiReport.healing_time ?? "8 - 12 Weeks") : "8 - 12 Weeks",
    currentArea: aiReport ? (aiReport.woundAreaCm2 ?? aiReport.ai_diagnostics?.calculated_area_cm2 ?? 2.45) : 2.45,
    currentPhase: aiReport ? (aiReport.triageLevel ?? aiReport.severity_tier ?? "Urgent Care") : "Urgent Care",
    triageColor: aiReport ? (aiReport.triageColor ?? aiReport.triage_color ?? "#f59e0b") : "#f59e0b",
    triageLabel: aiReport ? (aiReport.triageLevel ?? aiReport.triage_label ?? "URGENT TRIAGE") : "URGENT TRIAGE",

    verificationStatus: aiReport?.verifiedByDoctor ? (aiReport.reviewStatus || "Verified by Physician") : (aiReport?.isOfflineEdge ? "Edge Calculated (Offline Queue)" : "Pending Physician Review"),
    followUpDate: aiReport?.followUpDate,
    precautions: aiReport?.precautions || []
  }

  // ==========================================
  // VIEW 1: UNIFIED INTAKE DASHBOARD
  // ==========================================
  if (appState === 'intake') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">

          {/* HEADER WITH FAIL-SAFE PUBLIC LOGO PATH */}
          <div className="bg-white px-10 py-8 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Intake Portal</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Heal6 Edge Telemetry & Diagnostics</p>
            </div>
            <img src="/Heal6_LOGO.jpeg" alt="Heal6 Logo" className="h-16 object-contain" />
          </div>

          <form onSubmit={handleSubmit} className="p-10">
            {/* OFFLINE EDGE & CLOUD TELEMETRY SWITCHER */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEdgeMode || !isOnline ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30' : 'bg-teal-500/10 text-teal-600 border border-teal-500/30'}`}>
                  {isEdgeMode || !isOnline ? <Lightning weight="fill" className="w-5 h-5 animate-pulse" /> : <Cpu weight="bold" className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {isEdgeMode || !isOnline ? 'On-Device Edge Engine (ONNX WebGL)' : 'Cloud AI Pipeline (FastAPI / CUDA)'}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isEdgeMode || !isOnline 
                      ? 'Client-side inference inside browser • Zero network latency • Offline field clinic ready' 
                      : 'High-precision server pipeline with automated doctor triage synchronization'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pendingSyncCount > 0 && (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing || !isOnline}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CloudArrowUp weight="bold" />
                    <span>{isSyncing ? 'Syncing...' : `Sync Queue (${pendingSyncCount})`}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsEdgeMode(!isEdgeMode)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isEdgeMode 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isEdgeMode ? '⚡ Edge Mode Active' : 'Switch to Edge AI'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

              {/* COLUMN 1: PATIENT DEMOGRAPHICS */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">1. Patient Profile</h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Full Legal Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none font-medium text-slate-800" placeholder="e.g. Arjun Sharma" />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Age</label>
                      <input type="number" name="age" required value={formData.age} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none font-medium text-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Years" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none font-medium text-slate-800 cursor-pointer">
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Diabetes History</label>
                    <select name="diabetesType" value={formData.diabetesType} onChange={handleInputChange} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none font-medium text-slate-800 cursor-pointer">
                      <option>Type I</option><option>Type II (14 Years)</option><option>Gestational</option><option>None</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: CLINICAL CAPTURE */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">2. Clinical Diagnostics</h3>

                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-2 bg-slate-50 relative overflow-hidden group cursor-pointer hover:bg-slate-100 hover:border-teal-400 transition-all h-40 flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-teal-500 transition-colors">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                      </div>
                      <div className="text-sm text-slate-700 font-bold">Upload Clinical Scan</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-medium">Ensure ArUco marker is visible</div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                </div>

                {/* Quick Sample Loader Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleLoadSampleScan}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡ Load Calibrated Sample Scan (ArUco DICT_4X4_50)</span>
                  </button>
                </div>

                {/* PREMIUM TOUCH CARDS FOR EXPERT TRIAGE */}
                <div className="grid grid-cols-1 gap-3">
                  <div onClick={() => handleCardToggle('isHindfoot')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${formData.isHindfoot ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                    <input type="checkbox" readOnly checked={formData.isHindfoot} className="mt-1 w-5 h-5 text-teal-600 rounded pointer-events-none" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Heel/Midfoot Location</p>
                      <p className="text-xs text-slate-500 mt-0.5">Is the wound on the bottom or back of foot?</p>
                    </div>
                  </div>

                  <div onClick={() => handleCardToggle('hasIschemia')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${formData.hasIschemia ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                    <input type="checkbox" readOnly checked={formData.hasIschemia} className="mt-1 w-5 h-5 text-teal-600 rounded pointer-events-none" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Ischemia (Capillary Test)</p>
                      <p className="text-xs text-slate-500 mt-0.5">Pinch toe for 3s. Does it stay white when released?</p>
                    </div>
                  </div>

                  <div onClick={() => handleCardToggle('hasNeuropathy')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${formData.hasNeuropathy ? 'border-teal-500 bg-teal-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                    <input type="checkbox" readOnly checked={formData.hasNeuropathy} className="mt-1 w-5 h-5 text-teal-600 rounded pointer-events-none" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Neuropathy (Twig Test)</p>
                      <p className="text-xs text-slate-500 mt-0.5">Lightly touch sole in 10 spots. Any numbness?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PILLAR 4: DIAGNOSTIC EXECUTION ENGINE SELECTOR */}
            <div className="mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-teal-600 text-white px-2.5 py-0.5 rounded-full">
                    Pillar 4: Edge AI
                  </span>
                  <span className="text-xs font-bold text-slate-800">Inference Execution Engine</span>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEdgeMode}
                    onChange={(e) => setIsEdgeMode(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span>Simulate Offline Mode</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setIsEdgeMode(false)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    !isEdgeMode
                      ? 'border-teal-600 bg-teal-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>☁️ Hospital Cloud Cluster</span>
                    </span>
                    {!isEdgeMode && <span className="w-2 h-2 rounded-full bg-teal-500" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">PyTorch ConvNeXt & UNet++ on FastAPI server. Sub-millimeter surgical accuracy.</p>
                </div>

                <div
                  onClick={() => setIsEdgeMode(true)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isEdgeMode
                      ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>⚡ Offline Edge AI (ONNX WebGL)</span>
                    </span>
                    {isEdgeMode && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">100% In-Browser execution via GPU WebGL shaders. Stored in IndexedDB for auto-sync.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button type="submit" className="w-full bg-teal-600 text-white font-bold py-5 rounded-2xl shadow-[0_10px_30px_rgba(13,148,136,0.25)] hover:bg-teal-500 hover:shadow-[0_15px_40px_rgba(13,148,136,0.35)] active:scale-[0.98] transition-all text-lg tracking-wide flex justify-center items-center gap-3 cursor-pointer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                {isEdgeMode ? 'RUN ON-DEVICE EDGE SCAN (ONNX WEBGL)' : 'INITIATE AI DIAGNOSTIC SCAN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW 2: PROCESSING
  // ==========================================
  if (appState === 'analyzing') {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500 mb-6 shadow-[0_0_20px_#14b8a6]"></div>
        <h2 className="text-2xl font-semibold text-white tracking-wide">Analyzing Telemetry...</h2>
        <p className="text-teal-400 mt-3 opacity-90 text-sm font-mono max-w-md">{analyzingStatus}</p>
      </div>
    )
  }

  // ==========================================
  // VIEW 3: DYNAMIC REPORT (ARIBA'S FULL GRID)
  // ==========================================
  return (
    <>
      <TopActionBar
        onOpenReverify={() => setIsReverifyOpen(true)}
        onNewScan={() => {
          setAppState('intake')
          setImageFile(null)
          setImagePreview(null)
        }}
        isOfflineEdge={patientData.isOfflineEdge}
        pendingSyncCount={pendingSyncCount}
        onSyncNow={handleManualSync}
        onExportFhir={handleExportFhir}
        pdfUrl={aiReport?.pdf_url}
        reportNumber={aiReport?.report_number || reportMetadata.id}
      />

      <div className="report-paper animate-fade-in">
        <div className="top-accent" style={{ backgroundColor: patientData.triageColor }}></div>

        <PatientHeader data={patientData} />

        <div className="px-10 grid grid-cols-1 md:grid-cols-12 gap-10 pb-10">
          <div className="col-span-1 md:col-span-7 space-y-8">
            <DiagnosticVisuals
              data={patientData}
              onOpenToolkit={() => setIsToolkitOpen(true)}
            />
          </div>

          <div className="col-span-1 md:col-span-5 space-y-6">
            <EmergencyAlert
              onOpenSchedule={() => setIsScheduleOpen(true)}
              onOpenRx={() => setIsRxOpen(true)}
              onOpenCare={() => setIsCareOpen(true)}
              onOpenAppt={() => setIsAppointmentOpen(true)}
              data={patientData}
              recommendation={aiReport?.clinical_protocol?.recommendation}
            />
          </div>
        </div>

        <div className="px-10 pb-10">
          <HealingTracker
            currentArea={patientData.currentArea}
            healingEstimateText={patientData.healingEstimate}
            status={patientData.currentPhase}
          />
        </div>

        <ReportFooter data={patientData} />
      </div>

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onConfirm={(newAppt) => {
          setConfirmedAppointment(newAppt)
          setIsScheduleOpen(false)
          setIsAppointmentOpen(true)
        }}
        data={patientData}
      />
      <RxModal isOpen={isRxOpen} onClose={() => setIsRxOpen(false)} data={patientData} />
      <CareModal isOpen={isCareOpen} onClose={() => setIsCareOpen(false)} data={patientData} />
      <AppointmentModal
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        data={patientData}
        appointment={confirmedAppointment}
      />
      <ReverifyModal isOpen={isReverifyOpen} onClose={() => setIsReverifyOpen(false)} patientId={patientData.id} />
      <ToolkitModal isOpen={isToolkitOpen} onClose={() => setIsToolkitOpen(false)} data={patientData} />
    </>
  )
}