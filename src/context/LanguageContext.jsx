import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar')

  useEffect(() => {
    // Set HTML direction based on language
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar')
  }

  const translations = {
    ar: {
      hero: {
        title: 'مختـلف',
        subtitle: 'تجربة ثلاثية الأبعاد',
        description: 'نقدم حلولاً مبتكرة وعصرية تجمع بين الجمال والوظيفية',
        cta: 'ابدأ الآن'
      },
      services: {
        title: 'خدماتنا',
        subtitle: 'ما نقدمه لك',
        items: [
          {
            title: 'تصميم ثلاثي الأبعاد',
            description: 'تصاميم ثلاثية الأبعاد مبتكرة تجذب انتباه جمهورك'
          },
          {
            title: 'تطوير الويب',
            description: 'مواقع ويب حديثة وسريعة ومتجاوبة'
          },
          {
            title: 'تجربة المستخدم',
            description: 'تصميم واجهات مستخدم سلسة وجذابة'
          }
        ]
      },
      footer: {
        text: 'جميع الحقوق محفوظة',
        year: new Date().getFullYear()
      }
    },
    en: {
      hero: {
        title: 'Moukhtalif',
        subtitle: '3D Experience',
        description: 'We deliver innovative and modern solutions that combine beauty and functionality',
        cta: 'Get Started'
      },
      services: {
        title: 'Our Services',
        subtitle: 'What We Offer',
        items: [
          {
            title: '3D Design',
            description: 'Innovative 3D designs that capture your audience\'s attention'
          },
          {
            title: 'Web Development',
            description: 'Modern, fast, and responsive websites'
          },
          {
            title: 'User Experience',
            description: 'Smooth and engaging user interface design'
          }
        ]
      },
      footer: {
        text: 'All rights reserved',
        year: new Date().getFullYear()
      }
    }
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

