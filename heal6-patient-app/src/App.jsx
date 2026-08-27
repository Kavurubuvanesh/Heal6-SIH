import React, { useState } from 'react'
import PatientHeader from './components/PatientHeader'
import EmergencyAlert from './components/EmergencyAlert'
import DiagnosticVisuals from './components/DiagnosticVisuals'
import HealingTracker from './components/HealingTracker'

export default function App() {
  // Modal States
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isRxOpen, setIsRxOpen] = useState(false)
  const [isCareOpen, setIsCareOpen] = useState(false)
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false)
  const [isReverifyOpen, setIsReverifyOpen] = useState(false)

  // Dummy data (We will connect this to FastAPI later)
  const patientData = {
    name: "Arjun Sharma",
    id: "PT-84729",
    age: 58,
    gender: "Male",
    diabetesType: "Type II (14 Years)",
    ulcerationRisk: 94,
    infectionSpread: 82,
    tissueDamage: 45,
    healingEstimate: "6 - 8 Weeks",
    currentArea: 2.0
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      {/* Top Action Bar */}
      <div className="bg-white px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-heal6-teal"></span>
          Secure Patient Portal
        </div>
        <button
          onClick={() => setIsReverifyOpen(true)}
          className="text-xs bg-heal6-teal text-white px-3 py-1.5 rounded-lg font-bold shadow-sm"
        >
          Update Report
        </button>
      </div>

      <div className="max-w-md mx-auto space-y-6 px-4 pt-6">
        <PatientHeader data={patientData} />

        {/* Mobile-First: Put the Emergency Alert at the very top! */}
        <EmergencyAlert
          onOpenSchedule={() => setIsScheduleOpen(true)}
          onOpenRx={() => setIsRxOpen(true)}
          onOpenCare={() => setIsCareOpen(true)}
          onOpenAppt={() => setIsAppointmentOpen(true)}
        />

        <DiagnosticVisuals data={patientData} />

        <HealingTracker currentArea={patientData.currentArea} />
      </div>

      {/* Modals will go here later */}
    </div>
  )
}