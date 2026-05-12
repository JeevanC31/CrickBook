'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import Auth from '@/components/Auth';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Chatbot from '@/components/Chatbot';
import Dashboard from '@/components/Dashboard';
import Turfs from '@/components/Turfs';
import Coaches from '@/components/Coaches';
import Shop from '@/components/Shop';
import Matches from '@/components/Matches';
import Profile from '@/components/Profile';

export default function Home() {
  const { isAuthenticated, activeTab } = useAppContext();

  if (!isAuthenticated) {
    return <Auth />;
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'turfs': return <Turfs />;
      case 'coaches': return <Coaches />;
      case 'shop': return <Shop />;
      case 'matches': return <Matches />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div id="app-layout" className="animate-fade-in" data-testid="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="views-container">
          {renderView()}
        </div>
      </main>
      <Chatbot />
    </div>
  );
}
