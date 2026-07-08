import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Search, Play } from 'lucide-react';
import { useFocusable } from '../lib/focus/FocusContext';
import '../css/Header.css';

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

const Header: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { ref: profileRef, isFocused: profileFocused } = useFocusable('nav-profile');

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('#/')) return 'home';
    if (path.includes('categories')) return 'categories';
    if (path.includes('movies')) return 'movies';
    if (path.includes('shows')) return 'shows';
    if (path.includes('favorites')) return 'favorites';
    if (path.includes('search')) return 'search';
    if (path.includes('profile')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  const handleNavigation = (tab: string) => {
    switch (tab) {
      case 'home':
        history.push('/');
        break;
      case 'categories':
        history.push('/categories');
        break;
      case 'movies':
        history.push('/movies');
        break;
      case 'shows':
        history.push('/shows');
        break;
      case 'favorites':
        history.push('/favorites');
        break;
      case 'search':
        history.push('/search');
        break;
      case 'profile':
        history.push('/profile');
        break;
    }
  };

  return (
    <header className="nav-header">
      {/* Left: Avatar */}
      <div 
        ref={profileRef as any}
        onClick={() => handleNavigation('profile')}
        className={`nav-avatar ${profileFocused ? 'tv-focus-outline' : ''}`}
        style={{ opacity: activeTab === 'profile' || profileFocused ? 1 : 0.6 }}
      >
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&q=80" alt="Profile" />
      </div>

      {/* Center: Tabs */}
      <nav className="nav-tabs">
        <TopNavItem id="home" label="Home" isActive={activeTab === 'home'} onSelect={() => handleNavigation('home')} />
        <TopNavItem id="categories" label="Categories" isActive={activeTab === 'categories'} onSelect={() => handleNavigation('categories')} />
        <TopNavItem id="movies" label="Movies" isActive={activeTab === 'movies'} onSelect={() => handleNavigation('movies')} />
        <TopNavItem id="shows" label="Shows" isActive={activeTab === 'shows'} onSelect={() => handleNavigation('shows')} />
        <TopNavItem id="favorites" label="Favorites" isActive={activeTab === 'favorites'} onSelect={() => handleNavigation('favorites')} />
        <TopNavItem id="search" label="" icon={<Search size={24} />} isActive={activeTab === 'search'} onSelect={() => handleNavigation('search')} />
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
