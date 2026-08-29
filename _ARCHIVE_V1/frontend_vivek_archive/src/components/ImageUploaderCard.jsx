import React, { useState, useRef } from 'react'
import { Camera, Scan, UploadCloud } from 'lucide-react'

export default function ImageUploaderCard({ imageSrc, setImageSrc, isAnalyzing, arucoScale = 42, woundArea = 2.45 }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files[0]) {
      const reader = new FileReader(); reader.onload = (ev) => setImageSrc(ev.target.result); reader.readAsDataURL(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Optical Intake Feed</h3>
            <p className="text-xs text-white/50">Awaiting fiducial homography sync</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff]">
          <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse shadow-[0_0_5px_#00e5ff]" />
          CV ACTIVE
        </span>
      </div>

      <div
        onDragOver={(e) => {e.preventDefault(); setIsDragging(true)}}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden p-4 min-h-[290px] flex flex-col items-center justify-center text-center ${
          isDragging ? 'border-[#00e5ff] bg-[#00e5ff]/10' : 'border-[#00e5ff]/30 bg-black/40 hover:border-[#00e5ff]'
        }`}
      >
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          if (e.target.files[0]) {
            const reader = new FileReader(); reader.onload = (ev) => setImageSrc(ev.target.result); reader.readAsDataURL(e.target.files[0])
          }
        }} />

        <div className="w-full relative rounded-xl overflow-hidden bg-black/80 border border-white/10 shadow-inner flex items-center justify-center min-h-[220px]">
          {imageSrc ? (
            <img src={imageSrc} alt="Scan" className="w-full h-full object-contain opacity-80" />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-50">
               <Scan className="w-10 h-10 text-[#00e5ff]" />
               <span className="text-xs font-mono text-[#00e5ff]">AWAITING IMAGE DATA</span>
            </div>
          )}

          {(isAnalyzing) && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent animate-laser shadow-[0_0_15px_#00e5ff]" />
          )}

          {imageSrc && (
            <div className="absolute top-4 left-4 p-2 rounded-xl bg-black/80 border border-[#00e5ff] animate-aruco shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <span className="text-[10px] font-mono text-[#00e5ff]">ARUCO DETECT: {arucoScale}px/cm</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        {['Scale Ratio', 'Lighting', 'Fiducial Tag'].map((label, i) => (
          <div key={i} className="p-2 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center">
            <span className="text-[9px] uppercase font-bold text-white/40">{label}</span>
            <span className="text-xs font-bold text-[#00e5ff] font-mono">SYS_OK</span>
          </div>
        ))}
      </div>
    </div>
  )
}