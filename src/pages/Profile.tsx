import React from 'react';
import { useFocusable } from '../lib/focus/FocusContext';
import '../css/profile.css';

const ProfilePage: React.FC = () => {
  const { ref: logoutRef, isFocused: logoutFocused } = useFocusable('profile-logout');
  const { ref: switchRef, isFocused: switchFocused } = useFocusable('profile-switch');

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-large">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&q=80" alt="Profile" />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h1 className="profile-name">Sarah Jenkins</h1>
          <div className="profile-badges">
             <span className="badge-blue">Premium Member</span>
             <span className="badge-dim">Since 2022</span>
          </div>
        </div>
      </div>

      <div className="profile-stats">
        {[
          { label: 'Watch Time', value: '1,240 hrs', color: '#60a5fa' },
          { label: 'Favorites', value: '42 titles', color: '#f87171' },
          { label: 'Downloads', value: '12 GB', color: '#4ade80' }
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="profile-actions">
        <button 
          ref={switchRef as any}
          className={`btn-secondary ${switchFocused ? 'focused tv-focus-outline' : ''}`}
        >
          Switch Profile
        </button>
        <button 
          ref={logoutRef as any}
          className={`btn-danger ${logoutFocused ? 'focused tv-focus-outline' : ''}`}
        >
          Logout Session
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
