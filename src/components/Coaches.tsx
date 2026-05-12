'use client';

import React from 'react';
import './Views.css';

const Coaches = () => {
  return (
    <div className="animate-fade-in" data-testid="view-coaches">
      <div className="grid-container">
        <div className="coach-card glass">
          <img src="https://i.pravatar.cc/150?img=33" alt="Coach" className="coach-img" />
          <h3>David Warner</h3>
          <p className="specialty">Batting Coach</p>
          <div className="stats-row">
            <span><i className="fa-solid fa-star text-yellow"></i> 4.9</span>
            <span><i className="fa-solid fa-users"></i> 120+ Students</span>
          </div>
          <p className="coach-price">$50 / session</p>
          <button className="btn btn-primary w-100">Book Session</button>
        </div>
        <div className="coach-card glass">
          <img src="https://i.pravatar.cc/150?img=12" alt="Coach" className="coach-img" />
          <h3>Brett Lee</h3>
          <p className="specialty">Pace Bowling Coach</p>
          <div className="stats-row">
            <span><i className="fa-solid fa-star text-yellow"></i> 4.8</span>
            <span><i className="fa-solid fa-users"></i> 80+ Students</span>
          </div>
          <p className="coach-price">$60 / session</p>
          <button className="btn btn-primary w-100">Book Session</button>
        </div>
      </div>
    </div>
  );
};

export default Coaches;
