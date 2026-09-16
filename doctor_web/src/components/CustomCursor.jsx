import React, { useEffect, useState, useRef } from 'react'
import { motion, useSpring, AnimatePresence } from 'framer-motion'

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 })
  const [isHovered, setIsHovered] = useState(false)
  const [hoverType, setHoverType] = useState('default') // 'button' | 'card' | 'scanner' | 'danger'
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [ripples, setRipples] = useState([])
  const [cursorVelocity, setCursorVelocity] = useState({ speed: 0, angle: 0 })
  const lastPosRef = useRef({ x: 0, y: 0, time: Date.now() })
  const lastCardRef = useRef(null)
  const canvasRef = useRef(null)
  const particlesRef = useRef([])

  // Spring physics for smooth high-tech lag & momentum
  const cursorX = useSpring(mousePosition.x, { stiffness: 600, damping: 30 })
  const cursorY = useSpring(mousePosition.y, { stiffness: 600, damping: 30 })

  const ringX = useSpring(mousePosition.x, { stiffness: 260, damping: 24 })
  const ringY = useSpring(mousePosition.y, { stiffness: 260, damping: 24 })

  const spotlightX = useSpring(mousePosition.x, { stiffness: 140, damping: 22 })
  const spotlightY = useSpring(mousePosition.y, { stiffness: 140, damping: 22 })

  // Bioluminescent Neural Canvas Particle Swarm Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const particles = particlesRef.current

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.96
        p.vy *= 0.96
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        // Draw particle node
        ctx.save()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace('ALPHA', p.alpha.toFixed(2))
        ctx.shadowBlur = 8
        ctx.shadowColor = '#aceba7'
        ctx.fill()
        ctx.restore()

        // Connect particle to cursor if nearby
        const distToCursor = Math.hypot(p.x - lastPosRef.current.x, p.y - lastPosRef.current.y)
        if (distToCursor < 85) {
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(lastPosRef.current.x, lastPosRef.current.y)
          ctx.strokeStyle = `rgba(172, 235, 167, ${(p.alpha * 0.25 * (1 - distToCursor / 85)).toFixed(2)})`
          ctx.lineWidth = 0.75
          ctx.stroke()
          ctx.restore()
        }

        // Connect particles to each other (Neural Synapses)
        for (let j = i - 1; j >= 0; j--) {
          const p2 = particles[j]
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist < 60) {
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(172, 235, 167, ${(Math.min(p.alpha, p2.alpha) * 0.2 * (1 - dist / 60)).toFixed(2)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
            ctx.restore()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      const now = Date.now()
      const dt = Math.max(now - lastPosRef.current.time, 1)
      const dx = clientX - lastPosRef.current.x
      const dy = clientY - lastPosRef.current.y
      const speed = Math.min((Math.hypot(dx, dy) / dt) * 15, 35)
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI

      setCursorVelocity({ speed, angle })
      lastPosRef.current = { x: clientX, y: clientY, time: now }

      setMousePosition({ x: clientX, y: clientY })
      if (!isVisible) setIsVisible(true)

      // Spawn 1-2 bioluminescent dust particles along cursor trajectory
      if (particlesRef.current.length < 45 && speed > 2) {
        const colors = [
          'rgba(172, 235, 167, ALPHA)', // Mint glow
          'rgba(56, 189, 248, ALPHA)',  // Diagnostic cyan
          'rgba(255, 255, 255, ALPHA)'  // Spark
        ]
        const count = speed > 15 ? 2 : 1
        for (let k = 0; k < count; k++) {
          particlesRef.current.push({
            x: clientX + (Math.random() - 0.5) * 6,
            y: clientY + (Math.random() - 0.5) * 6,
            vx: (dx / dt) * 0.08 + (Math.random() - 0.5) * 0.6,
            vy: (dy / dt) * 0.08 + (Math.random() - 0.5) * 0.6,
            radius: Math.random() * 1.8 + 1.2,
            alpha: 0.85,
            decay: 0.02 + Math.random() * 0.015,
            color: colors[Math.floor(Math.random() * colors.length)]
          })
        }
      }

      // Feed mouse position and 3D tilt to hovered spotlight card
      const targetCard = e.target.closest('.spotlight-card')
      if (targetCard) {
        lastCardRef.current = targetCard
        const rect = targetCard.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const tiltX = (((y - centerY) / centerY) * -3.5).toFixed(2)
        const tiltY = (((x - centerX) / centerX) * 3.5).toFixed(2)

        targetCard.style.setProperty('--mouse-x', `${x}px`)
        targetCard.style.setProperty('--mouse-y', `${y}px`)
        targetCard.style.setProperty('--tilt-x', `${tiltX}deg`)
        targetCard.style.setProperty('--tilt-y', `${tiltY}deg`)
      } else if (lastCardRef.current) {
        lastCardRef.current.style.setProperty('--tilt-x', '0deg')
        lastCardRef.current.style.setProperty('--tilt-y', '0deg')
        lastCardRef.current = null
      }
    }

    const handleMouseOver = (e) => {
      const target = e.target
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button'
      ) {
        setIsHovered(true)
        setHoverType(target.closest('.danger-action') ? 'danger' : 'button')
      } else if (target.closest('.scanner-target') || target.tagName === 'CANVAS') {
        setIsHovered(true)
        setHoverType('scanner')
      } else if (target.closest('.spotlight-card')) {
        setIsHovered(true)
        setHoverType('card')
      } else {
        setIsHovered(false)
        setHoverType('default')
      }
    }

    const handleMouseDown = (e) => {
      setIsClicking(true)
      const newRipple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      }
      setRipples((prev) => [...prev.slice(-3), newRipple])

      // Click burst: emit 8 radial sparks
      for (let b = 0; b < 8; b++) {
        const theta = (Math.PI * 2 * b) / 8 + Math.random() * 0.2
        const velocity = Math.random() * 2 + 1.5
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(theta) * velocity,
          vy: Math.sin(theta) * velocity,
          radius: Math.random() * 2 + 1.5,
          alpha: 1.0,
          decay: 0.035,
          color: 'rgba(172, 235, 167, ALPHA)'
        })
      }
    }

    const handleMouseUp = () => {
      setIsClicking(false)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
      if (lastCardRef.current) {
        lastCardRef.current.style.setProperty('--tilt-x', '0deg')
        lastCardRef.current.style.setProperty('--tilt-y', '0deg')
        lastCardRef.current = null
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseover', handleMouseOver, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleMouseOver)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isVisible])

  // Clear old ripples
  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1))
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [ripples])

  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden hidden md:block select-none">
      {/* 0. Bioluminescent Neural Particle Swarm Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-40 w-full h-full"
      />
      {/* 1. Global Bioluminescent Ambient Spotlight Aura (Follows cursor across page) */}
      <motion.div
        style={{
          x: spotlightX,
          y: spotlightY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        className="w-[450px] h-[450px] rounded-full bg-radial from-[#aceba7]/12 via-[#12464e]/8 to-transparent blur-[70px] pointer-events-none dark:from-[#aceba7]/15 dark:via-[#12464e]/15"
      />

      {/* 2. Click Shockwave Ripples */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ opacity: 0.8, scale: 0 }}
            animate={{ opacity: 0, scale: 2.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            style={{
              left: ripple.x,
              top: ripple.y,
              translateX: '-50%',
              translateY: '-50%'
            }}
            className="absolute w-12 h-12 rounded-full border border-[#aceba7] shadow-[0_0_15px_#aceba7] pointer-events-none"
          />
        ))}
      </AnimatePresence>

      {/* 3. Outer Interactive High-Tech Reticle Ring with Velocity Fluidity */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          scale: isClicking ? 0.75 : isHovered ? (hoverType === 'scanner' ? 1.8 : 1.4) : 1,
          scaleX: isHovered ? 1 : 1 + Math.min(cursorVelocity.speed / 60, 0.35),
          scaleY: isHovered ? 1 : 1 - Math.min(cursorVelocity.speed / 100, 0.2),
          rotate: isHovered ? 0 : cursorVelocity.angle,
          borderColor:
            hoverType === 'danger'
              ? 'rgba(244, 63, 94, 0.8)'
              : hoverType === 'scanner'
              ? 'rgba(172, 235, 167, 0.95)'
              : isHovered
              ? 'rgba(172, 235, 167, 0.75)'
              : 'rgba(18, 70, 78, 0.35)',
          backgroundColor:
            hoverType === 'danger'
              ? 'rgba(244, 63, 94, 0.08)'
              : hoverType === 'scanner'
              ? 'rgba(172, 235, 167, 0.08)'
              : isHovered
              ? 'rgba(172, 235, 167, 0.05)'
              : 'rgba(172, 235, 167, 0.01)',
          boxShadow: isHovered
            ? '0 0 24px 3px rgba(172, 235, 167, 0.3)'
            : '0 0 0 0 transparent'
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className="w-11 h-11 rounded-full border backdrop-blur-[0.5px] flex items-center justify-center relative"
      >
        {/* Micro HUD corner tick marks when in clinical scanner mode */}
        {hoverType === 'scanner' && (
          <>
            <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#aceba7]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#aceba7]" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#aceba7]" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#aceba7]" />
          </>
        )}
      </motion.div>

      {/* 4. Center Precision Medical Laser Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          scale: isClicking ? 0.5 : isHovered ? 0.8 : 1,
          backgroundColor:
            hoverType === 'danger'
              ? '#f43f5e'
              : '#aceba7',
          boxShadow:
            hoverType === 'danger'
              ? '0 0 10px #f43f5e'
              : '0 0 12px #aceba7'
        }}
        transition={{ type: 'spring', stiffness: 600, damping: 28 }}
        className="w-2.5 h-2.5 rounded-full shadow-xs border border-white/60 pointer-events-none"
      />
    </div>
  )
}
