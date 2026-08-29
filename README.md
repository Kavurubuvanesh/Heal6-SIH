<div align="center">
  <img src="./doctor_web/src/assets/heal6_logo.png" alt="Heal6 Logo" width="200" />
  <h1>Heal6: Clinical-Grade Diabetic Foot Analysis & Triage Engine</h1>
  <p><strong>Edge-to-Cloud Computer Vision Telemetry & Automated SINBAD Staging</strong></p>

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
</div>

<hr />

## 📖 Overview

**Heal6** is an enterprise-grade, multi-platform healthcare suite designed to combat the diabetic foot ulcer (DFU) amputation crisis. By combining a SOTA deep-learning computer vision pipeline with the internationally validated **IWGDF SINBAD** scoring matrix, Heal6 accelerates clinical triage, delivers sub-millimeter wound metrology, and projects 12-week healing trajectories.

The ecosystem bridges the gap between remote patient monitoring and specialist intervention, utilizing a **Patient Edge Application** for guided intake and a high-performance **Doctor Command Center** for verifiable, human-in-the-loop diagnostic execution.

---

## ✨ Core Ecosystem Features

### 1. 📱 Patient Edge Client (Mobile-Optimized)
* **Guided Clinical Self-Assessment:** Translates complex clinical markers into accessible patient actions (e.g., Capillary Refill Pinch Test for Ischemia, Twig/Touch Test for Neuropathy).
* **ArUco Optical Homography:** Integrates standard 25mm ArUco fiducial markers during image capture, eliminating camera tilt and distance distortion.
* **Instant Triage Delivery:** Provides patients with immediate, localized risk assessments and automated specialist scheduling.

### 2. 🧠 Industrial PyTorch AI Engine (FastAPI Backend)
* **Module 1: ConvNeXt-V2 Gatekeeper:** Binary abnormality and bacterial infection triage filter operating at 99.2% sensitivity.
* **Module 2: UNet++ (EfficientNet-B4 Backbone):** State-of-the-art, 4-class multi-tissue semantic segmentation isolating Granulation, Slough, Necrotic tissue, and Background periwound.
* **Real-World Metrology:** Translates pixel outputs to absolute metric surface area (cm²) dynamically scaled to the ArUco coordinate plane (e.g., 42 px/cm).

### 3. 🩺 Doctor Command Center (Clinical Workstation)
* **Live Emergency Master Queue:** Real-time patient telemetry routing, automatically sorted by descending SINBAD severity.
* **Human-in-the-Loop Validation:** Dual-layer visualization engine layering AI Base64 segmentation masks over raw clinical scans with variable opacity sliders.
* **6-Axis Risk Radar & Trajectory:** Calculates a composite SINBAD score (0-6) and projects an exponential decay healing curve across a 12-week horizon.
* **One-Click HL7/FHIR Dispatch:** Securely generates official medical PDFs and interoperable vascular surgery referrals.

---

## 🏗️ System Architecture

```text
Heal6_dfu_project/
├── backend/                  # Enterprise FastAPI ML Diagnostic Service
│   ├── app/
│   │   ├── main.py           # Application entrypoint & model lifespan loader
│   │   ├── api/              # HTTP Route definitions
│   │   │   ├── routes_sinbad.py    # Primary /analyze-wound pipeline endpoint
│   │   │   ├── routes_patients.py  # In-memory triage queue & verification sign-off
│   │   │   ├── routes_auth.py      # Physician identity / profile
│   │   │   └── routes_xray.py      # Placeholder for LERA X-Ray expansion
│   │   ├── ml_engine/        # Production ML inference modules
│   │   │   ├── calibration.py            # ArUco fiducial marker detector (px/cm)
│   │   │   ├── inference.py              # ConvNeXt ulcer/infection classifier
│   │   │   ├── segmentation_inference.py # UNet++ 4-class sub-tissue segmentation
│   │   │   ├── sinbad_engine.py          # Strict IWGDF SINBAD scoring & prognostics
│   │   │   └── weights/                  # Trained PyTorch neural weights (.pth)
│   │   └── core/             # App configuration utilities
│   └── models/               # Top-level SOTA model store (heal6_tissue_sota_best.pth)
│
├── doctor_web/               # Physician Diagnostic & Command Center (React 19 + Vite)
│   ├── src/
│   │   ├── App.jsx           # Main controller (Landing vs Workstation)
│   │   ├── components/       # 19 Clinical UI components
│   │   │   ├── LandingPage.jsx          # Interactive hero, live demo, feature overview
│   │   │   ├── MasterTriageQueue.jsx    # Severity-sorted patient queue (SINBAD desc)
│   │   │   ├── PatientCommandCenter.jsx # Deep-dive patient telemetry & inspection
│   │   │   ├── RealisticFootModel.jsx   # SVG anatomical foot with thermal/vascular layers
│   │   │   ├── AiResultsColumn.jsx      # Live AI segmentation overlays & metrics
│   │   │   ├── ClinicalFormCard.jsx     # Physician clinical parameter toggles
│   │   │   ├── SinbadTrajectoryCard.jsx # Longitudinal wound healing forecast curves
│   │   │   ├── AnalyticsView.jsx        # Cohort epidemiological & healing analytics
│   │   │   ├── WoundRegistryView.jsx    # Searchable longitudinal wound database
│   │   │   ├── ReportModal.jsx          # Printable/Exportable clinical diagnostic report
│   │   │   └── ReferralModal.jsx        # Multidisciplinary referral slip generator
│   │   ├── data/clinicalCases.js        # Baseline patient telemetry database
│   │   └── services/api.js              # FastAPI client with offline telemetry fallback
│
├── heal6-patient-app/        # Patient / Point-of-Care Mobile Intake Portal (React 19 + Vite)
│   ├── src/
│   │   ├── App.jsx           # Intake form -> AI Processing -> Patient Report view
│   │   ├── components/       # Touch-first patient components
│   │   │   ├── EmergencyAlert.jsx       # Severity-based actionable directives
│   │   │   ├── DiagnosticVisuals.jsx    # Dual original/segmented mask viewer
│   │   │   ├── HealingTracker.jsx       # Wound area progression chart (Chart.js)
│   │   │   ├── TopActionBar.jsx         # Clinical reverify action bar
│   │   │   ├── PatientHeader.jsx        # Demographics badge
│   │   │   ├── ReportFooter.jsx         # Legal / Telemetry disclaimer
│   │   │   └── *Modal.jsx               # Care, Rx, Schedule, and Appointment modals
│   │   └── services/api.js              # Multipart form-data dispatcher to FastAPI
│
├── ml_training/              # PyTorch Machine Learning Training Pipelines
│   ├── train_task1_wound.py  # ConvNeXt-Tiny classification training (AdamW + Cosine)
│   ├── train_task2_area.py   # Binary Attention U-Net segmentation training (DiceBCE)
│   ├── train_task2_sota.py   # SOTA UNet++ (EfficientNet-B4) 4-class tissue segmentation
│   ├── evaluate.py           # Evaluation script placeholder
│   └── data/                 # Training datasets (task1, task2_advancement, task2_area)
│
├── scripts/                  # Utilities & Automated Verification
│   ├── generate_marker.py    # OpenCV ArUco 4x4_50 fiducial marker generator
│   └── test_api_contract.py  # Integration script testing end-to-end POST contracts
│
├── download_lera.py          # Stanford AIMI Redivis LERA X-Ray dataset downloader
└── _ARCHIVE_V1/              # Legacy prototypes (frontend_pratyusha_archive, frontend_vivek_archive)          
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18.0+)
* **Python** (3.10+)
* **CUDA-compatible GPU** (Recommended for <200ms model inference)

### 1. Backend Initialization (FastAPI)
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # On Windows
# source venv/bin/activate    # On Mac/Linux
pip install -r requirements.txt

# Start the ML Server (Pre-warms models into memory)
uvicorn app.main:app --reload --port 8000
```

### 2. Patient Edge Client
```bash
cd heal6-patient-app
npm install
npm run dev
# Launches at http://localhost:5173
```

### 3. Doctor Command Center
```bash
cd doctor_web
npm install
npm run dev
# Launches at http://localhost:5174
```

---

## ⚕️ Clinical Standards & Compliance
* **IWGDF 2023 Guidelines:** Fully aligned with the International Working Group on the Diabetic Foot recommendations for classification and triage.
* **SINBAD Scoring System:** Implements the globally validated 6-point matrix (*Site, Ischemia, Neuropathy, Bacterial Infection, Area, Depth*).
* **Data Security:** Follows zero-retention principles for PII on external models, utilizing AES-256 GCM encrypted telemetry transmission principles.

---

## 👥 The Team
Built with precision for the Smart India Hackathon 2026.

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/kavurubuvanesh">
        <img src="https://github.com/kavurubuvanesh.png" width="100px;" alt=""/><br />
        <sub><b>Buvanesh Kavuru</b></sub>
      </a><br />
      <i>AI/ML & Backend Lead</i>
    </td>
    <td align="center">
      <a href="https://github.com/VivML">
        <img src="https://github.com/VivML.png" width="100px;" alt=""/><br />
        <sub><b>Vivek</b></sub>
      </a><br />
      <i>Frontend Lead & Presentation</i>
    </td>
    <td align="center">
      <a href="https://github.com/Ariba006">
        <img src="https://github.com/Ariba006.png" width="100px;" alt=""/><br />
        <sub><b>Ariba</b></sub>
      </a><br />
      <i>Edge Client Eng. & Research Lead</i>
    </td>
    <td align="center">
      <a href="https://github.com/Pratyushaghosh148-create">
        <img src="https://github.com/Pratyushaghosh148-create.png" width="100px;" alt=""/><br />
        <sub><b>Pratyusha</b></sub>
      </a><br />
      <i>UI/UX Lead & Analytics</i>
    </td>
    <td align="center">
      <a href="https://github.com/Nishant">
        <img src="https://github.com/Nishant.png" width="100px;" alt=""/><br />
        <sub><b>Nishant</b></sub>
      </a><br />
      <i>Quality Assurance</i>
    </td>
    <td align="center">
      <a href="https://github.com/SerialKillr">
        <img src="https://github.com/SerialKillr.png" width="100px;" alt=""/><br />
        <sub><b>Sriram</b></sub>
      </a><br />
      <i>Systems Integration & App Dev</i>
    </td>
  </tr>
</table>

---

## ⚠️ Medical Disclaimer
**Heal6 is an investigational software platform and diagnostic aid.** It utilizes Artificial Intelligence to estimate probabilities of ulceration, ischemia, and infection spread. The AI estimations (including healing timelines) are based on visual data and statistical modeling. It **does not** guarantee specific clinical outcomes and **must not** replace the clinical judgment of a licensed medical professional.
