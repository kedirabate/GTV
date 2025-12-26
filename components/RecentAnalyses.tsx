
import React from 'react';
import type { AnalysisHistoryItem, AnalysisResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { HelpCircleIcon } from './icons/HelpCircleIcon';

interface RecentAnalysesProps {
  analyses: AnalysisHistoryItem[];
  onSelect: (item: AnalysisHistoryItem) => void;
}

const getStatusStyles = (status: AnalysisResult['status']) => {
  switch (status) {
    case 'Authentic':
      return { text: 'text-green-800', bg: 'bg-green-100', icon: <ShieldCheckIcon className="h-5 w-5 text-green-600" /> };
    case 'Suspicious':
      return { text: 'text-yellow-800', bg: 'bg-yellow-100', icon: <AlertTriangleIcon className="h-5 w-5 text-yellow-600" /> };
    case 'Likely Fake':
      return { text: 'text-red-800', bg: 'bg-red-100', icon: <XCircleIcon className="h-5 w-5 text-red-600" /> };
    case 'Inconclusive':
    default:
      return { text: 'text-gray-800', bg: 'bg-gray-100', icon: <HelpCircleIcon className="h-5 w-5 text-gray-600" /> };
  }
};

export const RecentAnalyses: React.FC<RecentAnalysesProps> = ({ analyses, onSelect }) => {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
      <h3 className="text-lg font-bold text-blue-700 mb-4 text-center">{t('recentAnalysesTitle')}</h3>
      {analyses.length === 0 ? (
        <div className="text-center text-gray-500 py-8 px-4 bg-white border border-gray-200 rounded-lg">
          {t('noRecentAnalyses')}
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map(item => {
            const statusStyles = getStatusStyles(item.result.status);
            const statusKey = `status${item.result.status.replace(' ', '')}`;
            const translatedStatus = t(statusKey);
            
            return (
              <button 
                key={item.id} 
                onClick={() => onSelect(item)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-600 transition-all duration-300 text-left shadow-sm`}
              >
                <div className="flex-1 overflow-hidden pr-4">
                  <p className="text-gray-800 font-semibold truncate" title={item.fileName}>{item.fileName}</p>
                  <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <div className={`flex-shrink-0 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyles.bg} ${statusStyles.text}`}>
                  {statusStyles.icon}
                  <span>{translatedStatus}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
};