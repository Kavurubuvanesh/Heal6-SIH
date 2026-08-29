/**
 * Industrial API Engine for Patient Intake
 * Converts camera capture and clinical booleans + demographics to strict FormData contract
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const submitPatientDiagnostic = async (imageFile, clinicalData = {}) => {
  if (!imageFile) throw new Error("A wound capture image is required.");

  // Strict multipart/form-data mapping
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("is_hindfoot", String(clinicalData.isHindfoot ?? false));
  formData.append("has_ischemia", String(clinicalData.hasIschemia ?? false));
  formData.append("has_neuropathy", String(clinicalData.hasNeuropathy ?? false));
  formData.append("is_deep", String(clinicalData.isDeep ?? false));
  
  if (clinicalData.name) formData.append("patient_name", String(clinicalData.name));
  if (clinicalData.age) formData.append("patient_age", String(clinicalData.age));
  if (clinicalData.gender) formData.append("patient_gender", String(clinicalData.gender));
  if (clinicalData.diabetesType) formData.append("diabetes_type", String(clinicalData.diabetesType));
  if (clinicalData.id) formData.append("patient_id", String(clinicalData.id));

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/sinbad/analyze-wound`, {
      method: "POST",
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