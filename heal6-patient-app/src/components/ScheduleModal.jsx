import React, { useState } from 'react'
import { Siren, X, User, FirstAid, Clock, VideoCamera, CalendarCheck, Check, CaretRight, ShieldCheck } from '@phosphor-icons/react'

export default function ScheduleModal({ isOpen, onClose, onConfirm, data }) {
  const [selectedSlot, setSelectedSlot] = useState('telehealth')
  const [selectedTime, setSelectedTime] = useState('8:15 PM')
  const [isBooking, setIsBooking] = useState(false)

  if (!isOpen) return null

  const availableSlots = [
    {
      id: 'telehealth',
      title: 'Urgent Video Consultation',
      provider: 'Dr. S. Sharma (Lead Podiatrist)',
      department: 'Diabetic Foot & Limb Salvage Unit',
      timeText: 'Available Today, 8:15 PM',
      type: 'Virtual HD Telehealth',
      icon: VideoCamera,
      badgeColor: 'bg-green-100 text-green-700 border-green-200',
      fastTrack: true
    },
    {
      id: 'debridement',
      title: 'Emergency Sharp Debridement',
      provider: 'Operating Theater 2 - Surgical Team',
      department: 'Ambulatory Wound Surgical Center',
      timeText: 'Today, 9:30 PM (Pre-Op Fasting Required)',
      type: 'In-Person Surgical',
      icon: FirstAid,
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
      fastTrack: data?.ulcerationRisk > 60
    },
    {
      id: 'offloading',
      title: 'Total Contact Casting (TCC) & Offloading',
      provider: 'Dr. M. Patel (Biomechanics Specialist)',
      department: 'Orthotic & Pressure Relief Center',
      timeText: 'Tomorrow, 9:00 AM',
      type: 'In-Person Specialist',
      icon: User,
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      fastTrack: false
    }
  ]

  const handleBookingSubmit = () => {
    setIsBooking(true)
    const slotDetails = availableSlots.find(s => s.id === selectedSlot) || availableSlots[0]

    setTimeout(() => {
      setIsBooking(false)
      if (onConfirm) {
        onConfirm({
          id: `APPT-${Math.floor(1000 + Math.random() * 9000)}`,
          title: slotDetails.title,
          provider: slotDetails.provider,
          timeText: selectedTime ? `Today, ${selectedTime}` : slotDetails.timeText,
          type: slotDetails.type,
          status: 'CONFIRMED'
        })
      }
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-heal6-coral/30 max-h-[90vh] flex flex-col">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#f43f5e] to-red-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Siren weight="bold" className="text-xl" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Fast-Track Emergency Scheduling</h3>
              <p className="text-xs text-rose-100">Directly connected to Hospital Triage Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold"
          >
            <X weight="bold" className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck weight="fill" className="text-[#f43f5e] text-xl shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900 leading-relaxed">
              Based on your calculated <strong>{data?.triageLabel || "URGENT"}</strong> status and <strong>{Number(data?.ulcerationRisk || 78).toFixed(1)}%</strong> infection risk, hospital triage has reserved priority intervention slots.
            </p>
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2.5">
              Select Care Intervention Slot:
            </label>

            <div className="space-y-2.5">
              {availableSlots.map((slot) => {
                const Icon = slot.icon
                const isSelected = selectedSlot === slot.id

                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 shadow-2xs ${
                      isSelected
                        ? 'border-[#0d9488] bg-teal-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0d9488] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon weight="fill" className="text-xl" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{slot.title}</h4>
                          {slot.fastTrack && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#f43f5e] text-white">
                              Priority
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">{slot.provider}</p>
                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{slot.department}</span>

                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${slot.badgeColor}`}>
                            <Clock weight="bold" className="text-xs" />
                            {slot.timeText}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                      isSelected ? 'border-[#0d9488] bg-[#0d9488] text-white' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check weight="bold" className="text-xs" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={handleBookingSubmit}
            disabled={isBooking}
            className="flex-1 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isBooking ? (
              <span className="animate-pulse">Confirming with Hospital...</span>
            ) : (
              <>
                <CalendarCheck weight="bold" className="text-base" />
                <span>Confirm Fast-Track Booking</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}