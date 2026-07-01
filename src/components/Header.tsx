import React from 'react';
import { Search, Play } from 'lucide-react';
import { useFocusable } from '../lib/focus/FocusContext';

const TopNavItem: React.FC<{ id: string; label: string; icon?: React.ReactNode; isActive: boolean; onSelect: () => void }> = ({ id, label, icon, isActive, onSelect }) => {
  const { ref, isFocused } = useFocusable(`nav-${id}`);
  
  return (
    <div
      ref={ref as any}
      onClick={onSelect}
      className={`nav-item ${isActive ? 'active' : ''} ${isFocused ? 'tv-focus-outline' : ''}`}
    >
      {icon && <span>{icon}</span>}
      {label && <span style={{ fontSize: '18px', fontWeight: 500, whiteSpace: 'nowrap', uppercase: 'true', letterSpacing: '0.05em' }}>{label}</span>}
    </div>
  );
};

const Header: React.FC<{ activeTab: string; onTabChange: (id: string) => void }> = ({ activeTab, onTabChange }) => {
  const { ref: profileRef, isFocused: profileFocused } = useFocusable('nav-profile');

  return (
    <header className="nav-header">
      {/* Left: Avatar */}
      <div 
        ref={profileRef as any}
        onClick={() => onTabChange('profile')}
        className={`nav-avatar ${profileFocused ? 'tv-focus-outline' : ''}`}
        style={{ opacity: activeTab === 'profile' || profileFocused ? 1 : 0.6 }}
      >
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&q=80" alt="Profile" />
      </div>

      {/* Center: Tabs */}
      <nav className="nav-tabs">
        <TopNavItem id="home" label="Home" isActive={activeTab === 'home'} onSelect={() => onTabChange('home')} />
        <TopNavItem id="categories" label="Categories" isActive={activeTab === 'categories'} onSelect={() => onTabChange('categories')} />
        <TopNavItem id="movies" label="Movies" isActive={activeTab === 'movies'} onSelect={() => onTabChange('movies')} />
        <TopNavItem id="shows" label="Shows" isActive={activeTab === 'shows'} onSelect={() => onTabChange('shows')} />
        <TopNavItem id="favorites" label="Favorites" isActive={activeTab === 'favorites'} onSelect={() => onTabChange('favorites')} />
        <TopNavItem id="search" label="" icon={<Search size={24} />} isActive={activeTab === 'search'} onSelect={() => onTabChange('search')} />
      </nav>

      {/* Right: Brand */}
      <div className="nav-brand">
        <div className="brand-icon">
          <Play size={16} fill="white" style={{ marginLeft: '2px' }} />
        </div>
        <span className="brand-text">360 TV</span>
      </div>
    </header>
  );
};

export default Header;
