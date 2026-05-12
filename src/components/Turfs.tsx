'use client';

import React from 'react';
import './Views.css';

const Turfs = () => {
  return (
    <div className="turf-layout animate-fade-in" data-testid="view-turfs">
      <div className="turf-list-container glass">
        <div className="filter-bar">
          <h3>Nearby Turfs</h3>
          <select>
            <option>Sort by Distance</option>
            <option>Sort by Price</option>
            <option>Sort by Rating</option>
          </select>
        </div>
        <div className="turf-list">
          <div className="turf-card">
            <img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Turf" />
            <div className="turf-info">
              <h4>Green Arena Nets</h4>
              <p className="address"><i className="fa-solid fa-location-dot"></i> 2.5 km away</p>
              <p className="price">$25 / hr</p>
              <div className="turf-actions">
                <button className="btn btn-sm btn-primary">Book Now</button>
                <span className="availability text-green">3 Nets Available</span>
              </div>
            </div>
          </div>
          <div className="turf-card">
            <img src="https://images.unsplash.com/photo-1518605368461-1e12922349ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Turf" />
            <div className="turf-info">
              <h4>Stadium Pro Turf</h4>
              <p className="address"><i className="fa-solid fa-location-dot"></i> 5.1 km away</p>
              <p className="price">$40 / hr</p>
              <div className="turf-actions">
                <button className="btn btn-sm btn-primary">Book Now</button>
                <span className="availability text-green">1 Net Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="turf-map-container glass">
        <div className="map-placeholder">
          <i className="fa-solid fa-map"></i>
          <p>Interactive Map View</p>
        </div>
      </div>
    </div>
  );
};

export default Turfs;
