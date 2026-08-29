import React, { useState } from 'react'
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

import { submitPatientDiagnostic } from "./services/api"

export default function App() {
  // --- CORE ROUTING STATE ---
  const [appState, setAppState] = useState('intake')
  const [aiReport, setAiReport] = useState(null)

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

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Toggles the clinical cards for a premium tablet/mobile feel
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.age) {
      alert("Please provide patient demographics."); return;
    }
    if (!imageFile) {
      alert("A clinical image capture is required."); return;
    }

    setAppState('analyzing')

    try {
      // POST to FastAPI Backend with full demographics + clinical indicators
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
    } catch (error) {
      alert("Pipeline Error: " + error.message)
      setAppState('intake')
    }
  }

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

    aiMaskImage: (() => {
      const rawMask = aiReport?.ai_diagnostics?.mask_image_base64 || aiReport?.patient_record?.maskImage || aiReport?.patient_record?.aiMaskImage;
      if (!rawMask) return null;
      if (rawMask.startsWith("data:")) return rawMask;
      return `data:image/png;base64,${rawMask}`;
    })(),

    doctorFeedback: aiReport?.clinical_protocol?.doctor_feedback || "AI detects active ulceration with moderate tissue damage. Implement daily antimicrobial dressings and maintain strict glycemic control.",
    actionDeadline: aiReport?.clinical_protocol?.action_deadline || "Schedule Clinical Consultation within 7 Days.",
    medications: aiReport?.clinical_protocol?.medications || ["Topical Silver Sulfadiazine", "Strict Glycemic Control Regime"],
    reviewingPhysician: "Dr. S. Sharma, MD (Lead Podiatrist)",

    ulcerationRisk: aiReport ? aiReport.ai_diagnostics.infection_risk_percent : 78.4,
    infectionSpread: aiReport ? aiReport.ai_diagnostics.tissue_breakdown.slough : 35.0,
    tissueDamage: aiReport ? aiReport.ai_diagnostics.tissue_breakdown.necrotic : 20.0,
    granulationTissue: aiReport ? aiReport.ai_diagnostics.tissue_breakdown.granulation : 45.0,
    healingEstimate: aiReport ? aiReport.healing_time : "8 - 12 Weeks",
    currentArea: aiReport ? aiReport.ai_diagnostics.calculated_area_cm2 : 2.45,
    currentPhase: aiReport ? aiReport.severity_tier : "Urgent Care",
    triageColor: aiReport ? aiReport.triage_color : "#f59e0b",
    triageLabel: aiReport ? aiReport.triage_label : "URGENT TRIAGE",

    verificationStatus: "Pending Physician Review"
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

            <div className="mt-10 pt-8 border-t border-slate-100">
              <button type="submit" className="w-full bg-teal-600 text-white font-bold py-5 rounded-2xl shadow-[0_10px_30px_rgba(13,148,136,0.25)] hover:bg-teal-500 hover:shadow-[0_15px_40px_rgba(13,148,136,0.35)] active:scale-[0.98] transition-all text-lg tracking-wide flex justify-center items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                INITIATE AI DIAGNOSTIC SCAN
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
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500 mb-6 shadow-[0_0_20px_#14b8a6]"></div>
        <h2 className="text-2xl font-semibold text-white tracking-wide">Analyzing Telemetry...</h2>
        <p className="text-teal-400 mt-3 opacity-80 text-sm">Running ConvNeXt & UNet++ Multiclass Inference</p>
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