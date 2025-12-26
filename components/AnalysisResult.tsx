
import React, { useState, useEffect, useRef } from 'react';
import type { AnalysisResult as AnalysisResultType, Language } from '../types';
import { jsPDF } from 'jspdf';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { HelpCircleIcon } from './icons/HelpCircleIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { translateAnalysisResult } from '../services/geminiService';
import { languages } from '../utils/languages';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { getFontForLanguage } from '../utils/pdfFonts';

interface AnalysisResultProps {
  result: AnalysisResultType;
  onReset: () => void;
  file: File | null;
}

const getStatusColor = (status: AnalysisResultType['status']) => {
  switch (status) {
    case 'Authentic':
      return { text: 'text-green-500', bg: 'bg-green-500', ring: 'ring-green-500' };
    case 'Suspicious':
      return { text: 'text-yellow-500', bg: 'bg-yellow-500', ring: 'ring-yellow-500' };
    case 'Likely Fake':
      return { text: 'text-red-500', bg: 'bg-red-500', ring: 'ring-red-500' };
    case 'Inconclusive':
      return { text: 'text-gray-500', bg: 'bg-gray-500', ring: 'ring-gray-500' };
    default:
      return { text: 'text-gray-500', bg: 'bg-gray-500', ring: 'ring-gray-500' };
  }
};

const TrustScoreGauge: React.FC<{ score: number; status: AnalysisResultType['status']; t: (key: string) => string; }> = ({ score, status, t }) => {
    const color = getStatusColor(status);
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="text-gray-200" strokeWidth="12" stroke="currentColor" fill="transparent" r="54" cx="60" cy="60" />
                <circle
                    className={color.text}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="54"
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${color.text}`}>{score}</span>
                <span className="text-sm text-gray-500">{t('trustScore')}</span>
            </div>
        </div>
    );
};

const FindingIcon: React.FC<{ verdict: string }> = ({ verdict }) => {
    switch (verdict) {
        case 'Authentic': return <ShieldCheckIcon className="h-5 w-5 text-green-500" />;
        case 'Suspicious': return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
        case 'Manipulated': return <XCircleIcon className="h-5 w-5 text-red-500" />;
        default: return <HelpCircleIcon className="h-5 w-5 text-gray-500" />;
    }
};

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-3 font-semibold text-sm border-b-2 whitespace-nowrap ${
      isActive
        ? 'border-blue-700 text-blue-700'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
    role="tab"
    aria-selected={isActive}
  >
    {children}
  </button>
);

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset, file }) => {
  const { t, language, setLanguage } = useLanguage();
  
  const [displayedResult, setDisplayedResult] = useState<AnalysisResultType>(result);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { trustScore, status, summary, findings, publicResearch, documents, sources } = displayedResult;
  const color = getStatusColor(status);

  useEffect(() => {
    // If the original result prop changes, update the displayed result.
    // This happens when a new analysis is performed.
    // Also, if the global language changes, we should re-translate the original result.
    if (language !== displayedResult.language) {
      handleTranslateResult(language);
    } else {
      setDisplayedResult(result);
    }
    setTranslationError(null);
  }, [result, language]);
  
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

  const getStatusTranslation = (statusKey: string) => {
    const key = `status${statusKey.replace(' ', '')}`;
    return t(key);
  }
  
  const handleTranslateResult = async (targetLang: Language) => {
    setIsLangDropdownOpen(false);
    
    // Update the application's language context.
    // This will translate all static UI elements, including the disclaimer.
    setLanguage(targetLang);

    setIsTranslating(true);
    setTranslationError(null);
    try {
      // Always re-translate the original, non-translated result to the target language
      // to ensure the displayed content matches the selected language.
      const translatedResult = await translateAnalysisResult(result, targetLang);
      translatedResult.language = targetLang;
      setDisplayedResult(translatedResult);
    } catch (err) {
      console.error(err);
      setTranslationError(t('errorTranslation'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const fileName = file?.name || 'file';

    const fontInfo = getFontForLanguage(language);
    let font = 'helvetica';

    if (fontInfo) {
      try {
        const fontData = atob(fontInfo.fontBase64);
        doc.addFileToVFS(fontInfo.fileName, fontData);
        doc.addFont(fontInfo.fileName, fontInfo.fontName, 'normal');
        doc.addFont(fontInfo.fileName, fontInfo.fontName, 'bold');
        font = fontInfo.fontName;
      } catch (e) {
        console.error(`Error loading ${language} font for PDF:`, e);
      }
    }
    
    doc.setFont(font, "bold");
    doc.setFontSize(22);
    doc.text(t('pdfReportTitle'), 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(font, "normal");
    doc.text(`${t('pdfFileName')}: ${fileName}`, 20, 40);
    doc.text(`${t('pdfTimestamp')}: ${new Date().toLocaleString()}`, 20, 48);
    
    doc.setFont(font, "bold");
    doc.text(`${t('pdfVerdict')}:`, 20, 60);
    doc.setTextColor(status === 'Authentic' ? 0 : status === 'Suspicious' ? 255 : 255, status === 'Authentic' ? 128 : status === 'Suspicious' ? 165 : 0, 0);
    doc.text(`${getStatusTranslation(status)} (${t('trustScore')}: ${trustScore}/100)`, 55, 60);
    doc.setTextColor(0, 0, 0);

    doc.setFont(font, "normal");
    let splitSummary = doc.splitTextToSize(`${t('summary')}: ${summary}`, 170);
    doc.text(splitSummary, 20, 70);
    
    let yPos = 70 + (splitSummary.length * 7) + 10;
    
    doc.setFont(font, "bold");
    doc.text(`${t('detailedFindings')}:`, 20, yPos);
    yPos += 8;

    findings.forEach((finding, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(font, "bold");
      const verdictKey = `verdict${finding.verdict}`;
      const translatedVerdict = t(verdictKey);
      let splitFindingTitle = doc.splitTextToSize(`${index + 1}. ${finding.finding} [${translatedVerdict}]`, 165);
      doc.text(splitFindingTitle, 25, yPos);
      yPos += (splitFindingTitle.length * 5) + 1;
      doc.setFont(font, "normal");
      let splitExplanation = doc.splitTextToSize(finding.explanation, 160);
      doc.text(splitExplanation, 30, yPos);
      yPos += (splitExplanation.length * 5) + 5;
    });

    if (sources && sources.length > 0) {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.setFont(font, "bold");
      doc.text(`${t('tabSources')}:`, 20, yPos);
      yPos += 6;
      doc.setFont(font, "normal");
      sources.forEach(source => {
        doc.textWithLink(source.title, 25, yPos, { url: source.url });
        yPos += 6;
      });
    }
    
    doc.save(`Verification_Report_${fileName}.pdf`);
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-lg animate-fade-in">
        <div className="flex justify-end items-center mb-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-md text-sm transition-colors"
                title={t('translateResult')}
              >
                <span>{t('translateResult')}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-56 overflow-y-auto">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleTranslateResult(lang.code)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-600 hover:text-white"
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>
        </div>
         {isTranslating && (
             <div className="flex items-center justify-end gap-2 text-gray-500 text-sm my-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold">{t('translatingResult')}</span>
            </div>
          )}
        {translationError && <p className="text-red-500 text-sm my-2 text-right">{translationError}</p>}
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs" role="tablist">
          <TabButton isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>{t('tabSummary')}</TabButton>
          <TabButton isActive={activeTab === 'ai_analysis'} onClick={() => setActiveTab('ai_analysis')}>{t('tabAIAnalysis')}</TabButton>
          <TabButton isActive={activeTab === 'public_research'} onClick={() => setActiveTab('public_research')}>{t('tabPublicResearch')}</TabButton>
          <TabButton isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')}>{t('tabDocuments')}</TabButton>
          <TabButton isActive={activeTab === 'sources'} onClick={() => setActiveTab('sources')}>{t('tabSources')}</TabButton>
          <TabButton isActive={activeTab === 'disclaimer'} onClick={() => setActiveTab('disclaimer')}>{t('tabDisclaimer')}</TabButton>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'summary' && (
          <div role="tabpanel" className="animate-fade-in">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex flex-col items-center flex-shrink-0">
                <TrustScoreGauge score={trustScore} status={status} t={t} />
                <div className={`mt-4 text-2xl font-bold ${color.text}`}>{getStatusTranslation(status)}</div>
              </div>
              <div className="flex-grow w-full">
                <h2 className="text-xl font-bold text-blue-700 mb-2">{t('analysisSummary')}</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{summary}</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'ai_analysis' && (
          <div role="tabpanel" className="animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-blue-700">{t('detailedFindings')}</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {findings.map((finding, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 pt-1">
                      <FindingIcon verdict={finding.verdict} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{finding.finding}</p>
                    <p className="text-sm text-gray-600">{finding.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'public_research' && (
           <div role="tabpanel" className="animate-fade-in">
             <h2 className="text-xl font-bold text-blue-700 mb-4">{t('tabPublicResearch')}</h2>
             {publicResearch && publicResearch.length > 0 ? (
               <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                 {publicResearch.map((item, index) => (
                   <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                     <p className="font-bold text-gray-500 text-sm">{item.sourceName}</p>
                     <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-800 hover:text-blue-700 group inline-flex items-center gap-1">
                       {item.title} <ExternalLinkIcon className="inline w-4 h-4 text-gray-400 group-hover:text-blue-700" />
                     </a>
                     <p className="text-gray-600 mt-1 text-sm">{item.summary}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-gray-500">{t('noPublicResearch')}</p>
             )}
           </div>
        )}
        {activeTab === 'documents' && (
           <div role="tabpanel" className="animate-fade-in">
             <h2 className="text-xl font-bold text-blue-700 mb-4">{t('tabDocuments')}</h2>
             {documents && documents.length > 0 ? (
               <ul className="space-y-2 max-h-96 overflow-y-auto pr-2 list-disc list-inside">
                 {documents.map((doc, index) => (
                   <li key={index}>
                     <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline group inline-flex items-center gap-1">
                       {doc.title} <ExternalLinkIcon className="inline w-4 h-4 text-gray-400 group-hover:text-blue-700" />
                     </a>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-gray-500">{t('noDocuments')}</p>
             )}
           </div>
        )}
        {activeTab === 'sources' && (
           <div role="tabpanel" className="animate-fade-in">
            <h2 className="text-xl font-bold text-blue-700 mb-4">{t('tabSources')}</h2>
             {sources && sources.length > 0 ? (
               <ul className="space-y-2 max-h-96 overflow-y-auto pr-2 list-disc list-inside">
                 {sources.map((source, index) => (
                   <li key={index}>
                     <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline group inline-flex items-center gap-1 break-all">
                       {source.title} <ExternalLinkIcon className="inline w-4 h-4 text-gray-400 group-hover:text-blue-700" />
                     </a>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-gray-500">{t('noSources')}</p>
             )}
           </div>
        )}
        {activeTab === 'disclaimer' && (
          <div role="tabpanel" className="animate-fade-in">
            <h2 className="text-xl font-bold text-blue-700 mb-4">{t('disclaimerTitle')}</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{t('disclaimerText')}</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-end gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button onClick={handleDownloadReport} className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-md transition-colors font-bold">
            {t('downloadReport')}
          </button>
          <button onClick={onReset} className="w-full sm:w-auto px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors font-bold">
            {t('startNewVerification')}
          </button>
        </div>
      </div>
    </div>
  );
};