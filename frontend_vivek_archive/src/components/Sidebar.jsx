import React, { useState } from 'react'
import {
  Users, BarChart3, Layers, Scan, Settings,
  Stethoscope, CheckCircle2
} from 'lucide-react'
import Heal6Logo from './Heal6Logo'

export default function Sidebar({
  activeTab = 'assessment', setActiveTab,
  currentCaseIndex, onSelectCase, cases = [], isAnalyzing = false
}) {
  const navItems = [
    { id: 'assessment', label: 'New Assessment', icon: Stethoscope, badge: 'Active Flow', badgeColor: 'bg-[#00e5ff]/10 text-[#00e5ff]' },
    { id: 'queue', label: 'Patient Queue', icon: Users, badge: '14 Active', badgeColor: 'bg-white/10 text-white/70' },
    { id: 'analytics', label: 'SINBAD Analytics', icon: BarChart3, badge: '99.2%', badgeColor: 'bg-white/10 text-white/70' },
    { id: 'registry', label: 'Wound Registry', icon: Layers, badge: 'ICD-10', badgeColor: 'bg-white/10 text-white/70' },
    { id: 'calibration', label: 'ArUco Setup', icon: Scan, badge: 'Calibrated', badgeColor: 'bg-[#00e5ff]/10 text-[#00e5ff]' }
  ]

  return (
    <aside className="w-72 glass-panel border-r border-white/10 border-t-0 border-b-0 border-l-0 flex flex-col h-screen shrink-0 select-none z-30 sticky top-0">
      <div className="pt-6 pb-5 px-5 flex flex-col items-center justify-center border-b border-white/10">
        <Heal6Logo className="transform transition-transform hover:scale-[1.02]" />
        <div className="mt-3.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] text-[10.5px] font-semibold tracking-wide border border-[#00e5ff]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse shadow-[0_0_8px_#00e5ff]" />
          Industrial Edition v3.0
        </div>
      </div>

      <div className="px-4 pt-3 pb-1">
        <div className="bg-black/40 border border-white/10 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5 px-1">
            <span>Data Subject</span>
            <span className="text-[#00e5ff] font-bold">File {currentCaseIndex + 1}/{cases.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {cases.map((c, idx) => (
              <button
                key={c.id} onClick={() => onSelectCase(idx)} disabled={isAnalyzing}
                className={`text-[10px] py-1.5 px-1 rounded-lg font-mono transition-all text-center truncate ${
                  currentCaseIndex === idx
                    ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_rgba(0,229,255,0.3)] font-bold'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:border-[#00e5ff]/50 hover:bg-[#00e5ff]/10'
                }`}
              >
                {c.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
          Command Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-white shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-[#00e5ff] text-black' : 'bg-white/10 text-white/50 group-hover:text-[#00e5ff]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-[#00e5ff] text-black' : item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}

        <div className="pt-4 px-1">
          <div className="bg-black/60 rounded-2xl p-3.5 text-white shadow-inner border border-white/10 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#00e5ff]/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00e5ff]">
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
                ArUco Optics Online
              </div>
            </div>
            <p className="text-[10px] text-white/50 leading-snug font-normal">
              CV homography and margin segmentation active.
            </p>
          </div>
        </div>
      </nav>

      <div className="p-3.5 border-t border-white/10 bg-black/20">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] flex items-center justify-center font-bold text-sm border border-[#00e5ff]/30">
              AX
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Admin-X</span>
              <span className="text-[10px] text-white/50 font-mono">SYS-OP</span>
            </div>
          </div>
          <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}