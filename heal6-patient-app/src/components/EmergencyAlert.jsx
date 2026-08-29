import React from 'react'
import {
  WarningCircle, CalendarPlus, Stethoscope, CheckCircle, Hospital,
  Circle, ShieldCheck, Check, Pill, VideoCamera, CalendarCheck, CaretRight
} from '@phosphor-icons/react'

export default function EmergencyAlert({ onOpenSchedule, onOpenRx, onOpenCare, onOpenAppt, data, recommendation }) {
  // Determine if we are in a pending state based on the backend flag
  const isPending = data?.verificationStatus === "Pending Physician Review";

  return (
    <div className="space-y-6">

      {/* 1. DYNAMIC: Risk Alert Badge */}
      <div
        className="bg-white border-2 rounded-xl p-5 text-center relative overflow-hidden group transition-colors duration-500"
        style={{ borderColor: data?.triageColor, boxShadow: `0 4px 20px ${data?.triageColor}25` }}
      >
        <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full transition-transform group-hover:scale-110" style={{ backgroundColor: `${data?.triageColor}15` }}></div>

        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 animate-pulse-ring"
          style={{ backgroundColor: `${data?.triageColor}20`, color: data?.triageColor }}
        >
          <WarningCircle weight="fill" className="text-2xl" />
        </div>

        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Emergency Level</h2>
        <div className="text-3xl font-extrabold tracking-tight" style={{ color: data?.triageColor }}>
          {data?.triageLabel || "ANALYZING..."}
        </div>
        <p className="text-xs text-gray-600 mt-2 mb-4">{recommendation}</p>

        <button
          onClick={onOpenSchedule}
          className="w-full relative z-10 py-2.5 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm hover:opacity-90"
          style={{ backgroundColor: data?.triageColor }}
        >
          <CalendarPlus weight="bold" className="text-lg" /> View Emergency Slots
        </button>
      </div>

      {/* 2. DYNAMIC: Doctor's Direct Feedback Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">

        {/* Status Header & Progress Tracker */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Stethoscope weight="fill" className="text-heal6-dark text-xl" />
              <h2 className="font-bold text-gray-900">Physician Review Status</h2>
            </div>
            {/* Dynamic Verification Badge */}
            <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${isPending ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
              {isPending ? <Circle weight="fill" className="mr-1 text-sm animate-pulse" /> : <CheckCircle weight="bold" className="mr-1 text-sm" />}
              {data?.verificationStatus}
            </span>
          </div>

          {/* Dynamic Progress Timeline */}
          <div className="flex items-center text-xs font-medium text-gray-400">
            <span className="flex items-center text-heal6-teal"><CheckCircle weight="fill" className="mr-1" /> AI Scanned</span>
            <div className="flex-1 border-t border-gray-300 mx-2 border-dashed"></div>
            <span className={`flex items-center ${!isPending ? 'text-heal6-teal' : 'text-gray-400'}`}>
              {isPending ? <Circle weight="bold" className="mr-1" /> : <CheckCircle weight="fill" className="mr-1" />} Doctor Reviewed
            </span>
            <div className="flex-1 border-t border-gray-300 mx-2 border-dashed"></div>
            <span className="flex items-center text-gray-400"><Circle weight="bold" className="mr-1" /> Pending Consult</span>
          </div>
        </div>

        <div className="p-5 flex-grow space-y-5">

          {/* DYNAMIC: AI Verification Status */}
          <div className="bg-teal-50 border border-teal-100 p-3 rounded-lg flex items-start gap-3">
            <ShieldCheck weight="fill" className="text-heal6-teal text-xl mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">AI Assessment Status</h3>
              <p className="text-sm text-teal-800 mt-1">
                {isPending
                  ? `The AI has securely routed this ${data?.triageLabel} report to the central hospital registry. Waiting for physician sign-off.`
                  : `Dr. Sharma has manually reviewed your scans and agrees with the AI's ${data?.ulcerationRisk}% ulceration risk calculation.`}
              </p>
            </div>
          </div>

          {/* DYNAMIC: Raw Feedback from API */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Doctor's Raw Feedback</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 italic" style={{ borderColor: data?.triageColor }}>
              "{data?.doctorFeedback}"
            </p>
          </div>

          {/* DYNAMIC: Action Required Timeline */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Action Required</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: `${data?.triageColor}10`, borderColor: `${data?.triageColor}30` }}>
              <Hospital weight="fill" className="text-xl" style={{ color: data?.triageColor }} />
              <div>
                <p className="text-sm font-bold text-gray-900">Clinical Directive Issued</p>
                <p className="text-xs font-medium" style={{ color: data?.triageColor }}>{data?.actionDeadline}</p>
              </div>
            </div>
          </div>

          {/* Preliminary Orders Menu */}
          <div className="border border-blue-100 bg-blue-50 p-4 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-blue-100 rounded-bl-full opacity-50"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Preliminary Orders Ready</h3>
              <span className="inline-flex items-center text-[10px] font-bold text-green-800 bg-green-200 px-2 py-1 rounded-md animate-pulse">
                <Check weight="bold" className="mr-1 text-sm" /> Available to View
              </span>
            </div>
            <p className="text-[13px] text-blue-800 leading-relaxed mb-3 relative z-10">
              Dr. Sharma has drafted your preliminary treatment plan based on this report. Please review the items below before your consultation.
            </p>

            <div className="space-y-2 relative z-10">
              <button onClick={onOpenRx} className="w-full text-left bg-white border border-blue-200 hover:border-blue-400 p-2.5 rounded-lg flex items-center justify-between transition-all group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Pill weight="fill" className="text-lg" /></div>
                  <span className="text-sm font-bold text-gray-800">Antibiotic & Pain Medication</span>
                </div>
                <CaretRight weight="bold" className="text-gray-400 group-hover:text-blue-600" />
              </button>

              <button onClick={onOpenCare} className="w-full text-left bg-white border border-blue-200 hover:border-blue-400 p-2.5 rounded-lg flex items-center justify-between transition-all group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><VideoCamera weight="fill" className="text-lg" /></div>
                  <span className="text-sm font-bold text-gray-800">Home Care & Ischemia Check</span>
                </div>
                <CaretRight weight="bold" className="text-gray-400 group-hover:text-blue-600" />
              </button>

              <button onClick={onOpenAppt} className="w-full text-left bg-white border border-blue-200 hover:border-blue-400 p-2.5 rounded-lg flex items-center justify-between transition-all group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><CalendarCheck weight="fill" className="text-lg" /></div>
                  <span className="text-sm font-bold text-gray-800">Manage Upcoming Visits</span>
                </div>
                <CaretRight weight="bold" className="text-gray-400 group-hover:text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Call Option & Availability Action */}
        <div className="p-5 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-gray-500 font-medium">Doctor Availability:</span>
            <span className="text-green-600 font-bold flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Available Now
            </span>
          </div>
          <button onClick={onOpenSchedule} className="w-full py-3 bg-heal6-dark hover:bg-heal6-teal text-white rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2">
            <VideoCamera weight="fill" className="text-lg" /> Schedule Consultation
          </button>
        </div>
      </div>
    </div>
  )
}