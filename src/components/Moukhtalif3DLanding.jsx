import React, { useState, useEffect, useRef, Children, useImperativeHandle, forwardRef, Suspense, Component, useCallback, useMemo } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getCategories, getAllProjectsList } from '../utils/dataStorage'
import { isFirebaseConfigured } from '../config/firebase'
import { Text3D, Text3DReveal, Text3DSplit } from './Text3D'
import emailjs from '@emailjs/browser'
// import OurWork from './OurWork/OurWork' // Disabled - causing white screen

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center text-white bg-black">
          <div className="text-center">
            <p className="text-xl mb-4">Error loading 3D Gallery</p>
            <p className="text-sm text-gray-400">{this.state.error?.message || 'Unknown error'}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-gold text-black rounded hover:bg-gold/80"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Enhanced 3D Animation variants
const fadeInUp3D = {
  initial: { opacity: 0, y: 50, rotateX: -15, z: -50 },
  animate: { opacity: 1, y: 0, rotateX: 0, z: 0 },
  transition: { 
    type: 'spring',
    stiffness: 100,
    damping: 15,
    duration: 0.8
  }
}

const fadeIn3D = {
  initial: { opacity: 0, scale: 0.9, z: -50 },
  animate: { opacity: 1, scale: 1, z: 0 },
  transition: { 
    type: 'spring',
    stiffness: 120,
    damping: 20,
    duration: 0.8
  }
}

const staggerContainer3D = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

const scaleIn3D = {
  initial: { opacity: 0, scale: 0.8, rotateY: -20, z: -100 },
  animate: { opacity: 1, scale: 1, rotateY: 0, z: 0 },
  transition: { 
    type: 'spring',
    stiffness: 100,
    damping: 15,
    duration: 0.8
  }
}

const slideIn3D = {
  initial: { opacity: 0, x: -100, rotateY: 45, z: -100 },
  animate: { opacity: 1, x: 0, rotateY: 0, z: 0 },
  transition: { 
    type: 'spring',
    stiffness: 100,
    damping: 15,
    duration: 0.8
  }
}

// Legacy variants for backward compatibility
const fadeInUp = fadeInUp3D
const fadeIn = fadeIn3D
const staggerContainer = staggerContainer3D
const scaleIn = scaleIn3D

// Helper function for smooth interpolation
function lerp(start, stop, amt) {
  return (1 - amt) * start + amt * stop;
}

// Service Card Component
const ServiceCard = ({ category, index, total }) => {
  return (
    <div className="bg-black border border-gold/30 rounded-[17px] overflow-visible shadow-lg w-full max-w-[90vw] md:w-72 lg:w-80 flex flex-col" style={{ minHeight: 'auto', height: 'auto' }}>
      {/* Title */}
      <div className="bg-gradient-to-b from-black/80 to-transparent pb-4 pt-6 px-4 md:px-6 border-b border-gold/20 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <h3 className="flex-1 text-lg md:text-lg lg:text-xl font-bold leading-tight text-white">
            {category.title}
          </h3>
          <span className="text-gold text-xl md:text-2xl font-bold opacity-80 flex-shrink-0">
            {String(total - index).padStart(2, '0')}
          </span>
        </div>
      </div>
      
      {/* Content - Show all items without scroll */}
      <div className="p-4 md:p-6 flex-1 overflow-visible">
        <ul className="space-y-2 md:space-y-3">
          {category.items.map((item, itemIndex) => (
            <li
              key={itemIndex}
              className="flex items-start gap-2 md:gap-3 text-sm md:text-sm text-lightGray/90 leading-relaxed"
            >
              <span className="text-gold mt-1.5 flex-shrink-0 text-base md:text-lg">•</span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Circular Carousel Component
const CircularCarouselComp = ({ onSelect, onSwapRight, onPointerDown, children }, ref) => {
  const indexRef = useRef(0);
  const prevRef = useRef(0);
  const nextRef = useRef(0);
  const rendering = useRef(false);
  const wheelLockedRef = useRef(false);
  const [deg, setDeg] = useState(0);
  const [wrapper, setWrapper] = useState(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const ARC_SIZE = 150;
  const len = Children.count(children);

  // Initialize to show first card (index 0) at the front
  useEffect(() => {
    if (len > 0) {
      // To show the first card (index 0) at the front, we need to rotate the carousel
      // The formula is: deg = (-ARC_SIZE / len) * index
      // For index 0: deg = (-ARC_SIZE / len) * 0 = 0
      // But we need to ensure the first card is actually in front
      // The carousel rotates negatively, so we start at 0 to show card 0
      const initialDeg = 0;
      nextRef.current = initialDeg;
      prevRef.current = initialDeg;
      setDeg(initialDeg);
      indexRef.current = 0;
      setCurrentIndex(0);
      
      // Force a re-render to ensure the position is correct
      setTimeout(() => {
        setDeg(initialDeg);
        nextRef.current = initialDeg;
        prevRef.current = initialDeg;
      }, 50);
    }
  }, [len]);

  prevRef.current = deg;

  function move() {
    const next = nextRef.current;
    const prev = prevRef.current;
    const newDeg = lerp(prev, next, 0.2);
    
    if (Math.abs(newDeg - prev) > 0.01) {
      setDeg(newDeg);
      requestAnimationFrame(move);
    } else {
      rendering.current = false;
    }
    
    // Calculate which card is in front based on rotation
    // When deg is negative, we rotate backwards through the cards
    // Formula: index = Math.round((-deg / ARC_SIZE) * len) % len
    // For deg = 0, index should be 0 (first card)
    let calculatedIndex = Math.round((-newDeg / ARC_SIZE) * len);
    // Handle negative modulo correctly
    calculatedIndex = ((calculatedIndex % len) + len) % len;
    if (calculatedIndex !== indexRef.current) {
      indexRef.current = calculatedIndex;
      setCurrentIndex(calculatedIndex);
      onSelect && onSelect(calculatedIndex);
    }
    
    // Check if we can scroll past the carousel
    // At the beginning (index 0), allow scrolling up
    // At the end (index len-1), allow scrolling down
    const maxDeg = -ARC_SIZE * (len - 1) / len;
    setCanScrollUp(calculatedIndex === 0 && newDeg >= -2);
    setCanScrollDown(calculatedIndex === len - 1 && newDeg <= maxDeg + 2);
  }

  const onMouseDown = (e) => {
    const isTouch = e.type === "touchstart";
    let _deg = deg;

    onPointerDown && onPointerDown();

    const tryMove = (next) => {
      _deg = nextRef.current += next;
      _deg = nextRef.current = Math.min(_deg, 3);
      _deg = nextRef.current = Math.max(_deg, -ARC_SIZE + 3);
      if (!rendering.current) {
        rendering.current = true;
        requestAnimationFrame(move);
      }
    };

    const onMouseMove = ({ movementX }) => {
      tryMove(movementX / 30);
    };

    let prevTouchPageX;
    const onTouchMove = ({ touches }) => {
      const pageX = touches[0].pageX;
      if (prevTouchPageX !== undefined) {
        const movementX = pageX - prevTouchPageX;
        tryMove(movementX / 10);
      }
      prevTouchPageX = pageX;
    };

    const onMouseUp = () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onMouseUp);

      const angle = ARC_SIZE / len;
      const mod = _deg % angle;
      const diff = angle - Math.abs(mod);
      const sign = Math.sign(_deg);
      const max = angle * (len - 1);

      if (_deg > 0) {
        if (onSwapRight && indexRef.current === 0 && _deg > 2) {
          onSwapRight();
        }
        tryMove(-_deg);
      } else if (-_deg > max) {
        tryMove(-_deg - max);
      } else {
        const move = (diff <= angle / 2 ? diff : mod) * sign;
        tryMove(move);
      }
    };

    if (isTouch) {
      document.addEventListener("touchmove", onTouchMove);
      document.addEventListener("touchend", onMouseUp);
    } else {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
  };

  useEffect(() => {
    if (!wrapper) return;

    const onWheel = (e) => {
      // Check current position
      const currentIndex = indexRef.current;
      const currentDeg = nextRef.current;
      const isScrollingDown = e.deltaY > 0;
      const isScrollingUp = e.deltaY < 0;
      
      // Calculate angles
      const cardAngle = ARC_SIZE / len;
      // Last card (index len-1) position: each card moves by cardAngle
      // Card 0 is at 0, Card 1 is at -cardAngle, Card (len-1) is at -(len-1)*cardAngle
      const maxDeg = -(len - 1) * cardAngle; // Exact position of last card
      const minDeg = 0; // Position of first card
      
      // Calculate what the next position would be
      let _deg = cardAngle;
      if (isScrollingDown) {
        _deg *= -1;
      }
      const next = nextRef.current + _deg;
      
      // Calculate which index we would reach with the next scroll
      let nextIndex = Math.round((-next / ARC_SIZE) * len);
      nextIndex = ((nextIndex % len) + len) % len;
      
      // Check boundaries BEFORE preventing default
      // At first card, allow scrolling up to previous section
      if (currentIndex === 0 && isScrollingUp && currentDeg >= -cardAngle / 4) {
        return; // Allow page scroll up
      }
      
      // At last card, allow scrolling down to next section
      // Check if we're ALREADY at the last card AND at the exact position
      // Only then allow page scroll (don't prevent reaching the last card!)
      if (isScrollingDown && currentIndex === len - 1) {
        // Check if we're at the exact last card position
        const tolerance = 2;
        const distanceToMax = Math.abs(currentDeg - maxDeg);
        if (distanceToMax <= tolerance) {
          // We're at the last card position
          // Allow page scroll on next scroll event
          // But first, let's ensure we update to maxDeg if needed
          if (currentDeg > maxDeg + tolerance) {
            // Not quite at maxDeg yet, continue normal navigation
          } else {
            // We're at maxDeg, allow page scroll
            return;
          }
        }
      }
      
      // Now we can safely prevent default and navigate the carousel
      e.preventDefault();
      e.stopPropagation();

      if (wheelLockedRef.current) {
        return;
      }
      wheelLockedRef.current = true;

      setTimeout(() => {
        wheelLockedRef.current = false;
      }, 100);

      // Calculate the next position and clamp to boundaries
      let clampedNext = next;
      
      // Clamp to boundaries - ensure we can reach both first and last cards
      if (clampedNext > minDeg) {
        clampedNext = minDeg;
      }
      if (clampedNext < maxDeg) {
        clampedNext = maxDeg;
      }
      
      // Calculate which card index we'll be at
      let index = Math.round((-clampedNext / ARC_SIZE) * len);
      index = ((index % len) + len) % len;

      // Check if we've reached the last card and are trying to scroll beyond it
      if (isScrollingDown && index === len - 1) {
        // We're at the last card
        // Check if we're at the exact last card position
        const tolerance = 1;
        if (Math.abs(clampedNext - maxDeg) <= tolerance) {
          // We're at the last card position
          // Update to exact position
          nextRef.current = maxDeg;
          if (!rendering.current) {
            rendering.current = true;
            requestAnimationFrame(move);
          }
          // On the next scroll event, if we're still at the last card and scrolling down,
          // the boundary check at the start will allow page scroll
          return;
        }
      }

      // Handle special case for first card
      if (isScrollingUp && index === 1) {
        onSwapRight && onSwapRight();
        return;
      }

      // Update position normally
      nextRef.current = clampedNext;

      if (!rendering.current) {
        rendering.current = true;
        requestAnimationFrame(move);
      }
    };

    wrapper.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      wrapper.removeEventListener("wheel", onWheel);
    };
  }, [wrapper, len, onSwapRight]);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo(i) {
        const _deg = (-ARC_SIZE / len) * i;
        nextRef.current = _deg;
        if (!rendering.current) {
          rendering.current = true;
          requestAnimationFrame(move);
        }
      },
    }),
    [len]
  );

  return (
    <div className="circular-carousel-root" ref={setWrapper}>
      {/* Left Arrow - shows cards come from left */}
      {currentIndex > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gold animate-pulse"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <div className="text-gold text-xs font-bold opacity-70">←</div>
          </div>
        </motion.div>
      )}
      
      {/* Right Arrow - shows cards go to right */}
      {currentIndex < len - 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gold animate-pulse"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            <div className="text-gold text-xs font-bold opacity-70">→</div>
          </div>
        </motion.div>
      )}
      
      <div
        className="circular-carousel-handle"
        onMouseDown={onMouseDown}
        onTouchStart={onMouseDown}
      >
        <div className="circular-carousel-center">
          <div
            className="circular-carousel-items"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            {Children.map(children, (child, i) => {
              // Calculate angle for each card
              // Cards are positioned around a circle
              // First card (i=0) is at 0 degrees, last card is at ARC_SIZE degrees
              const cardAngle = i * (ARC_SIZE / len);
              return (
                <div
                  key={i}
                  className="circular-carousel-item"
                  style={{
                    transform: `translateX(-50%) rotate(${cardAngle}deg)`,
                  }}
                >
                  {child}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CircularCarousel = forwardRef(CircularCarouselComp);

// Service Card Grid Component with Circular Carousel
const ServiceCardGrid = ({ services }) => {
  const categories = services.categories
  const carouselRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Ensure first card (index 0) is shown on mount
  useEffect(() => {
    if (carouselRef.current && categories.length > 0 && !isMobile) {
      // Scroll to first card (index 0) to ensure it's visible
      // Use multiple timeouts to ensure the carousel is fully initialized
      setTimeout(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollTo(0);
        }
      }, 50);
      setTimeout(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollTo(0);
        }
      }, 200);
    }
  }, [categories.length, isMobile]);
  
  // Mobile: Simple vertical scrollable list
  if (isMobile) {
    return (
      <div className="w-full py-4">
        <div className="container mx-auto px-4">
          <div className="space-y-6">
            {categories.map((category, index) => {
              const originalIndex = categories.length - 1 - index;
              return (
                <ServiceCard
                  key={`card-${originalIndex}`}
                  category={category}
                  index={originalIndex}
                  total={categories.length}
                />
              );
            })}
          </div>
        </div>
      </div>
    )
  }
  
  // Desktop: Circular carousel
  return (
    <div className="w-full min-h-screen">
      <div className="relative flex min-h-screen flex-col items-center justify-center py-2 md:py-0">
        <CircularCarousel
          ref={carouselRef}
          onSelect={(index) => {
            // Optional: handle selection
          }}
        >
          {[...categories].reverse().map((category, index) => {
            // Reverse the array so the last category (number 1) appears first
            // But we need to calculate the original index for numbering
            const originalIndex = categories.length - 1 - index;
            return (
              <ServiceCard
                key={`card-${originalIndex}`}
                category={category}
                index={originalIndex}
                total={categories.length}
              />
            );
          })}
        </CircularCarousel>
      </div>
    </div>
  )
}

// Project Card Component for Stack
const StackedProjectCard = ({ project, cardIndex, total, lang, displayNumber, isMobile = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: cardIndex * 0.05,
        ease: "easeOut"
      }}
      whileHover={!isMobile ? { 
        scale: 1.02,
        y: -5,
        transition: { duration: 0.3 }
      } : {}}
      className="group relative overflow-hidden rounded-lg bg-black border border-gold/20 hover:border-gold/40 transition-all duration-300"
      style={{
        width: '100%',
        maxWidth: '100%',
        pointerEvents: 'auto'
      }}
    >
      <Link to={project.href} className="block">
        <div className="relative h-64 md:h-96 overflow-hidden">
          <motion.img
            decoding="auto"
            width="2544"
            height="1336"
            sizes="calc(min(100vw, 1920px) - 108px)"
            srcSet={project.imageSrcSet}
            src={project.imageSrc}
            alt={project.alt}
            className="w-full h-full object-cover object-center"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 1, 
              delay: cardIndex * 0.15 + 0.2,
              ease: "easeOut"
            }}
            whileHover={{ scale: 1.05 }}
          />
        </div>
      </Link>
      {/* Display Number Badge */}
      {displayNumber && (
        <motion.div 
          className="absolute top-4 right-4 z-20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: cardIndex * 0.15 + 0.4,
            type: "spring",
            stiffness: 200
          }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gold/20 backdrop-blur-sm border border-gold/50 rounded-full flex items-center justify-center shadow-lg hover:shadow-gold/50 transition-shadow duration-300">
            <span className="text-gold font-bold text-base md:text-lg">{displayNumber}</span>
          </div>
        </motion.div>
      )}
      
      {/* Content */}
      <motion.div 
        className="p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: cardIndex * 0.15 + 0.3,
          ease: "easeOut"
        }}
      >
        <div className="mb-4">
          <p className="text-sm text-lightGray/70 mb-1">{lang === 'ar' ? 'اسم المشروع:' : 'Project Name:'}</p>
          <p className="text-xl md:text-2xl font-bold text-white">{project.projectName}</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-lightGray/70 mb-1">{lang === 'ar' ? 'الوصف' : 'Description'}</p>
          <p className="text-lightGray/90">{project.description}</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-lightGray/70 mb-1">{lang === 'ar' ? 'الصناعة:' : 'Industry:'}</p>
            <p className="text-lg font-semibold text-gold">{project.industry}</p>
          </div>
          <div>
            <p className="text-sm text-lightGray/70 mb-1">{lang === 'ar' ? 'تاريخ الإصدار:' : 'Release Date:'}</p>
            <p className="text-lg font-semibold text-white">{project.releaseDate}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Projects Stack Component
const ProjectsStack = ({ lang, isMobile = false }) => {
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Load categories from storage
  const [categories, setCategories] = useState([])
  
  // Function to load categories (now async)
  const loadCategories = useCallback(async () => {
    try {
      const storedCategories = await getCategories()
      console.log('Loaded categories from storage:', storedCategories)
      // Add "All" category if not exists
      const allCategory = storedCategories.find(cat => cat.id === 'all')
      if (!allCategory) {
        const categoriesWithAll = [{ id: 'all', name: lang === 'ar' ? 'الكل' : 'All', nameAr: 'الكل' }, ...storedCategories]
        setCategories(categoriesWithAll)
        console.log('Categories with All added:', categoriesWithAll)
      } else {
        setCategories(storedCategories)
        console.log('Categories set:', storedCategories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [lang])
  
  useEffect(() => {
    loadCategories()
  }, [loadCategories])
  
  // Listen for category updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'moukhtalif_categories' || e.key === null) {
        console.log('Storage change detected for categories, reloading...')
        loadCategories()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('categoriesUpdated', loadCategories)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('categoriesUpdated', loadCategories)
    }
  }, [loadCategories])

  // Load projects from storage
  const [projects, setProjects] = useState([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  
  // Function to load and format projects (memoized with useCallback, now async)
  const loadProjects = useCallback(async () => {
    console.log('🔄 Loading projects in ProjectsStack...')
    console.log('📍 Current URL:', window.location.href)
    console.log('📍 Using Firebase:', isFirebaseConfigured ? 'YES (shared across browsers!)' : 'NO (localStorage - browser-specific)')
    
    setIsLoadingProjects(true)
    try {
      const projectsList = await getAllProjectsList()
      console.log('✅ Raw projects list from getAllProjectsList:', projectsList)
      console.log('✅ Number of projects loaded:', projectsList.length)
      
      if (projectsList.length === 0) {
        console.warn('⚠️ No projects found in storage!')
        if (!isFirebaseConfigured) {
          console.log('💡 Tip: Firebase is not configured. Data is stored in localStorage (browser-specific).')
          console.log('💡 To share data across all browsers, configure Firebase in src/config/firebase.js')
        }
      }
      
      // Convert to display format
      const formattedProjects = projectsList.map(project => {
        const formatted = {
          href: `/projects/${project.id}`,
          imageSrc: project.images && project.images.length > 0 ? project.images[0] : "/images/placeholder.jpg",
          imageSrcSet: project.images && project.images.length > 0 ? `${project.images[0]} 1920w` : "/images/placeholder.jpg 1920w",
          alt: project.name || "Project",
          projectName: lang === 'ar' ? (project.nameAr || project.name) : (project.name || project.nameAr),
          description: lang === 'ar' ? (project.descriptionAr || project.description) : (project.description || project.descriptionAr),
          industry: lang === 'ar' ? (project.industryAr || project.industry) : (project.industry || project.industryAr),
          releaseDate: project.releaseDate || "2024",
          category: project.category || 'all'
        }
        console.log('✨ Formatted project:', formatted.projectName, '| Category:', formatted.category, '| ID:', project.id)
        return formatted
      })
      console.log('✅ Formatted projects for display:', formattedProjects.length, 'projects')
      if (formattedProjects.length > 0) {
        console.log('✅ First project details:', {
          id: formattedProjects[0].href,
          name: formattedProjects[0].projectName,
          category: formattedProjects[0].category,
          imageSrc: formattedProjects[0].imageSrc
        })
      }
      setProjects(formattedProjects)
    } catch (error) {
      console.error('❌ Error loading projects:', error)
      console.error('❌ Error stack:', error.stack)
      setProjects([])
    } finally {
      setIsLoadingProjects(false)
    }
  }, [lang])
  
  // Load projects on mount and when language changes
  useEffect(() => {
    loadProjects()
  }, [loadProjects])
  
  // Listen for storage changes (when projects are added/updated in admin page)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'moukhtalif_projects' || e.key === null) {
        // Projects were updated, reload them
        loadProjects()
      }
    }
    
    // Listen for storage events (works across tabs/windows)
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events (for same-tab updates)
    window.addEventListener('projectsUpdated', loadProjects)
    
    // Reload when page becomes visible (user returns from admin page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProjects()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Reload when window gains focus (user switches back to this tab)
    const handleFocus = () => {
      loadProjects()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('projectsUpdated', loadProjects)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadProjects])

  // Filter projects based on selected category (with safe filtering)
  const filteredProjects = useMemo(() => {
    try {
      // Ensure projects is an array
      if (!Array.isArray(projects)) {
        console.warn('⚠️ Projects is not an array:', typeof projects, projects)
        return []
      }
      
      if (selectedCategory === 'all') {
        return projects
      }
      
      // Safe filter with error handling
      return projects.filter(project => {
        try {
          return project && project.category === selectedCategory
        } catch (error) {
          console.error('❌ Error filtering project:', error, project)
          return false
        }
      })
    } catch (error) {
      console.error('❌ Error in filteredProjects calculation:', error)
      return []
    }
  }, [projects, selectedCategory])
  
  // Debug logging
  useEffect(() => {
    console.log('📊 Projects state:', projects)
    console.log('📊 Selected category:', selectedCategory)
    console.log('📊 Filtered projects:', filteredProjects)
    console.log('📊 Filtered projects count:', filteredProjects.length)
    if (filteredProjects.length > 0) {
      console.log('📊 First filtered project:', {
        name: filteredProjects[0].projectName,
        category: filteredProjects[0].category,
        href: filteredProjects[0].href
      })
    }
  }, [projects, selectedCategory, filteredProjects])

  return (
    <div className="relative w-full bg-black">
      {/* Filter Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-20 z-40 bg-black/90 ${isMobile ? '' : 'backdrop-blur-md'} border-b border-gold/20 py-4 md:py-6`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isLoadingProjects) {
                    setSelectedCategory(category.id)
                  }
                }}
                disabled={isLoadingProjects}
                className={`px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gold text-black shadow-lg shadow-gold/50'
                    : isLoadingProjects
                      ? 'bg-black/30 border border-gold/10 text-lightGray/50 cursor-not-allowed'
                      : 'bg-black/50 border border-gold/30 text-lightGray hover:bg-gold/20 hover:border-gold/50'
                }`}
              >
                {lang === 'ar' ? category.nameAr : category.name}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="relative w-full bg-black">
        {filteredProjects && filteredProjects.length === 1 ? (
          // Single project: Use relative layout to ensure full visibility, no sticky positioning
          <div className="relative py-2 md:py-3">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="max-w-4xl mx-auto">
                {filteredProjects.map((project, index) => {
                  if (!project) return null
                  return (
                    <StackedProjectCard
                      key={project.href || `project-${index}`}
                      project={project}
                      cardIndex={0}
                      total={1}
                      lang={lang}
                      displayNumber={1}
                      isMobile={isMobile}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          // Multiple projects: Simple vertical stack layout
          <div className="container mx-auto px-4 sm:px-6 py-2 md:py-3">
            <div className="max-w-4xl mx-auto space-y-4">
              {isLoadingProjects ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
                  <p className="text-lg text-lightGray/60">
                    {lang === 'ar' ? 'جاري تحميل المشاريع...' : 'Loading projects...'}
                  </p>
                </motion.div>
              ) : (filteredProjects && filteredProjects.length > 0) ? (
                filteredProjects.map((project, index) => {
                  if (!project) return null
                  const total = filteredProjects.length
                  const cardIndex = index // Cards are numbered 1, 2, 3... within each category
                  
                  return (
                    <StackedProjectCard
                      key={project.href || `project-${index}`}
                      project={project}
                      cardIndex={cardIndex}
                      total={total}
                      lang={lang}
                      displayNumber={index + 1} // Display number starts from 1 for each category
                      isMobile={isMobile}
                    />
                  )
                })
              ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
              >
                <p className="text-2xl md:text-3xl text-lightGray/60 mb-4">
                  {lang === 'ar' ? 'لا توجد مشاريع في هذه الفئة' : 'No projects in this category'}
                </p>
                {projects.length === 0 && (
                  <div className="text-sm text-lightGray/40 space-y-2">
                    <p>
                      {lang === 'ar' 
                        ? `إجمالي المشاريع المحملة: ${projects.length}`
                        : `Total projects loaded: ${projects.length}`}
                    </p>
                    <p className="text-xs text-lightGray/30">
                      {lang === 'ar' 
                        ? '💡 ملاحظة: localStorage منفصل لكل متصفح. إذا أضفت مشروعاً في Chrome، لن يظهر في Firefox.'
                        : '💡 Note: localStorage is separate for each browser. If you added a project in Chrome, it won\'t appear in Firefox.'}
                    </p>
                    <p className="text-xs text-lightGray/30">
                      {lang === 'ar' 
                        ? 'افتح Developer Tools (F12) وانتقل إلى Console لرؤية تفاصيل أكثر.'
                        : 'Open Developer Tools (F12) and check Console for more details.'}
                    </p>
                  </div>
                )}
                {projects.length > 0 && selectedCategory !== 'all' && (
                  <div className="text-sm text-lightGray/40 space-y-2">
                    <p>
                      {lang === 'ar' 
                        ? `يوجد ${projects.length} مشروع(ات) لكن لا يوجد في الفئة "${selectedCategory}"`
                        : `There are ${projects.length} project(s) but none in category "${selectedCategory}"`}
                    </p>
                    <p className="text-xs text-gold/70">
                      {lang === 'ar' 
                        ? '💡 جرب الضغط على زر "All" لعرض جميع المشاريع'
                        : '💡 Try clicking the "All" button to see all projects'}
                    </p>
                  </div>
                )}
              </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading Screen Component
const LoadingScreen = ({ onComplete }) => {
  useEffect(() => {
    // Auto-complete after 3 seconds (adjust as needed)
    const timeout = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => {
      clearTimeout(timeout)
    }
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-dark flex items-center justify-center"
    >
      <div className="loader-wrapper">
        <span className="loader-letter">L</span>
        <span className="loader-letter">o</span>
        <span className="loader-letter">a</span>
        <span className="loader-letter">d</span>
        <span className="loader-letter">i</span>
        <span className="loader-letter">n</span>
        <span className="loader-letter">g</span>
        <div className="loader"></div>
      </div>
    </motion.div>
  )
}

const Moukhtalif3DLanding = () => {
  const [lang, setLang] = useState('ar') // Default to Arabic
  const [isLoading, setIsLoading] = useState(true) // Show loading screen on initial load
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiry: ''
  })
  const servicesSectionRef = useRef(null)

  // Initialize EmailJS (you can also use environment variables)
  useEffect(() => {
    // Initialize EmailJS with your public key
    // You can get this from https://www.emailjs.com/
    // For now, we'll initialize it when the form is submitted
    // You can also set it here: emailjs.init('YOUR_PUBLIC_KEY')
  }, [])

  // Update HTML attributes when language changes
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  // Handle scroll to show/hide header and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show header at top or when scrolling up
      if (currentScrollY < 100 || currentScrollY < lastScrollY) {
        setIsHeaderVisible(true)
      } 
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false)
      }

      // Show scroll-to-top button when scrolled down more than 300px
      setShowScrollToTop(currentScrollY > 300)

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.inquiry) {
      alert(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address')
      return
    }

    try {
      setIsSubmitting(true)
      
      // EmailJS configuration
      // Replace these with your actual EmailJS credentials
      // Get them from: https://www.emailjs.com/
      const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID'
      const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID'
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY'

      // Initialize EmailJS if not already initialized
      if (publicKey && publicKey !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(publicKey)
      }

      // Send email via EmailJS
      await emailjs.send(
        serviceID,
        templateID,
        {
          from_name: formData.name,
          from_email: formData.email,
          from_phone: formData.phone,
          message: formData.inquiry,
          to_email: 'info@moukhtalif.com', // Your email address
        },
        publicKey
      )

      // Show success popup
      setShowSuccessPopup(true)
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiry: ''
      })
    } catch (error) {
      console.error('Error sending email:', error)
      alert(
        lang === 'ar' 
          ? 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.' 
          : 'An error occurred while sending the message. Please try again or contact us directly.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }


  // Toggle language function
  const toggleLanguage = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar')
  }

  // Copy object with all translations
  const copy = {
    ar: {
      header: {
        logo: 'م',
        title: 'مختـلف',
        nav: {
          home: 'الرئيسية',
          about: 'من نحن',
          services: 'خدماتنا',
          contact: 'تواصل معنا'
        }
      },
      about: {
        title: 'من نحن',
        subtitle: 'وكالة تسويق وهوية رقمية متكاملة',
        description: 'نحن في وكالة مختلف نقدم حلولاً تسويقية شاملة تجمع بين الإبداع والاستراتيجية. نؤمن بأن كل علامة تجارية فريدة وتستحق هوية بصرية مميزة تترك انطباعاً قوياً في أذهان الجمهور.',
        additionalText: 'مع سنوات من الخبرة في مجال التسويق الرقمي والهوية البصرية، نحن نعمل مع عملائنا كشركاء استراتيجيين لتحقيق أهدافهم التجارية. فريقنا المتمرس يجمع بين المبدعين والمستشارين الاستراتيجيين لضمان تحقيق نتائج متميزة تبرز هوية علامتك التجارية في السوق التنافسي.',
        mission: {
          title: 'رؤيتنا',
          text: 'أن نكون الوكالة الرائدة في المنطقة في مجال التسويق الرقمي والهوية البصرية، من خلال تقديم حلول مبتكرة تلهم وتؤثر.'
        },
        vision: {
          title: 'مهمتنا',
          text: 'تقديم خدمات تسويقية متكاملة وعالية الجودة تساعد الشركات على النمو والتوسع في السوق الرقمي بفعالية.'
        },
        stats: {
          title: 'إحصائياتنا',
          items: [
            { number: '200+', label: 'مشروع منجز' },
            { number: '70+', label: 'عميل راضٍ' },
            { number: '10+', label: 'سنوات خبرة' },
            { number: '17', label: 'موظف' }
          ]
        },
        values: {
          title: 'قيمنا',
          items: [
            'الإبداع والابتكار',
            'الجودة والاحترافية',
            'الشفافية والصدق',
            'التخصص والخبرة'
          ]
        }
      },
      hero: {
        headline: 'مختـلف',
        subtitle: 'تجربة ثلاثية الأبعاد',
        description: 'نقدم حلولاً مبتكرة وعصرية تجمع بين الجمال والوظيفية في عالم التصميم الرقمي',
        ctaPrimary: 'ابدأ الآن',
        ctaSecondary: 'اعرف المزيد'
      },
      parallaxCard: {
        description: 'تفاعل مع التصميم ثلاثي الأبعاد من خلال تحريك الماوس',
        quality: 'جودة',
        support: 'دعم'
      },
      services: {
        title: 'خدماتنا',
        subtitle: 'حلول تسويقية شاملة ومبتكرة',
        categories: [
          {
            title: '🧩 إدارة العلامة التجارية',
            items: [
              'تصميم الشعارات احترافيه (Logo Design)',
              'هوية بصرية كاملة (Visual Identity)',
              'تصميم هويه تجاريه (Branding design)',
              'بروفايل الشركات (Company Profile)',
              'الكتيبات والمطبوعات التعريفية'
            ]
          },
          {
            title: '📱 إدارة المنصات الرقمية',
            items: [
              'إعداد استراتيجية المحتوى',
              'كتابة المنشورات والنسخ التسويقية',
              'تصميم منشورات السوشيال ميديا',
              'إدارة ونشر وجدولة المحتوى',
              'إدارة التفاعل والردود',
              'إعداد التقارير والتحليل الشهري'
            ]
          },
          {
            title: '🎥 المحتوى المرئي والإنتاج الإبداعي',
            items: [
              'تصوير المنتجات والخدمات',
              'الفيديوهات القصيرة (Reels)',
              'البروموهات الإعلانية',
              'الموشن جرافيك (Motion Graphic)',
              'الوايت بورد (Whiteboard Animation)',
              'الفيديوهات المونتاجية'
            ]
          },
          {
            title: '💰 الحملات الإعلانية',
            items: [
              'إعداد وإدارة الحملات الممولة (Facebook – Instagram – TikTok – Google)',
              'صياغة الرسائل الإعلانية والعروض',
              'تصميم الإعلانات (صور وفيديوهات)',
              'متابعة الأداء وتحليل النتائج',
              'تحسين الحملة بي استمرار لتحقيق أعلى عائد'
            ]
          },
          {
            title: '🧾 التصاميم والمطبوعات',
            items: [
              'تصميم جرافيكي (سوشيل ميديا/انيماشن قصير/هويات بصريه)',
              'تصميم مطبوعات بي جميع انواعها',
              'تجهيز ملفات الطباعة عالية الدقة'
            ]
          },
          {
            title: '🌐 المواقع الإلكترونية والتحول الرقمي',
            items: [
              'تصميم وتطوير المواقع الإلكترونية',
              'المتاجر الإلكترونية',
              'صفحات الهبوط (Landing Pages)',
              'التكامل مع أنظمة CRM وأتمتة التسويق',
              'تحسين محركات البحث (SEO)'
            ]
          },
          {
            title: '🧠 التخطيط والاستشارات التسويقية',
            items: [
              'إعداد الملخص الإبداعي (Creative Brief)',
              'تحليل المنافسين والسوق المستهدف',
              'وضع خطة تسويقية تجريبية',
              'إعداد خطة تسويقية طويلة المدى',
              'تطوير استراتيجيات التواصل مع العملاء'
            ]
          }
        ]
      },
      footer: {
        contact: 'تواصل معنا',
        email: 'info@moukhtalif.com',
        phone: '218912246224+',
        whatsapp: '218912246224+',
        address: 'بالقرب من مركز السلام الطبي، جنزور، طرابلس، ليبيا',
        workingHours: '9:00 ص - 5:00 م',
        copyright: 'جميع الحقوق محفوظة',
        year: new Date().getFullYear(),
        description: 'نقدم حلولاً مبتكرة في عالم التصميم الرقمي',
        follow: 'تابعنا',
        quickLinks: 'روابط سريعة',
        services: 'خدماتنا',
        location: 'موقعنا',
        locationTitle: 'موقعنا',
        locationAddress: 'بالقرب من مركز السلام الطبي، جنزور، طرابلس، ليبيا',
        getInTouch: 'تواصل معنا'
      },
      contact: {
        title: 'تواصل معنا',
        subtitle: 'نحن هنا للإجابة على استفساراتك',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        inquiry: 'استفسارك',
        submit: 'إرسال',
        namePlaceholder: 'أدخل اسمك',
        emailPlaceholder: 'أدخل بريدك الإلكتروني',
        phonePlaceholder: 'أدخل رقم هاتفك',
        inquiryPlaceholder: 'اكتب استفسارك هنا...',
        successTitle: 'تم الإرسال بنجاح',
        successMessage: 'شكراً لتواصلك معنا! سنرد عليك قريباً.',
        close: 'إغلاق'
      }
    },
    en: {
      header: {
        logo: 'M',
        title: 'Moukhtalif',
        nav: {
          home: 'Home',
          about: 'About Us',
          services: 'Services',
          contact: 'Contact'
        }
      },
      about: {
        title: 'About Us',
        subtitle: 'Integrated Digital Marketing & Brand Identity Agency',
        description: 'At Moukhtalif Agency, we provide comprehensive marketing solutions that combine creativity and strategy. We believe every brand is unique and deserves a distinctive visual identity that leaves a strong impression.',
        additionalText: 'With years of experience in digital marketing and brand identity, we work with our clients as strategic partners to achieve their business goals. Our experienced team combines creative professionals and strategic consultants to ensure outstanding results that highlight your brand identity in the competitive market.',
        mission: {
          title: 'Our Vision',
          text: 'To be the leading agency in the region for digital marketing and brand identity, through delivering innovative solutions that inspire and influence.'
        },
        vision: {
          title: 'Our Mission',
          text: 'To provide integrated, high-quality marketing services that help businesses grow and expand effectively in the digital market.'
        },
        stats: {
          title: 'Our Statistics',
          items: [
            { number: '500+', label: 'Completed Projects' },
            { number: '200+', label: 'Satisfied Clients' },
            { number: '10+', label: 'Years of Experience' },
            { number: '17', label: 'Employees' }
          ]
        },
        values: {
          title: 'Our Values',
          items: [
            'Creativity & Innovation',
            'Quality & Professionalism',
            'Transparency & Honesty',
            'Expertise & Specialization'
          ]
        }
      },
      hero: {
        headline: 'Moukhtalif',
        subtitle: '3D Experience',
        description: 'We deliver innovative and modern solutions that combine beauty and functionality in the digital design world',
        ctaPrimary: 'Get Started',
        ctaSecondary: 'Learn More'
      },
      parallaxCard: {
        description: 'Interact with 3D design by moving your mouse',
        quality: 'Quality',
        support: 'Support'
      },
      

      
      services: {
        title: 'Our Services',
        subtitle: 'Comprehensive and innovative marketing solutions',
        categories: [
          {
            title: '🧩 Brand Management',
            items: [
              'Professional Logo Design',
              'Complete Visual Identity',
              'Branding design',
              'Company Profile',
              'Brochures and Print Materials'
            ]
          },
          {
            title: '📱 Social Media Management',
            items: [
              'Content Strategy Development',
              'Copywriting and Marketing Content',
              'Social Media Post Design',
              'Content Management and Scheduling',
              'Community Management and Engagement',
              'Monthly Reports and Analytics'
            ]
          },
          {
            title: '🎥 Creative Production',
            items: [
              'Product and Service Photography',
              'Short Videos (Reels)',
              'Promotional Videos',
              'Motion Graphics',
              'Whiteboard Animation',
              'Video Editing'
            ]
          },
          {
            title: '💰 Advertising Campaigns',
            items: [
              'Paid Campaign Management (Facebook, Instagram, TikTok, Google)',
              'Ad Copy and Offer Creation',
              'Ad Design (Images & Videos)',
              'Performance Monitoring and Analytics',
              'Continuous Campaign Optimization'
            ]
          },
          {
            title: '🧾 Design & Print',
            items: [
              'Graphic Design (Social Media, Short Animation/Gifs, Visual Identity)',
              'Designing Print Materials (Brochures, Flyers, Business Cards, etc.)',
              'High-Resolution Print Files'
            ]
          },
          {
            title: '🌐 Web & Digital Transformation',
            items: [
              'Website Design and Development',
              'E-commerce Stores',
              'Landing Pages',
              'CRM Integration and Marketing Automation',
              'Search Engine Optimization (SEO)'
            ]
          },
          {
            title: '🧠 Marketing Planning & Consultations',
            items: [
              'Creative Brief Development',
              'Competitor and Market Analysis',
              'Pilot Campaign Planning',
              'Long-term Marketing Strategy',
              'Customer Communication Strategy Development'
            ]
          }
        ]
      },
      ourWork: {
        title: 'Our Work',
        subtitle: 'Explore our featured work',
      },
      footer: {
        contact: 'Contact Us',
        email: 'info@moukhtalif.com',
        phone: '+218912246224',
        whatsapp: '+218912246224',
        address: 'بالقرب من مركز السلام الطبي، جنزور، طرابلس، ليبيا',
        workingHours: '9:00 AM - 5:00 PM',
        copyright: 'All rights reserved',
        year: new Date().getFullYear(),
        description: 'Delivering innovative solutions in the digital design world',
        follow: 'Follow Us',
        quickLinks: 'Quick Links',
        services: 'Our Services',
        location: 'Location',
        locationTitle: 'Our Location',
        locationAddress: 'بالقرب من مركز السلام الطبي، جنزور، طرابلس، ليبيا',
        getInTouch: 'Get In Touch'
      },
      contact: {
        title: 'Contact Us',
        subtitle: 'We\'re here to answer your inquiries',
        name: 'Name',
        email: 'Email',
        phone: 'Phone Number',
        inquiry: 'Your Inquiry',
        submit: 'Submit',
        namePlaceholder: 'Enter your name',
        emailPlaceholder: 'Enter your email',
        phonePlaceholder: 'Enter your phone number',
        inquiryPlaceholder: 'Write your inquiry here...',
        successTitle: 'Sent Successfully',
        successMessage: 'Thank you for contacting us! We will get back to you soon.',
        close: 'Close'
      }
    }
  }

  // Get current language content
  const content = copy[lang]
  const locationQuery = encodeURIComponent(content.footer.locationAddress || content.footer.address)

  // Detect mobile device for performance optimization
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Loading Screen */}
      {isLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      {/* Main Content */}
      <div style={{ display: isLoading ? 'none' : 'block' }}>
        {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: isHeaderVisible ? 1 : 0,
          y: isHeaderVisible ? 0 : -100
        }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 bg-transparent ${isMobile ? '' : 'backdrop-blur-sm'}`}
        style={{ pointerEvents: isHeaderVisible ? 'auto' : 'none' }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <motion.img 
                src="/logo.png" 
                alt={content.header.title}
                className="h-20 md:h-24 lg:h-28 w-auto cursor-pointer"
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                onError={(e) => {
                  if (e.target.src.includes('.png')) {
                    e.target.src = '/logo.jpg';
                  } else if (e.target.src.includes('.jpg')) {
                    e.target.src = '/logo.jpeg';
                  } else if (e.target.src.includes('.jpeg')) {
                    e.target.src = '/logo.svg';
                  }
                }}
              />
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6" style={{ perspective: '1000px' }}>
              {[
                { href: '#home', text: content.header.nav.home },
                { href: '#about', text: content.header.nav.about },
                { href: '#services', text: content.header.nav.services },
                { href: '#contact-section', text: content.header.nav.contact }
              ].map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: isMobile ? 0.2 : 0.4,
                    delay: isMobile ? 0 : index * 0.05,
                    ease: "easeOut"
                  }}
                  whileHover={!isMobile ? { 
                    scale: 1.1, 
                    y: -3,
                    transition: { duration: 0.3 }
                  } : {}}
                  className="text-lightGray text-base lg:text-lg hover:text-gold font-semibold relative"
                  style={!isMobile ? { transformStyle: 'preserve-3d' } : {}}
                >
                  {item.text}
                  <motion.span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
            </nav>
            
            <motion.button
              initial={{ opacity: 0, scale: 0, rotateY: -180 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
              whileHover={{ 
                scale: 1.1,
                rotateY: 360,
                z: 10,
                transition: { duration: 0.5 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLanguage}
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gold/20 hover:bg-gold/30 backdrop-blur-sm border border-gold/30 text-lightGray text-sm md:text-base font-medium transition-all duration-300 glow-gold"
              aria-label="Toggle language"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {lang === 'ar' ? 'EN' : 'AR'}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - YouTube Video */}
      <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black" style={{ paddingTop: '80px' }}>
        {/* YouTube Video Player - Simplified */}
        <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div 
            className="relative w-full"
            style={{
              maxWidth: 'calc(177.801vh)',
              height: 'calc(56.2425vw)',
              minHeight: '100%'
            }}
          >
            <iframe
              src="https://www.youtube.com/embed/DPCOTTBs_lQ?autoplay=1&mute=1&loop=1&playlist=DPCOTTBs_lQ&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&start=0&fs=0"
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
              allowFullScreen={false}
              title="Moukhtalif Agency Video"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10"
        >
          <div className="w-6 h-10 border-2 border-gold/50 rounded-full flex justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-1 h-3 bg-gold rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      {/* About Us Section */}
      <section id="about" className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lightGray/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-8 md:mb-12" style={{ perspective: '1000px' }}>
            <Text3DReveal delay={0.1} direction="up">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 text-gradient" style={{ transformStyle: 'preserve-3d' }}>
                {content.about.title}
              </h2>
            </Text3DReveal>
            <Text3DReveal delay={0.3} direction="up">
              <p className="text-xl md:text-2xl text-gold font-light" style={{ transformStyle: 'preserve-3d' }}>
                {content.about.subtitle}
              </p>
            </Text3DReveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3">
            {/* Description */}
            <Text3DReveal delay={0.2} direction={lang === 'ar' ? 'right' : 'left'}>
              <div className="space-y-1" style={{ transformStyle: 'preserve-3d' }}>
                <motion.p 
                  className="text-lg md:text-xl text-lightGray/90 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: isMobile ? 0.3 : 0.5, delay: isMobile ? 0 : 0.2, ease: "easeOut" }}
                >
                  {content.about.description}
                </motion.p>
                {content.about.additionalText && (
                  <motion.p 
                    className="text-base md:text-lg text-lightGray/80 leading-relaxed"
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: isMobile ? 0.3 : 0.5, delay: isMobile ? 0.1 : 0.3, ease: "easeOut" }}
                  >
                    {content.about.additionalText}
                  </motion.p>
                )}
              </div>
            </Text3DReveal>

            {/* Mission & Vision */}
            <Text3DReveal delay={0.4} direction={lang === 'ar' ? 'left' : 'right'}>
              <div className="space-y-1" style={{ transformStyle: 'preserve-3d' }}>
                <motion.div 
                  className="bg-gradient-to-br from-dark to-gold/5 p-6 md:p-8 rounded-2xl border border-gold/20"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: isMobile ? 0.3 : 0.5, delay: isMobile ? 0.1 : 0.4, ease: "easeOut" }}
                  whileHover={!isMobile ? { 
                    scale: 1.03,
                    transition: { duration: 0.3 }
                  } : {}}
                  style={!isMobile ? { transformStyle: 'preserve-3d' } : {}}
                >
                  <Text3D intensity={10}>
                    <h3 className="text-2xl md:text-3xl font-bold text-gold mb-4 md:mb-6" style={{ transformStyle: 'preserve-3d' }}>
                      {content.about.mission.title}
                    </h3>
                  </Text3D>
                  <p className="text-lightGray/80 leading-relaxed">
                    {content.about.mission.text}
                  </p>
                </motion.div>
                <motion.div 
                  className="bg-gradient-to-br from-dark to-gold/5 p-6 md:p-8 rounded-2xl border border-gold/20"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: isMobile ? 0.3 : 0.5, delay: isMobile ? 0.15 : 0.5, ease: "easeOut" }}
                  whileHover={!isMobile ? { 
                    scale: 1.03,
                    transition: { duration: 0.3 }
                  } : {}}
                  style={!isMobile ? { transformStyle: 'preserve-3d' } : {}}
                >
                  <Text3D intensity={10}>
                    <h3 className="text-2xl md:text-3xl font-bold text-gold mb-4 md:mb-6" style={{ transformStyle: 'preserve-3d' }}>
                      {content.about.vision.title}
                    </h3>
                  </Text3D>
                  <p className="text-lightGray/80 leading-relaxed">
                    {content.about.vision.text}
                  </p>
                </motion.div>
              </div>
            </Text3DReveal>
          </div>

          {/* Statistics */}
          {content.about.stats && (
            <div className="mt-8 md:mt-12 mb-8 md:mb-12" style={{ perspective: '1000px' }}>
              <Text3DReveal delay={0.2} direction="up">
                <h3 className="text-3xl md:text-4xl font-bold text-gold mb-6 md:mb-8 text-center" style={{ transformStyle: 'preserve-3d' }}>
                  {content.about.stats.title}
                </h3>
              </Text3DReveal>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {content.about.stats.items.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: false, margin: '-100px' }}
                    transition={{ 
                      duration: isMobile ? 0.3 : 0.6,
                      delay: isMobile ? 0 : index * 0.1,
                      ease: "easeOut"
                    }}
                    whileHover={!isMobile ? { 
                      scale: 1.1, 
                      y: -10,
                      rotateY: 10,
                      rotateX: 5,
                      z: 20,
                      transition: { duration: 0.3 }
                    } : {}}
                    className="bg-gradient-to-br from-dark to-gold/10 p-6 md:p-8 rounded-2xl border border-gold/20 text-center cursor-pointer"
                    style={!isMobile ? { transformStyle: 'preserve-3d' } : {}}
                  >
                    <motion.div 
                      className="text-4xl md:text-5xl lg:text-6xl font-bold text-gold mb-2"
                      style={!isMobile ? { transformStyle: 'preserve-3d' } : {}}
                      animate={!isMobile ? {
                        textShadow: [
                          '0 0 20px rgba(232, 185, 91, 0.3)',
                          '0 0 40px rgba(232, 185, 91, 0.6)',
                          '0 0 20px rgba(232, 185, 91, 0.3)'
                        ]
                      } : {}}
                      transition={!isMobile ? { duration: 3, repeat: Infinity, delay: index * 0.5 } : {}}
                    >
                      {stat.number}
                    </motion.div>
                    <div className="text-sm md:text-base text-lightGray/80 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Values */}
          <div className="bg-gradient-to-br from-dark to-gold/10 p-4 md:p-6 rounded-3xl border border-gold/20 mb-8 md:mb-12" style={{ perspective: '1000px' }}>
            <Text3DReveal delay={0.3} direction="up">
              <h3 className="text-3xl md:text-4xl font-bold text-gold mb-6 md:mb-8 text-center" style={{ transformStyle: 'preserve-3d' }}>
                {content.about.values.title}
              </h3>
            </Text3DReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {content.about.values.items.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px' }}
                  transition={{ 
                    duration: isMobile ? 0.3 : 0.6,
                    delay: isMobile ? index * 0.05 : 0.3 + index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={!isMobile ? { 
                    scale: 1.05, 
                    y: -5,
                    transition: { duration: 0.3 }
                  } : {}}
                  className="bg-dark/50 p-6 rounded-xl border border-gold/20 text-center cursor-pointer"
                  style={!isMobile ? { transformStyle: 'preserve-3d' } : {}}
                >
                  <motion.div 
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold to-lightGray rounded-full flex items-center justify-center text-2xl font-bold text-dark"
                    whileHover={{ 
                      rotateY: 360,
                      scale: 1.2,
                      transition: { duration: 0.6 }
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {index + 1}
                  </motion.div>
                  <p className="text-lightGray font-medium">{value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section 
        ref={servicesSectionRef}
        id="services" 
        className="relative overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          {!isMobile && (
            <>
              <div className="absolute top-0 left-0 w-48 h-48 md:w-72 md:h-72 bg-gold/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 md:w-72 md:h-72 bg-lightGray/10 rounded-full blur-3xl"></div>
            </>
          )}
        </div>

        <div className="relative z-10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-4 md:mb-12" style={{ perspective: '1000px' }}>
              <Text3DReveal delay={0.1} direction="up">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-6 text-gradient" style={{ transformStyle: 'preserve-3d' }}>
                  {content.services.title}
                </h2>
              </Text3DReveal>
              <Text3DReveal delay={0.3} direction="up">
                <p className="text-lg md:text-xl text-lightGray/80" style={{ transformStyle: 'preserve-3d' }}>
                  {content.services.subtitle}
                </p>
              </Text3DReveal>
            </div>
          </div>

          <ServiceCardGrid services={content.services} />
        </div>
      </section>

      {/* Our Work Section */}
      <section 
        id="our-work" 
        className="relative overflow-hidden bg-black"
        style={{ minHeight: '100vh' }}
      >
        <div className="relative z-10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 md:mb-12" style={{ perspective: '1000px' }}>
              <Text3DReveal delay={0.1} direction="up">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-gradient" style={{ transformStyle: 'preserve-3d' }}>
                  {content.ourWork?.title || (lang === 'ar' ? 'أعمالنا' : 'Our Work')}
                </h2>
              </Text3DReveal>
              <Text3DReveal delay={0.3} direction="up">
                <p className="text-lg md:text-xl text-lightGray/80" style={{ transformStyle: 'preserve-3d' }}>
                  {content.ourWork?.subtitle || (lang === 'ar' ? 'استكشف مجموعة أعمالنا المميزة' : 'Explore our featured work')}
                </p>
              </Text3DReveal>
            </div>
          </div>
        </div>
        
        {/* Projects Stack Container */}
        <div>
          <ProjectsStack lang={lang} isMobile={isMobile} />
        </div>
      </section>

      {/* Contact Us Section */}
      <section 
        id="contact-section"
        className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-b from-black via-dark to-black"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lightGray/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* Section Header */}
            <Text3DReveal delay={0.1} direction="up">
              <div className="text-center mb-8 md:mb-12" style={{ perspective: '1000px' }}>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gradient" style={{ transformStyle: 'preserve-3d' }}>
                  {content.contact.title}
                </h2>
                <p className="text-lg md:text-xl text-lightGray/80" style={{ transformStyle: 'preserve-3d' }}>
                  {content.contact.subtitle}
                </p>
              </div>
            </Text3DReveal>

            {/* Contact Form */}
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="bg-gradient-to-br from-dark/80 to-dark/40 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-gold/20 shadow-2xl"
            >
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm md:text-base font-medium text-gold mb-2">
                    {content.contact.name}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={content.contact.namePlaceholder}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gold/30 rounded-lg text-white placeholder-lightGray/50 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-300"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm md:text-base font-medium text-gold mb-2">
                    {content.contact.email}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={content.contact.emailPlaceholder}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gold/30 rounded-lg text-white placeholder-lightGray/50 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-300"
                  />
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm md:text-base font-medium text-gold mb-2">
                    {content.contact.phone}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={content.contact.phonePlaceholder}
                    required
                    className={`w-full px-4 py-3 bg-black/50 border border-gold/30 rounded-lg text-white placeholder-lightGray/50 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-300 ${
                      lang === 'ar' ? 'text-right placeholder:text-right' : ''
                    }`}
                  />
                </div>

                {/* Inquiry Field */}
                <div>
                  <label htmlFor="inquiry" className="block text-sm md:text-base font-medium text-gold mb-2">
                    {content.contact.inquiry}
                  </label>
                  <textarea
                    id="inquiry"
                    name="inquiry"
                    value={formData.inquiry}
                    onChange={handleInputChange}
                    placeholder={content.contact.inquiryPlaceholder}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-black/50 border border-gold/30 rounded-lg text-white placeholder-lightGray/50 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  className={`w-full py-4 bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-gold/50 transition-all duration-300 flex items-center justify-center gap-2 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                      <span>{lang === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{content.contact.submit}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        id="contact"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative py-12 md:py-16 border-t border-gold/20 bg-gradient-to-b from-dark via-dark/95 to-black overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-lightGray/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10 mb-10 md:mb-12">
            {/* Company Info */}
            <Text3DReveal delay={0.1} direction="up">
              <div style={{ transformStyle: 'preserve-3d' }} className="space-y-4">
                <div className="flex items-center gap-3 md:gap-4 mb-4">
                  <motion.img 
                    src="/logo.png" 
                    alt={content.header.title}
                    className="h-12 md:h-14 w-auto"
                    initial={{ opacity: 0, scale: 0, rotateY: -180 }}
                    whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                    whileHover={{ 
                      rotateY: 360,
                      scale: 1.1,
                      transition: { duration: 0.6 }
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    onError={(e) => {
                      if (e.target.src.includes('.png')) {
                        e.target.src = '/logo.jpg';
                      } else if (e.target.src.includes('.jpg')) {
                        e.target.src = '/logo.jpeg';
                      } else if (e.target.src.includes('.jpeg')) {
                        e.target.src = '/logo.svg';
                      }
                    }}
                  />
                  <Text3D intensity={8}>
                    <h3 className="text-xl md:text-2xl font-bold text-gradient" style={{ transformStyle: 'preserve-3d' }}>{content.header.title}</h3>
                  </Text3D>
                </div>
                <p className="text-sm md:text-base text-lightGray/80 leading-relaxed">
                  {content.footer.description}
                </p>
                <div className="pt-4">
                  <h5 className="text-sm font-semibold text-gold mb-3">{content.footer.follow}</h5>
                  <div className="card">
                    <ul>
                      <li className="iso-pro">
                        <span></span>
                        <span></span>
                        <span></span>
                        <a href="https://www.facebook.com/Mkhtalif1" target="_blank" rel="noopener noreferrer">
                          <svg
                            className="svg"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 320 512"
                          >
                            <path
                              d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
                            ></path>
                          </svg>
                        </a>
                        <div className="text">Facebook</div>
                      </li>
                      <li className="iso-pro">
                        <span></span>
                        <span></span>
                        <span></span>
                        <a href="https://www.instagram.com/mkhtalif_1" target="_blank" rel="noopener noreferrer">
                          <svg
                            viewBox="0 0 448 512"
                            xmlns="http://www.w3.org/2000/svg"
                            className="svg"
                          >
                            <path
                              d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
                            ></path>
                          </svg>
                        </a>
                        <div className="text">Instagram</div>
                      </li>
                      <li className="iso-pro">
                        <span></span>
                        <span></span>
                        <span></span>
                        <a href="https://www.behance.net/mkhtalif" target="_blank" rel="noopener noreferrer">
                          <svg
                            viewBox="0 0 576 512"
                            xmlns="http://www.w3.org/2000/svg"
                            className="svg"
                          >
                            <path d="M232 237.9c14.9-7.2 24.6-17.3 29-30.4 1.9-5.7 2.9-12.7 2.9-21.1 0-14.5-3.4-26-10.1-34.5-4.4-5.5-10.4-9.9-18-13.2 0 0-10.3-3.5-23.5-5.1-9.7-1.2-20.5-1.9-32.5-1.9H32v215.1h150.6c12.7 0 23.9-.8 33.6-2.5 10.4-1.8 19.3-4.8 26.8-9 9.9-5.5 17.2-13 21.8-22.5 4.6-9.5 7-20.4 7-32.8 0-17-4-30.6-12-40.7-8-10.2-18.5-17.4-31.4-21.4zm-128-73.9h66.5c11.7 0 21.1 2.1 28.2 6.4 7.1 4.2 10.6 11.7 10.6 22.4 0 11.9-3.6 20.1-10.9 24.5-7.2 4.4-16.5 6.6-27.9 6.6H104v-59.9zm91.6 148.3c-7.8 4.5-18.2 6.7-31.2 6.7H104v-65.8h63.6c12.6 0 22.5 2.6 29.6 7.7s10.6 14 10.6 26.7c0 14.3-3.9 24.2-11.2 28.7zm293.9-111.6c-12.8-14.5-32-21.7-57.6-21.7-24.9 0-45.5 6.9-61.7 20.7-16.1 13.8-25.9 33.1-29.2 57.8-.6 5.2-.9 12.7-.9 22.3 0 44.2 12.9 74.6 38.8 91.1 15.9 10.3 35.1 15.4 57.7 15.4 24.7 0 45.2-6.1 61.4-18.4 16.3-12.3 25.5-29.6 27.7-51.9h-49.8c-2.8 9.5-7.4 16.6-13.8 21.2-6.3 4.6-15.1 6.9-26.2 6.9-12.6 0-22.5-4-29.9-11.9s-11.2-19.8-11.8-35.6h131.3c.3-5.9.5-11 .5-15.4 0-30.7-6.5-54.5-19.4-70.5zM448 272H346.1c1.1-11.6 4.4-20.8 10-27.3 7.9-9.6 19-14.3 33.5-14.3 10.5 0 19 2.5 25.6 7.5s10.5 13.5 11.8 24.6H448v9.5zM343 144h112v30.3H343z"></path>
                          </svg>
                        </a>
                        <div className="text">Behance</div>
                      </li>
                      <li className="iso-pro">
                        <span></span>
                        <span></span>
                        <span></span>
                        <a href="https://www.tiktok.com/@mkhtalif" target="_blank" rel="noopener noreferrer">
                          <svg
                            viewBox="0 0 448 512"
                            xmlns="http://www.w3.org/2000/svg"
                            className="svg"
                          >
                            <path
                              d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"
                            ></path>
                          </svg>
                        </a>
                        <div className="text">TikTok</div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Text3DReveal>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <h4 className="text-lg md:text-xl font-bold text-gradient mb-4">{content.footer.quickLinks}</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#about" className="text-lightGray/80 hover:text-gold transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-gold/50 rounded-full group-hover:bg-gold transition-colors"></span>
                    {content.header.nav.about}
                  </a>
                </li>
                <li>
                  <a href="#services" className="text-lightGray/80 hover:text-gold transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-gold/50 rounded-full group-hover:bg-gold transition-colors"></span>
                    {content.header.nav.services}
                  </a>
                </li>
                <li>
                  <a href="#our-work" className="text-lightGray/80 hover:text-gold transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-gold/50 rounded-full group-hover:bg-gold transition-colors"></span>
                    {content.ourWork?.title || (lang === 'ar' ? 'أعمالنا' : 'Our Work')}
                  </a>
                </li>
                <li>
                  <a href="#contact-section" className="text-lightGray/80 hover:text-gold transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 bg-gold/50 rounded-full group-hover:bg-gold transition-colors"></span>
                    {content.header.nav.contact}
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <h4 className="text-lg md:text-xl font-bold text-gradient mb-4">{content.footer.services}</h4>
              <ul className="space-y-3">
                {content.services.categories.slice(0, 5).map((category, index) => (
                  <li key={index}>
                    <a href="#services" className="text-lightGray/80 hover:text-gold transition-colors flex items-center gap-2 group">
                      <span className="w-1.5 h-1.5 bg-gold/50 rounded-full group-hover:bg-gold transition-colors"></span>
                      <span className="text-sm">{category.title.replace(/🧩|📱|🎥|💰|🧾|🌐|🧠/g, '').trim()}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-4"
            >
              <h4 className="text-lg md:text-xl font-bold text-gradient mb-4">{content.footer.getInTouch}</h4>
              <div className="space-y-4 text-lightGray/80">
                <div className="flex items-start gap-3 group">
                  <div className="mt-1 w-5 h-5 flex-shrink-0">
                    <svg className="w-5 h-5 text-gold/70 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <a href={`mailto:${content.footer.email}`} className="hover:text-gold transition-colors break-all text-sm md:text-base">
                    {content.footer.email}
                  </a>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="mt-1 w-5 h-5 flex-shrink-0">
                    <svg className="w-5 h-5 text-gold/70 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <a href={`tel:${content.footer.phone}`} className="hover:text-gold transition-colors text-sm md:text-base">
                    {content.footer.phone}
                  </a>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="mt-1 w-5 h-5 flex-shrink-0">
                    <svg className="w-5 h-5 text-gold/70 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm md:text-base">{content.footer.address}</p>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="mt-1 w-5 h-5 flex-shrink-0">
                    <svg className="w-5 h-5 text-gold/70 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm md:text-base">{content.footer.workingHours}</p>
                </div>
              </div>
            </motion.div>

            {/* Location Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              <h4 className="text-lg md:text-xl font-bold text-gradient mb-4">{content.footer.locationTitle}</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3 group">
                  <div className="mt-1 w-5 h-5 flex-shrink-0">
                    <svg className="w-5 h-5 text-gold/70 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm md:text-base text-lightGray/80 font-medium mb-2">{content.footer.locationAddress}</p>
                    <a 
                      href={`https://www.google.com/maps?q=${locationQuery}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gold hover:text-gold/80 text-xs md:text-sm transition-colors flex items-center gap-1 group/link"
                    >
                      {lang === 'ar' ? 'عرض على الخريطة' : 'View on Map'}
                      <svg className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
                {/* Google Maps Embed */}
                <div className="mt-4 rounded-lg overflow-hidden border border-gold/20 shadow-lg hover:border-gold/40 transition-colors bg-dark/30">
                  <iframe
                    src={`https://www.google.com/maps?q=${locationQuery}&output=embed&zoom=16`}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full"
                    title={content.footer.locationTitle}
                  ></iframe>
                </div>
                {/* Direct link to Google Maps */}
                <div className="mt-2 text-center">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${locationQuery}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-lightGray/60 hover:text-gold transition-colors inline-flex items-center gap-1"
                  >
                    {lang === 'ar' ? 'افتح في خرائط جوجل' : 'Open in Google Maps'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="border-t border-gold/20 pt-8 md:pt-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm md:text-base text-lightGray/70 text-center md:text-left">
                © {content.footer.year} <span className="text-gold">{content.header.title}</span>. {content.footer.copyright}
              </p>
              <div className="flex items-center gap-4">
                <Link 
                  to="/admin" 
                  className="text-gold/60 hover:text-gold text-sm transition-colors flex items-center gap-2 group"
                >
                  <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.footer>

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowSuccessPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-dark to-dark/90 backdrop-blur-lg p-8 md:p-10 rounded-2xl border border-gold/30 shadow-2xl max-w-md w-full mx-4"
          >
            <div className="text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gold/20 rounded-full flex items-center justify-center"
              >
                <svg className="w-12 h-12 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              {/* Success Message */}
              <h3 className="text-2xl md:text-3xl font-bold text-gold mb-4">
                {content.contact.successTitle}
              </h3>
              <p className="text-lightGray/80 text-base md:text-lg mb-8">
                {content.contact.successMessage}
              </p>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuccessPopup(false)}
                className="px-8 py-3 bg-gold hover:bg-gold/90 text-black font-semibold rounded-lg transition-colors duration-300"
              >
                {content.contact.close}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: showScrollToTop ? 1 : 0,
          scale: showScrollToTop ? 1 : 0
        }}
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={scrollToTop}
        className={`fixed bottom-6 md:bottom-8 z-50 w-12 h-12 md:w-14 md:h-14 bg-gold/90 hover:bg-gold rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 backdrop-blur-sm border border-gold/50 ${
          lang === 'ar' ? 'left-6 md:left-8' : 'right-6 md:right-8'
        }`}
        aria-label={lang === 'ar' ? 'العودة للأعلى' : 'Scroll to top'}
        style={{
          pointerEvents: showScrollToTop ? 'auto' : 'none'
        }}
      >
        <svg
          className="w-6 h-6 md:w-7 md:h-7 text-black"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </motion.button>
      </div>
    </div>
  )
}

export default Moukhtalif3DLanding
