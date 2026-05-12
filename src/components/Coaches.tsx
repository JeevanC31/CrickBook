'use client';

import React, { useState } from 'react';
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

const coachesData: Coach[] = [
  {
    id: 'coach-1',
    name: 'David Warner',
    specialty: 'Batting Coach',
    pricePerSession: 50,
    rating: 4.9,
    imageUrl: 'https://i.pravatar.cc/300?img=33',
  },
  {
    id: 'coach-2',
    name: 'Brett Lee',
    specialty: 'Pace Bowling Coach',
    pricePerSession: 60,
    rating: 4.8,
    imageUrl: 'https://i.pravatar.cc/300?img=12',
  },
  {
    id: 'coach-3',
    name: 'Shane Warne',
    specialty: 'Spin Bowling Coach',
    pricePerSession: 55,
    rating: 4.7,
    imageUrl: 'https://i.pravatar.cc/300?img=57',
  },
  {
    id: 'coach-4',
    name: 'Ricky Ponting',
    specialty: 'Fielding Coach',
    pricePerSession: 45,
    rating: 4.6,
    imageUrl: 'https://i.pravatar.cc/300?img=52',
  },
];

const coachStats: Record<string, { achievements: string[]; students: number; experience: string; sessions: number; bio: string; locations: string[] }> = {
  'coach-1': {
    bio: 'Former Australian opening batsman with over 8000 Test runs. David brings elite-level batting technique and mental strength coaching to every session.',
    achievements: ['ICC Player of the Year 2016', '3× IPL Champion', '100+ International centuries', 'Test Cricket Legend'],
    students: 124,
    experience: '12 Years',
    sessions: 980,
    locations: ['Chennai Cricket Ground', 'MRC Academy', 'DY Patil Stadium', 'Online (Zoom)'],
  },
  'coach-2': {
    bio: 'Australia\'s fastest pace bowler. Brett Lee specializes in building raw pace, seam movement, and yorker mastery for fast bowlers of all levels.',
    achievements: ['300+ Test Wickets', 'ICC World Cup Winner 2003', 'Fastest Bowler Award 2003', 'Big Bash Legend'],
    students: 85,
    experience: '10 Years',
    sessions: 720,
    locations: ['Wankhede Stadium', 'MCA Academy', 'Fmouse Cricket Club', 'Online (Zoom)'],
  },
  'coach-3': {
    bio: 'The greatest leg-spinner of all time. Shane\'s sessions focus on wrist position, flight variations, and reading the batsman\'s footwork.',
    achievements: ['700+ Test Wickets', 'Wisden Cricketer of the Century', 'ICC Hall of Fame', '5× Ashes Winner'],
    students: 67,
    experience: '8 Years',
    sessions: 540,
    locations: ['Chinnaswamy Stadium', 'KSCA Academy', 'National Cricket Club'],
  },
  'coach-4': {
    bio: 'One of cricket\'s greatest captains and fielders. Ricky teaches elite fielding, diving techniques, and leadership on the field.',
    achievements: ['ICC World Cup Winner 2003, 2007', 'ICC Test No.1 Captain', '13000+ International Runs', 'Ponting Foundation Coach'],
    students: 92,
    experience: '9 Years',
    sessions: 810,
    locations: ['Eden Gardens', 'Kolkata Cricket Academy', 'Salt Lake Stadium'],
  },
};

const timeSlots = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return { value: `${hour.toString().padStart(2, '0')}:00`, label: `${displayHour}:00 ${ampm}` };
});

const Coaches = () => {
  const { user } = useAppContext();
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'complete'>('details');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const handleBookSession = (coach: Coach) => {
    setSelectedCoach(coach);
    setBookingStep('details');
    setDate('');
    setTime('');
    setLocation('');
  };

  const handleConfirmBooking = async () => {
    if (!date || !time || !location || !user || !selectedCoach) return;
    setBookingStep('payment');
    
    try {
      const start = new Date(`${date}T${time}:00`);
      
      const res = await fetch('/api/coaches/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          coachId: selectedCoach.id,
          coachName: selectedCoach.name,
          sessionTime: start.toISOString(),
        }),
      });

      if (res.ok) {
        setBookingStep('complete');
        setTimeout(() => {
          setSelectedCoach(null);
        }, 1800);
      } else {
        setBookingStep('details');
        alert('Booking failed. Please try again.');
      }
    } catch (e) {
      setBookingStep('details');
      alert('Network error during booking.');
    }
  };

  const stats = selectedCoach ? coachStats[selectedCoach.id] : null;

  return (
    <div className="animate-fade-in" data-testid="view-coaches">
      <div className="section-header mb-4">
        <h2>Cricket Coaches</h2>
        <p className="text-muted">Book a session with elite certified coaches</p>
      </div>

      <div className="coaches-grid">
        {coachesData.map(coach => (
          <div key={coach.id} className="coach-card glass">
            <div className="coach-card-img-wrap">
              <img src={coach.imageUrl} alt={coach.name} className="coach-avatar" />
              <span className="coach-rating-badge">
                <i className="fa-solid fa-star"></i> {coach.rating}
              </span>
            </div>
            <div className="coach-card-body">
              <h3>{coach.name}</h3>
              <p className="coach-specialty">{coach.specialty}</p>
              <div className="coach-mini-stats">
                <span><i className="fa-solid fa-users"></i> {coachStats[coach.id].students}+ Students</span>
                <span><i className="fa-solid fa-clock"></i> {coachStats[coach.id].experience}</span>
              </div>
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

            {bookingStep === 'details' && stats && (
              <div className="flipkart-layout">
                {/* Left: Photo + Stats */}
                <div className="fk-left">
                  <img src={selectedCoach.imageUrl} alt={selectedCoach.name} className="fk-main-img" />
                  
                  {/* Stats Panel */}
                  <div className="coach-stats-panel glass mt-3">
                    <h4 className="stats-panel-title">Career Stats</h4>
                    <div className="stats-panel-grid">
                      <div className="stat-box">
                        <span className="stat-val">{stats.students}+</span>
                        <span className="stat-lbl">Students</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-val">{stats.sessions}+</span>
                        <span className="stat-lbl">Sessions</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-val">{stats.experience}</span>
                        <span className="stat-lbl">Experience</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-val">{selectedCoach.rating}</span>
                        <span className="stat-lbl">Rating</span>
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="coach-achievements glass mt-3">
                    <h4 className="stats-panel-title">🏆 Achievements</h4>
                    <ul className="achievement-list">
                      {stats.achievements.map((a, i) => (
                        <li key={i}><i className="fa-solid fa-medal"></i> {a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: Details + Booking Form */}
                <div className="fk-right">
                  <nav className="fk-breadcrumb">Home / Coaches / {selectedCoach.name}</nav>
                  <h2 className="fk-title">{selectedCoach.name}</h2>

                  <div className="fk-rating-row">
                    <span className="badge badge-green">{selectedCoach.rating} <i className="fa-solid fa-star"></i></span>
                    <span className="text-muted small">{stats.students} Students • {stats.sessions} Sessions</span>
                  </div>

                  <div className="fk-price-row mt-3">
                    <span className="price-tag">₹{selectedCoach.pricePerSession}</span>
                    <span className="text-muted small">per session</span>
                  </div>

                  <p className="coach-bio mt-3">{stats.bio}</p>

                  {/* Booking Form */}
                  <div className="fk-form mt-4">
                    <h3>Book a Session</h3>
                    <div className="form-grid mt-3">
                      <div className="form-group">
                        <label>Select Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="form-group">
                        <label>Select Time Slot</label>
                        <select className="form-control" value={time} onChange={e => setTime(e.target.value)}>
                          <option value="">Choose Time</option>
                          {timeSlots.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <span className="small text-muted">6 AM – 11 PM</span>
                      </div>
                      <div className="form-group">
                        <label>Session Location</label>
                        <select className="form-control" value={location} onChange={e => setLocation(e.target.value)}>
                          <option value="">Choose Location</option>
                          {stats.locations.map((loc, i) => (
                            <option key={i} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="fk-actions mt-5">
                    <button
                      className="btn btn-warning fk-btn"
                      disabled={!date || !time || !location}
                      onClick={handleConfirmBooking}
                    >
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
                <p>Your session with <strong>{selectedCoach.name}</strong> at <strong>{location}</strong> is confirmed.</p>
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
