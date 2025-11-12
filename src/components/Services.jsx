import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useParallax } from '../hooks/useParallax'

const ServiceCard = ({ title, description, index }) => {
  const parallaxRef = useParallax(0.2)

  return (
    <div
      ref={parallaxRef}
      className="group relative bg-gradient-to-br from-dark to-purple/10 p-8 rounded-2xl border border-purple/20 hover:border-purple/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple/20"
      style={{ perspective: '1000px' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-pink/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="w-16 h-16 mb-6 bg-gradient-to-br from-purple to-pink rounded-xl flex items-center justify-center text-2xl font-bold">
          {index + 1}
        </div>
        <h3 className="text-2xl font-bold mb-4 text-gradient group-hover:scale-105 transition-transform duration-300">
          {title}
        </h3>
        <p className="text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}

const Services = () => {
  const { t } = useLanguage()

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
            {t.services.title}
          </h2>
          <p className="text-xl text-gray-400">
            {t.services.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t.services.items.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services

