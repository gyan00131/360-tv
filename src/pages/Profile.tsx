import React, { useEffect } from 'react';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import Header from '../components/Header';
import '../css/profile.css';

const ProfileInner: React.FC = () => {
  const { isActive, activeIndex, activate, setRef } = useSectionFocus('profile-actions', {
    itemCount: 2,
    onEnter: (i) => {
      if (i === 1) {
        localStorage.removeItem('tv_auth_token');
        window.location.reload();
      }
    },
  });

  useEffect(() => { activate(0); }, []);

  return (
    <div className="profile-container tv-scroll-hide" style={{ height: '100vh', overflowY: 'auto' }}>
      <Header />
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
          { label: 'Downloads', value: '12 GB', color: '#4ade80' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="profile-actions">
        <button
          ref={(el) => setRef(el, 0)}
          onClick={() => activate(0)}
          className={`btn-secondary ${isActive && activeIndex === 0 ? 'focused tv-focus-outline' : ''}`}
        >
          Switch Profile
        </button>
        <button
          ref={(el) => setRef(el, 1)}
          onClick={() => { localStorage.removeItem('tv_auth_token'); window.location.reload(); }}
          className={`btn-danger ${isActive && activeIndex === 1 ? 'focused tv-focus-outline' : ''}`}
        >
          Logout Session
        </button>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => (
  <FocusProvider>
    <ProfileInner />
  </FocusProvider>
);

export default ProfilePage;
