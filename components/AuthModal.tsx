
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError(null);
    }
  }, [isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError(t('loginError'));
    } else {
      setError(null);
      // The useEffect for isAuthenticated will handle closing the modal
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white border border-gray-200 shadow-2xl rounded-2xl p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 text-3xl font-light">&times;</button>
        
        <div className="text-center mb-6">
            <ShieldCheckIcon className="h-10 w-10 text-blue-700 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t('loginTitle')}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {t('loginSubtitle')}
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username-modal" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('usernameLabel')}
            </label>
            <input
              id="username-modal"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder={t('usernameLabel')}
              required
            />
          </div>
          <div>
            <label htmlFor="password-modal" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('passwordLabel')}
            </label>
            <input
              id="password-modal"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder={t('passwordLabel')}
              required
            />
          </div>
          
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-md shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            {t('loginButton')}
          </button>
        </form>
      </div>
    </div>
  );
};