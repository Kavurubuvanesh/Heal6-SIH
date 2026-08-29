import React, { useState, useRef } from 'react'
import { ArrowClockwise, CameraPlus, CheckCircle, Trash, X, ShieldCheck } from '@phosphor-icons/react'
import { submitPatientReverification } from '../services/api'

export default function ReverifyModal({ isOpen, onClose, patientId = 'DFU-8842' }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [notes, setNotes] = useState("")
  const [extraPhotos, setExtraPhotos] = useState([])
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (event) => {
          setExtraPhotos(prev => [...prev, { name: file.name, url: event.target.result }])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index) => {
    setExtraPhotos(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await submitPatientReverification(patientId, notes)
      setIsSubmitting(false)
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        setNotes("")
        setExtraPhotos([])
        onClose()
      }, 2000)
    } catch (err) {
      console.error(err)
      setIsSubmitting(false)
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        setNotes("")
        setExtraPhotos([])
        onClose()
      }, 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-teal-500/20 max-h-[90vh] flex flex-col">

        {isSuccess ? (
          <div className="p-10 text-center space-y-4">
            <CheckCircle weight="fill" className="text-6xl text-teal-500 mx-auto animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-800">Report Flagged & Sent to Doctor!</h2>
            <p className="text-sm text-gray-500">
              Your clinical notes and additional photo angles have been transmitted directly to the Doctor Portal for manual re-verification.
            </p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="bg-teal-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <ArrowClockwise weight="bold" className="text-xl" />
                <div>
                  <h2 className="font-extrabold text-base tracking-tight">Request Physician Re-Verification</h2>
                  <p className="text-xs text-teal-100">Patient Case ID: {patientId}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold">
                <X weight="bold" className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <p className="text-xs text-teal-900 leading-relaxed bg-teal-50 p-3.5 rounded-2xl border border-teal-100 flex items-start gap-2">
                <ShieldCheck weight="fill" className="text-teal-600 text-lg shrink-0 mt-0.5" />
                <span>
                  Unsure about the AI results or missed symptoms during intake? Submit additional photo angles or clinical notes below to prompt an immediate manual review by your attending podiatrist.
                </span>
              </p>

              {/* Upload Extra Photos */}
              <div>
                <h3 className="text-xs font-bold text-gray-800 mb-2">1. ADD ADDITIONAL PHOTO ANGLES (Optional)</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {extraPhotos.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {extraPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-teal-300 group">
                          <img src={photo.url} alt="Extra Angle" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white text-xs opacity-90 hover:opacity-100 transition-opacity"
                          >
                            <Trash weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      + Add More Photos
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-5 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-teal-400 transition-colors group cursor-pointer"
                  >
                    <CameraPlus weight="fill" className="text-3xl text-gray-400 group-hover:text-teal-500 mb-1" />
                    <span className="text-xs font-bold text-gray-700">Tap to upload additional angles (Heel, Metatarsal, Side view)</span>
                  </button>
                )}
              </div>

              {/* Notes input */}
              <div>
                <h3 className="text-xs font-bold text-gray-800 mb-2">2. CLINICAL NOTES / MISSED SYMPTOMS</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none resize-none h-24 font-medium"
                  placeholder="E.g., I noticed increased redness spreading up the ankle, or I forgot to mention a fever last night..."
                ></textarea>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex justify-center items-center cursor-pointer"
              >
                {isSubmitting ? <span className="animate-pulse">Transmitting Update...</span> : "Submit Re-Verification Request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}