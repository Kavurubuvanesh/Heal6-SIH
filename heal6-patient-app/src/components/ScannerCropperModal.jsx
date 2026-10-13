import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Camera,
  Crop,
  Check,
  X,
  ArrowsOut,
  ArrowsIn,
  MagnifyingGlassPlus,
  Sparkle,
  Target,
  ArrowClockwise,
  WarningCircle,
  ShieldCheck,
  Scan
} from '@phosphor-icons/react'

export default function ScannerCropperModal({
  isOpen,
  onClose,
  initialImageSrc = null,
  onConfirmCrop
}) {
  const [mode, setMode] = useState(initialImageSrc ? 'crop' : 'camera')
  const [imageSrc, setImageSrc] = useState(initialImageSrc)
  const [zoom, setZoom] = useState(1.2)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [isAutoCentering, setIsAutoCentering] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Sync initial image
  useEffect(() => {
    if (initialImageSrc) {
      setImageSrc(initialImageSrc)
      setMode('crop')
      setZoom(1.15)
      setPan({ x: 0, y: 0 })
    } else {
      setMode('camera')
    }
  }, [initialImageSrc, isOpen])

  // Camera lifecycle management
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.warn('[Heal6 Scanner] Camera access note:', err)
      setCameraError('Camera unavailable or permission denied. Please select or upload a photo to frame.')
      setMode('crop')
    }
  }, [cameraStream])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }, [cameraStream])

  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen, mode])

  if (!isOpen) return null

  // Capture current video frame into cropper
  const handleCaptureFromVideo = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = w
    tempCanvas.height = h
    const ctx = tempCanvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)

    const capturedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95)
    setImageSrc(capturedDataUrl)
    stopCamera()
    setMode('crop')
    setZoom(1.15)
    setPan({ x: 0, y: 0 })
  }

  // File upload directly into cropper
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageSrc(event.target.result)
        stopCamera()
        setMode('crop')
        setZoom(1.15)
        setPan({ x: 0, y: 0 })
      }
      reader.readAsDataURL(file)
    }
  }

  // Pan interaction handlers (touch + mouse)
  const handlePointerDown = (e) => {
    setIsDragging(true)
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y })
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Auto-Center Wound: Finds high redness/erythema centroid
  const handleAutoCenterWound = () => {
    if (!imageSrc) return
    setIsAutoCentering(true)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const offCanvas = document.createElement('canvas')
        const downscale = 160
        offCanvas.width = downscale
        offCanvas.height = Math.round((img.height / img.width) * downscale)
        const ctx = offCanvas.getContext('2d')
        ctx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height)

        const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height).data
        let sumX = 0, sumY = 0, weightSum = 0

        for (let y = 0; y < offCanvas.height; y++) {
          for (let x = 0; x < offCanvas.width; x++) {
            const idx = (y * offCanvas.width + x) * 4
            const r = imgData[idx]
            const g = imgData[idx + 1]
            const b = imgData[idx + 2]

            // Ulcerative / erythema contrast weight: High red, lower green/blue
            const redness = r - (g + b) / 2
            if (redness > 15) {
              const weight = redness * redness
              sumX += x * weight
              sumY += y * weight
              weightSum += weight
            }
          }
        }

        if (weightSum > 0) {
          const centroidNormX = (sumX / weightSum) / offCanvas.width - 0.5
          const centroidNormY = (sumY / weightSum) / offCanvas.height - 0.5

          // Offset pan in opposite direction to center the wound
          const containerSize = 320
          setPan({
            x: Math.round(-centroidNormX * containerSize * zoom),
            y: Math.round(-centroidNormY * containerSize * zoom)
          })
          setZoom(1.35)
        } else {
          // Default center if no distinct ulcer centroid detected
          setPan({ x: 0, y: 0 })
          setZoom(1.2)
        }
      } catch (err) {
        console.warn('Auto-center failed:', err)
      } finally {
        setIsAutoCentering(false)
      }
    }
    img.src = imageSrc
  }

  // Generate cropped high-res JPEG
  const handleConfirmCrop = () => {
    if (!imageSrc) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const cropSize = 640 // High-res standardized square
      const canvas = document.createElement('canvas')
      canvas.width = cropSize
      canvas.height = cropSize
      const ctx = canvas.getContext('2d')

      // Fill neutral medical background
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, 0, cropSize, cropSize)

      // Calculate source crop window based on pan and zoom
      const containerSize = 320 // Size of onscreen viewfinder
      const displayedWidth = containerSize * zoom
      const displayedHeight = (img.height / img.width) * displayedWidth

      // Scale between container coordinates and raw image coordinates
      const scaleToRaw = img.width / displayedWidth

      // Viewfinder center in image coordinates
      const centerX = (containerSize / 2 - pan.x) * scaleToRaw
      const centerY = (containerSize / 2 - pan.y) * scaleToRaw
      const rawCropDimension = containerSize * scaleToRaw

      const srcX = centerX - rawCropDimension / 2
      const srcY = centerY - rawCropDimension / 2

      ctx.drawImage(
        img,
        srcX,
        srcY,
        rawCropDimension,
        rawCropDimension,
        0,
        0,
        cropSize,
        cropSize
      )

      canvas.toBlob((blob) => {
        if (!blob) return
        const croppedFile = new File([blob], 'focused_wound_scan.jpg', { type: 'image/jpeg' })
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92)

        onConfirmCrop({
          file: croppedFile,
          dataUrl: croppedDataUrl,
          isCropped: true
        })
        onClose()
      }, 'image/jpeg', 0.92)
    }
    img.src = imageSrc
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-teal-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Scan weight="bold" className="text-lg" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">Clinical Wound Scanner</h3>
              <p className="text-[11px] text-teal-400 font-mono">Frame the proper wound & marker region</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X weight="bold" className="text-base" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 pb-2 bg-slate-900 border-b border-slate-800/80 flex gap-2">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'camera'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera weight="bold" />
            <span>Live Camera Scanner</span>
          </button>
          <button
            onClick={() => setMode('crop')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'crop'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crop weight="bold" />
            <span>Target Frame & Crop</span>
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/60 select-none">
          {/* Square Clinical Viewfinder HUD */}
          <div
            ref={containerRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-teal-500/40 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            {/* Viewfinder Corners */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-3 border-l-3 border-teal-400 rounded-tl-sm pointer-events-none z-20" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-3 border-r-3 border-teal-400 rounded-tr-sm pointer-events-none z-20" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-3 border-l-3 border-teal-400 rounded-bl-sm pointer-events-none z-20" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-3 border-r-3 border-teal-400 rounded-br-sm pointer-events-none z-20" />

            {/* Target Reticle Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-14 h-14 border border-teal-400/40 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" />
              </div>
              <div className="absolute w-24 h-px bg-teal-400/30" />
              <div className="absolute h-24 w-px bg-teal-400/30" />
            </div>

            {/* Laser Scanning Line */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#14b8a6] pointer-events-none z-20 animate-laser" />

            {/* Content: Mode Camera vs Crop */}
            {mode === 'camera' ? (
              cameraError ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <WarningCircle weight="fill" className="text-3xl text-amber-400 mx-auto mb-2" />
                  <p>{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs"
                  >
                    Select Photo File
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover pointer-events-none"
                />
              )
            ) : (
              imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Wound to Frame"
                  draggable={false}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                  }}
                  className="max-w-none w-full object-contain pointer-events-none select-none"
                />
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <p className="mb-2">No photo selected</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Upload Image
                  </button>
                </div>
              )
            )}

            {/* HUD Status Tag */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-20">
              <span className="bg-slate-950/80 backdrop-blur-xs text-teal-300 font-mono text-[10px] px-2.5 py-0.5 rounded-full border border-teal-500/30 font-bold">
                {mode === 'camera' ? 'LIVE HUD • ALIGN WOUND IN RETICLE' : 'PAN / ZOOM TO ISOLATE WOUND PART'}
              </span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Controls Bar */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-4">
          {mode === 'camera' ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Upload from Gallery
              </button>
              <button
                type="button"
                onClick={handleCaptureFromVideo}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Camera weight="bold" className="text-base" />
                <span>Capture Wound Part</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Zoom & Centering Tools */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <MagnifyingGlassPlus weight="bold" className="text-slate-400 text-sm" />
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <span className="text-slate-400 text-[11px] font-mono w-9 text-right font-bold">{zoom.toFixed(1)}x</span>
                </div>

                <button
                  type="button"
                  onClick={handleAutoCenterWound}
                  disabled={isAutoCentering || !imageSrc}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Automatically center on wound lesion"
                >
                  <Sparkle weight="fill" className={isAutoCentering ? 'animate-spin' : ''} />
                  <span>{isAutoCentering ? 'Centering...' : 'Auto-Center'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Replace Photo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCrop}
                  disabled={!imageSrc}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Check weight="bold" className="text-base" />
                  <span>Lock & Extract Wound Part</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
