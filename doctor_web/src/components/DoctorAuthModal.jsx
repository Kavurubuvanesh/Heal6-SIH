import React, { useState, useRef, useEffect } from 'react'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Hospital,
  KeyRound,
  ChevronDown,
  Check
} from 'lucide-react'
import Heal6Logo from './Heal6Logo'

const DEPARTMENTS = [
  { id: 'endocrinology', label: 'Endocrinology & Diabetic Foot Unit (Suite B)', badge: 'Suite B' },
  { id: 'vascular', label: 'Vascular Surgery & Limb Salvage Team', badge: 'STAT Team' },
  { id: 'podiatry', label: 'Podiatric Surgical Clinic (Terminal 04)', badge: 'Terminal 04' },
  { id: 'telemedicine', label: 'Tele-Wound Remote Diagnostic Service', badge: 'Remote' },
]

export default function DoctorAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('dr.sharma@heal6.health')
  const [password, setPassword] = useState('Heal6@Podiatry2026')
  const [showPassword, setShowPassword] = useState(false)
  const [hospitalDept, setHospitalDept] = useState('endocrinology')
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDeptDropdownOpen(false)
      }
    }
    if (deptDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [deptDropdownOpen])

  if (!isOpen) return null

  const selectedDepartmentObj = DEPARTMENTS.find(d => d.id === hospitalDept) || DEPARTMENTS[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Please enter both your clinical email and password.')
      return
    }

    setIsLoading(true)

    // Simulate secure clinical SSO authentication handshake
    setTimeout(() => {
      setIsLoading(false)
      onLoginSuccess({
        name: 'Dr. Sharma',
        email: email,
        role: 'Consultant Endocrinologist & DFU Specialist',
        department: hospitalDept
      })
    }, 900)
  }

  const handleQuickFillDoctor = () => {
    setEmail('dr.sharma@heal6.health')
    setPassword('Heal6@Podiatry2026')
    setHospitalDept('endocrinology')
    setDeptDropdownOpen(false)
    setErrorMessage('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#0c1524] backdrop-blur-xl rounded-3xl max-w-md w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-visible flex flex-col my-8 relative">
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0d9488] via-teal-400 to-[#f43f5e] rounded-t-3xl" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Header with Heal6 Branding */}
        <div className="pt-6 pb-2 px-8 text-center flex flex-col items-center">
          <Heal6Logo size="large" className="my-0.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Enter your medical credentials to access live patient telemetry
          </p>
        </div>

        {/* Demo Quick-Fill Pill */}
        <div className="px-8 pb-2">
          <div className="bg-teal-500/[0.07] dark:bg-teal-950/40 border border-teal-500/25 dark:border-teal-800 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0d9488] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                DS
              </div>
              <div className="text-left">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">Verified Staff Profile</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Dr. Sharma (Endocrinology & DFU)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickFillDoctor}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#0d9488] text-white hover:bg-[#0f766e] transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              Auto-Fill
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#fff1f2] dark:bg-rose-950/50 border border-[#f43f5e]/40 text-[#f43f5e] dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Hospital Email / Clinician ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Medical Portal Password
              </label>
              <a href="#reset" onClick={(e) => { e.preventDefault(); handleQuickFillDoctor(); }} className="text-[10px] text-[#0d9488] dark:text-teal-400 font-bold hover:underline">
                Reset / Auto-fill
              </a>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Department Unit Custom Styled Select */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Clinical Department / Terminal
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
                className={`w-full pl-10 pr-9 py-2.5 rounded-xl border transition-all text-left flex items-center justify-between text-xs font-semibold cursor-pointer ${
                  deptDropdownOpen
                    ? 'border-[#0d9488] ring-2 ring-[#0d9488]/20 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Hospital className="w-4 h-4 text-[#0d9488] dark:text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <span className="truncate pr-2 text-slate-900 dark:text-slate-100 font-semibold">{selectedDepartmentObj.label}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 ${deptDropdownOpen ? 'rotate-180 text-[#0d9488]' : ''}`} />
              </button>

              {/* Dropdown Menu Popover */}
              {deptDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0f1d2e] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-900/15 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {DEPARTMENTS.map((dept) => {
                    const isSelected = dept.id === hospitalDept
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          setHospitalDept(dept.id)
                          setDeptDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0d9488]/15 dark:bg-teal-500/20 text-[#0f766e] dark:text-teal-300 font-bold border border-teal-500/30'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white border border-transparent'
                        }`}
                      >
                        <span className="truncate pr-2">{dept.label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#0d9488] dark:text-teal-400 shrink-0 ml-1" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sign In CTA Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0d9488] via-[#0f766e] to-[#0284c7] hover:from-[#0f766e] hover:to-[#0369a1] text-white font-bold text-xs tracking-wide shadow-lg shadow-teal-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with Hospital Registry...</span>
              </>
            ) : (
              <>
                <span>Sign In to Clinical Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badge */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-8 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 font-medium rounded-b-3xl">
          <span>Heal6 Clinical Network</span>
          <span>SSL 256-Bit Encrypted</span>
        </div>
      </div>
    </div>
  )
}
