import React from 'react'
import {
  Stethoscope,
  Users,
  BarChart3,
  Layers,
  Scan,
  Activity,
  LogOut
} from 'lucide-react'
import Heal6Logo from './Heal6Logo'
import ThemeToggle from './ThemeToggle'

export default function Sidebar({
  activeTab = 'queue',
  setActiveTab,
  onExitToLanding
}) {
  const navItems = [
    {
      id: 'queue',
      label: 'Master Triage Queue',
      icon: Users
    },
    {
      id: 'command_center',
      label: 'Patient Command Center',
      icon: Activity
    },
    {
      id: 'assessment',
      label: 'Intake Assessment',
      icon: Stethoscope
    },
    {
      id: 'registry',
      label: 'Wound Registry',
      icon: Layers
    },
    {
      id: 'analytics',
      label: 'SINBAD Analytics',
      icon: BarChart3
    }
  ]

  return (
    <aside className="w-80 bg-white/95 dark:bg-[#070e14]/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col h-screen shrink-0 select-none z-30 sticky top-0 transition-colors duration-200">
      {/* 1. Top Brand Header with Official Heal6 Logo */}
      <div className="py-6 px-5 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800/80 relative group">
        <button
          onClick={onExitToLanding}
          className="cursor-pointer focus:outline-none w-full flex items-center justify-center"
          title="Return to Public Homepage"
        >
          <Heal6Logo size="sidebar" className="w-full max-w-[270px] transform transition-transform group-hover:scale-[1.02]" />
        </button>
      </div>

      {/* 2. Clinical Navigation (Uplifted right below the Heal6 Brand Header) */}
      <div className="flex-1 flex flex-col px-4 pt-5 pb-6 overflow-y-auto">
        <div className="flex items-center justify-center gap-2.5 pb-3.5">
          <div className="h-[1px] w-6 bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">
            Clinical Navigation
          </span>
          <div className="h-[1px] w-6 bg-slate-200 dark:bg-slate-800" />
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14.5px] font-bold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0d9488] to-[#0284c7] text-white shadow-lg shadow-teal-500/25 scale-[1.01]'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-colors shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 group-hover:text-[#0d9488] dark:group-hover:text-teal-300 group-hover:bg-teal-500/10 dark:group-hover:bg-teal-500/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="tracking-tight truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* 3. User Profile Footer ("Dr. Sharma") & Theme Toggle */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0c1524]/60">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0d9488] to-[#0284c7] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                DS
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Dr. Sharma</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Endocrinology & DFU</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle className="w-8 h-8" />
            <button
              onClick={onExitToLanding}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
              title="Exit to Public Homepage / Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
