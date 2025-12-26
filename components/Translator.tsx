
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../services/geminiService';
import { CopyIcon } from './icons/CopyIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { languages } from '../utils/languages';
import type { Language } from '../types';

interface TranslatorProps {
  onClose: () => void;
  isAuthenticated: boolean;
  onAuthRequest: () => void;
}

export const Translator: React.FC<TranslatorProps> = ({ onClose, isAuthenticated, onAuthRequest }) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { language: uiLanguage, t } = useLanguage();
  
  const [targetLanguage, setTargetLanguage] = useState<Language>(uiLanguage);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTargetLanguage(uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTranslate = async () => {
    if (!isAuthenticated) {
      onAuthRequest();
      return;
    }
    
    if (!inputText.trim()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setOutputText('');
    try {
      const result = await translateText(inputText, targetLanguage);
      setOutputText(result);
    } catch (err) {
      setError(t('errorTranslation'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div 
      className="w-full bg-white border border-gray-200 rounded-2xl p-6 md:p-8 text-center shadow-lg relative animate-fade-in"
    >
      <button onClick={onClose} className="absolute top-3 right-4 text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
      <h2 className="text-2xl font-bold mb-2 text-blue-700">{t('translateTitle')}</h2>
      <p className="text-gray-500 mb-6">{t('translateSubtitle')}</p>
      
      <div className="grid md:grid-cols-2 gap-4 my-6">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-600 mb-2 text-left">{t('sourceText')}</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('inputTextLabel')}
            className="w-full flex-grow h-48 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors resize-none"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-600">{t('translation')}</label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors"
              >
                {languages.find(l => l.code === targetLanguage)?.nativeName}
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-56 overflow-y-auto">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setTargetLanguage(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white"
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="relative w-full flex-grow p-3 bg-gray-100 border border-gray-200 rounded-lg min-h-[12rem] flex items-start justify-start">
             {isLoading && <div className="w-full h-full flex items-center justify-center"><p className="text-gray-500">{t('translating')}</p></div>}
             {error && <div className="w-full h-full flex items-center justify-center"><p className="text-red-500">{error}</p></div>}
            {!isLoading && !error && outputText && (
              <>
                <p className="text-gray-800 whitespace-pre-wrap text-left">{outputText}</p>
                <div className="absolute top-2 right-2 flex items-center gap-2">
                   {copySuccess && <span className="text-xs text-green-500 animate-fade-in">{t('copySuccess')}</span>}
                   <button
                      onClick={handleCopy}
                      className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-gray-200 rounded-md transition-colors"
                      title={t('copyButton')}
                   >
                     <CopyIcon className="w-5 h-5" />
                   </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleTranslate}
        disabled={!inputText.trim() || isLoading}
        className="w-full max-w-sm mx-auto mt-6 py-3 px-6 bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105"
      >
        {t('translateButton')}
      </button>
    </div>
  );
};