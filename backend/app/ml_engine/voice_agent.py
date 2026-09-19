"""
Heal6 Voice Agent Engine
Phase 12: Autonomous Multilingual Voice Telemetry (Agentic AI)

Clinical Goal:
Automates follow-up for elderly/rural patients unable to type or navigate apps.
Provides outbound multilingual telephone outreach in Hindi, Marathi, Odia, Bengali, Tamil,
and English. Analyzes verbal responses for distress, throbbing pain, and sepsis warning signs,
and generates HL7 FHIR Condition / Observation EMR records.
"""

import datetime
import re
from typing import Dict, Any, List, Optional

# Multilingual Outreach Script Repository
OUTREACH_SCRIPTS: Dict[str, Dict[str, str]] = {
    "hi": {
        "greeting": "नमस्ते {name} जी, मैं Heal6 AI क्लिनिकल असिस्टेंट बोल रहा हूँ।",
        "question_pain_fever": "क्या आज आपको पैर के घाव में तेज़ चुभन, धड़कता हुआ दर्द या बुखार महसूस हो रहा है?",
        "question_drainage": "क्या घाव से कोई बदबूदार मवाद या पीला पानी बह रहा है?",
        "closing_safe": "धन्यवाद रमेश जी, आपके लक्षण सामान्य लग रहे हैं। डॉक्टर को रिपोर्ट भेज दी गई है।",
        "closing_urgent": "चेतावनी: आपके लक्षण संक्रमण की ओर इशारा कर रहे हैं। हमने डॉक्टर को आपातकालीन अलर्ट भेज दिया है। कृपया तुरंत अस्पताल जाएं।"
    },
    "mr": {
        "greeting": "नमस्कार {name}, मी Heal6 AI क्लिनिकल सहाय्यक बोलत आहे.",
        "question_pain_fever": "आज तुम्हाला पायाच्या जखमेत ठसठस, तीव्र वेदना किंवा ताप जाणवत आहे का?",
        "question_drainage": "जखमेतून दुर्गंधीयुक्त पू किंवा पिवळे पाणी येत आहे का?",
        "closing_safe": "धन्यवाद, तुमची प्रकृती स्थिर वाटत आहे. डॉक्टरांना माहिती दिली आहे.",
        "closing_urgent": "सावधान: हे गंभीर संसर्गाचे लक्षण असू शकते. डॉक्टरांना तात्काळ अलर्ट पाठवला आहे. लगेच दवाखान्यात जा."
    },
    "or": {
        "greeting": "ନମସ୍କାର {name}, ମୁଁ Heal6 AI କ୍ଲିନିକାଲ୍ ଭଏସ୍ ସହାୟକ କହୁଛି।",
        "question_pain_fever": "ଆଜି ଆପଣଙ୍କ ପାଦ କ୍ଷତରେ କୌଣସି ପ୍ରବଳ ଯନ୍ତ୍ରଣା ବା ଜ୍ୱର ଅନୁଭବ ହେଉଛି କି?",
        "question_drainage": "ଘାଆରୁ କୌଣସି ଦୁର୍ଗନ୍ଧଯୁକ୍ତ ପୂଜ କିମ୍ବା ହଳଦିଆ ପାଣି ବାହାରୁଛି କି?",
        "closing_safe": "ଧନ୍ୟବାଦ, ଆପଣଙ୍କ ଲକ୍ଷଣ ସ୍ୱାଭାବିକ ଅଛି। ଡାକ୍ତରଙ୍କୁ ରିପୋର୍ଟ ପଠାଗଲା।",
        "closing_urgent": "ସାବଧାନ: ସଂକ୍ରମଣର ଲକ୍ଷଣ ଦେଖାଯାଉଛି। ଡାକ୍ତରଙ୍କୁ ଜରୁରୀ ସୂଚନା ଦିଆଯାଇଛି।"
    },
    "bn": {
        "greeting": "নমস্কার {name}, আমি Heal6 ক্লিনিক্যাল ভয়েস অ্যাসিস্ট্যান্ট বলছি।",
        "question_pain_fever": "আজ কি আপনার পায়ের ঘায়ে তীব্র টনটন করা ব্যথা বা জ্বর অনুভব হচ্ছে?",
        "question_drainage": "ঘা থেকে কি কোনো দুর্গন্ধযুক্ত পুঁজ বা হলুদ তরল বের হচ্ছে?",
        "closing_safe": "ধন্যবাদ, আপনার লক্ষণগুলি স্বাভাবিক রয়েছে। ডাক্তারকে আপডেট করা হয়েছে।",
        "closing_urgent": "সতর্কতা: এটি সংক্রমণের লক্ষণ হতে পারে। অবিলম্বে হাসপাতালে যোগাযোগ করুন।"
    },
    "ta": {
        "greeting": "வணக்கம் {name}, நான் Heal6 மருத்துவ குரல் உதவியாளர் பேசுகிறேன்.",
        "question_pain_fever": "இன்று உங்கள் காலில் கடுமையான துடிக்கும் வலி அல்லது காய்ச்சல் உள்ளதா?",
        "question_drainage": "புண்ணிலிருந்து துர்நாற்றமுள்ள சீழ் அல்லது நீர் வழிகிறதா?",
        "closing_safe": "நன்றி, உங்கள் நிலை சீராக உள்ளது. மருத்துவருக்கு அறிக்கை அனுப்பப்பட்டது.",
        "closing_urgent": "எச்சரிக்கை: தொற்று பரவும் அபாயம் உள்ளது. உடனடியாக மருத்துவமனைக்கு செல்லவும்."
    },
    "en": {
        "greeting": "Hello {name}, this is the Heal6 Autonomous Clinical Voice Outreach Assistant.",
        "question_pain_fever": "Are you experiencing any throbbing pain, spreading warmth, or fever today?",
        "question_drainage": "Is there any foul odor, yellow pus, or increasing fluid leaking from your foot wound?",
        "closing_safe": "Thank you. Your telemetry has been recorded as stable and submitted to your physician.",
        "closing_urgent": "URGENT CLINICAL DIRECTIVE: Symptoms indicate potential acute infection or early sepsis. An emergency alert has been dispatched to your vascular surgeon."
    }
}

# Symptom NLP vocabulary with multilingual synonyms
SYMPTOM_LEXICON = {
    "fever": ["fever", "bukhar", "taap", "tap", "jwar", "jor", "kaichal", "temperature", "chills", " shivering", "कांपना"],
    "throbbing_pain": ["throbbing", "severe pain", "dard", "peeda", "vedna", "thas-thas", "thas thas", "ton-ton", "kashta", "vali", "unbearable"],
    "purulent_drainage": ["pus", "drainage", "mavad", "peev", "puzh", "pooj", "yellow fluid", "discharge", "leaking"],
    "malodor": ["foul smell", "odor", "bad smell", "badbu", "durgandh", "gandh", "stink", "smelly"],
    "spreading_erythema": ["redness", "spreading", "lal", "laal", "red", "swelling", "sujan", "sooj", "warmth", "garm"]
}

class ClinicalVoiceAgent:
    """Agentic AI Orchestrator for Multilingual Patient Follow-up"""

    def __init__(self):
        self.call_history: List[Dict[str, Any]] = []

    def get_prompt_script(self, language: str = "en", patient_name: str = "Patient") -> Dict[str, str]:
        lang = language.lower() if language.lower() in OUTREACH_SCRIPTS else "en"
        script = OUTREACH_SCRIPTS[lang].copy()
        for key in script:
            script[key] = script[key].format(name=patient_name)
        return script

    def analyze_patient_speech(
        self,
        transcript_text: str,
        language: str = "en",
        sinbad_score: int = 3
    ) -> Dict[str, Any]:
        """
        Extracts clinical infection markers and calculates distress sentiment from speech.
        """
        text_lower = transcript_text.lower()
        detected_symptoms = []

        for symptom, keywords in SYMPTOM_LEXICON.items():
            for kw in keywords:
                if kw in text_lower:
                    detected_symptoms.append(symptom)
                    break

        # Distress scoring
        distress_weight = 0.0
        if "fever" in detected_symptoms:
            distress_weight += 0.35
        if "throbbing_pain" in detected_symptoms:
            distress_weight += 0.30
        if "purulent_drainage" in detected_symptoms:
            distress_weight += 0.25
        if "malodor" in detected_symptoms:
            distress_weight += 0.20
        if "spreading_erythema" in detected_symptoms:
            distress_weight += 0.25

        # Base distress from baseline SINBAD
        distress_score = min(1.0, (distress_weight + (sinbad_score * 0.08)))

        # Triage determination
        if distress_score >= 0.65 or "fever" in detected_symptoms and "throbbing_pain" in detected_symptoms:
            triage_level = "EMERGENCY_SEPSIS_ALERT"
            urgency = "CRITICAL"
        elif distress_score >= 0.35 or len(detected_symptoms) > 0:
            triage_level = "URGENT_CLINICAL_EVALUATION"
            urgency = "HIGH"
        else:
            triage_level = "ROUTINE_MONITORING"
            urgency = "STABLE"

        return {
            "transcript": transcript_text,
            "language": language,
            "detected_symptoms": detected_symptoms,
            "distress_score": round(distress_score, 2),
            "triage_level": triage_level,
            "urgency": urgency,
            "requires_physician_callback": urgency in ["HIGH", "CRITICAL"]
        }

    def generate_fhir_telemetry_resources(
        self,
        patient_id: str,
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Injects verbal tele-survey outcomes into standard HL7 FHIR R4 Condition & Observation JSON.
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        obs_id = f"obs-voice-{patient_id}-{int(datetime.datetime.now().timestamp())}"
        cond_id = f"cond-voice-{patient_id}-{int(datetime.datetime.now().timestamp())}"

        # FHIR Observation (Wound Symptom Tele-report)
        observation = {
            "resourceType": "Observation",
            "id": obs_id,
            "status": "final",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "survey",
                    "display": "Survey"
                }]
            }],
            "code": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "80352-8",
                    "display": "Wound assessment panel"
                }],
                "text": "Automated Multilingual Voice Telemetry Follow-up"
            },
            "subject": {"reference": f"Patient/{patient_id}"},
            "effectiveDateTime": now_iso,
            "valueString": f"Detected: {', '.join(analysis['detected_symptoms']) if analysis['detected_symptoms'] else 'No acute symptoms'}",
            "component": [
                {
                    "code": {
                        "coding": [{"system": "http://loinc.org", "code": "75325-1", "display": "Symptom distress level"}]
                    },
                    "valueQuantity": {
                        "value": analysis["distress_score"] * 100,
                        "unit": "%",
                        "system": "http://unitsofmeasure.org",
                        "code": "%"
                    }
                }
            ]
        }

        # FHIR Condition (if critical/urgent)
        condition = None
        if analysis["urgency"] in ["HIGH", "CRITICAL"]:
            condition = {
                "resourceType": "Condition",
                "id": cond_id,
                "clinicalStatus": {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
                },
                "verificationStatus": {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": "provisional"}]
                },
                "category": [{
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-category", "code": "encounter-diagnosis"}]
                }],
                "severity": {
                    "coding": [{
                        "system": "http://snomed.info/sct",
                        "code": "24484000" if analysis["urgency"] == "CRITICAL" else "6736007",
                        "display": "Severe" if analysis["urgency"] == "CRITICAL" else "Moderate"
                    }]
                },
                "code": {
                    "coding": [{
                        "system": "http://snomed.info/sct",
                        "code": "128045006",
                        "display": "Cellulitis of foot / acute wound infection"
                    }],
                    "text": "Acute DFU Exacerbation flagged via Multilingual Voice Telemetry"
                },
                "subject": {"reference": f"Patient/{patient_id}"},
                "recordedDate": now_iso
            }

        return {
            "observation": observation,
            "condition": condition,
            "patient_id": patient_id,
            "timestamp": now_iso
        }

    def simulate_call(
        self,
        patient_id: str,
        patient_name: str,
        language: str = "hi",
        sinbad_score: int = 4,
        scenario: str = "infection_spike"
    ) -> Dict[str, Any]:
        """
        Executes an end-to-end simulated autonomous voice call with transcription & FHIR generation.
        """
        scripts = self.get_prompt_script(language, patient_name)

        # Realistic patient verbal responses based on scenario
        sample_responses = {
            "infection_spike": {
                "hi": "हाँ डॉक्टर साहब, रात से पैर में बहुत तेज चुभन और धड़कता हुआ दर्द है, और मुझे हल्का बुखार भी लग रहा है।",
                "mr": "हो डॉक्टर, काल रात्रीपासून पायात खूप ठसठस लागली आहे आणि अंगात बारीक ताप पण आहे.",
                "or": "ହଁ ଡାକ୍ତରବାବୁ, ଗତକାଲି ରାତିରୁ ପାଦରେ ପ୍ରବଳ ଯନ୍ତ୍ରଣା ହେଉଛି ଆଉ ଦେହ ଗରମ ଲାଗୁଛି।",
                "bn": "হ্যাঁ ডাক্তারবাবু, কাল রাত থেকে পায়ে খুব টনটন করছে এবং গা গরম লাগছে।",
                "ta": "ஆமாம் டாக்டர், நேற்றிரவு முதல் காலில் கடுமையான வலி உள்ளது, உடம்பும் சுடுகிறது.",
                "en": "Yes doctor, since last night there is severe throbbing pain in my foot and I feel feverish with chills."
            },
            "stable": {
                "hi": "नहीं, आज कोई ज्यादा दर्द नहीं है, घाव साफ है और कोई बुखार नहीं है।",
                "mr": "नाही, आज काही त्रास नाही, जखम स्वच्छ आहे आणि ताप नाही.",
                "or": "ନାହିଁ, ଆଜି କୌଣସି ବିଶେଷ କଷ୍ଟ ନାହିଁ, ଜ୍ୱର ମଧ୍ୟ ନାହିଁ।",
                "bn": "না, আজ বিশেষ কোনো ব্যথা নেই, জ্বরও আসেনি।",
                "ta": "இல்லை, இன்று வலி எதுவும் இல்லை, காய்ச்சலும் இல்லை.",
                "en": "No, I am doing fine today. The dressing is clean, no fever or throbbing pain."
            }
        }

        lang_code = language.lower() if language.lower() in sample_responses[scenario] else "en"
        patient_spoken_text = sample_responses.get(scenario, {}).get(lang_code, sample_responses["stable"]["en"])

        analysis = self.analyze_patient_speech(patient_spoken_text, language=lang_code, sinbad_score=sinbad_score)
        fhir_data = self.generate_fhir_telemetry_resources(patient_id, analysis)

        closing_statement = scripts["closing_urgent"] if analysis["urgency"] in ["HIGH", "CRITICAL"] else scripts["closing_safe"]

        call_record = {
            "call_id": f"call-{int(datetime.datetime.now().timestamp())}",
            "patient_id": patient_id,
            "patient_name": patient_name,
            "language": lang_code,
            "language_name": {"hi": "Hindi", "mr": "Marathi", "or": "Odia", "bn": "Bengali", "ta": "Tamil", "en": "English"}.get(lang_code, "English"),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "dialogue": [
                {"speaker": "Heal6 AI Voice Agent", "text": scripts["greeting"]},
                {"speaker": "Heal6 AI Voice Agent", "text": scripts["question_pain_fever"]},
                {"speaker": patient_name, "text": patient_spoken_text},
                {"speaker": "Heal6 AI Voice Agent", "text": closing_statement}
            ],
            "analysis": analysis,
            "fhir_telemetry": fhir_data
        }

        self.call_history.insert(0, call_record)
        return call_record


# Singleton instance
clinical_voice_agent = ClinicalVoiceAgent()
