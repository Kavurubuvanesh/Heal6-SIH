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
    <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4 transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Clinical Image Intake & ArUco Vision</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Autonomous fiducial homography & contouring</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300">
            <span className="w-2 h-2 rounded-full bg-[#0d9488] animate-pulse" />
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

        {/* Realistic Interactive Medical Canvas / Clinical Photographic Mockup */}
        <div className="w-full relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-inner flex items-center justify-center min-h-[220px]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Uploaded Clinical Wound"
              className="w-full h-full object-cover max-h-[220px]"
            />
          ) : (
            /* Background Foot Silhouette & Clinical Wound Articulation */
            <div className="w-full h-full flex items-center justify-center relative min-h-[220px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
              <svg
                className="w-full h-full object-cover max-h-[220px]"
                viewBox="0 0 400 240"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <radialGradient id="footSkin" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#e8c4a2" />
                    <stop offset="60%" stopColor="#d4a373" />
                    <stop offset="100%" stopColor="#bc8a5f" />
                  </radialGradient>
                  <radialGradient id="ulcerCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#dc2626" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                  <filter id="woundGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid overlay for medical measurement */}
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Stylized Plantar Foot Outline */}
                <path
                  d="M 120 40 C 170 30, 260 30, 290 60 C 310 80, 310 110, 280 140 C 260 160, 240 180, 230 210 C 220 230, 180 230, 160 215 C 140 190, 120 160, 100 130 C 80 100, 90 50, 120 40 Z"
                  fill="url(#footSkin)"
                  opacity="0.85"
                  filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
                />

                {/* Metatarsal / Heel Ulcer Wound Bed */}
                <g transform="translate(195, 125)">
                  {/* Erythema margin */}
                  <ellipse cx="0" cy="0" rx="36" ry="26" fill="#f59e0b" opacity="0.35" filter="url(#woundGlow)" />
                  {/* Ulcer Core */}
                  <path
                    d="M -18 -8 C -14 -18, 12 -16, 20 -4 C 24 6, 16 18, -4 20 C -18 20, -22 4, -18 -8 Z"
                    fill="url(#ulcerCore)"
                    filter="url(#woundGlow)"
                  />
                  {/* Slough / Fibrin patches */}
                  <ellipse cx="-2" cy="-1" rx="8" ry="6" fill="#fef08a" opacity="0.75" />
                  <ellipse cx="6" cy="4" rx="5" ry="4" fill="#991b1b" opacity="0.8" />
                </g>

                {/* Wound Contour Detection Vector Line */}
                <path
                  d="M 172 118 C 180 105, 210 106, 220 120 C 225 132, 215 146, 192 148 C 174 147, 168 132, 172 118 Z"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              </svg>
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
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Scale Ratio</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">42.0 px / cm</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Lighting</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-semibold">96% Optimal</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Fiducial Tag</span>
          <span className="text-xs font-bold text-[#0d9488] dark:text-teal-400 font-mono">ArUco #42</span>
        </div>
      </div>
    </div>
  )
}
