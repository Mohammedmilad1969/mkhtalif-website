import { useEffect, useRef, useState } from 'react'

export const useCardParallax = (intensity = 0.15) => {
  const cardRef = useRef(null)
  const containerRef = useRef(null)
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 })
  const rafId = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    const container = containerRef.current
    if (!card || !container) return

    let mouseX = 0
    let mouseY = 0
    let targetRotateX = 0
    let targetRotateY = 0
    let currentRotateX = 0
    let currentRotateY = 0

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Calculate normalized position (0 to 1)
      const normalizedX = x / rect.width
      const normalizedY = y / rect.height

      // Calculate rotation targets (-15 to 15 degrees)
      targetRotateX = (normalizedY - 0.5) * -30 * intensity
      targetRotateY = (normalizedX - 0.5) * 30 * intensity

      // Update gradient position (0 to 100%)
      setGradientPosition({
        x: normalizedX * 100,
        y: normalizedY * 100
      })
    }

    const handleMouseLeave = () => {
      targetRotateX = 0
      targetRotateY = 0
      setGradientPosition({ x: 50, y: 50 })
    }

    // Smooth animation loop using requestAnimationFrame
    const animate = () => {
      // Easing function for smooth interpolation
      const easing = 0.15
      currentRotateX += (targetRotateX - currentRotateX) * easing
      currentRotateY += (targetRotateY - currentRotateY) * easing

      // Apply transform with GPU acceleration
      card.style.transform = `
        perspective(1000px)
        rotateX(${currentRotateX}deg)
        rotateY(${currentRotateY}deg)
        translateZ(0)
      `
      card.style.transformStyle = 'preserve-3d'

      rafId.current = requestAnimationFrame(animate)
    }

    // Start animation loop
    animate()

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [intensity])

  return { cardRef, containerRef, gradientPosition }
}

