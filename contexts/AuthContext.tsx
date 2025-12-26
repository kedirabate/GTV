
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  // FIX: Added signup to the context type to match its usage in Signup.tsx
  signup: (user: string, pass: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);

  // This is a simulated login function.
  // In a real application, this would involve an API call to a backend server.
  const login = (user: string, pass: string): boolean => {
    if (user.trim() !== '' && pass.trim() !== '') {
      setIsAuthenticated(true);
      setUsername(user);
      return true;
    }
    return false;
  };

  // FIX: Added a simulated signup function. In this mock, it behaves the same as login.
  const signup = (user: string, pass: string): boolean => {
    if (user.trim() !== '' && pass.trim() !== '') {
      setIsAuthenticated(true);
      setUsername(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername(null);
    localStorage.removeItem('recentAnalyses');
  };

  return (
    // FIX: Provided the new signup function through the context.
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
