import React from 'react'
import {
  Stethoscope,
  Users,
  BarChart3,
  Layers,
  Activity,
  LogOut
} from 'lucide-react'
import Heal6Logo from './Heal6Logo'


export default function Sidebar({
  activeTab = 'queue',
  setActiveTab,
  cases = [],
  loggedInDoctor = {
    name: 'Dr. Sharma',
    department: 'Endocrinology & DFU'
  },
  onExitToLanding,
  onOpenArchitectureModal
}) {
  const navItems = [
    {
      id: 'queue',
      label: 'Master Triage Queue',
      icon: Users,
      badge: cases.length > 0 ? `${cases.length} Active` : 'Clear'
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

        </nav>
      </div>

      {/* 4. User Profile Footer ("Dr. Sharma") & Theme Toggle */}
      <div className="p-4 border-t border-[#12464e]/10 dark:border-[#223229] bg-[#12464e]/[0.02] dark:bg-[#0e120f]">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#15221b] border border-[#12464e]/12 dark:border-[#223229] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#12464e] to-[#466f49] text-[#aceba7] flex items-center justify-center font-bold text-sm shadow-xs border border-[#aceba7]/30">
                {loggedInDoctor?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).replace('D.', 'DS') || 'DS'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#aceba7] border-2 border-white dark:border-[#0e120f] rounded-full shadow-[0_0_6px_#aceba7]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif-luxury truncate max-w-[120px]">{loggedInDoctor?.name || 'Dr. Sharma'}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px]" title="Endocrinology & DFU Specialist">
                {loggedInDoctor?.department === 'General' ? 'Endocrinology & DFU Specialist' : (loggedInDoctor?.role || loggedInDoctor?.department || 'Endocrinology & DFU Specialist')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">

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
