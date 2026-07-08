import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Search, Play } from 'lucide-react';
import '../css/header.css';

const NAV_TABS = ['home', 'categories', 'movies', 'shows', 'favorites', 'search'];

const Header: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [isFocused, setIsFocused] = useState(true); // start focused
  const [focusedIndex, setFocusedIndex] = useState(0);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return 'home';
    if (path.includes('categories')) return 'categories';
    if (path.includes('movies')) return 'movies';
    if (path.includes('shows')) return 'shows';
    if (path.includes('favorites')) return 'favorites';
    if (path.includes('search')) return 'search';
    if (path.includes('profile')) return 'profile';
    return 'home';
  };

  const activeTab = getActiveTab();

  // Sync focused index to active tab on route change
  useEffect(() => {
    const idx = NAV_TABS.indexOf(activeTab);
    setFocusedIndex(idx >= 0 ? idx : 0);
    setIsFocused(true);
  }, [location.pathname]);

  // Listen for page content requesting header focus (banner Up)
  useEffect(() => {
    const onHeaderFocus = () => {
      const idx = NAV_TABS.indexOf(activeTab);
      setFocusedIndex(idx >= 0 ? idx : 0);
      setIsFocused(true);
    };
    window.addEventListener('header-focus', onHeaderFocus);
    return () => window.removeEventListener('header-focus', onHeaderFocus);
  }, [activeTab]);

  // Keyboard handler when header is focused
  useEffect(() => {
    if (!isFocused) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex(i => Math.min(NAV_TABS.length - 1, i + 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFocused(false);
        window.dispatchEvent(new CustomEvent('content-focus')); // tell page content to take focus
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNavigation(NAV_TABS[focusedIndex]);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isFocused, focusedIndex]);

  const handleNavigation = (tab: string) => {
    const routes: Record<string, string> = {
      home: '/', categories: '/categories', movies: '/movies',
      shows: '/shows', favorites: '/favorites', search: '/search', profile: '/profile',
    };
    if (routes[tab]) history.push(routes[tab]);
  };

  return (
    <header className="nav-header">
      <div onClick={() => handleNavigation('profile')} className="nav-avatar">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&q=80" alt="Profile" />
      </div>

      <nav className="nav-tabs">
        {['Home', 'Categories', 'Movies', 'Shows', 'Favorites', ''].map((label, i) => (
          <div
            key={i}
            onClick={() => handleNavigation(NAV_TABS[i])}
            className={`nav-item
              ${activeTab === NAV_TABS[i] ? 'active' : ''}
              ${isFocused && focusedIndex === i ? 'nav-focused' : ''}
            `}
          >
            {i === 5 ? <Search size={22} /> : <span style={{ fontSize: '16px', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>{label}</span>}
          </div>
        ))}
      </nav>

      <div className="nav-brand">
        <div className="brand-icon">
          <Play size={16} fill="white" style={{ marginLeft: '2px' }} />
        </div>
        <span className="brand-text">JET STREAM</span>
      </div>
    </header>
  );
};

export default Header;
