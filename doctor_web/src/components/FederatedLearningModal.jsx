import React, { useState, useEffect } from 'react'
import {
  Network,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Zap,
  Lock,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  X,
  Layers,
  ArrowRight,
  Database,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react'
import {
  fetchFederatedStatus,
  fetchFederatedNodes,
  initiateFederatedRound,
  fetchFederatedTrajectory,
  resetFederatedSimulation
} from '../services/api'

export default function FederatedLearningModal({
  isOpen,
  onClose,
  isLiveBackend = true
}) {
  const [statusData, setStatusData] = useState(null)
  const [nodes, setNodes] = useState([])
  const [trajectory, setTrajectory] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [isRoundRunning, setIsRoundRunning] = useState(false)
  const [roundStep, setRoundStep] = useState(0)
  const [roundReport, setRoundReport] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadFederatedData()
    }
  }, [isOpen])

  async function loadFederatedData() {
    try {
      const [statusRes, nodesRes, trajRes] = await Promise.all([
        fetchFederatedStatus(),
        fetchFederatedNodes(),
        fetchFederatedTrajectory()
      ])

      if (statusRes.success && statusRes.data) setStatusData(statusRes.data)
      if (nodesRes.success && nodesRes.data) {
        setNodes(nodesRes.data)
        if (!selectedNode && nodesRes.data.length > 0) {
          setSelectedNode(nodesRes.data[0])
        }
      }
      if (trajRes.success && trajRes.data) setTrajectory(trajRes.data)
    } catch (err) {
      console.warn('Could not load federated status:', err)
    }
  }

  async function handleTriggerRound() {
    if (isRoundRunning) return
    setIsRoundRunning(true)
    setRoundReport(null)

    // Animated step progression
    setRoundStep(1) // Step 1: Decentralized Local Training
    await new Promise(r => setTimeout(r, 600))
    setRoundStep(2) // Step 2: L2 Gradient Clipping & HMAC Signing
    await new Promise(r => setTimeout(r, 600))
    setRoundStep(3) // Step 3: Central FedAvg Sample Fusion
    await new Promise(r => setTimeout(r, 600))
    setRoundStep(4) // Step 4: Differential Privacy Gaussian Noise Addition
    await new Promise(r => setTimeout(r, 600))

    try {
      const res = await initiateFederatedRound()
      if (res.success && res.data) {
        setRoundReport(res.data)
        await loadFederatedData()
      }
    } catch (err) {
      console.error('Round initiation failed:', err)
    } finally {
      setRoundStep(5) // Step 5: Broadcast Global Model
      setTimeout(() => {
        setIsRoundRunning(false)
        setRoundStep(0)
      }, 1200)
    }
  }

  async function handleReset() {
    await resetFederatedSimulation()
    await loadFederatedData()
    setRoundReport(null)
  }

  if (!isOpen) return null

  const curRound = statusData?.current_round ?? 3
  const maxRounds = statusData?.max_rounds ?? 10
  const globalMetrics = statusData?.global_metrics || {
    convnext_accuracy: 91.4,
    global_loss: 0.25,
    unet_dice_score: 0.88
  }
  const dp = statusData?.differential_privacy || {
    target_epsilon: 1.25,
    consumed_epsilon: 0.54,
    target_delta: 1e-5,
    clipping_threshold: 1.0
  }

  const epsilonPct = Math.min(100, Math.round((dp.consumed_epsilon / dp.target_epsilon) * 100))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0b1120] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-teal-500 shadow-md shadow-cyan-500/20 text-white">
              <Network className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Federated Learning Consortium
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 rounded-full flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> FedAvg Topology
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Zero Raw PHI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Privacy-Preserving Multi-Center Clinical AI (DISHA, HIPAA & GDPR Compliant)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerRound}
              disabled={isRoundRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {isRoundRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isRoundRunning ? 'Aggregating Round...' : 'Initiate Round'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset simulation to initial state"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Key Metrics Strip */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Communication Round</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-cyan-300 font-mono">Round {curRound}</span>
              <span className="text-slate-500 font-mono text-[11px]">/ {maxRounds}</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Decentralized Cohort</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-sm font-bold text-white font-mono">
                {statusData?.total_dataset_samples || 1800} Cases
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Global ConvNeXt Accuracy</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {globalMetrics.convnext_accuracy}%
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400">UNet++ Mean Dice Score</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-sm font-bold text-teal-300 font-mono">
                {globalMetrics.unet_dice_score}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:col-span-1 col-span-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="uppercase font-semibold text-slate-400">Privacy Budget (ε)</span>
              <span className="font-mono text-cyan-400 font-bold">{dp.consumed_epsilon} / {dp.target_epsilon}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${epsilonPct}%` }}
              />
            </div>
          </div>

        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Round Execution Progress Ribbon (Active when running) */}
          {isRoundRunning && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/40 shadow-lg space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Executing Federated Averaging Round {curRound + 1}...
                </span>
                <span className="font-mono text-slate-400">Step {roundStep} of 5</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-[10.5px]">
                {[
                  '1. Local SGD Training',
                  '2. L2 Clipping & HMAC Sign',
                  '3. FedAvg Weight Fusion',
                  '4. DP Gaussian Noise',
                  '5. Global Model Broadcast'
                ].map((stepLabel, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-1.5 rounded-lg border text-center font-medium transition ${
                      roundStep === idx + 1
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md animate-pulse'
                        : roundStep > idx + 1
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800'
                    }`}
                  >
                    {stepLabel}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Round Completed Notification Banner */}
          {roundReport && !isRoundRunning && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Round {roundReport.round} Converged Successfully!</strong> Global Accuracy reached{' '}
                  <strong className="text-white font-mono">{roundReport.global_metrics.accuracy}%</strong> across {roundReport.total_samples_trained} decentralized clinical cases.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 font-mono text-[10px] border border-emerald-500/30">
                DP Noise Injected (σ = {dp.clipping_threshold})
              </span>
            </div>
          )}

          {/* Grid: Topology Visualizer (Left) + Center Details & Trajectory (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Interactive SVG Network Topology Graph (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Consortium Star Topology (Zero-PHI Mesh)
                  </h3>
                </div>
                <span className="text-[10.5px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  4 Active Hospital Nodes
                </span>
              </div>

              {/* High-Tech Animated SVG Canvas */}
              <div className="relative w-full aspect-[16/11] bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
                <svg className="w-full h-full" viewBox="0 0 500 340">
                  <defs>
                    <linearGradient id="cyanLine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                    </linearGradient>
                    <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0b1120" stopOpacity="0" />
                    </radialGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Ambient Hub Glow */}
                  <circle cx="250" cy="170" r="90" fill="url(#hubGlow)" />

                  {/* Connection Rays to Hospital Nodes */}
                  {/* Top-Left: Apollo Chennai */}
                  <line x1="250" y1="170" x2="90" y2="70" stroke="url(#cyanLine)" strokeWidth="2" strokeDasharray="4 4" className={isRoundRunning ? 'animate-pulse' : ''} />
                  {/* Top-Right: AIIMS Delhi */}
                  <line x1="250" y1="170" x2="410" y2="70" stroke="url(#cyanLine)" strokeWidth="2" strokeDasharray="4 4" className={isRoundRunning ? 'animate-pulse' : ''} />
                  {/* Bottom-Left: CMC Vellore */}
                  <line x1="250" y1="170" x2="90" y2="270" stroke="url(#cyanLine)" strokeWidth="2" strokeDasharray="4 4" className={isRoundRunning ? 'animate-pulse' : ''} />
                  {/* Bottom-Right: Fortis Bengaluru */}
                  <line x1="250" y1="170" x2="410" y2="270" stroke="url(#cyanLine)" strokeWidth="2" strokeDasharray="4 4" className={isRoundRunning ? 'animate-pulse' : ''} />

                  {/* Traveling Pulse Packets when round is active */}
                  {isRoundRunning && (
                    <>
                      <circle cx="170" cy="120" r="4" fill="#06b6d4" filter="url(#glow)">
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="330" cy="120" r="4" fill="#6366f1" filter="url(#glow)">
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="170" cy="220" r="4" fill="#10b981" filter="url(#glow)">
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="330" cy="220" r="4" fill="#f59e0b" filter="url(#glow)">
                        <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  {/* Central Coordinator Hub */}
                  <g transform="translate(250, 170)">
                    <circle r="36" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" filter="url(#glow)" />
                    <circle r="44" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="6 6" className="animate-spin" style={{ transformOrigin: '0 0', animationDuration: '18s' }} />
                    <text textAnchor="middle" y="-6" fill="#ffffff" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                      HEAL6 HUB
                    </text>
                    <text textAnchor="middle" y="8" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      FEDAVG
                    </text>
                    <text textAnchor="middle" y="20" fill="#94a3b8" fontSize="7" fontFamily="sans-serif">
                      Aggregator
                    </text>
                  </g>

                  {/* Node 1: Apollo Chennai (Top-Left) */}
                  <g transform="translate(90, 70)" className="cursor-pointer" onClick={() => setSelectedNode(nodes[0])}>
                    <circle r="26" fill={selectedNode?.node_id === nodes[0]?.node_id ? '#0e7490' : '#1e293b'} stroke="#06b6d4" strokeWidth="1.5" />
                    <text textAnchor="middle" y="-2" fill="#ffffff" fontSize="9" fontWeight="bold">Apollo</text>
                    <text textAnchor="middle" y="9" fill="#94a3b8" fontSize="7" fontFamily="monospace">480 Cases</text>
                    <circle cx="18" cy="-18" r="4" fill="#10b981" />
                  </g>

                  {/* Node 2: AIIMS Delhi (Top-Right) */}
                  <g transform="translate(410, 70)" className="cursor-pointer" onClick={() => setSelectedNode(nodes[1])}>
                    <circle r="26" fill={selectedNode?.node_id === nodes[1]?.node_id ? '#0e7490' : '#1e293b'} stroke="#6366f1" strokeWidth="1.5" />
                    <text textAnchor="middle" y="-2" fill="#ffffff" fontSize="9" fontWeight="bold">AIIMS</text>
                    <text textAnchor="middle" y="9" fill="#94a3b8" fontSize="7" fontFamily="monospace">620 Cases</text>
                    <circle cx="18" cy="-18" r="4" fill="#10b981" />
                  </g>

                  {/* Node 3: CMC Vellore (Bottom-Left) */}
                  <g transform="translate(90, 270)" className="cursor-pointer" onClick={() => setSelectedNode(nodes[2])}>
                    <circle r="26" fill={selectedNode?.node_id === nodes[2]?.node_id ? '#0e7490' : '#1e293b'} stroke="#10b981" strokeWidth="1.5" />
                    <text textAnchor="middle" y="-2" fill="#ffffff" fontSize="9" fontWeight="bold">CMC</text>
                    <text textAnchor="middle" y="9" fill="#94a3b8" fontSize="7" fontFamily="monospace">390 Cases</text>
                    <circle cx="18" cy="-18" r="4" fill="#10b981" />
                  </g>

                  {/* Node 4: Fortis Bengaluru (Bottom-Right) */}
                  <g transform="translate(410, 270)" className="cursor-pointer" onClick={() => setSelectedNode(nodes[3])}>
                    <circle r="26" fill={selectedNode?.node_id === nodes[3]?.node_id ? '#0e7490' : '#1e293b'} stroke="#f59e0b" strokeWidth="1.5" />
                    <text textAnchor="middle" y="-2" fill="#ffffff" fontSize="9" fontWeight="bold">Fortis</text>
                    <text textAnchor="middle" y="9" fill="#94a3b8" fontSize="7" fontFamily="monospace">310 Cases</text>
                    <circle cx="18" cy="-18" r="4" fill="#10b981" />
                  </g>

                </svg>

                {/* Privacy Guarantee Floating Badge */}
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[10px] text-slate-300 flex items-center gap-1.5 backdrop-blur-sm">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span>Encrypted Weight Deltas Only (HMAC-SHA256 Signed)</span>
                </div>
              </div>

              {/* Bottom Topology Legend */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {nodes.map(n => (
                  <button
                    key={n.node_id}
                    onClick={() => setSelectedNode(n)}
                    className={`p-2 rounded-lg border text-left transition ${
                      selectedNode?.node_id === n.node_id
                        ? 'bg-cyan-950/60 border-cyan-500/80 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px] truncate">{n.institution.split(' ')[0]}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{n.dataset_size} cases • {n.local_accuracy}%</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Node Details & Trajectory (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">

              {/* Selected Node Inspector Card */}
              {selectedNode && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 shadow-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        {selectedNode.node_id}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
                        {selectedNode.institution}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {selectedNode.location}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      ONLINE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Local Dataset Cohort</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedNode.dataset_size} DFU Patients</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Local Model Accuracy</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{selectedNode.local_accuracy}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">L2 Weight Delta Norm</span>
                      <span className="text-sm font-bold text-indigo-300 font-mono">{selectedNode.weight_delta_norm}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Encrypted RTT Latency</span>
                      <span className="text-sm font-bold text-cyan-300 font-mono">{selectedNode.latency_ms} ms</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Institutional Tier:</span>
                    <strong className="text-slate-200">{selectedNode.tier}</strong>
                  </div>
                </div>
              )}

              {/* Historical Trajectory Line Graph */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    Global Accuracy Convergence
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {trajectory[0]?.global_accuracy}% → {globalMetrics.convnext_accuracy}%
                  </span>
                </div>

                {/* Trajectory Table / Steps */}
                <div className="space-y-1.5">
                  {trajectory.map((t, i) => (
                    <div
                      key={t.round}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/70 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-slate-500 font-bold">R{t.round}</span>
                        <span className="text-emerald-400 font-bold">{t.global_accuracy}% Acc</span>
                        <span className="text-slate-400 text-[11px]">Loss {t.global_loss}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px]">
                        <span className="text-teal-400">Dice {t.unet_dice_score}</span>
                        <span className="text-slate-500">ε={t.epsilon_consumed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-500">
              Protocol: FedAvg (McMahan et al.) + DP-SGD Gaussian Mechanism (Abadi et al.)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerRound}
              disabled={isRoundRunning}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Initiate Convergence Round</span>
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
