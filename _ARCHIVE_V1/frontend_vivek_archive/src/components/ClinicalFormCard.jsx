import React from 'react'
import { MapPin, HeartCrack, Activity, Layers, Sparkles, Loader2, Check } from 'lucide-react'

export default function ClinicalFormCard({
  siteHindfoot, setSiteHindfoot, ischemia, setIschemia,
  neuropathy, setNeuropathy, depthDeep, setDepthDeep,
  onRunAnalysis, isAnalyzing, analysisStep = ''
}) {
  const toggleItems = [
    { id: 'site', label: 'Hindfoot / Midfoot Location', checked: siteHindfoot, onChange: setSiteHindfoot, icon: MapPin },
    { id: 'ischemia', label: 'Ischemia (ABI < 0.8)', checked: ischemia, onChange: setIschemia, icon: HeartCrack },
    { id: 'neuropathy', label: 'Sensory Neuropathy', checked: neuropathy, onChange: setNeuropathy, icon: Activity },
    { id: 'depth', label: 'Deep Tissue / Bone Probing', checked: depthDeep, onChange: setDepthDeep, icon: Layers }
  ]

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Manual Override Protocols</h3>
          <p className="text-xs text-white/50">IWGDF 6-Factor SINBAD Physical Inputs</p>
        </div>
      </div>

      <div className="space-y-3">
        {toggleItems.map((item) => (
          <div key={item.id} onClick={() => item.onChange(!item.checked)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              item.checked ? 'bg-[#00e5ff]/10 border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'bg-black/40 border-white/10 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${item.checked ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_#00e5ff]' : 'bg-white/10 text-white/50'}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">{item.label}</span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${item.checked ? 'bg-[#00e5ff]' : 'bg-white/20'}`}>
              <div className={`w-4 h-4 mt-0.5 bg-white rounded-full transition-transform flex items-center justify-center ${item.checked ? 'translate-x-5' : 'translate-x-1'}`}>
                {item.checked && <Check className="w-3 h-3 text-black stroke-[3]" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <button
          onClick={onRunAnalysis} disabled={isAnalyzing}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 ${
            isAnalyzing
              ? 'bg-[#00e5ff]/50 text-black cursor-wait'
              : 'bg-[#00e5ff] text-black hover:bg-[#00b3cc] shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)]'
          }`}
        >
          {isAnalyzing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>{analysisStep || 'PROCESSING...'}</span></>
          ) : (
            <><Sparkles className="w-5 h-5" /><span>EXECUTE NEURAL INFERENCE</span></>
          )}
        </button>
      </div>
    </div>
  )
}