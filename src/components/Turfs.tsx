'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Views.css';

interface Turf {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
  netsAvailable: number;
  imageUrl?: string;
}

const Turfs = () => {
  const { user, setActiveTab } = useAppContext();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'complete'>('details');
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [people, setPeople] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Generate Time Slots (6 AM to 10 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return {
      value: `${hour.toString().padStart(2, '0')}:00`,
      label: `${displayHour}:00 ${ampm}`
    };
  });

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const res = await fetch('/api/turfs');
        if (res.ok) {
          const data = await res.json();
          setTurfs(data);
        }
      } catch (e) {
        console.error("Failed to fetch turfs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, []);

  const handleBookNow = (turf: Turf) => {
    setSelectedTurf(turf);
    setBookingStep('details');
    setPeople(1);
    setDate('');
    setTime('');
  };

  const startPayment = () => {
    setBookingStep('payment');
    setTimeout(async () => {
      const result = await finalizeBooking();
      if (result.ok) {
        setBookingStep('complete');
        setTimeout(() => {
          setSelectedTurf(null);
          setActiveTab('orders');
        }, 1500);
      } else {
        setBookingStep('details');
        alert(`Booking failed: ${result.error}\n\nDetails: ${result.details || 'Check console'}`);
      }
    }, 3500);
  };

  const finalizeBooking = async () => {
    if (!user || !selectedTurf || !date || !time) {
      return { ok: false, error: 'Incomplete Data', details: 'Please ensure all fields are filled.' };
    }
    
    try {
      const start = new Date(`${date}T${time}:00`);
      if (isNaN(start.getTime())) {
        return { ok: false, error: 'Invalid Date', details: 'The date or time format is incorrect.' };
      }
      
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const res = await fetch('/api/turfs/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          turfId: selectedTurf.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          guests: people
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error, details: data.details };
      }
      
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: 'Network Error', details: e.message };
    }
  };

  const adjustPeople = (val: number) => {
    const next = people + val;
    if (next >= 1 && next <= 20) setPeople(next);
  };

  const handlePeopleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      if (val < 1) setPeople(1);
      else if (val > 20) setPeople(20);
      else setPeople(val);
    }
  };

  if (loading) return <div className="loading">Finding best turfs...</div>;

  return (
    <div className="turf-layout animate-fade-in" data-testid="view-turfs">
      <div className="turf-list-container glass">
        <div className="filter-bar">
          <h3>Nearby Turfs</h3>
          <select>
            <option>Sort by Distance</option>
            <option>Sort by Price</option>
          </select>
        </div>
        <div className="turf-list">
          {turfs.map(turf => (
            <div key={turf.id} className="turf-card">
              <img src={turf.imageUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=300"} alt={turf.name} />
              <div className="turf-info">
                <h4>{turf.name}</h4>
                <p className="address"><i className="fa-solid fa-location-dot"></i> {turf.location}</p>
                <p className="price">${turf.pricePerHour} / hr</p>
                <div className="turf-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => handleBookNow(turf)}>Book Now</button>
                  <span className="availability text-green">{turf.netsAvailable} Nets Available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="turf-map-container glass">
        <div className="map-placeholder">
          <i className="fa-solid fa-map"></i>
          <p>Interactive Map View</p>
        </div>
      </div>

      {/* Booking Modal (Flipkart Style) */}
      {selectedTurf && (
        <div className="modal-overlay">
          <div className={`modal-content glass animate-scale-up ${bookingStep === 'details' ? 'modal-lg' : ''}`}>
            <button className="close-btn" onClick={() => setSelectedTurf(null)}>&times;</button>
            
            {bookingStep === 'details' && (
              <div className="flipkart-layout">
                <div className="fk-left">
                  <div className="fk-gallery">
                    <img src={selectedTurf.imageUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600"} alt="" className="fk-main-img" />
                    <div className="mini-map mt-3">
                       <img src={`https://api.placeholder.com/600/300?text=Map+Location+of+${selectedTurf.name}`} alt="Map" />
                       <div className="map-marker"><i className="fa-solid fa-location-dot"></i></div>
                    </div>
                  </div>
                </div>

                <div className="fk-right">
                  <nav className="fk-breadcrumb">Home / Turfs / {selectedTurf.name}</nav>
                  <h2 className="fk-title">{selectedTurf.name}</h2>
                  <div className="fk-rating-row">
                    <span className="badge badge-green">4.2 <i className="fa-solid fa-star"></i></span>
                    <span className="text-muted small">178 Ratings & 24 Reviews</span>
                  </div>
                  
                  <div className="fk-price-row mt-3">
                    <span className="price-tag">${selectedTurf.pricePerHour}</span>
                    <span className="old-price">${selectedTurf.pricePerHour + 15}</span>
                    <span className="discount">{(15 / (selectedTurf.pricePerHour + 15) * 100).toFixed(0)}% off</span>
                  </div>

                  <div className="fk-offers mt-3">
                    <p><strong>Available offers</strong></p>
                    <p><i className="fa-solid fa-tag text-green"></i> Bank Offer: 10% off on SBI Credit Card, up to $50 on orders of $500 and above</p>
                    <p><i className="fa-solid fa-tag text-green"></i> Special Price: Get extra $10 off (price inclusive of cashback/coupon)</p>
                  </div>

                  <div className="fk-form mt-4">
                    <h3>Booking Details</h3>
                    <div className="form-grid mt-3">
                      <div className="form-group">
                        <label>Number of People</label>
                        <div className="people-picker">
                          <button type="button" onClick={() => adjustPeople(-1)}>-</button>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={people} 
                            onChange={handlePeopleChange} 
                          />
                          <button type="button" onClick={() => adjustPeople(1)}>+</button>
                        </div>
                        <span className="small text-muted">Max 20</span>
                      </div>
                      <div className="form-group">
                        <label>Select Date</label>
                        <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Select Time Slot</label>
                        <select className="form-control" value={time} onChange={e => setTime(e.target.value)} required>
                          <option value="">Select Time</option>
                          {timeSlots.map(slot => (
                            <option key={slot.value} value={slot.value}>{slot.label}</option>
                          ))}
                        </select>
                        <span className="small text-muted">6 AM - 11 PM</span>
                      </div>
                    </div>
                  </div>

                  <div className="fk-actions mt-5">
                    <button 
                      className="btn btn-warning fk-btn" 
                      disabled={!date || !time}
                      onClick={startPayment}
                    >
                      <i className="fa-solid fa-bolt"></i> BUY NOW
                    </button>
                  </div>
                </div>
              </div>
            )}

            {bookingStep === 'payment' && (
              <div className="step-payment text-center p-5">
                <div className="payment-spinner"></div>
                <h3 className="mt-4">Securely Processing Payment</h3>
                <p className="text-muted">Please do not refresh the page...</p>
              </div>
            )}

            {bookingStep === 'complete' && (
              <div className="step-complete text-center p-5">
                <div className="success-icon animate-bounce">✅</div>
                <h2 className="mt-4">Payment Complete!</h2>
                <p>Your booking for <strong>{selectedTurf.name}</strong> is confirmed.</p>
                <p className="small text-muted mt-2">Redirecting to your orders...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Turfs;
