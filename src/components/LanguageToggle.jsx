import React from 'react'
import { useLanguage } from '../context/LanguageContext'

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className={`fixed top-6 z-50 px-4 py-2 rounded-full bg-purple/20 hover:bg-purple/30 backdrop-blur-sm border border-purple/30 text-white font-medium transition-all duration-300 hover:scale-105 ${language === 'ar' ? 'right-6' : 'left-6'}`}
      aria-label="Toggle language"
    >
      {language === 'ar' ? 'EN' : 'AR'}
    </button>
  )
}

export default LanguageToggle

