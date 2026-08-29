import React, { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const cursorX = useSpring(mousePosition.x, { stiffness: 450, damping: 28 })
  const cursorY = useSpring(mousePosition.y, { stiffness: 450, damping: 28 })

  const ringX = useSpring(mousePosition.x, { stiffness: 200, damping: 22 })
  const ringY = useSpring(mousePosition.y, { stiffness: 200, damping: 22 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseOver = (e) => {
      const target = e.target
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button'
      ) {
        setIsHovered(true)
      } else {
        setIsHovered(false)
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block">
      {/* Outer Soft Ring with Teal Halo */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          scale: isHovered ? 1.6 : 1,
          borderColor: isHovered ? '#0d9488' : 'rgba(36, 149, 131, 0.4)',
          backgroundColor: isHovered ? 'rgba(36, 149, 131, 0.08)' : 'rgba(36, 149, 131, 0.02)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-10 h-10 rounded-full border border-[#0d9488]/40 backdrop-blur-[0.5px]"
      />

      {/* Center Precise Medical Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          scale: isHovered ? 0.6 : 1,
          backgroundColor: isHovered ? '#f43f5e' : '#0d9488'
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="w-2.5 h-2.5 rounded-full bg-[#0d9488] shadow-xs"
      />
    </div>
  )
}
