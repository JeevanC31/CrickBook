'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Views.css';
import './coaches-orders.css';

interface Coach {
  id: string;
  name: string;
  specialty: string;
  pricePerSession: number;
  rating: number;
  imageUrl?: string;
}

const allTimeSlots = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return { value: `${hour.toString().padStart(2, '0')}:00`, label: `${displayHour}:00 ${ampm}` };
});

const todayStr = new Date().toISOString().split('T')[0];

const Coaches = () => {
  const { user } = useAppContext();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'complete'>('details');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Filter out past time slots when today is selected
  const timeSlots = date === todayStr
    ? allTimeSlots.filter(slot => parseInt(slot.value.split(':')[0], 10) > new Date().getHours())
    : allTimeSlots;

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const COACH_URL = process.env.NEXT_PUBLIC_COACH_URL || '';
    fetch(`${COACH_URL}/coaches`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCoaches(data);
        } else {
          setFetchError(data?.error || 'Failed to load coaches');
        }
        setLoading(false);
      })
      .catch(() => { setFetchError('Network error'); setLoading(false); });
  }, []);

  const handleBookSession = (coach: Coach) => {
    setSelectedCoach(coach);
    setBookingStep('details');
    setDate('');
    setTime('');
  };

  const handleConfirmBooking = async () => {
    if (!date || !time || !user || !selectedCoach) return;
    setBookingStep('payment');
    try {
      const start = new Date(`${date}T${time}:00`);
      const COACH_URL = process.env.NEXT_PUBLIC_COACH_URL || '';
      const res = await fetch(`${COACH_URL}/coaches/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, coachId: selectedCoach.id, coachName: selectedCoach.name, sessionTime: start.toISOString() }),
      });
      if (res.ok) {
        setBookingStep('complete');
        setTimeout(() => setSelectedCoach(null), 1800);
      } else {
        setBookingStep('details');
        alert('Booking failed. Please try again.');
      }
    } catch {
      setBookingStep('details');
      alert('Network error during booking.');
    }
  };

  if (loading) return <div className="loading">Loading coaches...</div>;

  if (fetchError) return (
    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.7 }}>
      <i className="fa-solid fa-circle-exclamation fa-3x mb-3" style={{ color: '#f87171' }}></i>
      <p style={{ color: '#f87171', marginTop: '1rem' }}>{fetchError}</p>
      <p className="text-muted small">Make sure the database is reachable from the container.</p>
    </div>
  );

  return (
    <div className="animate-fade-in" data-testid="view-coaches">
      <div className="section-header mb-4">
        <h2>Cricket Coaches</h2>
        <p className="text-muted">Book a session with elite certified coaches</p>
      </div>

      {coaches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
          <i className="fa-solid fa-user-tie fa-3x mb-3"></i>
          <p>No coaches available yet. Check back soon!</p>
        </div>
      )}

      <div className="coaches-grid">
        {coaches.map(coach => (
          <div key={coach.id} className="coach-card glass">
            <div className="coach-card-img-wrap">
              {coach.imageUrl ? (
                <img src={coach.imageUrl} alt={coach.name} className="coach-avatar" />
              ) : (
                <div className="coach-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168,85,247,0.15)' }}>
                  <i className="fa-solid fa-user-tie fa-2x" style={{ opacity: 0.5 }}></i>
                </div>
              )}
              <span className="coach-rating-badge">
                <i className="fa-solid fa-star"></i> {coach.rating.toFixed(1)}
              </span>
            </div>
            <div className="coach-card-body">
              <h3>{coach.name}</h3>
              <p className="coach-specialty">{coach.specialty}</p>
              <div className="coach-price-row">
                <span className="coach-price">₹{coach.pricePerSession}</span>
                <span className="text-muted small">/ session</span>
              </div>
              <button className="btn btn-primary w-100" onClick={() => handleBookSession(coach)}>
                <i className="fa-solid fa-calendar-check"></i> Book Session
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coach Booking Modal */}
      {selectedCoach && (
        <div className="modal-overlay">
          <div className={`modal-content glass animate-scale-up ${bookingStep === 'details' ? 'modal-lg' : ''}`}>
            <button className="close-btn" onClick={() => setSelectedCoach(null)}>&times;</button>

            {bookingStep === 'details' && (
              <div className="flipkart-layout">
                <div className="fk-left">
                  {selectedCoach.imageUrl ? (
                    <img src={selectedCoach.imageUrl} alt={selectedCoach.name} className="fk-main-img" />
                  ) : (
                    <div className="fk-main-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168,85,247,0.1)', borderRadius: '12px' }}>
                      <i className="fa-solid fa-user-tie fa-4x" style={{ opacity: 0.3 }}></i>
                    </div>
                  )}
                  <div className="coach-stats-panel glass mt-3">
                    <h4 className="stats-panel-title">Coach Info</h4>
                    <div className="stats-panel-grid">
                      <div className="stat-box"><span className="stat-val">{selectedCoach.rating.toFixed(1)}</span><span className="stat-lbl">Rating</span></div>
                      <div className="stat-box"><span className="stat-val">₹{selectedCoach.pricePerSession}</span><span className="stat-lbl">/ Session</span></div>
                    </div>
                  </div>
                </div>

                <div className="fk-right">
                  <nav className="fk-breadcrumb">Home / Coaches / {selectedCoach.name}</nav>
                  <h2 className="fk-title">{selectedCoach.name}</h2>
                  <div className="fk-rating-row">
                    <span className="badge badge-green">{selectedCoach.rating.toFixed(1)} <i className="fa-solid fa-star"></i></span>
                    <span className="text-muted small">{selectedCoach.specialty}</span>
                  </div>
                  <div className="fk-price-row mt-3">
                    <span className="price-tag">₹{selectedCoach.pricePerSession}</span>
                    <span className="text-muted small">per session</span>
                  </div>

                  <div className="fk-form mt-4">
                    <h3>Book a Session</h3>
                    <div className="form-grid mt-3">
                      <div className="form-group">
                        <label>Select Date</label>
                        <input type="date" className="form-control" value={date} onChange={e => { setDate(e.target.value); setTime(''); }} min={todayStr} />
                      </div>
                      <div className="form-group">
                        <label>Select Time Slot</label>
                        <select className="form-control" value={time} onChange={e => setTime(e.target.value)}>
                          <option value="">Choose Time</option>
                          {timeSlots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="fk-actions mt-5">
                    <button className="btn btn-warning fk-btn" disabled={!date || !time} onClick={handleConfirmBooking}>
                      <i className="fa-solid fa-bolt"></i> CONFIRM BOOKING
                    </button>
                  </div>
                </div>
              </div>
            )}

            {bookingStep === 'payment' && (
              <div className="step-payment text-center p-5">
                <div className="payment-spinner"></div>
                <h3 className="mt-4">Confirming Your Session</h3>
                <p className="text-muted">Please wait while we book your slot...</p>
              </div>
            )}

            {bookingStep === 'complete' && (
              <div className="step-complete text-center p-5">
                <div className="success-icon animate-bounce">✅</div>
                <h2 className="mt-4">Session Booked!</h2>
                <p>Your session with <strong>{selectedCoach.name}</strong> is confirmed.</p>
                <p className="small text-muted mt-2">You&apos;ll receive a confirmation shortly.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Coaches;
