import React, { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function ThemeToggle({ className = '', variant = 'button' }) {
  const { themePreference, setThemePreference, resolvedTheme, toggleTheme, isDark, systemIsDark } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Segmented Pill Variant (e.g. for landing page or settings)
  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs ${className}`}>
        <button
          onClick={() => setThemePreference('light')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            themePreference === 'light'
              ? 'bg-white text-amber-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Light Theme"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>

        <button
          onClick={() => setThemePreference('system')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            themePreference === 'system'
              ? 'bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl text-[#0d9488] dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="System Auto Match"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>System</span>
        </button>

        <button
          onClick={() => setThemePreference('dark')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            themePreference === 'dark'
              ? 'bg-slate-900 text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Dark Theme"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
      </div>
    )
  }

  // Quick tooltip text describing current status
  const titleText =
    themePreference === 'system'
      ? `System Theme (${systemIsDark ? 'Dark' : 'Light'}) - Click to toggle`
      : `${themePreference.charAt(0).toUpperCase() + themePreference.slice(1)} Mode - Click to toggle`

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={toggleTheme}
        onContextMenu={(e) => {
          e.preventDefault()
          setIsMenuOpen((prev) => !prev)
        }}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer select-none group ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-teal-400 hover:bg-slate-800 hover:border-teal-500/50 shadow-inner'
            : 'bg-white border-slate-200/90 text-amber-500 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
        } ${className}`}
        title={`${titleText} (Right click for options)`}
        aria-label="Toggle Theme"
      >
        <motion.div
          key={`${themePreference}-${resolvedTheme}`}
          initial={{ rotate: -30, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 30, scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {themePreference === 'system' ? (
            <div className="relative">
              <Laptop className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
              <span className={`absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full ${isDark ? 'bg-teal-400' : 'bg-amber-400'}`} />
            </div>
          ) : isDark ? (
            <Moon className="w-4 h-4 text-teal-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </motion.div>
      </button>

      {/* Context Menu / Dropdown on Right Click or Trigger */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#0c1524]/85 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col gap-0.5"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Appearance
            </div>

            <button
              onClick={() => {
                setThemePreference('system')
                setIsMenuOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                themePreference === 'system'
                  ? 'bg-[#0d9488]/10 dark:bg-teal-950/60 text-[#0d9488] dark:text-teal-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5" />
                <span>System ({systemIsDark ? 'Dark' : 'Light'})</span>
              </div>
              {themePreference === 'system' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                setThemePreference('light')
                setIsMenuOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                themePreference === 'light'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </div>
              {themePreference === 'light' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                setThemePreference('dark')
                setIsMenuOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                themePreference === 'dark'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-[#0d9488] dark:text-teal-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </div>
              {themePreference === 'dark' && <Check className="w-3.5 h-3.5" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
