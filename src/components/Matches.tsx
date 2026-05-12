'use client';

import React from 'react';
import './Views.css';

const Matches = () => {
  return (
    <div className="animate-fade-in" data-testid="view-matches">
      <div className="match-list">
        <div className="match-card glass">
          <div className="match-date">
            <span className="month">MAY</span>
            <span className="day">12</span>
          </div>
          <div className="match-info">
            <h3>Weekend League T20</h3>
            <p><i className="fa-solid fa-location-dot"></i> Central Park Nets</p>
            <p><i className="fa-solid fa-clock"></i> 08:00 AM - 11:00 AM</p>
          </div>
          <div className="match-roles">
            <h4>Available Roles:</h4>
            <div className="role-tags">
              <span className="tag">Batsman (2)</span>
              <span className="tag">Bowler (1)</span>
            </div>
            <button className="btn btn-primary mt-2">Join Match</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matches;
