'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Dashboard.css';

const Dashboard = () => {
  const { setActiveTab, toggleChatbot, user, updateUser } = useAppContext();
  const [walletLoading, setWalletLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletAction, setWalletAction] = useState<'add'|'withdraw'>('add');
  const [activities, setActivities] = useState<any[]>([]);

  const firstName = user?.name?.split(' ')[0] || 'Player';

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/users/${user.id}/wallet`)
        .then(res => res.json())
        .then(data => {
          if (data.walletBalance !== undefined && data.walletBalance !== user.walletBalance) {
            updateUser({ walletBalance: data.walletBalance });
          }
        })
        .catch(console.error);

      fetch(`/api/users/${user.id}/orders`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const sorted = data
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
            setActivities(sorted);
          }
        })
        .catch(console.error);
    }
  }, [user?.id]);

  const handleWalletSubmit = async () => {
    const amount = parseFloat(walletAmount);
    if (!amount || amount <= 0 || !user) return;
    
    setWalletLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: walletAction, amount })
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({ walletBalance: data.walletBalance });
        setShowWalletModal(false);
        setWalletAmount('');
      } else {
        alert(data.error || 'Transaction failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setWalletLoading(false);
    }
  };

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
        <div className="stat-card glass" style={{ cursor: 'pointer', transition: 'var(--transition)' }} onClick={() => setShowWalletModal(true)} title="Manage Wallet">
          <div className="stat-icon"><i className="fa-solid fa-wallet"></i></div>
          <div className="stat-details">
            <h3>Wallet Balance</h3>
            <p>₹{(user?.walletBalance ?? 0).toFixed(2)}</p>
          </div>
          <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--primary)', opacity: 0.5 }}><i className="fa-solid fa-plus-circle"></i></div>
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
            {activities.length === 0 ? (
              <li style={{ border: 'none', padding: '1rem 0', color: 'var(--text-muted)' }}>
                No recent activity found. Make some bookings or orders!
              </li>
            ) : (
              activities.map((act) => {
                let iconClass = 'fa-check';
                let bgStyle = { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)' };
                let actionTitle = act.category;

                if (act.category === 'Coach') {
                  iconClass = 'fa-user-tie';
                  bgStyle = { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' };
                  actionTitle = 'Booked Coach';
                } else if (act.category === 'Sports Items') {
                  iconClass = 'fa-cart-shopping';
                  bgStyle = { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--secondary)' };
                  actionTitle = 'Purchased';
                } else if (act.category === 'Match') {
                  iconClass = 'fa-trophy';
                  bgStyle = { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' };
                  actionTitle = 'Joined Match';
                } else if (act.category === 'Turf') {
                  iconClass = 'fa-calendar-check';
                  bgStyle = { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--primary)' };
                  actionTitle = 'Booked Turf';
                }

                const date = new Date(act.createdAt);
                const timeString = date.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });

                return (
                  <li key={act.id}>
                    <div className="activity-icon" style={bgStyle}><i className={`fa-solid ${iconClass}`}></i></div>
                    <div className="activity-text">
                      <strong>{actionTitle}:</strong> {act.title}
                      <span>{timeString} ({act.status})</span>
                    </div>
                  </li>
                );
              })
            )}
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

      {showWalletModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowWalletModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              Manage Wallet 
              <button onClick={() => setShowWalletModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}><i className="fa-solid fa-times"></i></button>
            </h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button className={`btn ${walletAction === 'add' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setWalletAction('add')}>Add Funds</button>
              <button className={`btn ${walletAction === 'withdraw' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setWalletAction('withdraw')}>Withdraw</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Amount (₹)</label>
              <input type="number" value={walletAmount} onChange={e => setWalletAmount(e.target.value)} placeholder="0.00" autoFocus />
            </div>

            <button className="btn btn-primary w-100" onClick={handleWalletSubmit} disabled={walletLoading || !walletAmount}>
              {walletLoading ? 'Processing...' : (walletAction === 'add' ? 'Add Money' : 'Withdraw Money')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
