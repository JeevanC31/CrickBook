'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  age?: number | null;
  specialization?: string | null;
}

interface AppContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isChatbotOpen: boolean;
  toggleChatbot: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // On mount: restore session from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('cricbook_user');
    const storedTab = localStorage.getItem('cricbook_tab');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setIsAuthenticated(true);
    }
    if (storedTab) setActiveTab(storedTab);
    setIsHydrated(true);
  }, []);

  // Persist active tab in localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('cricbook_tab', activeTab);
    }
  }, [activeTab, isHydrated]);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('cricbook_user', JSON.stringify(userData));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
    setIsChatbotOpen(false);
    localStorage.removeItem('cricbook_user');
    localStorage.removeItem('cricbook_tab');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('cricbook_user', JSON.stringify(updated));
  };

  const toggleChatbot = () => setIsChatbotOpen(prev => !prev);

  // Prevent SSR mismatch — don't render children until localStorage is read
  if (!isHydrated) return null;

  return (
    <AppContext.Provider value={{
      isAuthenticated, user, login, logout, updateUser,
      activeTab, setActiveTab,
      isChatbotOpen, toggleChatbot,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
