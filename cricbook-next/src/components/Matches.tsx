'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Views.css';

interface User {
  id: string;
  name: string;
}

interface MatchPlayer {
  id: string;
  userId: string;
  role: string;
  user: User;
}

interface Match {
  id: string;
  title: string;
  stadiumName: string;
  location: string;
  stadiumStats?: string;
  weather?: string;
  imageUrl?: string;
  umpireList?: string;
  startTime: string;
  endTime: string;
  pricePerPlayer: number;
  maxCapacity: number;
  status: string;
  players: MatchPlayer[];
}

const Matches = () => {
  const { user } = useAppContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  
  // Checkout/Join state
  const [selectedRole, setSelectedRole] = useState('Batsman');
  const [isProcessing, setIsProcessing] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const fetchMatches = async () => {
    try {
      const MATCH_URL = process.env.NEXT_PUBLIC_MATCH_URL || '';
      const res = await fetch(`${MATCH_URL}/matches`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (e) {
      console.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleJoinMatch = async () => {
    if (!user) {
      alert("Please log in to join matches");
      return;
    }
    if (!selectedMatch) return;

    setIsProcessing(true);
    try {
      const MATCH_URL = process.env.NEXT_PUBLIC_MATCH_URL || '';
      const res = await fetch(`${MATCH_URL}/matches/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          matchId: selectedMatch.id,
          role: selectedRole
        })
      });

      if (res.ok) {
        setJoinSuccess(true);
        setTimeout(() => {
          setSelectedMatch(null);
          setJoinSuccess(false);
          setIsProcessing(false);
          fetchMatches(); // refresh
        }, 2000);
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error}`);
        setIsProcessing(false);
      }
    } catch (e) {
      alert("Network error.");
      setIsProcessing(false);
    }
  };

  const openMatchDetails = (match: Match) => {
    setSelectedMatch(match);
    setJoinSuccess(false);
    setIsProcessing(false);
  };

  if (loading) return <div className="p-5 text-center"><div className="payment-spinner mx-auto mb-3"></div><p>Loading matches...</p></div>;

  return (
    <div className="animate-fade-in" data-testid="view-matches">
      <div className="shop-header mb-4">
        <h2>Upcoming Matches</h2>
        <p className="text-muted">Join local leagues and friendly matches.</p>
      </div>

      <div className="match-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {matches.map(match => {
          const startDate = new Date(match.startTime);
          const playerCount = match.players?.length ?? 0;
          const capacity = match.maxCapacity ?? 26;
          const isFull = playerCount >= capacity;
          
          return (
            <div key={match.id} className="match-card glass p-0" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '140px' }}>
                <img src={match.imageUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600'} alt={match.stadiumName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' }}></div>
                <div style={{ position: 'absolute', bottom: '10px', left: '15px' }}>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{match.title}</h3>
                  <div style={{ color: '#ccc', fontSize: '0.8rem' }}><i className="fa-solid fa-location-dot"></i> {match.stadiumName}</div>
                </div>
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                  ₹{(match.pricePerPlayer ?? 0).toFixed(2)}
                </div>
              </div>
              
              <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                  <span><i className="fa-regular fa-calendar" style={{ color: '#60a5fa' }}></i> {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
                  <span><i className="fa-regular fa-clock" style={{ color: '#f59e0b' }}></i> {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}</span>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '10px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Players Enrolled</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isFull ? '#ef4444' : '#4ade80' }}>
                      {playerCount} / {capacity}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(playerCount / capacity) * 100}%`, height: '100%', background: isFull ? '#ef4444' : '#4ade80', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <button 
                    className={`btn w-100 ${isFull ? 'btn-outline' : 'btn-primary'}`} 
                    onClick={() => openMatchDetails(match)}
                  >
                    {isFull ? 'View Match (Full)' : 'Join Match'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {matches.length === 0 && <div className="text-muted">No upcoming matches available.</div>}
      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-scale-up" style={{ maxWidth: '800px', width: '95%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Modal Header Cover */}
            <div style={{ position: 'relative', height: '200px' }}>
              <img src={selectedMatch.imageUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=800'} alt="Stadium" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2))' }}></div>
              <button className="close-btn" style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedMatch(null)}>&times;</button>
              
              <div style={{ position: 'absolute', bottom: '20px', left: '25px', right: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <span className="badge badge-blue mb-2" style={{ background: 'rgba(59, 130, 246, 0.3)', border: '1px solid rgba(59, 130, 246, 0.5)' }}>{selectedMatch.status}</span>
                  <h2 style={{ margin: 0, color: 'white', fontSize: '2rem' }}>{selectedMatch.title}</h2>
                  <div style={{ color: '#d1d5db', fontSize: '1rem', marginTop: '5px' }}><i className="fa-solid fa-location-dot"></i> {selectedMatch.stadiumName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: '#ccc' }}>Entry Fee</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>₹{selectedMatch.pricePerPlayer.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Modal Body Scrollable Area */}
            <div style={{ overflowY: 'auto', padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="match-modal-body">
              
              {/* Left Column: Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="info-block" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: '#60a5fa', marginBottom: '10px', fontSize: '0.95rem', textTransform: 'uppercase' }}><i className="fa-solid fa-circle-info me-2"></i> Match Details</h4>
                  <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Date:</span> <span>{new Date(selectedMatch.startTime).toLocaleDateString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Time:</span> <span>{new Date(selectedMatch.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedMatch.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Address:</span> <span style={{ textAlign: 'right', maxWidth: '60%' }}>{selectedMatch.location}</span></div>
                    {selectedMatch.weather && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Weather:</span> <span><i className="fa-solid fa-cloud-sun me-1"></i> {selectedMatch.weather}</span></div>}
                    {selectedMatch.stadiumStats && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Pitch/Stats:</span> <span style={{ textAlign: 'right', maxWidth: '60%' }}>{selectedMatch.stadiumStats}</span></div>}
                  </div>
                </div>

                <div className="info-block" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: '#a855f7', marginBottom: '10px', fontSize: '0.95rem', textTransform: 'uppercase' }}><i className="fa-solid fa-gavel me-2"></i> Officials / Umpires</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ad-text)', lineHeight: '1.5' }}>
                    {selectedMatch.umpireList || "Officials will be assigned closer to the match date."}
                  </p>
                </div>
              </div>

              {/* Right Column: Roster & Checkout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="roster-block" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ color: '#f59e0b', margin: 0, fontSize: '0.95rem', textTransform: 'uppercase' }}><i className="fa-solid fa-users me-2"></i> Current Roster</h4>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{selectedMatch.players.length} / {selectedMatch.maxCapacity}</span>
                  </div>
                  
                  <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }} className="cart-items-scroll">
                    {selectedMatch.players.length === 0 ? (
                      <div className="text-center text-muted py-4"><p>No players have joined yet. Be the first!</p></div>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {selectedMatch.players.map((p, i) => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{i + 1}</div>
                              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{p.user.name}</span>
                            </div>
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>{p.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkout Block */}
                {!isProcessing && !joinSuccess && selectedMatch.players.length < selectedMatch.maxCapacity && (
                  <div className="checkout-block" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.15))', padding: '20px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#4ade80', textTransform: 'uppercase' }}>Select Your Role</label>
                    <select 
                      className="form-control mb-3" 
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', color: 'white' }}
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                    >
                      <option>Batsman</option>
                      <option>Bowler</option>
                      <option>All-Rounder</option>
                      <option>Wicket Keeper</option>
                    </select>
                    
                    <button 
                      className="btn w-100" 
                      style={{ background: '#22c55e', color: 'white', fontWeight: 'bold', padding: '1rem', borderRadius: '8px' }}
                      onClick={handleJoinMatch}
                    >
                      Confirm Payment & Book (₹{selectedMatch.pricePerPlayer.toFixed(2)})
                    </button>
                  </div>
                )}
                
                {selectedMatch.players.length >= selectedMatch.maxCapacity && !joinSuccess && (
                  <div className="text-center p-3" style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                    <i className="fa-solid fa-ban fa-2x mb-2"></i>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>Match is Full</p>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center p-4">
                    <div className="payment-spinner mx-auto mb-3"></div>
                    <p className="text-muted">Processing payment and reserving your spot...</p>
                  </div>
                )}

                {joinSuccess && (
                  <div className="text-center p-4">
                    <div className="success-icon animate-bounce mx-auto mb-3" style={{ fontSize: '3rem' }}>✅</div>
                    <h3 style={{ color: '#4ade80' }}>Spot Confirmed!</h3>
                    <p className="text-muted small">You are now added to the roster.</p>
                  </div>
                )}

              </div>
            </div>
            
            {/* Styles specific to this layout that might not be in Views.css yet */}
            <style dangerouslySetInnerHTML={{__html: `
              @media (max-width: 768px) {
                .match-modal-body {
                  grid-template-columns: 1fr !important;
                }
              }
            `}} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;
