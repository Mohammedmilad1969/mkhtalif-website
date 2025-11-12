import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProject, getProjects } from '../utils/dataStorage'

const ProjectPage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [projectId])

  // Load project data from storage
  const [project, setProject] = useState(null)
  const [lang, setLang] = useState('ar')

  useEffect(() => {
    const loadProject = async () => {
      try {
        const storedProject = await getProject(projectId)
        if (storedProject) {
          setProject(storedProject)
        } else {
          // Fallback to default data if not found in storage
          // This allows the page to still work with hardcoded data
          setProject(null)
        }
      } catch (error) {
        console.error('Error loading project:', error)
        setProject(null)
      }
    }
    loadProject()
  }, [projectId])
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Get language from localStorage or default to Arabic
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') || 'ar'
    setLang(savedLang)
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = savedLang
  }, [])

  // Handle scroll to show/hide header (same logic as homepage)
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

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])


  // Check if media is GIF
  const isGif = (mediaPath) => {
    return mediaPath && mediaPath.toLowerCase().endsWith('.gif')
  }

  // Check if media is a video (YouTube, Vimeo, or direct video file)
  const isVideo = (mediaPath) => {
    if (!mediaPath) return false
    const lowerPath = mediaPath.toLowerCase()
    return lowerPath.includes('youtube.com') || 
           lowerPath.includes('youtu.be') || 
           lowerPath.includes('vimeo.com') ||
           lowerPath.endsWith('.mp4') ||
           lowerPath.endsWith('.webm') ||
           lowerPath.endsWith('.ogg') ||
           lowerPath.endsWith('.mov')
  }

  // Extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Extract Vimeo video ID
  const getVimeoVideoId = (url) => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{lang === 'ar' ? 'المشروع غير موجود' : 'Project Not Found'}</h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gold text-black rounded-lg hover:bg-gold/80 transition-colors"
          >
            {lang === 'ar' ? 'العودة للصفحة الرئيسية' : 'Go Back Home'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with same logic as homepage */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: isHeaderVisible ? 1 : 0,
          y: isHeaderVisible ? 0 : -100
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm"
        style={{ pointerEvents: isHeaderVisible ? 'auto' : 'none' }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-lightGray hover:text-gold transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{lang === 'ar' ? 'العودة' : 'Back'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const newLang = lang === 'ar' ? 'en' : 'ar'
                setLang(newLang)
                localStorage.setItem('lang', newLang)
                document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
                document.documentElement.lang = newLang
              }}
              className="px-3 py-1.5 rounded-full bg-gold/20 hover:bg-gold/30 border border-gold/30 text-lightGray text-sm font-medium transition-all"
            >
              {lang === 'ar' ? 'EN' : 'AR'}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Project Content - Fullscreen Images Stack */}
      <div className="relative">
        {/* Project Info - Not fixed, with spacing from header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-32 pb-8 md:pt-40 md:pb-12 bg-black"
        >
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gradient">
                {lang === 'ar' ? project.nameAr : project.name}
              </h1>
              <p className="text-lg md:text-xl text-lightGray/80 mb-6 max-w-2xl mx-auto">
                {lang === 'ar' ? project.descriptionAr : project.description}
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-base md:text-lg">
                <div>
                  <span className="text-lightGray/70">{lang === 'ar' ? 'الصناعة: ' : 'Industry: '}</span>
                  <span className="text-gold font-semibold">{lang === 'ar' ? project.industryAr : project.industry}</span>
                </div>
                <div>
                  <span className="text-lightGray/70">{lang === 'ar' ? 'تاريخ الإصدار: ' : 'Release Date: '}</span>
                  <span className="text-white font-semibold">{project.releaseDate}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fullscreen Media Stack (Images & Videos) */}
        {project.images && project.images.length > 0 && project.images.map((media, index) => (
          <motion.section
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="w-full flex items-center justify-center bg-black relative"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Media Container */}
            <div className="relative w-full flex items-center justify-center p-2 md:p-4" style={{ minHeight: 'auto', paddingTop: '1rem', paddingBottom: '1rem' }}>
              {isVideo(media) ? (
                <div className="w-full flex items-center justify-center" style={{ maxHeight: '85vh' }}>
                  {media.includes('youtube.com') || media.includes('youtu.be') ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(media)}`}
                      title={`${lang === 'ar' ? project.nameAr : project.name} - Video ${index + 1}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="max-w-full"
                      style={{ aspectRatio: '16/9', maxHeight: '85vh', width: '100%' }}
                    />
                  ) : media.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${getVimeoVideoId(media)}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="max-w-full"
                      style={{ aspectRatio: '16/9', maxHeight: '85vh', width: '100%' }}
                    />
                  ) : (
                    <video
                      src={media}
                      controls
                      className="max-w-full w-auto h-auto"
                      style={{ maxHeight: '85vh' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              ) : isGif(media) ? (
                <img
                  src={media}
                  alt={`${lang === 'ar' ? project.nameAr : project.name} - Image ${index + 1}`}
                  className="max-w-full w-auto h-auto object-contain"
                  style={{ maxHeight: '85vh' }}
                  onError={(e) => {
                    e.target.src = '/images/placeholder.jpg'
                  }}
                />
              ) : (
                <img
                  src={media}
                  alt={`${lang === 'ar' ? project.nameAr : project.name} - Image ${index + 1}`}
                  className="max-w-full w-auto h-auto object-contain"
                  style={{ maxHeight: '85vh' }}
                  onError={(e) => {
                    e.target.src = '/images/placeholder.jpg'
                  }}
                />
              )}
            </div>

            {/* Scroll Indicator - Only show on first media */}
            {index === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/60 text-xs text-center"
              >
                <div className="flex flex-col items-center gap-2">
                  <span>{lang === 'ar' ? 'مرر للأسفل لعرض المزيد' : 'Scroll down to view more'}</span>
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-6 h-10 border-2 border-gold/50 rounded-full flex justify-center pt-2"
                  >
                    <div className="w-1 h-3 bg-gold rounded-full"></div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.section>
        ))}
      </div>

    </div>
  )
}

export default ProjectPage

