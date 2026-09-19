# Heal6 Mobile (Expo)

The mobile app now uses the screenshot-inspired dashboard as the signed-in home page and is wired to the bundled FastAPI backend.

## Main flow

`Auth -> Profile Setup (first login) -> Home -> Scan -> Clinical intake -> AI/SINBAD analysis -> Result -> PDF`

Bottom navigation: Home, Scan, Reports, Guide, Profile.

## Authentication

Test account:
- Email: `test@heal6.app`
- Password: `Heal6@123`

Google sign-in is wired through `expo-auth-session`. Supply the three `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` values in `.env`, and the backend must accept the same client IDs through `HEAL6_GOOGLE_CLIENT_IDS`.

## Profile

The profile stores name, age, gender, date of birth, height, weight, blood group, diabetes type and duration, previous ulcer status, symptoms, allergies, phone, and emergency contact. The same data is attached to each server-side report.

## Language

English, Hindi, and Odia are persisted in AsyncStorage. Core dashboard/settings/guide/tutorial labels switch immediately.

## Report generation

The result screen can ask the backend for a short-lived PDF link. The backend generates a PDF containing the captured image and the screening payload, with both a unique assessment ID and a separate human-readable report number.
