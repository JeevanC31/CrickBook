'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import './Sidebar.css';

const Sidebar = () => {
  const { activeTab, setActiveTab, logout } = useAppContext();

  const navItems = [
    { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
    { id: 'turfs', icon: 'fa-map-location-dot', label: 'Turfs' },
    { id: 'coaches', icon: 'fa-user-tie', label: 'Coaches' },
    { id: 'shop', icon: 'fa-store', label: 'Shop' },
    { id: 'matches', icon: 'fa-trophy', label: 'Matches' },
    { id: 'profile', icon: 'fa-user', label: 'Profile' },
  ];

  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <i className="fa-solid fa-cricket-bat-ball"></i> <span className="logo-text">CricBook</span>
      </div>
      <ul className="nav-links">
        {navItems.map(item => (
          <li
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => setActiveTab(item.id)}
            data-testid={`nav-${item.id}`}
          >
            <i className={`fa-solid ${item.icon}`}></i> <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <button className="btn btn-logout" onClick={logout} data-testid="logout-btn">
          <i className="fa-solid fa-arrow-right-from-bracket"></i> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
