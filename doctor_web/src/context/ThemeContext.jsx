import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // Theme preference: 'system' | 'light' | 'dark'
  const [themePreference, setThemePreferenceState] = useState(() => {
    try {
      const saved = localStorage.getItem('heal6_theme_pref')
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved
      }
      // If legacy 'heal6_theme' was stored, check it
      const legacy = localStorage.getItem('heal6_theme')
      if (legacy === 'light' || legacy === 'dark') {
        return legacy
      }
    } catch {
      // ignore local storage errors
    }
    return 'system'
  })

  // Track system OS color scheme preference
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Listen to OS system color scheme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      setSystemIsDark(e.matches)
    }

    setSystemIsDark(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  // Calculate resolved theme based on preference and OS state
  const resolvedTheme = themePreference === 'system' 
    ? (systemIsDark ? 'dark' : 'light') 
    : themePreference

  const isDark = resolvedTheme === 'dark'

  // Apply .dark class and data-theme attribute to <html> root
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
    }
  }, [isDark])

  // Setter that updates state and localStorage
  const setThemePreference = useCallback((pref) => {
    setThemePreferenceState(pref)
    try {
      localStorage.setItem('heal6_theme_pref', pref)
      localStorage.setItem('heal6_theme', pref) // legacy compatibility
    } catch {
      // ignore
    }
  }, [])

  // Toggle method: cycles between light -> dark -> system
  const toggleTheme = useCallback(() => {
    setThemePreferenceState((prev) => {
      let next = 'dark'
      if (prev === 'light') next = 'dark'
      else if (prev === 'dark') next = 'system'
      else next = 'light'

      try {
        localStorage.setItem('heal6_theme_pref', next)
        localStorage.setItem('heal6_theme', next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme, // for backward compatibility
        resolvedTheme,
        themePreference,
        setTheme: setThemePreference,
        setThemePreference,
        toggleTheme,
        isDark,
        systemIsDark
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
