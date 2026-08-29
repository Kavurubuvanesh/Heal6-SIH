// Clinical base64 sample wound scans and UNet++ segmentation masks for demo cases
// When live patients submit from heal6-patient-app, their real camera capture is used directly.

// Helper to generate a realistic clinical wound canvas base64 image
export function generateClinicalWoundDataUrl(type = 'hindfoot') {
  if (typeof document === 'undefined') return ''
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')

  // Skin backdrop gradient
  const skinGrad = ctx.createRadialGradient(200, 150, 40, 200, 150, 200)
  skinGrad.addColorStop(0, '#e7c09e')
  skinGrad.addColorStop(0.6, '#d4a373')
  skinGrad.addColorStop(1, '#b07d56')
  ctx.fillStyle = skinGrad
  ctx.fillRect(0, 0, 400, 300)

  // Skin texture noise
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
    ctx.fillRect(Math.random() * 400, Math.random() * 300, 2, 2)
  }

  // Erythematous border / inflamed halo
  const haloGrad = ctx.createRadialGradient(210, 150, 10, 210, 150, 85)
  haloGrad.addColorStop(0, 'rgba(180, 20, 30, 0.75)')
  haloGrad.addColorStop(0.5, 'rgba(220, 38, 38, 0.45)')
  haloGrad.addColorStop(0.85, 'rgba(244, 63, 94, 0.25)')
  haloGrad.addColorStop(1, 'rgba(244, 63, 94, 0)')
  ctx.fillStyle = haloGrad
  ctx.beginPath()
  ctx.ellipse(210, 150, 85, 65, type === 'forefoot' ? 0.2 : -0.1, 0, Math.PI * 2)
  ctx.fill()

  // Granulation tissue base (deep beefy red)
  ctx.fillStyle = '#881337'
  ctx.beginPath()
  ctx.ellipse(210, 150, 52, 38, 0, 0, Math.PI * 2)
  ctx.fill()

  // Slough tissue (yellow fibrinous patch)
  ctx.fillStyle = '#eab308'
  ctx.beginPath()
  ctx.ellipse(type === 'hindfoot' ? 220 : 205, 142, 24, 16, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Necrotic tissue core (dark eschar)
  ctx.fillStyle = '#1e1b4b'
  ctx.beginPath()
  ctx.ellipse(205, 154, 16, 11, -0.2, 0, Math.PI * 2)
  ctx.fill()

  // ArUco 25mm Marker in upper left corner
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(25, 20, 48, 48)
  ctx.fillStyle = '#000000'
  ctx.fillRect(30, 25, 38, 38)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(38, 33, 22, 22)
  ctx.fillStyle = '#000000'
  ctx.fillRect(44, 39, 10, 10)

  // Calibrated marker text
  ctx.fillStyle = '#0d9488'
  ctx.font = 'bold 9px monospace'
  ctx.fillText('25mm TAG', 25, 78)

  return canvas.toDataURL('image/jpeg', 0.92)
}

// Helper to generate the matching UNet++ segmentation mask overlay
export function generateClinicalMaskDataUrl(type = 'hindfoot') {
  if (typeof document === 'undefined') return ''
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')

  // Transparent background
  ctx.clearRect(0, 0, 400, 300)

  // UNet++ SOTA Predicted Ulcer Boundary (Semi-transparent coral/red: R: 250, G: 117, B: 106, A: 0.7)
  const maskGrad = ctx.createRadialGradient(210, 150, 10, 210, 150, 60)
  maskGrad.addColorStop(0, 'rgba(250, 117, 106, 0.85)')
  maskGrad.addColorStop(0.7, 'rgba(244, 63, 94, 0.70)')
  maskGrad.addColorStop(1, 'rgba(225, 29, 72, 0.55)')

  ctx.fillStyle = maskGrad
  ctx.beginPath()
  ctx.ellipse(210, 150, 62, 46, type === 'forefoot' ? 0.2 : -0.1, 0, Math.PI * 2)
  ctx.fill()

  // High-contrast cyan boundary stroke
  ctx.strokeStyle = '#0d9488'
  ctx.lineWidth = 2.5
  ctx.setLineDash([5, 3])
  ctx.stroke()

  return canvas.toDataURL('image/png')
}
