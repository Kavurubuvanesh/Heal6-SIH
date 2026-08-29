import React, { useState } from 'react'
import {
  CalendarCheck,
  X,
  Clock,
  XCircle,
  ArrowRight,
  VideoCamera,
  DownloadSimple,
  CheckCircle,
  CalendarPlus,
  Microphone,
  Camera
} from '@phosphor-icons/react'

export default function AppointmentModal({ isOpen, onClose, data, appointment, onUpdateAppointment }) {
  const [currentAppt, setCurrentAppt] = useState(appointment || {
    id: 'APPT-4921',
    title: 'Dr. S. Sharma - Emergency Consult',
    provider: 'Dr. S. Sharma, MD (Lead Podiatrist)',
    timeText: 'Today, 8:15 PM',
    status: 'CONFIRMED',
    type: 'Telehealth Video Room'
  })

  const [isCancelled, setIsCancelled] = useState(false)
  const [inVideoRoom, setInVideoRoom] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [successToast, setSuccessToast] = useState('')

  if (!isOpen) return null

  const handleCancel = () => {
    setIsCancelled(true)
    setCurrentAppt(prev => ({ ...prev, status: 'CANCELLED' }))
    setSuccessToast('Appointment cancelled successfully.')
    setTimeout(() => setSuccessToast(''), 3000)
  }

  const handleReschedule = (newTime, newDoctor) => {
    setIsCancelled(false)
    setCurrentAppt({
      id: `APPT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `${newDoctor} - Clinical Review`,
      provider: newDoctor,
      timeText: newTime,
      status: 'CONFIRMED',
      type: 'In-Person Specialist Consult'
    })
    setSuccessToast(`Rescheduled to ${newTime}!`)
    setTimeout(() => setSuccessToast(''), 3000)
  }

  const downloadIcsCalendar = () => {
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Heal6 Health//Diabetic Foot Care Consultation//EN',
      'BEGIN:VEVENT',
      `UID:${currentAppt.id}@heal6.health`,
      `SUMMARY:Heal6 Clinical Consult: ${currentAppt.title}`,
      `DESCRIPTION:Diabetic Foot Ulcer triage consultation with ${currentAppt.provider}. Patient: ${data?.name || "Patient"}.`,
      'LOCATION:Heal6 Telehealth Virtual Room / Hospital Podiatry Clinic',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `Heal6_Appointment_${currentAppt.id}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setSuccessToast('Calendar invite (.ics) downloaded!')
    setTimeout(() => setSuccessToast(''), 3000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-teal-500/20 max-h-[90vh] flex flex-col">

        {/* Modal Header */}
        <div className="bg-[#0F594E] px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <CalendarCheck weight="bold" className="text-2xl" />
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Active Appointment Manager</h3>
              <p className="text-xs text-teal-200">Ref ID: {currentAppt.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold">
            <X weight="bold" className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 border border-emerald-300 animate-in fade-in">
              <CheckCircle weight="fill" className="text-lg text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Telehealth Video Room Interface if user launched call */}
          {inVideoRoom ? (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-xs font-extrabold text-teal-300">LIVE TELEHEALTH ROOM</span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400">Encrypted HIPAA Room</span>
              </div>

              <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-slate-800">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center mx-auto animate-pulse">
                    <VideoCamera weight="fill" className="text-2xl" />
                  </div>
                  <p className="text-xs font-bold text-slate-200">Connecting to {currentAppt.provider}...</p>
                  <p className="text-[11px] text-slate-500">Your camera and mic are active. Please wait in the virtual room.</p>
                </div>

                <div className="absolute bottom-3 flex items-center gap-3">
                  <button
                    onClick={() => setMicMuted(!micMuted)}
                    className={`p-2 rounded-full text-xs font-bold transition-colors ${micMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    <Microphone weight="bold" className="text-base" />
                  </button>
                  <button
                    onClick={() => setCameraOff(!cameraOff)}
                    className={`p-2 rounded-full text-xs font-bold transition-colors ${cameraOff ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    <Camera weight="bold" className="text-base" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setInVideoRoom(false)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Leave Virtual Consultation
              </button>
            </div>
          ) : (
            /* Current Booking Card */
            <div>
              <h4 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Confirmed Care Appointment
              </h4>
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                isCancelled
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-teal-50/70 border-teal-200/80 text-teal-950'
              }`}>
                <div>
                  <p className="font-extrabold text-sm text-slate-900">{currentAppt.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{currentAppt.provider}</p>
                  <p className="text-xs font-bold mt-1.5 flex items-center gap-1.5 text-teal-700">
                    <Clock weight="bold" className="text-sm" />
                    <span>{currentAppt.timeText}</span>
                  </p>
                </div>
                <div className="flex sm:flex-col items-end justify-between gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    isCancelled ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {isCancelled ? 'CANCELLED' : 'CONFIRMED'}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Confirmed Booking */}
              {!isCancelled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setInVideoRoom(true)}
                    className="py-2.5 px-3 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <VideoCamera weight="bold" className="text-base" />
                    <span>Join Video Room</span>
                  </button>

                  <button
                    onClick={downloadIcsCalendar}
                    className="py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CalendarPlus weight="bold" className="text-base text-teal-600" />
                    <span>Add to Calendar (.ics)</span>
                  </button>
                </div>
              )}

              {!isCancelled && (
                <button
                  onClick={handleCancel}
                  className="w-full mt-2 py-2 text-xs text-rose-600 font-bold hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle weight="bold" className="text-base" />
                  <span>Cancel This Appointment</span>
                </button>
              )}
            </div>
          )}

          {/* Rebooking & Reschedule Options */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
              Reschedule to Alternative Availability:
            </h4>
            <div className="space-y-2.5">
              <button
                onClick={() => handleReschedule('Tomorrow, 9:00 AM', 'Dr. M. Patel (Wound Care Spec.)')}
                className="w-full bg-white border border-slate-200 hover:border-[#0d9488] hover:bg-teal-50/40 p-3 rounded-2xl flex items-center justify-between transition-all group cursor-pointer text-left shadow-2xs"
              >
                <div>
                  <p className="font-extrabold text-slate-900 text-xs group-hover:text-[#0d9488] transition-colors">
                    Tomorrow, 9:00 AM
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dr. M. Patel • Ambulatory Clinic</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-[#0d9488]">
                  <span>Reschedule</span>
                  <ArrowRight weight="bold" className="text-sm" />
                </div>
              </button>

              <button
                onClick={() => handleReschedule('Tomorrow, 11:30 AM', 'Dr. S. Sharma (Lead Podiatrist)')}
                className="w-full bg-white border border-slate-200 hover:border-[#0d9488] hover:bg-teal-50/40 p-3 rounded-2xl flex items-center justify-between transition-all group cursor-pointer text-left shadow-2xs"
              >
                <div>
                  <p className="font-extrabold text-slate-900 text-xs group-hover:text-[#0d9488] transition-colors">
                    Tomorrow, 11:30 AM
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dr. S. Sharma • Virtual / In-Person</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-[#0d9488]">
                  <span>Reschedule</span>
                  <ArrowRight weight="bold" className="text-sm" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}