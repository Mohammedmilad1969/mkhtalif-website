import React from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

// 3D Text Component with mouse parallax
export const Text3D = ({ children, className = '', delay = 0, intensity = 15 }) => {
  const ref = React.useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [intensity, -intensity])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-intensity, intensity])

  const handleMouseMove = (e) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={className}
      initial={{ opacity: 0, rotateX: -20, z: -100 }}
      whileInView={{ opacity: 1, rotateX: 0, z: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay
      }}
    >
      {children}
    </motion.div>
  )
}

// 3D Text Reveal Component
export const Text3DReveal = ({ children, className = '', delay = 0, direction = 'up' }) => {
  const directions = {
    up: { y: 50, rotateX: -45 },
    down: { y: -50, rotateX: 45 },
    left: { x: 50, rotateY: 45 },
    right: { x: -50, rotateY: -45 }
  }

  const initial = directions[direction] || directions.up
  
  // Check if mobile device
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))

  return (
    <motion.div
      className={className}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      initial={isMobile ? { 
        opacity: 0, 
        y: 20,
        scale: 0.95
      } : { 
        opacity: 0, 
        ...initial,
        z: -100,
        scale: 0.8
      }}
      whileInView={{ 
        opacity: 1, 
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        z: 0,
        scale: 1
      }}
      viewport={{ once: true, margin: isMobile ? '0px' : '-50px' }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 20,
        delay,
        mass: 0.8
      }}
    >
      {children}
    </motion.div>
  )
}

// 3D Letter Component for individual letter animation
export const Letter3D = ({ children, index, delay = 0 }) => {
  return (
    <motion.span
      display="inline-block"
      initial={{ 
        opacity: 0, 
        y: 50,
        rotateX: -90,
        z: -50
      }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        rotateX: 0,
        z: 0
      }}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        delay: delay + (index * 0.03)
      }}
      style={{ 
        display: 'inline-block',
        transformStyle: 'preserve-3d'
      }}
      whileHover={{
        scale: 1.2,
        rotateY: 15,
        rotateX: 5,
        z: 20,
        transition: { duration: 0.3 }
      }}
    >
      {children === ' ' ? '\u00A0' : children}
    </motion.span>
  )
}

// 3D Text Split Component
export const Text3DSplit = ({ text, className = '', delay = 0 }) => {
  const letters = text.split('')
  
  return (
    <div className={className} style={{ perspective: '1000px' }}>
      {letters.map((letter, index) => (
        <Letter3D key={index} index={index} delay={delay}>
          {letter}
        </Letter3D>
      ))}
    </div>
  )
}

