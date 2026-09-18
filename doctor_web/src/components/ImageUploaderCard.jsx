import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  Scan,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  Eye
} from 'lucide-react'

export default function ImageUploaderCard({
  imageSrc,
  setImageSrc,
  onImageFileSelect,
  isAnalyzing,
  arucoDetected = true,
  arucoScale = 42,
  woundArea = 2.45
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [showLaserScan, setShowLaserScan] = useState(true)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (onImageFileSelect) onImageFileSelect(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageSrc(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (onImageFileSelect) onImageFileSelect(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageSrc(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="spotlight-card glass-panel-luxury rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-xl flex flex-col gap-4 transition-all relative overflow-hidden group">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] flex items-center justify-center border border-[#aceba7]/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif-luxury font-semibold text-slate-900 dark:text-white tracking-wide">
              Clinical Image Intake & ArUco Vision
            </h3>
            <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
              Autonomous fiducial homography & contouring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#aceba7]/15 text-[#12464e] dark:text-[#aceba7] border border-[#aceba7]/30">
            <span className="w-2 h-2 rounded-full bg-[#aceba7] animate-pulse" />
            Live CV Tracking
          </span>
        </div>
      </div>

      {/* Main Drag-and-Drop Zone with Dashed Teal Border */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden p-4 min-h-[290px] flex flex-col items-center justify-center text-center ${
          isDragging
            ? 'border-[#0d9488] bg-[#0d9488]/10 scale-[1.01]'
            : 'border-[#0d9488]/40 bg-[#0d9488]/5 dark:bg-teal-950/20 hover:border-[#0d9488] hover:bg-[#0d9488]/8 dark:hover:bg-teal-950/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Clean Professional Image Drop Zone */}
        <div className="w-full relative rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/60 shadow-inner flex items-center justify-center min-h-[220px]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Uploaded Clinical Wound"
              className="w-full h-full object-cover max-h-[220px]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-slate-400 dark:text-slate-500 min-h-[220px]">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-sm">
                <ImageIcon className="w-8 h-8 opacity-75" />
              </div>
              <p className="text-sm font-semibold">No Image Selected</p>
              <p className="text-[11px] max-w-[200px] text-center opacity-80">
                Drag and drop a clinical wound scan here or click to browse files.
              </p>
            </div>
          )}

          {/* LASER SCAN LINE */}
          {(isAnalyzing || showLaserScan) && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#0d9488] to-transparent animate-laser pointer-events-none shadow-[0_0_12px_#0d9488]" />
          )}

          {/* LIVE ARUCO DETECTION BOUNDING BOX */}
          <div className="absolute top-4 left-4 z-10 select-none pointer-events-none">
            <div className="relative p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-[#0d9488] animate-aruco shadow-lg">
              {/* Corner crosshairs */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#0d9488]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#0d9488]" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#0d9488]" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#0d9488]" />

              <div className="flex items-center gap-2">
                {/* SVG Fiducial ArUco Marker Matrix */}
                <div className="w-9 h-9 bg-black p-1 border border-white/20 grid grid-cols-4 gap-0.5 rounded-sm shadow-xs">
                  <div className="bg-white" />
                  <div className="bg-black" />
                  <div className="bg-white" />
                  <div className="bg-white" />
                  <div className="bg-black" />
                  <div className="bg-white" />
                  <div className="bg-black" />
                  <div className="bg-white" />
                  <div className="bg-white" />
                  <div className="bg-white" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                  <div className="bg-black" />
                  <div className="bg-white" />
                  <div className="bg-white" />
                  <div className="bg-black" />
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[10.5px] font-bold font-mono text-[#0d9488] tracking-wide">
                      [ARUCO-42 DETECTED]
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono text-emerald-400 font-semibold">
                    SCALE: {arucoScale}.0 px/cm
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    HOMOGRAPHY: 0.998 CONF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Segmented Wound Contour Pin */}
          <div className="absolute bottom-4 right-4 z-10 select-none pointer-events-none">
            <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-white text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" />
              <span>Contour Area: <strong className="text-[#0d9488]">{woundArea} cm²</strong></span>
            </div>
          </div>

          {/* Interactive Inspect Hover Pill */}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-800 dark:text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-[#0d9488] dark:text-teal-400" />
              <span>Drop Image or Click to Replace</span>
            </div>
          </div>
        </div>

        {/* Helper Text & Requirements */}
        <div className="mt-3 flex flex-col items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Scan className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
            <span>Upload foot image. Ensure ArUco marker is visible.</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Supports DICOM, JPEG, PNG, TIFF (Calibrated for standard 25mm fiducials)
          </p>
        </div>
      </div>

      {/* Vision Status Metadata Badges */}
      <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
        <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#0e120f]/80 border border-slate-200/70 dark:border-white/5 flex flex-col items-center justify-center shadow-xs">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500">Scale Ratio</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-mono">42.0 px/cm</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#0e120f]/80 border border-slate-200/70 dark:border-white/5 flex flex-col items-center justify-center shadow-xs">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500">Lighting</span>
          <span className="text-xs font-bold text-[#12464e] dark:text-[#aceba7] font-mono">96% Optimal</span>
        </div>
        <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-[#0e120f]/80 border border-slate-200/70 dark:border-white/5 flex flex-col items-center justify-center shadow-xs">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500">Fiducial Tag</span>
          <span className="text-xs font-bold text-[#12464e] dark:text-[#aceba7] font-mono">ArUco #42</span>
        </div>
      </div>
    </div>
  )
}
