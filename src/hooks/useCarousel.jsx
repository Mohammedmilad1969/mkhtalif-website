import { useState, useEffect, useRef, useCallback } from 'react'

export const useCarousel = (itemsCount, speedWheel = 0.02, speedDrag = -0.1) => {
  const [progress, setProgress] = useState(50)
  const [active, setActive] = useState(0)
  const [isDown, setIsDown] = useState(false)
  const [allowScroll, setAllowScroll] = useState(false)
  const [isSectionActive, setIsSectionActive] = useState(false)
  const startXRef = useRef(0)
  const containerRef = useRef(null)
  const rafIdRef = useRef(null)

  // Get Z-index for each item based on active index
  const getZindex = useCallback((index, activeIndex) => {
    if (index === activeIndex) return itemsCount
    return itemsCount - Math.abs(index - activeIndex)
  }, [itemsCount])

  // Check if services section is prominently in view
  const checkSectionInView = useCallback(() => {
    const container = containerRef.current
    if (!container) return false

    const rect = container.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth
    
    // Section should be at least 60% visible and centered in viewport
    const sectionTop = rect.top
    const sectionBottom = rect.bottom
    const sectionHeight = rect.height
    
    // Calculate how much of the section is visible
    const visibleTop = Math.max(0, -sectionTop)
    const visibleBottom = Math.max(0, sectionBottom - windowHeight)
    const visibleHeight = sectionHeight - visibleTop - visibleBottom
    const visiblePercent = (visibleHeight / sectionHeight) * 100
    
    // Section should be at least 60% visible and in the viewport
    const isVisible = visiblePercent >= 60 && sectionTop < windowHeight && sectionBottom > 0
    
    // Also check if section is reasonably centered (not too far off screen)
    const isCentered = sectionTop < windowHeight * 0.8 && sectionBottom > windowHeight * 0.2
    
    return isVisible && isCentered
  }, [])

  // Monitor section visibility
  useEffect(() => {
    const checkVisibility = () => {
      const isActive = checkSectionInView()
      setIsSectionActive(isActive)
      
      // If section is not active and we're not at boundaries, allow scroll
      if (!isActive && progress > 5 && progress < 95) {
        setAllowScroll(true)
      }
    }

    checkVisibility()
    window.addEventListener('scroll', checkVisibility, { passive: true })
    window.addEventListener('resize', checkVisibility, { passive: true })

    return () => {
      window.removeEventListener('scroll', checkVisibility)
      window.removeEventListener('resize', checkVisibility)
    }
  }, [checkSectionInView, progress])

  // Calculate active item from progress
  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(progress, 100))
    const newActive = Math.floor((clampedProgress / 100) * (itemsCount - 1))
    setActive(newActive)
    
    // Allow scrolling when we've reached boundaries
    if (clampedProgress >= 90 || newActive >= itemsCount - 1) {
      setAllowScroll(true)
    } else if (clampedProgress <= 10) {
      // At the beginning, allow scrolling up
      setAllowScroll(true)
    } else if (!isSectionActive) {
      // If section not active, allow scroll
      setAllowScroll(true)
    } else {
      setAllowScroll(false)
    }
  }, [progress, itemsCount, isSectionActive])

  // Handle wheel scroll with requestAnimationFrame for smoothness
  const handleWheel = useCallback((e) => {
    // Check if section is prominently in view
    const sectionActive = checkSectionInView()
    
    // If section is not prominently visible, allow normal scroll
    if (!sectionActive) {
      return
    }

    // If we're at the end and scrolling down, allow normal scroll
    if (allowScroll && e.deltaY > 0) {
      return // Let the page scroll normally
    }
    
    // If scrolling up from the end, re-engage carousel
    if (allowScroll && e.deltaY < 0) {
      setAllowScroll(false)
      setProgress(prev => {
        const newVal = Math.max(0, prev - 2)
        return newVal
      })
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // If at the beginning (progress <= 10) and scrolling up, allow normal scroll
    if (progress <= 10 && e.deltaY < 0) {
      return // Let the page scroll normally upwards
    }
    
    // Prevent default only if carousel is active and section is in view
    if (!allowScroll && sectionActive) {
      e.preventDefault()
      e.stopPropagation()
      
      // Cancel any pending animation
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      
      rafIdRef.current = requestAnimationFrame(() => {
        const wheelProgress = e.deltaY * speedWheel
        setProgress(prev => {
          const newProgress = prev + wheelProgress
          return Math.max(0, Math.min(newProgress, 100))
        })
      })
    }
  }, [allowScroll, speedWheel, progress, checkSectionInView])

  // Handle mouse move / touch move
  const handleMouseMove = useCallback((e) => {
    if (!isDown || allowScroll || !isSectionActive) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // Cancel any pending animation
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
      const mouseProgress = (x - startXRef.current) * speedDrag
      setProgress(prev => {
        const newProgress = prev + mouseProgress
        return Math.max(0, Math.min(newProgress, 100))
      })
      startXRef.current = x
    })
  }, [isDown, allowScroll, speedDrag, isSectionActive])

  // Handle mouse down / touch start
  const handleMouseDown = useCallback((e) => {
    if (allowScroll || !isSectionActive) return
    setIsDown(true)
    startXRef.current = e.clientX || (e.touches && e.touches[0]?.clientX) || 0
    e.preventDefault()
  }, [allowScroll, isSectionActive])

  // Handle mouse up / touch end
  const handleMouseUp = useCallback(() => {
    setIsDown(false)
  }, [])

  // Handle click on item
  const goToItem = useCallback((index) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
    
    const targetProgress = (index / (itemsCount - 1)) * 100
    setProgress(Math.max(0, Math.min(targetProgress, 100)))
    setAllowScroll(false)
  }, [itemsCount])

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mousedown', handleMouseDown, { passive: false })
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('touchstart', handleMouseDown, { passive: false })
    document.addEventListener('touchmove', handleMouseMove, { passive: false })
    document.addEventListener('touchend', handleMouseUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('touchstart', handleMouseDown)
      document.removeEventListener('touchmove', handleMouseMove)
      document.removeEventListener('touchend', handleMouseUp)
      
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [handleWheel, handleMouseMove, handleMouseDown, handleMouseUp])

  return {
    progress,
    active,
    containerRef,
    goToItem,
    getZindex,
    allowScroll
  }
}
