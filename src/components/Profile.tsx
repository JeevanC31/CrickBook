'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Views.css';

const Profile = () => {
  const { user, updateUser } = useAppContext();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('All-Rounder');
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Initialise form from the user in context (including from localStorage)
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAge(user.age?.toString() || '');
      setPhone(user.phone || '');
      setSpecialization(user.specialization || 'All-Rounder');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaveMsg(null);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, age: age ? Number(age) : undefined, specialization }),
      });
      const data = await res.json();

      if (res.ok) {
        // Sync updated data back into context + localStorage
        updateUser(data.user);
        setSaveMsg({ text: 'Profile saved successfully!', ok: true });
      } else {
        setSaveMsg({ text: data.error || 'Failed to save.', ok: false });
      }
    } catch {
      setSaveMsg({ text: 'Network error. Changes saved locally.', ok: false });
      // Still update local context so page doesn't lose data
      updateUser({ name, phone, age: age ? Number(age) : undefined, specialization });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="animate-fade-in" data-testid="view-profile">
      <div className="profile-layout">
        <div className="profile-sidebar glass">
          <div className="profile-avatar-large">
            <div className="profile-avatar-initials">{initial}</div>
            <button className="btn-edit-avatar"><i className="fa-solid fa-camera"></i></button>
          </div>
          <h3>{name || 'Your Name'}</h3>
          <p>{specialization || 'Cricket Enthusiast'}</p>
        </div>

        <div className="profile-details glass">
          <h3>Personal Details</h3>

          {saveMsg && (
            <div className={`profile-save-msg ${saveMsg.ok ? 'save-ok' : 'save-err'}`}>
              <i className={`fa-solid ${saveMsg.ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
              {saveMsg.text}
            </div>
          )}

          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="input-group">
                <label>Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="Your age"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div className="input-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div className="input-group">
              <label>Cricket Specialization</label>
              <select
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
              >
                <option>Batsman</option>
                <option>Bowler</option>
                <option>All-Rounder</option>
                <option>Wicket Keeper</option>
              </select>
            </div>

            <h3>App Settings</h3>
            <div className="toggle-group">
              <label>Push Notifications</label>
              <input
                type="checkbox"
                checked={notifications}
                onChange={e => setNotifications(e.target.checked)}
                style={{ width: 'auto' }}
              />
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={saving}>
              {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
