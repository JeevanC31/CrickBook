'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import './Header.css';

const Header = () => {
  const { activeTab, setActiveTab, user } = useAppContext();

  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    turfs: 'Turfs',
    coaches: 'Coaches',
    shop: 'Shop',
    matches: 'Matches',
    profile: 'Profile'
  };

  // Get the first letter of the user's name for the avatar
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="top-header">
      <div className="header-title">
        <h2 className="animate-fade-in" key={activeTab}>{titleMap[activeTab]}</h2>
      </div>
      <div className="header-actions">
        <div className="search-bar">
          <i className="fa-solid fa-search"></i>
          <input type="text" placeholder="Search turfs, coaches..." />
        </div>
        <div className="user-avatar" onClick={() => setActiveTab('profile')} title={user?.name}>
          <div className="avatar-circle">{initial}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
