import { useEffect, useRef } from 'react'

export const useParallax = (intensity = 0.5) => {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const moveX = (x - centerX) * intensity
      const moveY = (y - centerY) * intensity

      const rotateX = ((y - centerY) / centerY) * intensity * 10
      const rotateY = ((centerX - x) / centerX) * intensity * 10

      element.style.transform = `
        translate3d(${moveX}px, ${moveY}px, 0)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
      `
      element.style.transition = 'transform 0.1s ease-out'
    }

    const handleMouseLeave = () => {
      element.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)'
      element.style.transition = 'transform 0.5s ease-out'
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [intensity])

  return ref
}

