import React from 'react'
import { useLanguage } from '../context/LanguageContext'

const Footer = () => {
  const { t } = useLanguage()

  return (
    <footer className="py-12 border-t border-purple/20 bg-dark/50 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <p className="text-gray-400">
            © {t.footer.year} Moukhtalif 3D. {t.footer.text}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

