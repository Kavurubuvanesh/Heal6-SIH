# Heal6 — integrated mobile app + backend

This build keeps the existing Heal6 camera/SINBAD/ML pipeline and adds the requested product layer: screenshot-inspired home dashboard, authenticated login, Google OAuth plumbing, persistent profile details, language settings (English/Hindi/Odia), first-run four-step tutorial, guide, appointment request flow, report history, separate report numbers, and backend PDF generation with the captured image plus screening data.

## Project layout

- `mobile/` — Expo React Native + TypeScript app.
- `backend/` — FastAPI service with the supplied ConvNeXt/segmentation weights and new auth/profile/report/PDF routes.
- `backend/storage/reports/` — generated PDF files.
- `backend/storage/uploads/` — uploaded screening images.

## Demo account

Email: `test@heal6.app`
Password: `Heal6@123`

The backend auto-creates this account on startup.

## Run the backend

From `backend/`:

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Copy `.env.example` to `.env` or export the variables in your shell. For a physical phone, use the computer's LAN IP in `mobile/.env` rather than `localhost`.

## Run the mobile app

From `mobile/`:

```bash
npm install
npx expo start
```

For Google login, create Google OAuth clients for the app's Android/iOS/web targets and put their IDs in `mobile/.env` and the same IDs (comma separated) in `backend/.env` as `HEAL6_GOOGLE_CLIENT_IDS`. The button is fully wired; Google Console credentials are environment-specific and cannot be embedded without the project's own OAuth configuration.

## PDF report contents

Each server-side screening gets two distinct identifiers:

- `assessmentId` — internal unique assessment ID.
- `reportNumber` — human-readable identifier such as `H6-20260918-ABC123`.

The PDF includes the report number, assessment ID, profile data, original captured photograph, risk level, SINBAD breakdown, AI classification/confidence, infection risk, wound area/coverage, ArUco status and scale, tissue breakdown, findings, recommended action, action deadline, doctor-feedback text, protocol notes, and capture coordinates when present. A segmentation overlay is included when the model returns one.

## Important implementation notes

The screening output is an early-warning support result. The report deliberately does not present itself as a diagnosis, and the UI carries the same limitation. The existing supplied ML weights are preserved in `backend/models/` and `backend/app/ml_engine/weights/`.
