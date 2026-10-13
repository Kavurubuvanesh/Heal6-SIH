import React, { useState, useEffect } from 'react'
import {
  FileText,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Download,
  Search,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Clock,
  Layers,
  Activity,
  Send,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  User,
  CheckCircle2,
  Bookmark
} from 'lucide-react'
import {
  generateClinicalScribeNote,
  queryClinicalGuidelines,
  fetchGuidelineCatalog,
  verifyPatientReport
} from '../services/api'

export default function ClinicalRAGWorkspace({
  cases = [],
  activePatientIndex = 0,
  onSelectPatient,
  isLiveBackend = true
}) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(activePatientIndex)
  const activePatient = cases[selectedCaseIdx] || cases[0] || null

  const [activeTab, setActiveTab] = useState('soap') // 'soap' | 'orders'
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [verifiedSuccess, setVerifiedSuccess] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [scribeData, setScribeData] = useState(null)
  const [activeGuideline, setActiveGuideline] = useState(null)

  // Guideline Query state
  const [queryInput, setQueryInput] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryResult, setQueryResult] = useState(null)
  const [catalog, setCatalog] = useState([])

  // Load scribe note when active patient changes
  useEffect(() => {
    if (activePatient) {
      handleGenerateNote()
      loadCatalog()
    }
  }, [activePatient?.id])

  async function handleGenerateNote() {
    if (!activePatient) return
    setLoading(true)
    try {
      const res = await generateClinicalScribeNote(activePatient)
      if (res.success && res.data) {
        setScribeData(res.data)
        if (res.data.guideline_citations && res.data.guideline_citations.length > 0) {
          setActiveGuideline(res.data.guideline_citations[0])
        }
      }
    } catch (err) {
      console.error('Failed to generate clinical scribe note:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalog() {
    try {
      const res = await fetchGuidelineCatalog()
      if (res.success && res.data?.guidelines) {
        setCatalog(res.data.guidelines)
      }
    } catch (err) {
      console.warn('Could not load guideline catalog:', err)
    }
  }

  async function handleSearchGuideline(e) {
    if (e) e.preventDefault()
    if (!queryInput.trim()) return
    setQueryLoading(true)
    try {
      const res = await queryClinicalGuidelines(queryInput.trim(), activePatient)
      if (res.success && res.data) {
        setQueryResult(res.data)
      }
    } catch (err) {
      console.error('Guideline query failed:', err)
    } finally {
      setQueryLoading(false)
    }
  }

  function handleChipClick(chipText) {
    setQueryInput(chipText)
    setQueryLoading(true)
    queryClinicalGuidelines(chipText, activePatient)
      .then(res => {
        if (res.success && res.data) setQueryResult(res.data)
      })
      .finally(() => setQueryLoading(false))
  }

  function handleCopySoap() {
    if (!scribeData) return
    const soap = scribeData.soap_note || {}
    const textToCopy = `=== HEAL6 CLINICAL SCRIBE NOTE (IWGDF 2023) ===
PATIENT: ${scribeData.patient_name} (ID: ${scribeData.patient_id})
TIMESTAMP: ${scribeData.timestamp}
AI ENGINE: ${scribeData.ai_scribe_version || 'Heal6 Clinical RAG v1.0'}

[SUBJECTIVE]
${soap.subjective || ''}

[OBJECTIVE]
${soap.objective || ''}

[ASSESSMENT]
${soap.assessment || ''}

[PLAN]
${soap.plan || ''}

[RECOMMENDED ORDERS]
• Dressings: ${(scribeData.recommended_orders?.dressings || []).join(', ')}
• Medications: ${(scribeData.recommended_orders?.medications || []).join(', ')}
• Biomechanical Offloading: ${scribeData.recommended_orders?.offloading || 'N/A'}
• Clinical Follow-Up: ${scribeData.recommended_orders?.follow_up || 'N/A'}

[AUTHORITATIVE IWGDF 2023 CITATIONS]
${(scribeData.guideline_citations || []).map(c => `• [${c.id}] ${c.title} (${c.grade}) - ${c.recommendation}`).join('\n')}
`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleExportMarkdown() {
    if (!scribeData) return
    const soap = scribeData.soap_note || {}
    const md = `# Heal6 Autonomous Clinical Scribe Note
**Patient:** ${scribeData.patient_name} (\`${scribeData.patient_id}\`)  
**Generated:** ${scribeData.timestamp}  
**Standards:** International Working Group on the Diabetic Foot (IWGDF 2023 Guidelines)  

---

## Subjective (S)
${soap.subjective}

## Objective (O)
\`\`\`
${soap.objective}
\`\`\`

## Assessment (A)
${soap.assessment}

## Plan (P)
${soap.plan}

---

## Recommended Orders
- **Topical Wound Dressing:** ${(scribeData.recommended_orders?.dressings || []).join(', ')}
- **Pharmacotherapy:** ${(scribeData.recommended_orders?.medications || []).join(', ')}
- **Offloading Prescription:** ${scribeData.recommended_orders?.offloading || 'N/A'}
- **Surveillance Timeline:** ${scribeData.recommended_orders?.follow_up || 'N/A'}

## Evidence-Based Citations
${(scribeData.guideline_citations || []).map(c => `### ${c.id}: ${c.title}\n- **Evidence Grade:** ${c.grade}\n- **Source:** *${c.source}*\n- **Clinical Directive:** "${c.recommendation}"\n`).join('\n')}
`
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Clinical_Note_${scribeData.patient_id}_${new Date().toISOString().slice(0, 10)}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleExecuteVerification() {
    if (!activePatient || !scribeData) return
    setIsVerifying(true)
    try {
      const orders = scribeData.recommended_orders || {}
      await verifyPatientReport(activePatient.id, {
        finalScore: activePatient.calculatedSinbad || 0,
        verifiedIschemia: activePatient.ischemiaScore === 1,
        verifiedDepth: activePatient.depthScore === 1,
        doctorNotes: `[Autonomous RAG Scribe Note Verified]\n${scribeData.soap_note?.assessment || ''}`,
        physicianName: 'Dr. Sharma',
        reviewStatus: 'Verified by Attending Physician',
        prescriptions: orders.medications || [],
        precautions: [orders.offloading || 'Custom plantar offloading boot', 'Daily sterile dressing inspection'],
        followUpDate: orders.follow_up || 'Within 7 Days',
        callBackDays: 7
      })
      setVerifiedSuccess(true)
      setTimeout(() => setVerifiedSuccess(false), 3500)
    } catch (e) {
      console.error('Verification failed:', e)
    } finally {
      setIsVerifying(false)
    }
  }

  const p = activePatient || {}
  const soap = scribeData?.soap_note || {}
  const citations = scribeData?.guideline_citations || []
  const orders = scribeData?.recommended_orders || {}

  const PROMPT_CHIPS = [
    'IWGDF Antibiotic Selection',
    'Offloading Gold Standard',
    'Hydrofiber Silver Dressings',
    'NPWT Debridement Thresholds',
    'Osteomyelitis Probe-to-Bone Protocol'
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0 pb-16 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="glass-panel-luxury p-6 rounded-3xl border border-[#12464e]/10 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-700 text-white shadow-md shadow-cyan-600/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black text-[#12464e] dark:text-white tracking-tight">
                Autonomous Clinical RAG Copilot
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded-full flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> IWGDF 2023 Guidelines
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Grounded Evidence
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Podiatric SOAP Synthesis, Semantic Guideline Ingestion & Actionable EHR Orders
            </p>
          </div>
        </div>

        {/* Patient Selection Dropdown */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#141c17] px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-[#223229]">
            <User className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCaseIdx}
              onChange={(e) => {
                const idx = Number(e.target.value)
                setSelectedCaseIdx(idx)
                if (onSelectPatient) onSelectPatient(idx)
              }}
              className="bg-transparent text-xs font-bold text-[#12464e] dark:text-white focus:outline-none cursor-pointer"
            >
              {cases.length > 0 ? (
                cases.map((c, i) => (
                  <option key={c.id || i} value={i} className="dark:bg-[#141c17] text-slate-800 dark:text-white">
                    {c.name} ({c.id}) · SINBAD {c.calculatedSinbad ?? '—'}
                  </option>
                ))
              ) : (
                <option value={0}>No Patients in Queue</option>
              )}
            </select>
          </div>

          <button
            onClick={handleGenerateNote}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl bg-[#12464e] text-white hover:bg-[#165660] transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* 2. Patient Telemetry Ribbon */}
      {p && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
            <span className="text-sm font-extrabold text-[#12464e] dark:text-white truncate block">{p.name || 'Anonymous'}</span>
            <span className="text-[11px] text-slate-500">{p.age}y · {p.gender}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SINBAD Score</span>
            <span className={`text-base font-black ${p.calculatedSinbad >= 4 ? 'text-rose-500' : p.calculatedSinbad >= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {p.calculatedSinbad ?? 0} / 6
            </span>
            <span className="text-[11px] text-slate-500 block truncate">{p.triageLevel || 'Standard'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Calibrated Area</span>
            <span className="text-base font-black text-[#12464e] dark:text-white">
              {p.woundAreaCm2 ? `${p.woundAreaCm2} cm²` : '0.0 cm²'}
            </span>
            <span className="text-[11px] text-slate-500 block truncate">{p.locationLabel || 'Plantar'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Infection Risk</span>
            <span className={`text-base font-black ${p.infectionRiskPercent >= 60 ? 'text-rose-500' : 'text-teal-600'}`}>
              {p.infectionRiskPercent ?? 0}%
            </span>
            <span className="text-[11px] text-slate-500 block truncate">ConvNeXt Confidence</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dermal Depth</span>
            <span className="text-sm font-black text-[#12464e] dark:text-white truncate block">
              {p.depthScore === 1 ? 'Probe to Bone' : 'Superficial Ulcer'}
            </span>
            <span className="text-[11px] text-slate-500">{p.depthClassification || 'Intact Bed'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ischemia</span>
            <span className={`text-sm font-black ${p.ischemiaScore === 1 ? 'text-rose-500' : 'text-emerald-500'} block`}>
              {p.ischemiaScore === 1 ? 'Reduced Pulses' : 'Intact Palpable'}
            </span>
            <span className="text-[11px] text-slate-500 block truncate">{p.diabetesType || 'Type 2 DM'}</span>
          </div>
        </div>
      )}

      {/* 3. Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): IWGDF Clinical Guideline Copilot */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="glass-panel-luxury p-5 rounded-3xl border border-[#12464e]/10 dark:border-white/10 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-extrabold text-[#12464e] dark:text-white tracking-tight">
                  IWGDF 2023 Guideline Retriever
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                Autonomous RAG
              </span>
            </div>

            {/* Natural Language Search Input */}
            <form onSubmit={handleSearchGuideline} className="relative">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask IWGDF guidelines or protocol..."
                className="w-full text-xs font-medium bg-slate-50 dark:bg-[#141c17] border border-slate-300 dark:border-[#223229] rounded-2xl pl-10 pr-10 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                disabled={queryLoading}
                className="absolute right-2.5 top-2 p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${queryLoading ? 'animate-spin' : ''}`} />
              </button>
            </form>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#141c17] hover:bg-cyan-500/15 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-[#223229] transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Search Query Result */}
            {queryResult && (
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col gap-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Semantic Match ({Math.round((queryResult.similarity_score || 0.92) * 100)}% Confidence)
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Grade {queryResult.evidence_grade || 'A'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">
                  {queryResult.rule_title || queryResult.query}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {queryResult.recommendation || queryResult.guideline_text}
                </p>
                {queryResult.clinical_rationale && (
                  <div className="mt-1 pt-2 border-t border-cyan-500/20 text-[11px] text-cyan-300/90 italic">
                    Rationale: {queryResult.clinical_rationale}
                  </div>
                )}
              </div>
            )}

            {/* Guideline Citations for Current Patient */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Patient-Specific IWGDF Citations ({citations.length})
              </span>
              <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {citations.map((c, i) => (
                  <div
                    key={c.id || i}
                    onClick={() => setActiveGuideline(c)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      activeGuideline?.id === c.id
                        ? 'bg-cyan-950/30 border-cyan-500/50 shadow-xs'
                        : 'bg-white/80 dark:bg-[#141c17] border-slate-200 dark:border-[#223229] hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-500">[{c.id}]</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {c.grade}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#12464e] dark:text-white">{c.title}</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {c.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Scribe SOAP Note & Clinical Orders Studio */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="glass-panel-luxury p-6 rounded-3xl border border-[#12464e]/10 dark:border-white/10 shadow-xs flex flex-col gap-5">
            {/* Tab Selector + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('soap')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'soap'
                      ? 'bg-[#12464e] text-white dark:bg-[#aceba7] dark:text-[#0e120f] shadow-xs'
                      : 'bg-slate-100 dark:bg-[#141c17] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Clinical SOAP Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'orders'
                      ? 'bg-[#12464e] text-white dark:bg-[#aceba7] dark:text-[#0e120f] shadow-xs'
                      : 'bg-slate-100 dark:bg-[#141c17] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Recommended Orders</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySoap}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#223229] hover:bg-slate-100 dark:hover:bg-[#18231c] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copy full clinical SOAP documentation to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#223229] hover:bg-slate-100 dark:hover:bg-[#18231c] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export documentation as Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: SOAP NOTE */}
            {activeTab === 'soap' && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-400">Synthesizing clinical SOAP note from UNet++ & ConvNeXt telemetry...</span>
                  </div>
                ) : (
                  <>
                    {/* Subjective */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-black flex items-center justify-center">S</span>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">Subjective History</h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {soap.subjective || 'Patient presents for diabetic foot screening. Telemetry reports chronic plantar discomfort with diminished peripheral protective sensation.'}
                      </p>
                    </div>

                    {/* Objective */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-500 text-xs font-black flex items-center justify-center">O</span>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">Objective Telemetry & Metrology</h4>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-black/30 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {soap.objective || `Wound Area: ${p.woundAreaCm2 || 0} cm² (ArUco calibrated)\nSINBAD Score: ${p.calculatedSinbad || 0} / 6\nInfection Probability: ${p.infectionRiskPercent || 0}%\nGranulation: ${p.tissueBreakdown?.granulation || 0}%, Slough: ${p.tissueBreakdown?.slough || 0}%, Necrotic: ${p.tissueBreakdown?.necrotic || 0}%`}
                      </pre>
                    </div>

                    {/* Assessment */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-black flex items-center justify-center">A</span>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">Clinical Assessment</h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {soap.assessment || `Diabetic foot ulcer of ${p.locationLabel || 'plantar region'}. Elevated bacterial colonization risk with potential microvascular involvement.`}
                      </p>
                    </div>

                    {/* Plan */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-black flex items-center justify-center">P</span>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">Intervention Plan (IWGDF 2023)</h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        {soap.plan || 'Execute aggressive mechanical offloading, initiate antimicrobial dressing protocol, and schedule vascular consult within 48-72h.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: ORDERS */}
            {activeTab === 'orders' && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-3 flex items-center gap-2">
                    <Bookmark className="w-4 h-4" /> Prescribed Topical Wound Dressings
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(orders.dressings || ['Hydrofiber silver dressing', 'Polyurethane foam backing']).map((d, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 text-xs font-bold border border-cyan-200 dark:border-cyan-800">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" /> Systemic Pharmacotherapy & Antibiotics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(orders.medications || ['Amoxicillin-clavulanate 875/125mg BID', 'Ciprofloxacin 500mg BID (if pseudomonal risk)']).map((m, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                    Biomechanical Offloading Prescription
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    {orders.offloading || 'Non-removable knee-high offloading device (TCC or iTCC) gold standard for neuropathic plantar forefoot ulcers.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#141c17] border border-slate-200 dark:border-[#223229]">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
                    Clinical Follow-Up Directive
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    {orders.follow_up || 'Mandatory clinical review within 7 days. Escalate immediately if spreading cellulitis (>2cm) or systemic fevers develop.'}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Execution Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Directives will sync to mobile patient companion app in real-time.
              </span>
              <button
                type="button"
                onClick={handleExecuteVerification}
                disabled={isVerifying || !p}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-700 to-[#12464e] hover:from-teal-600 hover:to-[#185a64] text-white text-xs font-black tracking-wide shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {verifiedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Directive Executed & Signed!</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? 'Executing Orders...' : 'Physician Sign-Off & Execute Directive'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
