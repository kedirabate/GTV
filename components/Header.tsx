
import React, { useRef, useEffect } from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { LogOutIcon } from './icons/LogOutIcon';

interface HeaderProps {
  onLoginClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const { t } = useLanguage();
  const { isAuthenticated, username, logout } = useAuth();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = header.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      header.style.setProperty('--mouse-x', `${x}px`);
      header.style.setProperty('--mouse-y', `${y}px`);
    };

    header.addEventListener('mousemove', handleMouseMove);

    return () => {
      header.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <header 
      ref={headerRef}
      className="relative w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 sticky top-0 z-50 overflow-hidden group"
    >
      <div 
        className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(37, 99, 235, 0.1), transparent 80%)'
        }}
      />
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="h-8 w-8 text-blue-700" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            {t('headerTitle')}
          </h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-gray-600">{t('welcomeMessage')}, <span className="font-bold">{username}</span></span>
              <button onClick={logout} className="p-2 rounded-full text-gray-500 hover:text-blue-700 hover:bg-gray-100 transition-colors" aria-label="Logout">
                <LogOutIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={onLoginClick} 
                className="px-3 py-2 text-sm font-bold bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors"
              >
                {t('headerLoginButton')}
              </button>
            </div>
          )}
          <LanguageSwitcher />
          {isAuthenticated && (
            <div className="md:hidden">
               <button onClick={logout} className="p-2 rounded-full text-gray-500 hover:text-blue-700 hover:bg-gray-100 transition-colors" aria-label="Logout">
                <LogOutIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};