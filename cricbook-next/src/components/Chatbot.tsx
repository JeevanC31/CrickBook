'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Chatbot.css';

interface ChatMessage {
  text: string;
  isBot: boolean;
  intent?: string;
  type?: 'MATCH' | 'TURF' | 'COACH';
  matches?: any[];
  turfs?: any[];
  coaches?: any[];
}

const Chatbot = () => {
  const { isChatbotOpen, toggleChatbot, user, updateUser } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: 'Hi! I can help you book turfs, coaches, or join matches. Try saying: "book a match", "show me turfs", or "find a coach".', isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Booking details state
  const [selectedRole, setSelectedRole] = useState('Batsman');
  const [bookingStatus, setBookingStatus] = useState<{ [key: string]: 'idle' | 'processing' | 'success' | 'failed' }>({});
  const [bookingError, setBookingError] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isChatbotOpen, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInput('');
    setIsTyping(true);
    
    try {
      const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL || 'http://localhost:4006';
      const res = await fetch(`${CHAT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, userId: user?.id })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        text: data.response || 'Sorry, I encountered an error.',
        isBot: true,
        intent: data.intent,
        type: data.type,
        matches: data.matches,
        turfs: data.turfs,
        coaches: data.coaches
      }]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { text: 'Sorry, I am having trouble connecting to my AI brain.', isBot: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Click handler for joining a match directly inside the chatbot card
  const handleJoinMatch = async (matchId: string) => {
    if (!user) {
      alert("Please log in to join matches");
      return;
    }

    setBookingStatus(prev => ({ ...prev, [matchId]: 'processing' }));
    setBookingError(prev => ({ ...prev, [matchId]: '' }));

    try {
      const MATCH_URL = process.env.NEXT_PUBLIC_MATCH_URL || 'http://localhost:4004';
      const res = await fetch(`${MATCH_URL}/matches/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          matchId,
          role: selectedRole
        })
      });

      const data = await res.json();

      if (res.ok) {
        setBookingStatus(prev => ({ ...prev, [matchId]: 'success' }));
        // Refresh the wallet balance
        const balanceRes = await fetch(`/api/users/${user.id}/wallet`);
        const balanceData = await balanceRes.json();
        if (balanceData.walletBalance !== undefined) {
          updateUser({ walletBalance: balanceData.walletBalance });
        }
      } else {
        setBookingStatus(prev => ({ ...prev, [matchId]: 'failed' }));
        setBookingError(prev => ({ ...prev, [matchId]: data.error || 'Failed to book slot' }));
      }
    } catch (e) {
      setBookingStatus(prev => ({ ...prev, [matchId]: 'failed' }));
      setBookingError(prev => ({ ...prev, [matchId]: 'Network error. Try again.' }));
    }
  };

  // Click handler for booking a turf directly inside the chatbot card
  const handleBookTurf = async (turfId: string) => {
    if (!user) {
      alert("Please log in to book turfs");
      return;
    }

    setBookingStatus(prev => ({ ...prev, [turfId]: 'processing' }));
    setBookingError(prev => ({ ...prev, [turfId]: '' }));

    try {
      const TURF_URL = process.env.NEXT_PUBLIC_TURF_URL || 'http://localhost:4002';
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(18, 0, 0, 0);
      const endTime = new Date(tomorrow); endTime.setHours(19, 0, 0, 0);

      const res = await fetch(`${TURF_URL}/turfs/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          turfId,
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
          guests: 1
        })
      });

      const data = await res.json();

      if (res.ok) {
        setBookingStatus(prev => ({ ...prev, [turfId]: 'success' }));
        // Refresh the wallet balance
        const balanceRes = await fetch(`/api/users/${user.id}/wallet`);
        const balanceData = await balanceRes.json();
        if (balanceData.walletBalance !== undefined) {
          updateUser({ walletBalance: balanceData.walletBalance });
        }
      } else {
        setBookingStatus(prev => ({ ...prev, [turfId]: 'failed' }));
        setBookingError(prev => ({ ...prev, [turfId]: data.error || 'Failed to book slot' }));
      }
    } catch (e) {
      setBookingStatus(prev => ({ ...prev, [turfId]: 'failed' }));
      setBookingError(prev => ({ ...prev, [turfId]: 'Network error. Try again.' }));
    }
  };

  // Click handler for booking a coach directly inside the chatbot card
  const handleBookCoach = async (coachId: string, coachName: string) => {
    if (!user) {
      alert("Please log in to book coaches");
      return;
    }

    setBookingStatus(prev => ({ ...prev, [coachId]: 'processing' }));
    setBookingError(prev => ({ ...prev, [coachId]: '' }));

    try {
      const COACH_URL = process.env.NEXT_PUBLIC_COACH_URL || 'http://localhost:4003';
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);

      const res = await fetch(`${COACH_URL}/coaches/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          coachId,
          coachName,
          sessionTime: tomorrow.toISOString()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setBookingStatus(prev => ({ ...prev, [coachId]: 'success' }));
        // Refresh the wallet balance
        const balanceRes = await fetch(`/api/users/${user.id}/wallet`);
        const balanceData = await balanceRes.json();
        if (balanceData.walletBalance !== undefined) {
          updateUser({ walletBalance: balanceData.walletBalance });
        }
      } else {
        setBookingStatus(prev => ({ ...prev, [coachId]: 'failed' }));
        setBookingError(prev => ({ ...prev, [coachId]: data.error || 'Failed to book slot' }));
      }
    } catch (e) {
      setBookingStatus(prev => ({ ...prev, [coachId]: 'failed' }));
      setBookingError(prev => ({ ...prev, [coachId]: 'Network error. Try again.' }));
    }
  };

  return (
    <>
      {isChatbotOpen && (
        <div className="chatbot-widget animate-fade-in" data-testid="chatbot-widget">
          <div className="chat-header">
            <span><i className="fa-solid fa-robot"></i> AI Booking Assistant</span>
            <button className="close-chat" onClick={toggleChatbot} data-testid="close-chatbot">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-container ${msg.isBot ? 'bot' : 'user'}`}>
                <div className={`message ${msg.isBot ? 'bot' : 'user'}`}>
                  {msg.text}
                </div>

                {/* Render interactive MATCH card list */}
                {msg.isBot && msg.intent === 'LIST' && msg.type === 'MATCH' && msg.matches && (
                  <div className="interactive-cards-container">
                    {msg.matches.map((match: any) => {
                      const status = bookingStatus[match.id] || 'idle';
                      const err = bookingError[match.id];
                      const enrolled = match.players?.length || 0;
                      const capacity = match.maxCapacity || 26;

                      return (
                        <div key={match.id} className="interactive-card">
                          <div className="card-top">
                            <span className="card-tag"><i className="fa-solid fa-trophy"></i> Match</span>
                            <span className="card-price">₹{Number(match.pricePerPlayer).toFixed(2)}</span>
                          </div>
                          <h4>{match.title}</h4>
                          <p className="card-meta"><i className="fa-solid fa-location-dot"></i> {match.stadiumName}</p>
                          <p className="card-meta"><i className="fa-regular fa-calendar-days"></i> {new Date(match.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          
                          <div className="card-roster-progress">
                            <div className="roster-meta">
                              <span>Players joined:</span>
                              <span className="roster-count">{enrolled} / {capacity}</span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${(enrolled / capacity) * 100}%` }}></div>
                            </div>
                          </div>

                          {status === 'idle' && enrolled < capacity && (
                            <div className="card-booking-actions">
                              <div className="role-selector-wrapper">
                                <label>Role:</label>
                                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                  <option>Batsman</option>
                                  <option>Bowler</option>
                                  <option>All-Rounder</option>
                                  <option>Wicket Keeper</option>
                                </select>
                              </div>
                              <button className="btn-action" onClick={() => handleJoinMatch(match.id)}>
                                <i className="fa-solid fa-ticket"></i> Join Match
                              </button>
                            </div>
                          )}

                          {enrolled >= capacity && status === 'idle' && (
                            <div className="status-badge full"><i className="fa-solid fa-circle-xmark"></i> Roster Full</div>
                          )}

                          {status === 'processing' && (
                            <div className="status-badge processing"><i className="fa-solid fa-spinner fa-spin"></i> Reserving spot...</div>
                          )}

                          {status === 'success' && (
                            <div className="status-badge success"><i className="fa-solid fa-circle-check"></i> Spot Confirmed!</div>
                          )}

                          {status === 'failed' && (
                            <div className="booking-error-block">
                              <p className="error-text">❌ {err}</p>
                              <button className="btn-retry" onClick={() => handleJoinMatch(match.id)}>Try Again</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Render interactive TURF card list */}
                {msg.isBot && msg.intent === 'LIST' && msg.type === 'TURF' && msg.turfs && (
                  <div className="interactive-cards-container">
                    {msg.turfs.map((turf: any) => {
                      const status = bookingStatus[turf.id] || 'idle';
                      const err = bookingError[turf.id];

                      return (
                        <div key={turf.id} className="interactive-card">
                          <div className="card-top">
                            <span className="card-tag turf"><i className="fa-solid fa-table-cells"></i> Turf</span>
                            <span className="card-price">₹{Number(turf.pricePerHour).toFixed(2)}/hr</span>
                          </div>
                          <h4>{turf.name}</h4>
                          <p className="card-meta"><i className="fa-solid fa-location-dot"></i> {turf.location}</p>
                          <p className="card-meta"><i className="fa-regular fa-clock"></i> 6:00 PM - 7:00 PM (Tomorrow)</p>

                          {status === 'idle' && (
                            <button className="btn-action turf" onClick={() => handleBookTurf(turf.id)}>
                              <i className="fa-regular fa-calendar-check"></i> Book Slots
                            </button>
                          )}

                          {status === 'processing' && (
                            <div className="status-badge processing"><i className="fa-solid fa-spinner fa-spin"></i> Securing slots...</div>
                          )}

                          {status === 'success' && (
                            <div className="status-badge success"><i className="fa-solid fa-circle-check"></i> Turf Booked!</div>
                          )}

                          {status === 'failed' && (
                            <div className="booking-error-block">
                              <p className="error-text">❌ {err}</p>
                              <button className="btn-retry" onClick={() => handleBookTurf(turf.id)}>Try Again</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Render interactive COACH card list */}
                {msg.isBot && msg.intent === 'LIST' && msg.type === 'COACH' && msg.coaches && (
                  <div className="interactive-cards-container">
                    {msg.coaches.map((coach: any) => {
                      const status = bookingStatus[coach.id] || 'idle';
                      const err = bookingError[coach.id];

                      return (
                        <div key={coach.id} className="interactive-card">
                          <div className="card-top">
                            <span className="card-tag coach"><i className="fa-solid fa-user-tie"></i> Coach</span>
                            <span className="card-price">₹{Number(coach.pricePerSession).toFixed(2)}</span>
                          </div>
                          <h4>{coach.name}</h4>
                          <p className="card-meta"><i className="fa-solid fa-star" style={{ color: '#f59e0b' }}></i> {coach.rating} ({coach.specialty})</p>
                          <p className="card-meta"><i className="fa-regular fa-calendar"></i> 10:00 AM (Tomorrow)</p>

                          {status === 'idle' && (
                            <button className="btn-action coach" onClick={() => handleBookCoach(coach.id, coach.name)}>
                              <i className="fa-regular fa-calendar-check"></i> Hire Coach
                            </button>
                          )}

                          {status === 'processing' && (
                            <div className="status-badge processing"><i className="fa-solid fa-spinner fa-spin"></i> Reserving coach...</div>
                          )}

                          {status === 'success' && (
                            <div className="status-badge success"><i className="fa-solid fa-circle-check"></i> Coach Booked!</div>
                          )}

                          {status === 'failed' && (
                            <div className="booking-error-block">
                              <p className="error-text">❌ {err}</p>
                              <button className="btn-retry" onClick={() => handleBookCoach(coach.id, coach.name)}>Try Again</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble-container bot">
                <div className="message bot typing">
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="chat-footer">
            <input 
              type="text" 
              placeholder="Type your prompt..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button className="btn-send" onClick={handleSend} disabled={isTyping}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      <button className={`chatbot-fab ${isChatbotOpen ? 'hidden' : ''}`} onClick={toggleChatbot} data-testid="chatbot-fab">
        <i className="fa-solid fa-robot"></i>
      </button>
    </>
  );
};

export default Chatbot;
