'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext';
import './Dashboard.css';

const Dashboard = () => {
  const { setActiveTab, toggleChatbot, user } = useAppContext();

  // Get first name only for greeting
  const firstName = user?.name?.split(' ')[0] || 'Player';

  return (
    <div className="animate-fade-in" data-testid="view-dashboard">
      <div className="dashboard-greeting">
        <h2>Welcome back, <span className="text-green">{firstName}</span> 👋</h2>
        <p>Here's what's happening with your cricket today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon"><i className="fa-solid fa-calendar-check"></i></div>
          <div className="stat-details">
            <h3>Upcoming Match</h3>
            <p>Today, 6:00 PM</p>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon"><i className="fa-solid fa-wallet"></i></div>
          <div className="stat-details">
            <h3>Wallet Balance</h3>
            <p>$120.50</p>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon"><i className="fa-solid fa-star text-yellow"></i></div>
          <div className="stat-details">
            <h3>Player Rating</h3>
            <p>4.8 / 5.0</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="card glass recent-activity">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            <li>
              <div className="activity-icon bg-green"><i className="fa-solid fa-check"></i></div>
              <div className="activity-text">
                <strong>Booked Turf:</strong> Central Park Nets
                <span>2 hours ago</span>
              </div>
            </li>
            <li>
              <div className="activity-icon bg-blue"><i className="fa-solid fa-cart-shopping"></i></div>
              <div className="activity-text">
                <strong>Purchased:</strong> SG Cricket Bat
                <span>Yesterday</span>
              </div>
            </li>
          </ul>
        </div>

        <div className="card glass quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-grid">
            <button className="btn btn-outline" onClick={() => setActiveTab('turfs')}>Book a Net</button>
            <button className="btn btn-outline" onClick={() => setActiveTab('coaches')}>Find Coach</button>
            <button className="btn btn-outline" onClick={() => setActiveTab('matches')}>Join Match</button>
            <button className="btn btn-primary" onClick={toggleChatbot}>
              <i className="fa-solid fa-robot"></i> AI Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
