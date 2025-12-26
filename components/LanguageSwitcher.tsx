
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../types';
import { GlobeIcon } from './icons/GlobeIcon';
import { languages } from '../utils/languages';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  
  return (
    <>
      <button
        onClick={handleOpen}
        className="p-2 rounded-full text-gray-500 hover:text-blue-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
        aria-label="Change language"
      >
        <GlobeIcon className="w-6 h-6" />
      </button>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in"
          onClick={handleClose}
        >
          <div 
            className="w-full max-w-lg bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={handleClose} className="absolute top-3 right-4 text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
            <h2 className="text-xl font-bold text-center text-gray-900 mb-6">{t('selectLanguageTitle')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    language === lang.code
                      ? 'bg-blue-700 text-white font-bold ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="block text-sm">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};