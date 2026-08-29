import React, { useState } from 'react'
import {
  Scan,
  ShieldCheck,
  RotateCw,
  Camera,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Printer
} from 'lucide-react'

export default function CalibrationView() {
  const [targetMarkerSize, setTargetMarkerSize] = useState(25) // 25mm
  const [pixelRatio, setPixelRatio] = useState(42.0)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibratedSuccess, setCalibratedSuccess] = useState(true)

  const handleRecalibrate = () => {
    setIsCalibrating(true)
    setTimeout(() => {
      setIsCalibrating(false)
      setCalibratedSuccess(true)
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0d9488] dark:text-teal-400 bg-[#0d9488]/10 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
            Computer Vision Calibration
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Fiducial Telemetry
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
          ArUco Optical Vision & Homography Calibration
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure fiducial physical matrix scales, focal distortion, and wound bed homography
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Optical Sensor Telemetry */}
        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Active Sensor Parameters</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0d9488]/10 dark:bg-teal-950 text-[#0d9488] dark:text-teal-300">
              DIAGNOSTIC GRADE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Dictionary Type:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">DICT_4X4_50</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Marker Physical Dimension:</span>
              <span className="font-mono font-bold text-[#0d9488] dark:text-teal-400">{targetMarkerSize} mm (Square)</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Calibrated Resolution:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">{pixelRatio} px / cm</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Homography Distortion Correction:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Active (Brown-Conrady)</span>
            </div>
          </div>

          <button
            onClick={handleRecalibrate}
            disabled={isCalibrating}
            className="mt-2 w-full py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
            <span>{isCalibrating ? 'Recalibrating Optical Matrix...' : 'Run Auto-Calibration Routine'}</span>
          </button>
        </div>

        {/* Fiducial Print Pattern */}
        <div className="bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center gap-4">
          <div className="w-36 h-36 bg-black p-3 rounded-xl border-4 border-[#0d9488] shadow-lg animate-aruco grid grid-cols-4 gap-1">
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

          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Fiducial Standard Tag #42</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Adhere sterile 25mm adhesive target adjacent to peri-wound margin prior to photographic capture.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Print Calibration Sheet (1:1 Scale)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
