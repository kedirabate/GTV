
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { Loader } from './components/Loader';
import { analyzeFile } from './services/geminiService';
import type { AnalysisResult as AnalysisResultType, FileType, AnalysisHistoryItem } from './types';
import { getFileType } from './utils/fileUtils';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { RecentAnalyses } from './components/RecentAnalyses';
import { Signup } from './components/Signup';
import { processVideo } from './components/VideoProcessor';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      try {
        const storedAnalyses = localStorage.getItem('recentAnalyses');
        if (storedAnalyses) {
          setRecentAnalyses(JSON.parse(storedAnalyses));
        }
      } catch (e) {
        console.error("Failed to parse recent analyses from localStorage", e);
        setRecentAnalyses([]);
      }
    } else {
      setRecentAnalyses([]);
    }
  }, [isAuthenticated]);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(getFileType(selectedFile));
      setAnalysisResult(null);
      setError(null);
    } else {
      setFile(null);
      setFileType(null);
    }
  };
  
  const handleLoginClick = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);
  
  const handleAnalysis = useCallback(async () => {
    if (!isAuthenticated) {
      handleLoginClick();
      return;
    }

    if (!file || !fileType) {
      setError(t('errorSelectFile'));
      return;
    }

    if (fileType === 'unsupported') {
      setError(t('errorUnsupportedFile'));
      return;
    }

    setIsLoading(true);
    setLoadingMessage('');
    setError(null);
    setAnalysisResult(null);

    try {
      let result;
      // Pre-process large videos on the client-side
      if (fileType === 'video' && file.size > 10 * 1024 * 1024) { // Threshold: 10MB
        setLoadingMessage(t('preprocessingVideo'));
        const processedData = await processVideo(file, 16); // Reduced from 300 to 16 frames
        setLoadingMessage(''); // Clear preprocessing message
        result = await analyzeFile(processedData, fileType, language);
      } else {
        result = await analyzeFile(file, fileType, language);
      }

      setAnalysisResult(result);

      const newHistoryItem: AnalysisHistoryItem = {
        id: `${Date.now()}-${file.name}`,
        fileName: file.name,
        timestamp: new Date().toISOString(),
        result,
      };
      setRecentAnalyses(prevAnalyses => {
        const updatedAnalyses = [newHistoryItem, ...prevAnalyses].slice(0, 5); // Keep last 5
        localStorage.setItem('recentAnalyses', JSON.stringify(updatedAnalyses));
        return updatedAnalyses;
      });

    } catch (err) {
      console.error(err);
      setError(t('errorAnalysis'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [isAuthenticated, file, fileType, language, t, handleLoginClick]);

  const handleReset = () => {
    setFile(null);
    setFileType(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
  }

  const handleSelectRecent = (historyItem: AnalysisHistoryItem) => {
    setAnalysisResult(historyItem.result);
    // Create a dummy file object for the report component which only needs the name
    const dummyFile = new File([], historyItem.fileName, { type: 'text/plain' });
    setFile(dummyFile);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen text-gray-800 flex flex-col font-sans">
      <Header onLoginClick={handleLoginClick} />
      <main className="flex-grow flex flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {!analysisResult && !isLoading && (
            <FileUpload 
              onFileChange={handleFileChange}
              onAnalyze={handleAnalysis}
              file={file}
              fileType={fileType}
            />
          )}
          {isLoading && <Loader customMessage={loadingMessage} />}
          {error && (
            <div className="text-center bg-red-100 border border-red-400 p-4 rounded-lg">
              <p className="text-red-700 font-bold">{error}</p>
              <button 
                onClick={handleReset} 
                className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors font-bold"
              >
                {t('tryAgain')}
              </button>
            </div>
          )}
          {analysisResult && !isLoading && (
            <AnalysisResult result={analysisResult} onReset={handleReset} file={file} />
          )}

          {!isLoading && !analysisResult && isAuthenticated && (
              <RecentAnalyses analyses={recentAnalyses} onSelect={handleSelectRecent} />
          )}

          {!isLoading && !analysisResult && !isAuthenticated && (
            <Signup onLoginClick={handleLoginClick} />
          )}
        </div>
      </main>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default App;