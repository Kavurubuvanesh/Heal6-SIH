import React, { useState } from 'react'
import {
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  UserPlus,
  User
} from 'lucide-react'
import Heal6Logo from './Heal6Logo'
import { loginDoctor } from '../services/api'

export default function DoctorAuthModal({ isOpen, onClose, onLoginSuccess }) {
  // Toggle between 'signin' and 'signup'
  const [authMode, setAuthMode] = useState('signin')

  // Sign In state
  const [email, setEmail] = useState('dr.sharma@heal6.health')
  const [password, setPassword] = useState('Heal6@Podiatry2026')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Sign Up state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirm, setShowSignupConfirm] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  if (!isOpen) return null

  const switchMode = (mode) => {
    setAuthMode(mode)
    setErrorMessage('')
    setSignupError('')
    setSignupSuccess(false)
  }

  // --- Sign In Handler ---
  const handleSignIn = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Please enter both your clinical email and password.')
      return
    }

    setIsLoading(true)

    try {
      const res = await loginDoctor({
        email: email.trim(),
        password,
        department: 'Endocrinology & DFU Specialist'
      })
      setIsLoading(false)

      if (res.success && res.data && res.data.doctor) {
        onLoginSuccess(res.data.doctor)
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify your staff credentials.')
      }
    } catch (err) {
      setIsLoading(false)
      setErrorMessage(err.message || 'Authentication error. Please try again.')
    }
  }

  // --- Sign Up Handler ---
  const handleSignUp = async (e) => {
    e.preventDefault()
    setSignupError('')

    if (!signupName.trim()) {
      setSignupError('Please enter your full name.')
      return
    }
    if (!signupEmail.trim()) {
      setSignupError('Please enter a valid email address.')
      return
    }
    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters.')
      return
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.')
      return
    }

    setSignupLoading(true)

    // Simulate signup (replace with real API call when backend supports it)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setSignupLoading(false)
      setSignupSuccess(true)

      // Auto-switch to sign-in after a short delay with the new email pre-filled
      setTimeout(() => {
        setEmail(signupEmail.trim())
        setPassword('')
        setSignupSuccess(false)
        switchMode('signin')
      }, 2000)
    } catch (err) {
      setSignupLoading(false)
      setSignupError('Registration failed. Please try again.')
    }
  }

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all'

  const inputWithToggleClass =
    'w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all'

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#0c1524] backdrop-blur-xl rounded-3xl max-w-md w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-visible flex flex-col my-8 relative">

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          ✕
        </button>

        {/* Header with Heal6 Branding */}
        <div className="pt-6 pb-2 px-8 text-center flex flex-col items-center">
          <Heal6Logo size="large" className="my-0.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {authMode === 'signin'
              ? 'Enter your medical credentials to access live patient telemetry'
              : 'Create a new clinician account to get started'}
          </p>
        </div>

        {/* Sign In / Sign Up Tab Switcher */}
        <div className="px-8 pt-2 pb-1">
          <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-slate-700 text-[#0d9488] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-white dark:bg-slate-700 text-[#0d9488] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>
        </div>

        {/* ===== SIGN IN FORM ===== */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} className="p-8 pt-4 space-y-4">
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
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Medical Portal Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={inputWithToggleClass}
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

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0d9488] via-[#0f766e] to-[#0284c7] hover:from-[#0f766e] hover:to-[#0369a1] text-white font-bold text-xs tracking-wide shadow-lg shadow-teal-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Clinical Workstation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ===== SIGN UP FORM ===== */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="p-8 pt-4 space-y-4">
            {signupError && (
              <div className="p-3 rounded-xl bg-[#fff1f2] dark:bg-rose-950/50 border border-[#f43f5e]/40 text-[#f43f5e] dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            {signupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-400/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <ArrowRight className="w-4 h-4 shrink-0" />
                <span>Account created! Redirecting to sign in...</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Hospital Email / Clinician ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="doctor@hospital.org"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={inputWithToggleClass}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showSignupConfirm ? 'text' : 'password'}
                  required
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={inputWithToggleClass}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupConfirm(!showSignupConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  {showSignupConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={signupLoading || signupSuccess}
              className="w-full mt-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0d9488] via-[#0f766e] to-[#0284c7] hover:from-[#0f766e] hover:to-[#0369a1] text-white font-bold text-xs tracking-wide shadow-lg shadow-teal-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {signupLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Clinician Account</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
