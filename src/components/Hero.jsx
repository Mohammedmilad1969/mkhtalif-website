import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useParallax } from '../hooks/useParallax'

const Hero = () => {
  const { t } = useLanguage()
  const parallaxRef = useParallax(0.3)

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-purple/10 to-pink/10"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div 
          ref={parallaxRef}
          className="text-center space-y-8"
          style={{ perspective: '1000px' }}
        >
          <h1 className="text-7xl md:text-9xl font-bold text-gradient">
            {t.hero.title}
          </h1>
          <h2 className="text-2xl md:text-4xl text-gray-300 font-light">
            {t.hero.subtitle}
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            {t.hero.description}
          </p>
          <button className="mt-8 px-8 py-4 bg-gradient-to-r from-purple to-pink rounded-full font-semibold text-lg hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple/50">
            {t.hero.cta}
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-purple/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-purple rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  )
}

export default Hero

