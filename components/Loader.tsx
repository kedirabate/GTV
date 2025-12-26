
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoaderProps {
  customMessage?: string;
}

export const Loader: React.FC<LoaderProps> = ({ customMessage }) => {
  const { t } = useLanguage();
  
  const messages = [
      t('loaderMessage1'),
      t('loaderMessage2'),
      t('loaderMessage3'),
      t('loaderMessage4'),
      t('loaderMessage5'),
      t('loaderMessage6'),
      t('loaderMessage7'),
  ];
  
  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white border border-gray-200 rounded-2xl shadow-lg">
      <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-bold text-blue-700">{customMessage || t('analyzing')}</p>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
};