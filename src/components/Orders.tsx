'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Views.css';
import './coaches-orders.css';

interface Booking {
  id: string;
  category: 'Turf' | 'Coach' | 'Sports Items';
  title: string;
  subtitle: string;
  startTime: string;
  endTime: string;
  guests: number | null;
  status: string;
  createdAt: string;
  // Extra fields for shop
  deliveryAddress?: string;
  discount?: number;
  couponCode?: string;
  fullItemsList?: string;
  totalAmount?: number;
}

const Orders = () => {
  const { user } = useAppContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}/orders`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch bookings');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [user]);

  if (loading) return (
    <div className="orders-loading">
      <div className="orders-spinner"></div>
      <p>Loading your bookings...</p>
    </div>
  );

  if (error) return (
    <div className="orders-error glass">
      <i className="fa-solid fa-circle-exclamation"></i>
      <h3>Couldn&apos;t load bookings</h3>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={fetchBookings}>Try Again</button>
    </div>
  );

  return (
    <div className="orders-page animate-fade-in" data-testid="view-orders">
      <div className="orders-header">
        <div>
          <h2>My Bookings & Orders</h2>
          <p className="text-muted">{bookings.length} item{bookings.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn-icon-only" onClick={fetchBookings} title="Refresh">
          <i className="fa-solid fa-rotate"></i>
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="orders-empty glass">
          <div className="orders-empty-icon">🏏</div>
          <h3>No Orders Yet</h3>
          <p>You haven&apos;t booked or bought anything yet. Go explore nearby turfs, coaches, or the shop!</p>
        </div>
      ) : (
        <div className="orders-grid">
          {bookings.map((booking, i) => {
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);
            const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'DELIVERED';
            const isCoach = booking.category === 'Coach';
            const isShop = booking.category === 'Sports Items';
            
            // Icon logic
            let iconClass = 'fa-cricket-bat-ball';
            if (isCoach) iconClass = 'fa-user-tie';
            if (isShop) iconClass = 'fa-box-open';

            // Background logic
            let iconBg = {};
            if (isCoach) iconBg = { background: 'linear-gradient(135deg, #a855f7, #6366f1)' };
            if (isShop) iconBg = { background: 'linear-gradient(135deg, #f59e0b, #ef4444)' };
            
            const isExpanded = expandedId === booking.id;

            return (
              <div 
                key={booking.id} 
                className={`order-card glass ${isShop ? 'clickable-card' : ''}`} 
                style={{ animationDelay: `${i * 0.08}s`, cursor: isShop ? 'pointer' : 'default' }}
                onClick={() => isShop && setExpandedId(isExpanded ? null : booking.id)}
              >
                {/* Card Header */}
                <div className="order-card-header">
                  <div className={`order-card-icon`} style={iconBg}>
                    <i className={`fa-solid ${iconClass}`}></i>
                  </div>
                  <div className="order-card-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.2rem' }}>
                      <span className={`category-tag`} style={{
                        fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>
                        {booking.category}
                      </span>
                      <h4 style={{ margin: 0 }}>{booking.title}</h4>
                    </div>
                    <span className="order-location">
                      <i className={`fa-solid ${isCoach ? 'fa-star' : isShop ? 'fa-money-bill' : 'fa-location-dot'}`}></i>
                      {booking.subtitle}
                    </span>
                  </div>
                  <span className={`order-status-badge ${isConfirmed ? 'status-confirmed' : 'status-pending'}`}>
                    <i className={`fa-solid ${isConfirmed ? 'fa-circle-check' : 'fa-clock'}`}></i>
                    {booking.status}
                  </span>
                </div>

                {/* Divider */}
                <div className="order-card-divider"></div>

                {/* Card Details */}
                <div className="order-card-details">
                  <div className="order-detail">
                    <i className="fa-regular fa-calendar"></i>
                    <div>
                      <span className="detail-label">Date</span>
                      <span className="detail-value">{start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  {!isShop ? (
                    <>
                      <div className="order-detail">
                        <i className="fa-regular fa-clock"></i>
                        <div>
                          <span className="detail-label">Time Slot</span>
                          <span className="detail-value">
                            {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            {' → '}
                            {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </div>
                      <div className="order-detail">
                        <i className="fa-solid fa-users"></i>
                        <div>
                          <span className="detail-label">Players</span>
                          <span className="detail-value">{booking.guests || 1} Person{booking.guests !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="order-detail">
                        <i className="fa-solid fa-box"></i>
                        <div>
                          <span className="detail-label">Items</span>
                          <span className="detail-value" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px', display: 'inline-block' }}>
                            {booking.fullItemsList}
                          </span>
                        </div>
                      </div>
                      <div className="order-detail">
                        <i className="fa-solid fa-truck"></i>
                        <div>
                          <span className="detail-label">Delivery</span>
                          <span className="detail-value">{booking.status}</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="order-detail">
                    <i className="fa-solid fa-hashtag"></i>
                    <div>
                      <span className="detail-label">Order ID</span>
                      <span className="detail-value detail-id">{booking.id.split('-')[0].toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Expandable Shop Details */}
                {isShop && isExpanded && (
                  <div className="shop-order-details mt-4 animate-fade-in" style={{ 
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderBottom: '1px dashed rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 style={{ margin: 0, fontSize: '0.95rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px' }}><i className="fa-solid fa-receipt me-2"></i> Order Receipt</h5>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>{booking.id.split('-')[0].toUpperCase()}</span>
                    </div>
                    
                    <div style={{ padding: '20px', display: 'grid', gap: '15px', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ad-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Items Purchased</span>
                        <span style={{ lineHeight: '1.4', color: 'var(--ad-text)' }}>{booking.fullItemsList}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ad-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Delivery Address</span>
                        <div style={{ lineHeight: '1.4', color: 'var(--ad-text)', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {(() => {
                            try {
                              const addr = JSON.parse(booking.deliveryAddress || '{}');
                              return (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <i className="fa-solid fa-location-dot mt-1" style={{ color: '#f87171' }}></i>
                                  <div>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{addr.street}</div>
                                    {addr.landmark && <div style={{ fontSize: '0.85rem', color: 'var(--ad-muted)' }}>Landmark: {addr.landmark}</div>}
                                    <div style={{ fontSize: '0.85rem', color: 'var(--ad-muted)' }}>PIN: {addr.pincode}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--ad-muted)', marginTop: '4px' }}><i className="fa-solid fa-phone me-1"></i> {addr.phone}</div>
                                  </div>
                                </div>
                              );
                            } catch (e) {
                              return (
                                <>
                                  <i className="fa-solid fa-location-dot" style={{ color: '#f87171', marginRight: '8px' }}></i>
                                  {booking.deliveryAddress}
                                </>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      
                      {booking.discount && booking.discount > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(34, 197, 94, 0.1)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <span style={{ color: '#4ade80', fontWeight: '500' }}><i className="fa-solid fa-tag me-2"></i>Discount Applied</span>
                          <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{booking.discount}% OFF (Code: {booking.couponCode})</span>
                        </div>
                      ) : null}
                      
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '5px 0' }}></div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--ad-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid</span>
                        <span style={{ color: 'white', fontSize: '1.8rem', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>${booking.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {isShop && !isExpanded && (
                  <div className="text-center mt-3 text-muted" style={{ fontSize: '0.75rem' }}>
                    <i className="fa-solid fa-chevron-down"></i> Click to view details
                  </div>
                )}
                {isShop && isExpanded && (
                  <div className="text-center mt-3 text-muted" style={{ fontSize: '0.75rem' }}>
                    <i className="fa-solid fa-chevron-up"></i> Click to collapse
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
