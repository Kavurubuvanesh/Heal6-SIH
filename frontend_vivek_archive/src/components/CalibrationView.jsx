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
  AlertCircle
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
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">ArUco Optical Vision & Homography Calibration</h2>
        <p className="text-xs text-slate-500">Configure fiducial physical matrix scales, focal distortion, and wound bed homography</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Optical Sensor Telemetry */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Active Sensor Parameters</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#249583]/10 text-[#249583]">
              DIAGNOSTIC GRADE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-600 font-medium">Dictionary Type:</span>
              <span className="font-mono font-bold text-slate-800">DICT_4X4_50</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-600 font-medium">Marker Physical Dimension:</span>
              <span className="font-mono font-bold text-[#249583]">{targetMarkerSize} mm (Square)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-600 font-medium">Calibrated Resolution:</span>
              <span className="font-mono font-bold text-slate-800">{pixelRatio} px / cm</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-600 font-medium">Homography Distortion Correction:</span>
              <span className="font-mono font-bold text-emerald-600">Active (Brown-Conrady)</span>
            </div>
          </div>

          <button
            onClick={handleRecalibrate}
            disabled={isCalibrating}
            className="mt-2 w-full py-3 bg-[#249583] hover:bg-[#1b7a6b] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <RotateCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
            <span>{isCalibrating ? 'Recalibrating Optical Matrix...' : 'Run Auto-Calibration Routine'}</span>
          </button>
        </div>

        {/* Fiducial Print Pattern */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center gap-4">
          <div className="w-36 h-36 bg-black p-3 rounded-xl border-4 border-[#249583] shadow-lg animate-aruco grid grid-cols-4 gap-1">
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
            <h4 className="font-bold text-slate-800 text-sm">Fiducial Standard Tag #42</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Adhere sterile 25mm adhesive target adjacent to peri-wound margin prior to photographic capture.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Print Calibration Sheet (1:1 Scale)
          </button>
        </div>
      </div>
    </div>
  )
}
