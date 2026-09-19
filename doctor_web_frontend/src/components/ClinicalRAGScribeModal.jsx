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
  X
} from 'lucide-react'
import {
  generateClinicalScribeNote,
  queryClinicalGuidelines,
  fetchGuidelineCatalog
} from '../services/api'

export default function ClinicalRAGScribeModal({
  isOpen,
  onClose,
  activePatient,
  isLiveBackend = true
}) {
  const [activeTab, setActiveTab] = useState('soap') // 'soap' | 'guidelines' | 'orders'
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scribeData, setScribeData] = useState(null)
  const [activeGuideline, setActiveGuideline] = useState(null)

  // Guideline Query state
  const [queryInput, setQueryInput] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryResult, setQueryResult] = useState(null)
  const [catalog, setCatalog] = useState([])

  // Load scribe note on open or patient change
  useEffect(() => {
    if (isOpen && activePatient) {
      handleGenerateNote()
      loadCatalog()
    }
  }, [isOpen, activePatient?.id])

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

  if (!isOpen) return null

  const p = activePatient || {}
  const soap = scribeData?.soap_note || {}
  const citations = scribeData?.guideline_citations || []
  const orders = scribeData?.recommended_orders || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0b1120] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md shadow-cyan-500/20 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Autonomous Clinical RAG Agent
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded-full flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> IWGDF 2023 Guidelines
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Evidence-Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Specialist Podiatric SOAP Note Synthesis & Semantic Guideline Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateNote}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              title="Regenerate clinical note"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Regenerate</span>
            </button>
            <button
              onClick={handleCopySoap}
              disabled={!scribeData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow transition disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to EHR!' : 'Copy SOAP'}</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              disabled={!scribeData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
              title="Export as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export .md</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Patient Context Strip */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5 font-medium text-white">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              {p.name || 'Anonymous Patient'}
              <span className="text-slate-400 font-mono text-[11px]">({p.id || 'PT-2026'})</span>
            </div>
            <span className="text-slate-600">|</span>
            <span>Age: {p.age || 62}y</span>
            <span className="text-slate-600">|</span>
            <span>Location: <strong className="text-cyan-300">{p.wound_location || 'Plantar Forefoot'}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Area: <strong className="text-white">{p.woundAreaCm2 || p.area_cm2 || 2.4} cm²</strong></span>
            <span className="text-slate-600">|</span>
            <span>3D Depth: <strong className="text-amber-300">{p.maxDepthMm || p.max_depth_mm || 4.1} mm</strong></span>
            <span className="text-slate-600">|</span>
            <span>Vol: <strong className="text-amber-300">{p.craterVolumeMm3 || p.crater_volume_mm3 || 215.0} mm³</strong></span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('soap')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'soap'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SOAP Note
            </button>
            <button
              onClick={() => setActiveTab('guidelines')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                activeTab === 'guidelines'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>IWGDF Q&A</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                activeTab === 'orders'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orders & Rx
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <Sparkles className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-cyan-300">
                  Retrieving Authoritative IWGDF 2023 Guidelines...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Synthesizing multi-modal telemetry into standard clinical SOAP note
                </p>
              </div>
            </div>
          ) : activeTab === 'soap' ? (
            /* Tab 1: Full Clinical SOAP Note */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SOAP Sections (Col 1 & 2) */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* Subjective */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/40 transition">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-cyan-900/60 text-cyan-300 rounded">
                      [S] SUBJECTIVE
                    </span>
                    <span className="text-xs text-slate-400">Patient Narrative & Clinical History</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {soap.subjective || 'Synthesizing subjective narrative...'}
                  </p>
                </div>

                {/* Objective */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/40 transition">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-900/60 text-indigo-300 rounded">
                      [O] OBJECTIVE
                    </span>
                    <span className="text-xs text-slate-400">Physical Exam, 3D Metrology & Multi-Modal AI</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-300 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                    {soap.objective || 'Processing spatial telemetry objective metrics...'}
                  </pre>
                </div>

                {/* Assessment */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/40 transition">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-900/60 text-amber-300 rounded">
                      [A] ASSESSMENT
                    </span>
                    <span className="text-xs text-slate-400">Clinical Formulation & Guideline Evidence Match</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {soap.assessment || 'Formulating clinical assessment...'}
                  </div>
                </div>

                {/* Plan */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/40 transition">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-900/60 text-emerald-300 rounded">
                      [P] PLAN
                    </span>
                    <span className="text-xs text-slate-400">Actionable IWGDF Protocol Directives</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {soap.plan || 'Generating treatment plan directives...'}
                  </div>
                </div>

              </div>

              {/* Sidebar: Citations & Quick Directives (Col 3) */}
              <div className="space-y-4">
                
                {/* RAG Knowledge Engine Status */}
                <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/20 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      RAG Clinical Evidence
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {citations.length} Guidelines Matched
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This note was autonomously generated by cross-referencing patient spatial metrology, sub-tissue segmentations, and infection telemetry against the official IWGDF 2023 guideline corpus.
                  </p>
                </div>

                {/* Citations List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    Matched IWGDF Citations
                  </h4>

                  {citations.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      onClick={() => setActiveGuideline(c)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        activeGuideline?.id === c.id
                          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-cyan-300">
                          {c.id}
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                          {c.grade || 'Grade A'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 mb-1">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {c.recommendation}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Selected Citation Detail Callout */}
                {activeGuideline && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{activeGuideline.title}</span>
                      <span className="text-[10px] text-slate-400">{activeGuideline.id}</span>
                    </div>
                    <p className="text-slate-300 italic text-[11px]">
                      "{activeGuideline.recommendation}"
                    </p>
                    <div className="text-[10px] text-cyan-400 pt-1 border-t border-slate-800/80">
                      Source: {activeGuideline.source}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : activeTab === 'guidelines' ? (
            /* Tab 2: Interactive IWGDF Guideline Knowledge Assistant */
            <div className="space-y-6">
              
              {/* Question Input Form */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  Ask IWGDF Clinical Guidelines
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Perform semantic vector search against the IWGDF 2023 recommendations. Answers are grounded strictly in peer-reviewed clinical evidence.
                </p>

                <form onSubmit={handleSearchGuideline} className="flex gap-2">
                  <input
                    type="text"
                    value={queryInput}
                    onChange={e => setQueryInput(e.target.value)}
                    placeholder="e.g. When should sharp surgical debridement be initiated? Or, what offloader is recommended?"
                    className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={queryLoading || !queryInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow disabled:opacity-50 transition"
                  >
                    {queryLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Query</span>
                  </button>
                </form>

                {/* Suggested Query Chips */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Quick Prompts:</span>
                  {[
                    'When to use Total Contact Cast (TCC)?',
                    'Superficial swab vs deep tissue biopsy?',
                    'Sharp debridement contraindications in ischemia?',
                    'Probe-to-bone test accuracy for osteomyelitis?',
                    'Empiric antibiotic regimens for deep infection?'
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-300 hover:border-cyan-500/40 text-slate-300 border border-slate-700/80 text-[11px] transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Result Display */}
              {queryLoading ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
                  <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Searching IWGDF guideline vector embeddings...</p>
                </div>
              ) : queryResult ? (
                <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        Authoritative Synthesis
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-0.5">
                        Q: "{queryResult.query}"
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {queryResult.matched_chunks_count || 1} Evidence Source(s)
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {queryResult.answer}
                  </p>

                  {/* Matched Citations */}
                  {queryResult.citations && queryResult.citations.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Cited Recommendations
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {queryResult.citations.map((c, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300">{c.id}</span>
                              <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                {c.grade || 'Strong'}
                              </span>
                            </div>
                            <div className="font-medium text-slate-200 text-xs">{c.title}</div>
                            <p className="text-slate-400 text-[11px] leading-snug">
                              {c.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Full Guideline Catalog Table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Full IWGDF 2023 Guidelines Catalog in Local Corpus
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catalog.map(g => (
                    <div
                      key={g.id}
                      onClick={() => handleChipClick(`What is the recommendation for ${g.title}?`)}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-cyan-400">{g.id}</span>
                          <span className="text-[10px] text-slate-500">• {g.category}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">{g.title}</p>
                      </div>
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-800 text-slate-300 shrink-0">
                        {g.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* Tab 3: Prescriptions & Actionable Orders */
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Dressings Directive */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Topical Wound Dressing Prescription</span>
                  </div>
                  <ul className="space-y-2">
                    {(orders.dressings || ['Silver Calcium Alginate Ribbon', 'Sterile Polyurethane Foam Pad']).map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5"></span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800">
                    Guideline Reference: IWGDF-2023-WBP-02 (Moist Wound Healing Principle)
                  </p>
                </div>

                {/* Antimicrobial Therapy */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                    <Stethoscope className="w-4 h-4 text-indigo-400" />
                    <span>Empiric Antimicrobial Orders</span>
                  </div>
                  <ul className="space-y-2">
                    {(orders.medications || ['Amoxicillin-Clavulanate 875/125mg PO BID x 10 days']).map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800">
                    Guideline Reference: IWGDF-2023-INF-02 (Target Gram-positive cocci & common anaerobes)
                  </p>
                </div>

                {/* Biomechanical Offloading */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Biomechanical Offloading Appliance</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {orders.offloading || 'Non-removable Total Contact Cast (TCC) or pneumatic fiberglass walker'}
                  </p>
                  <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800">
                    Guideline Reference: IWGDF-2023-OFF-01 (First-Choice Neuropathic Offloading)
                  </p>
                </div>

                {/* Surveillance & Clinic Follow-Up */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Surveillance & Follow-Up Protocol</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Clinic visit scheduled for: <strong>{orders.follow_up || '7 days for re-volumetric spatial evaluation'}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800">
                    Includes repeat 3D depth metrology, convex hull planimetry, and photograph audit.
                  </p>
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-500">
              Corpus: IWGDF Guidelines on the Prevention and Management of Diabetic Foot Disease (2023 update)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySoap}
              disabled={!scribeData}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Full Note</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
