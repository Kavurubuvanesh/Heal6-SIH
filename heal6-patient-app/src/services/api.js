/**
 * Industrial API Engine for Patient Intake
 * Converts camera capture and clinical booleans + demographics to strict FormData contract
 * matching routes_screenings.py endpoint signature exactly.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const submitPatientDiagnostic = async (imageFile, clinicalData = {}) => {
  if (!imageFile) throw new Error("A wound capture image is required.");

  // Build clinical_data JSON object matching routes_screenings.py parser
  const clinicalJson = {
    site: clinicalData.isHindfoot ? 'hindfoot' : 'forefoot',
    ischemia: clinicalData.hasIschemia ? 'reduced_or_absent' : 'intact',
    neuropathy: clinicalData.hasNeuropathy ? 'loss_of_sensation' : 'intact',
    depth: clinicalData.isDeep ? 'deep_ulcer_or_bone' : 'superficial',
    has_infection: false,
    has_neuropathy: clinicalData.hasNeuropathy ?? false,
    area: 'unknown',
    symptomFlags: {
      swelling: false,
      warmth: false,
      redness: false,
      numbness: clinicalData.hasNeuropathy ?? false,
      tingling: false,
      ulcer: false,
    },
  };

  // Strict multipart/form-data mapping matching routes_screenings.py signature:
  // image: UploadFile, patient_identifier: str, clinical_data: str (JSON), latitude, longitude
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("patient_identifier", String(clinicalData.id || `PAT-${Date.now().toString().slice(-6)}`));
  formData.append("clinical_data", JSON.stringify(clinicalJson));
  // Optional geo fields
  formData.append("latitude", "");
  formData.append("longitude", "");

  try {
    const token = localStorage.getItem('heal6_patient_jwt');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/v1/screenings`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Diagnostic inference failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Diagnostic Dispatch Error:", error);
    throw error;
  }
};

export const submitPatientReverification = async (patientId, patientNotes = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/patients/${patientId}/reverify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientNotes }),
    });

    if (!response.ok) {
      throw new Error(`Re-verification request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Re-verification offline fallback:", error);
    return { status: "success", local: true };
  }
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ONLINE";
  } catch {
    return false;
  }
};