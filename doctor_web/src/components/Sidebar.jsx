import React from 'react'
import {
  Stethoscope,
  Users,
  BarChart3,
  Layers,
  Scan,
  Activity,
  LogOut,
  Search,
  Command,
  Sparkles,
  Boxes
} from 'lucide-react'
import Heal6Logo from './Heal6Logo'
import ThemeToggle from './ThemeToggle'

export default function Sidebar({
  activeTab = 'queue',
  setActiveTab,
  onExitToLanding,
  onOpenArchitectureModal
}) {
  const navItems = [
    {
      id: 'queue',
      label: 'Master Triage Queue',
      icon: Users,
      badge: 'Live'
    },
    {
      id: 'command_center',
      label: 'Patient Command Center',
      icon: Activity,
      badge: null
    },
    {
      id: 'assessment',
      label: 'Intake Assessment',
      icon: Stethoscope,
      badge: 'AI'
    },
    {
      id: 'registry',
      label: 'Wound Registry',
      icon: Layers,
      badge: null
    },
    {
      id: 'analytics',
      label: 'SINBAD Analytics',
      icon: BarChart3,
      badge: null
    }
  ]

  return (
    <aside className="w-80 bg-white/90 dark:bg-[#0e120f]/95 backdrop-blur-2xl border-r border-[#12464e]/10 dark:border-[#223229] flex flex-col h-screen shrink-0 select-none z-30 sticky top-0 transition-colors duration-300">
      {/* 1. Top Brand Header with Official Heal6 Logo */}
      <div className="py-6 px-5 flex flex-col items-center justify-center border-b border-[#12464e]/10 dark:border-[#223229] relative group">
        <button
          onClick={onExitToLanding}
          className="cursor-pointer focus:outline-none w-full flex items-center justify-center"
          title="Return to Public Homepage"
        >
          <Heal6Logo size="sidebar" className="w-full max-w-[270px] transform transition-transform group-hover:scale-[1.02]" />
        </button>
      </div>

      {/* 2. Clinical Quick Command Bar (Inspired by Pillio / Docx, Screenshot 4 & 5) */}
      <div className="px-4 pt-4">
        <button
          onClick={() => setActiveTab('queue')}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#12464e]/5 dark:bg-[#15221b] border border-[#12464e]/10 dark:border-[#223229] text-xs font-semibold text-slate-500 dark:text-slate-400 hover:border-[#aceba7]/40 hover:text-[#12464e] dark:hover:text-[#aceba7] transition-all shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#12464e] dark:group-hover:text-[#aceba7] transition-colors" />
            <span>Search Triage / MRN</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-[#0e120f] border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400 dark:text-slate-500 shadow-2xs">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* 3. Clinical Navigation */}
      <div className="flex-1 flex flex-col px-4 pt-4 pb-6 overflow-y-auto">
        <div className="flex items-center justify-center gap-2.5 pb-3">
          <div className="h-[1px] w-5 bg-[#12464e]/15 dark:bg-[#223229]" />
          <span className="font-serif-luxury text-xs font-normal uppercase tracking-widest text-[#12464e]/70 dark:text-[#aceba7]/70 text-center">
            Clinical Navigation
          </span>
          <div className="h-[1px] w-5 bg-[#12464e]/15 dark:bg-[#223229]" />
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-bold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#12464e] via-[#185a64] to-[#12464e] dark:from-[#152e25] dark:via-[#193a2e] dark:to-[#152e25] text-white dark:text-[#aceba7] shadow-lg shadow-[#12464e]/20 border border-[#aceba7]/40 scale-[1.01]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-[#12464e]/5 dark:hover:bg-[#15221b] hover:text-[#12464e] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2 rounded-xl transition-colors shrink-0 ${
                      isActive
                        ? 'bg-[#aceba7] text-[#12464e] shadow-xs'
                        : 'bg-slate-100 dark:bg-[#15221b] text-slate-600 dark:text-slate-400 group-hover:text-[#12464e] dark:group-hover:text-[#aceba7] group-hover:bg-[#aceba7]/15'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="tracking-tight truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#aceba7]/20 text-[#aceba7] border border-[#aceba7]/40'
                      : 'bg-[#12464e]/10 dark:bg-[#223229] text-[#12464e] dark:text-[#aceba7]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}

          {/* 5-Pillar Architecture Hub Launcher (Pillars 1 to 5) */}
          <div className="pt-3">
            <button
              onClick={onOpenArchitectureModal}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#aceba7]/10 dark:bg-[#aceba7]/5 hover:bg-[#aceba7]/20 border border-[#aceba7]/30 text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#aceba7]/20 border border-[#aceba7]/40 flex items-center justify-center text-[#12464e] dark:text-[#aceba7] shadow-[0_0_10px_rgba(172,235,167,0.3)]">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#12464e] dark:text-[#aceba7] flex items-center gap-1.5">
                    <span>5 Pillars Hub</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Cluster & Health Telemetry</div>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#aceba7] text-[#0e120f]">
                Live
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* 4. User Profile Footer ("Dr. Sharma") & Theme Toggle */}
      <div className="p-4 border-t border-[#12464e]/10 dark:border-[#223229] bg-[#12464e]/[0.02] dark:bg-[#0e120f]">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#15221b] border border-[#12464e]/12 dark:border-[#223229] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#12464e] to-[#466f49] text-[#aceba7] flex items-center justify-center font-bold text-sm shadow-xs border border-[#aceba7]/30">
                DS
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#aceba7] border-2 border-white dark:border-[#0e120f] rounded-full shadow-[0_0_6px_#aceba7]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif-luxury">Dr. Sharma</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Endocrinology & DFU</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle className="w-8 h-8" />
            <button
              onClick={onExitToLanding}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
              title="Exit to Public Homepage / Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
