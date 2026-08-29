// Heal6 Frontend API Client for FastAPI backend integration with graceful local fallback

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/**
 * Check if the Heal6 FastAPI backend is currently online and reachable
 */
export async function checkBackendStatus() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    if (!response.ok) return false
    const data = await response.json()
    return data.status === 'ONLINE'
  } catch (err) {
    return false
  }
}

/**
 * Fetch the active patient triage queue directly from the backend
 */
export async function fetchPatientQueue() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/patients/queue`)
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }
    const data = await response.json()
    return {
      success: true,
      data,
      isLiveBackend: true
    }
  } catch (error) {
    console.warn('[Heal6 API] Could not fetch live patient queue, falling back to local dataset:', error)
    return {
      success: false,
      error: error.message,
      isLiveBackend: false
    }
  }
}

/**
 * Fetch doctor identity from backend
 */
export async function fetchDoctorProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      data: {
        name: "Dr. Sharma",
        email: "dr.sharma@heal6.health",
        role: "Consultant Endocrinologist & DFU Specialist",
        department: "Endocrinology & Diabetic Foot Unit"
      }
    }
  }
}

/**
 * Send wound photograph + physician clinical factors to FastAPI backend for
 * ConvNeXt infection detection, ArUco fiducial calibration, and U-Net wound boundary segmentation.
 */
export async function analyzeWoundWithBackend({
  imageFile,
  isHindfoot = false,
  hasIschemia = false,
  hasNeuropathy = false,
  isDeep = false,
  patientName = 'Walk-In Patient',
  patientAge = '58',
  patientGender = 'Male',
  diabetesType = 'Type 2 DM (14 yrs)',
  patientId = null,
  locationLabel = null
}) {
  try {
    const formData = new FormData()
    if (imageFile) {
      formData.append('file', imageFile)
    } else {
      // Create a small fallback genuine JPEG buffer if no file attached
      const canvas = document.createElement('canvas')
      canvas.width = 224
      canvas.height = 224
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(40, 40, 144, 144)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'))
      formData.append('file', blob, 'telemetry_sample.jpg')
    }

    formData.append('is_hindfoot', String(isHindfoot))
    formData.append('has_ischemia', String(hasIschemia))
    formData.append('has_neuropathy', String(hasNeuropathy))
    formData.append('is_deep', String(isDeep))
    formData.append('patient_name', String(patientName))
    formData.append('patient_age', String(patientAge))
    formData.append('patient_gender', String(patientGender))
    formData.append('diabetes_type', String(diabetesType))
    if (patientId) formData.append('patient_id', String(patientId))
    if (locationLabel) formData.append('location_label', String(locationLabel))

    const response = await fetch(`${API_BASE_URL}/api/v1/sinbad/analyze-wound`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Backend returned status ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data,
      isLiveBackend: true,
    }
  } catch (error) {
    console.warn('[Heal6 API] Backend call failed, using local telemetry calculation:', error)
    return {
      success: false,
      error: error.message,
      isLiveBackend: false,
    }
  }
}

/**
 * Physician Validation / Verification of a Patient Case
 */
export async function verifyPatientReport(patientId, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    console.warn('[Heal6 API] Local verification fallback:', error)
    return { status: 'success', local: true }
  }
}

/**
 * Re-verify request from patient
 */
export async function reverifyPatientReport(patientId, patientNotes = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/reverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientNotes })
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    return { status: 'success', local: true }
  }
}

/**
 * Local deterministic SINBAD score calculation (0 to 6 points)
 */
export function calculateLocalSinbadScore({
  isHindfoot,
  hasIschemia,
  hasNeuropathy,
  isDeep,
  infectionRiskPercent = 50,
  woundAreaCm2 = 1.0,
}) {
  const site = isHindfoot ? 1 : 0
  const ischemia = hasIschemia ? 1 : 0
  const neuropathy = hasNeuropathy ? 1 : 0
  const depth = isDeep ? 1 : 0
  const bacterial = infectionRiskPercent >= 50 ? 1 : 0
  const area = woundAreaCm2 >= 1.0 ? 1 : 0

  const total = site + ischemia + neuropathy + depth + bacterial + area

  let triageLevel = 'LOW RISK'
  let triageColor = '#10b981'
  let healingEstimateWeeks = '3 - 4 Weeks'

  if (total >= 5) {
    triageLevel = 'CRITICAL SURGICAL EMERGENCY'
    triageColor = '#f43f5e'
    healingEstimateWeeks = '20 - 28 Weeks'
  } else if (total >= 3) {
    triageLevel = 'URGENT TRIAGE'
    triageColor = '#f59e0b'
    healingEstimateWeeks = '12 - 16 Weeks'
  } else if (total >= 2) {
    triageLevel = 'MODERATE RISK'
    triageColor = '#f59e0b'
    healingEstimateWeeks = '6 - 8 Weeks'
  }

  return {
    totalScore: total,
    breakdown: { site, ischemia, neuropathy, depth, bacterial, area },
    triageLevel,
    triageColor,
    healingEstimateWeeks,
  }
}
