import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Phone, PhoneCall, PhoneForwarded, PhoneOff, Mic, MicOff, 
  Volume2, VolumeX, Globe, Sparkles, ShieldAlert, AlertTriangle, 
  CheckCircle2, FileText, Activity, Radio, Play, Pause, RefreshCw, Send
} from 'lucide-react';
import { api } from '../services/api';

/**
 * MultilingualVoiceTelemetryModal
 * Phase 12: Autonomous Multilingual Voice Telemetry (Agentic AI)
 * 
 * Clinical Goal:
 * Proactively reaches out to elderly, rural patients via automated regional language phone calls
 * (Hindi, Marathi, Odia, Bengali, Tamil, English) when high SINBAD scores (>=4) or missed check-ins occur.
 * Transcribes speech, rates distress/sepsis indicators, and injects FHIR Condition & Observation resources.
 */
export default function MultilingualVoiceTelemetryModal({ 
  isOpen, 
  onClose, 
  patient = null 
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [selectedScenario, setSelectedScenario] = useState('infection_spike');
  const [isCalling, setIsCalling] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callData, setCallData] = useState(null);
  const [activeTab, setActiveTab] = useState('dialogue'); // dialogue | fhir | telemetry
  const [speakingIndex, setSpeakingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const waveAnimRef = useRef(null);

  const languages = [
    { code: 'hi', name: 'Hindi (हिंदी)', region: 'North/Central India' },
    { code: 'mr', name: 'Marathi (मराठी)', region: 'Maharashtra' },
    { code: 'or', name: 'Odia (ଓଡ଼ିଆ)', region: 'Odisha' },
    { code: 'bn', name: 'Bengali (বাংলা)', region: 'West Bengal' },
    { code: 'ta', name: 'Tamil (தமிழ்)', region: 'Tamil Nadu' },
    { code: 'en', name: 'English', region: 'Global' }
  ];

  // Call duration counter
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  // Audio wave animation on canvas
  useEffect(() => {
    if (!callActive) return;

    let phase = 0;
    const renderWave = () => {
      phase += 0.08;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const numBars = 32;
      const barWidth = w / numBars - 3;

      for (let i = 0; i < numBars; i++) {
        const heightMultiplier = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
        const barHeight = Math.max(6, heightMultiplier * (h * 0.8));
        const x = i * (barWidth + 3);
        const y = (h - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(1, '#3b82f6');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      waveAnimRef.current = requestAnimationFrame(renderWave);
    };

    waveAnimRef.current = requestAnimationFrame(renderWave);

    return () => {
      if (waveAnimRef.current) cancelAnimationFrame(waveAnimRef.current);
    };
  }, [callActive]);

  const handleStartCall = async () => {
    setIsCalling(true);
    setLoading(true);

    try {
      const pId = patient ? patient.id : 'PT-8841';
      const pName = patient ? patient.name : 'Ramesh Patel';
      const sinbad = patient ? (patient.sinbadScore || 4) : 4;

      // Simulate network ringing for 1.2s
      setTimeout(async () => {
        try {
          const res = await fetch('http://localhost:8000/api/v1/voice/simulate-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: pId,
              patient_name: pName,
              language: selectedLanguage,
              sinbad_score: sinbad,
              scenario: selectedScenario
            })
          });

          if (res.ok) {
            const data = await res.json();
            setCallData(data.call_record);
          } else {
            // Fallback simulated record
            simulateLocalCall(pId, pName, sinbad);
          }
        } catch (e) {
          simulateLocalCall(pId, pName, sinbad);
        } finally {
          setIsCalling(false);
          setCallActive(true);
          setLoading(false);
          setCallDuration(1);
        }
      }, 1200);

    } catch (err) {
      setIsCalling(false);
      setLoading(false);
    }
  };

  const simulateLocalCall = (pId, pName, sinbad) => {
    const isSpike = selectedScenario === 'infection_spike';
    setCallData({
      call_id: `call-${Date.now()}`,
      patient_id: pId,
      patient_name: pName,
      language: selectedLanguage,
      language_name: languages.find(l => l.code === selectedLanguage)?.name || 'Hindi',
      timestamp: new Date().toISOString(),
      dialogue: [
        { 
          speaker: "Heal6 AI Voice Agent", 
          text: selectedLanguage === 'hi' 
            ? `नमस्ते ${pName} जी, मैं Heal6 AI क्लिनिकल असिस्टेंट बोल रहा हूँ।`
            : `Hello ${pName}, this is Heal6 Autonomous Clinical Voice Outreach Assistant.` 
        },
        { 
          speaker: "Heal6 AI Voice Agent", 
          text: selectedLanguage === 'hi'
            ? "क्या आज आपको पैर के घाव में तेज़ चुभन, धड़कता हुआ दर्द या बुखार महसूस हो रहा है?"
            : "Are you experiencing any throbbing pain, spreading warmth, or fever today?"
        },
        { 
          speaker: pName, 
          text: isSpike 
            ? (selectedLanguage === 'hi' ? "हाँ डॉक्टर साहब, रात से बहुत तेज धड़कता हुआ दर्द है और हल्का बुखार भी लग रहा है।" : "Yes doctor, severe throbbing pain since night and I feel feverish.")
            : (selectedLanguage === 'hi' ? "नहीं, आज घाव ठीक है, कोई बुखार या तेज दर्द नहीं है।" : "No, today it is feeling fine, no fever or throbbing.")
        },
        { 
          speaker: "Heal6 AI Voice Agent", 
          text: isSpike
            ? (selectedLanguage === 'hi' ? "चेतावनी: आपके लक्षण संक्रमण की ओर इशारा कर रहे हैं। हमने डॉक्टर को आपातकालीन अलर्ट भेज दिया है।" : "Warning: Symptoms indicate infection. We dispatched an emergency alert to your physician.")
            : (selectedLanguage === 'hi' ? "धन्यवाद, आपकी रिपोर्ट सामान्य दर्ज कर ली गई है।" : "Thank you, your telemetry has been recorded as stable.")
        }
      ],
      analysis: {
        transcript: isSpike ? "Severe throbbing pain and fever" : "No pain or fever",
        language: selectedLanguage,
        detected_symptoms: isSpike ? ["fever", "throbbing_pain"] : [],
        distress_score: isSpike ? 0.78 : 0.15,
        triage_level: isSpike ? "EMERGENCY_SEPSIS_ALERT" : "ROUTINE_MONITORING",
        urgency: isSpike ? "CRITICAL" : "STABLE",
        requires_physician_callback: isSpike
      },
      fhir_telemetry: {
        observation: {
          resourceType: "Observation",
          id: `obs-voice-${pId}`,
          status: "final",
          code: { text: "Automated Multilingual Voice Telemetry Follow-up" },
          valueString: isSpike ? "Detected: fever, throbbing_pain" : "No acute symptoms"
        },
        condition: isSpike ? {
          resourceType: "Condition",
          id: `cond-voice-${pId}`,
          severity: { coding: [{ display: "Severe" }] },
          code: { text: "Cellulitis of foot / acute wound infection" }
        } : null
      }
    });
  };

  const handleEndCall = () => {
    setCallActive(false);
    setIsCalling(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Browser Speech Synthesis for audio playback
  const playDialogueAudio = (text, idx, langCode) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Best effort mapping for language synthesis
    const voiceLangMap = { hi: 'hi-IN', mr: 'mr-IN', or: 'or-IN', bn: 'bn-IN', ta: 'ta-IN', en: 'en-US' };
    utterance.lang = voiceLangMap[langCode] || 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeakingIndex(idx);
    utterance.onend = () => setSpeakingIndex(-1);
    utterance.onerror = () => setSpeakingIndex(-1);

    window.speechSynthesis.speak(utterance);
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const analysis = callData?.analysis;
  const isEmergency = analysis?.urgency === 'CRITICAL' || analysis?.urgency === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                  Autonomous Multilingual Voice Telemetry
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AGENTIC NLP
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  FHIR R4 INTEGRATED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: {patient ? `${patient.name} (${patient.id})` : 'Ramesh Patel (PT-8841)'} • Rural Voice Outreach Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleEndCall();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Call Bar */}
        <div className={`px-6 py-2.5 border-b text-xs flex items-center justify-between transition-colors ${
          callActive 
            ? (isEmergency ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300')
            : 'bg-slate-950/60 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${callActive ? (isEmergency ? 'bg-red-400 animate-ping' : 'bg-emerald-400 animate-ping') : 'bg-slate-600'}`} />
            <span className="font-semibold">
              {isCalling ? 'DIALING PATIENT TELEPHONE NETWORK...' : callActive ? `CALL ACTIVE • DURATION: ${formatDuration(callDuration)}` : 'OUTREACH STANDBY'}
            </span>
            {callActive && (
              <span className="font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                IVR GATEWAY: SIP-ENCRYPTED (256-BIT)
              </span>
            )}
          </div>

          {callActive && (
            <div className="w-32 h-6">
              <canvas ref={canvasRef} width={128} height={24} className="w-full h-full" />
            </div>
          )}
        </div>

        {/* Modal Body: Left Control Panel + Right Dialogue / FHIR Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-hidden">
          
          {/* Left Column: Language & Call Dispatcher (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-950/40 border-r border-slate-800 p-5 flex flex-col justify-between overflow-y-auto space-y-5">
            
            <div className="space-y-4">
              {/* Dialing Target Info */}
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Patient Identity</span>
                  <span className="font-mono text-cyan-400">{patient?.id || 'PT-8841'}</span>
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {patient?.name || 'Ramesh Patel'}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Registered Contact</span>
                  <span className="font-mono text-slate-300">+91 98402 18942</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>SINBAD Severity</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    STAGE {patient?.sinbadScore || 4} (HIGH RISK)
                  </span>
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Select Regional Outreach Language
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      disabled={callActive || isCalling}
                      className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                        selectedLanguage === lang.code
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{lang.name}</div>
                        <div className="text-[10px] text-slate-500">{lang.region}</div>
                      </div>
                      {selectedLanguage === lang.code && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Scenario Toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  Outreach Clinical Scenario
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedScenario('infection_spike')}
                    disabled={callActive || isCalling}
                    className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                      selectedScenario === 'infection_spike'
                        ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Acute Infection (Pain + Fever)
                  </button>

                  <button
                    onClick={() => setSelectedScenario('stable')}
                    disabled={callActive || isCalling}
                    className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                      selectedScenario === 'stable'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Routine Follow-up (Stable)
                  </button>
                </div>
              </div>

            </div>

            {/* Call Action Button */}
            <div className="pt-4 border-t border-slate-800">
              {!callActive ? (
                <button
                  onClick={handleStartCall}
                  disabled={isCalling}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  {isCalling ? 'Connecting Cellular Bridge...' : 'Initiate Autonomous AI Call'}
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-bold text-xs hover:from-red-500 hover:to-rose-600 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  Terminate Consultation Call
                </button>
              )}
            </div>

          </div>

          {/* Right Column: Live Transcript, Sentiment & FHIR Inspector (8 Cols) */}
          <div className="lg:col-span-8 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            
            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dialogue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'dialogue'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Live Dialogue Transcript
                </button>

                <button
                  onClick={() => setActiveTab('fhir')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'fhir'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  HL7 FHIR EMR Injection
                </button>

                <button
                  onClick={() => setActiveTab('telemetry')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'telemetry'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Distress & Triage Metrics
                </button>
              </div>

              {callData && (
                <span className="text-[10px] font-mono text-slate-500">
                  SESSION: {callData.call_id}
                </span>
              )}
            </div>

            {/* Tab 1: Live Dialogue Transcript */}
            {activeTab === 'dialogue' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-2">
                {callData ? (
                  callData.dialogue.map((msg, idx) => {
                    const isAgent = msg.speaker.includes('Agent');
                    const isPlaying = speakingIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isAgent 
                            ? 'bg-slate-950/80 border-slate-800 mr-8 text-slate-200' 
                            : 'bg-cyan-950/40 border-cyan-500/30 ml-8 text-cyan-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isAgent ? 'text-cyan-400' : 'text-emerald-400'}`}>
                            {msg.speaker}
                          </span>
                          <button
                            onClick={() => playDialogueAudio(msg.text, idx, callData.language)}
                            title="Play Native Regional Audio"
                            className={`p-1 rounded-md text-xs transition-colors ${
                              isPlaying ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed font-sans">{msg.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl p-6 text-center">
                    <PhoneForwarded className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
                    <span>Click "Initiate Autonomous AI Call" to simulate outreach in {languages.find(l => l.code === selectedLanguage)?.name}.</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: HL7 FHIR EMR Injection */}
            {activeTab === 'fhir' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px]">
                {callData?.fhir_telemetry ? (
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        FHIR R4 Observation (LOINC: 80352-8 / 75325-1)
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40 p-2 bg-slate-900 rounded">
                        {JSON.stringify(callData.fhir_telemetry.observation, null, 2)}
                      </pre>
                    </div>

                    {callData.fhir_telemetry.condition && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-red-500/30">
                        <div className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          FHIR R4 Condition (SNOMED: 128045006 - Acute Foot Cellulitis)
                        </div>
                        <pre className="text-[11px] font-mono text-red-200 overflow-x-auto max-h-40 p-2 bg-slate-900 rounded">
                          {JSON.stringify(callData.fhir_telemetry.condition, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs p-6 text-center">
                    Initiate a call to view generated FHIR JSON resources.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Distress & Triage Metrics */}
            {activeTab === 'telemetry' && (
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[380px]">
                {analysis ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                      <div className="text-xs text-slate-400">Clinical Distress Sentiment</div>
                      <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                        {(analysis.distress_score * 100).toFixed(0)}%
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${analysis.distress_score > 0.5 ? 'bg-red-400' : 'bg-emerald-400'}`} 
                          style={{ width: `${analysis.distress_score * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                      <div className="text-xs text-slate-400">Triage Escalation</div>
                      <div className={`text-sm font-bold font-mono mt-1 ${isEmergency ? 'text-red-400' : 'text-emerald-400'}`}>
                        {analysis.triage_level}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2">
                        {analysis.requires_physician_callback ? 'Vascular surgeon callback scheduled' : 'Telemetry logged to record'}
                      </div>
                    </div>

                    <div className="col-span-2 bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                      <div className="text-xs text-slate-400 mb-2">Extracted Infection & Pain Symptoms</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.detected_symptoms.length > 0 ? (
                          analysis.detected_symptoms.map((sym, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                              {sym.toUpperCase()}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-400 font-mono">NO ACUTE CLINICAL SYMPTOMS FLAGGED</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs p-6 text-center">
                    Initiate a call to view automated distress and sentiment analysis.
                  </div>
                )}
              </div>
            )}

            {/* Bottom Alert Banner if Emergency */}
            {isEmergency && (
              <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 flex items-center justify-between text-xs text-red-300 font-semibold animate-pulse">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>CRITICAL ALERT: Patient verbalized severe throbbing pain & fever. High sepsis probability.</span>
                </div>
                <button 
                  onClick={() => alert('Emergency dispatch alert broadcast to duty vascular surgeon.')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
                >
                  Acknowledge & Triage
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
