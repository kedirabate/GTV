
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SignupProps {
  onLoginClick: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onLoginClick }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = signup(username, password);
    if (!success) {
      setError(t('signupError'));
    } else {
      setError(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 p-6 md:p-8 bg-white border border-gray-200 rounded-2xl shadow-lg animate-fade-in">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-blue-700 mb-2">{t('signupTitle')}</h3>
        <p className="text-gray-500 text-sm">{t('signupPromptMessage')}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
        <div>
          <label htmlFor="username-signup" className="sr-only">
            {t('usernameLabel')}
          </label>
          <input
            id="username-signup"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder={t('usernameLabel')}
            required
          />
        </div>
        <div>
          <label htmlFor="password-signup" className="sr-only">
            {t('passwordLabel')}
          </label>
          <input
            id="password-signup"
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
          className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-md shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          {t('signupButton')}
        </button>
      </form>
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          {t('switchToLoginPrompt')}{' '}
          <button onClick={onLoginClick} className="font-bold text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-0">
            {t('switchToLoginLink')}
          </button>
        </p>
      </div>
    </div>
  );
};