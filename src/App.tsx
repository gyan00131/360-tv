import React, { useState, useEffect } from 'react';
import { FocusProvider } from './lib/focus/FocusContext';
import { motion, AnimatePresence } from 'motion/react';

// Shared
import { MOVIES } from './constants';
import { ViewState } from './types/common-interface';

// Components
import Header from './components/Header';
import Modal from './components/Modal';
import SplashScreen from './components/SplashScreen';

// Pages
import HomePage from './pages/Home';
import CategoriesPage from './pages/Categories';
import MoviesPage from './pages/Movies';
import ShowsPage from './pages/Shows';
import FavouritesPage from './pages/Favourites';
import SearchPage from './pages/Search';
import ProfilePage from './pages/Profile';
import PlayerPage from './pages/Player';
import CategoryDetailPage from './pages/CategoryDetail';
import SeriesSeasonPage from './pages/SeriesSeason';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [navStack, setNavStack] = useState<ViewState[]>([{ view: 'dashboard' }]);
  const [activeTab, setActiveTab] = useState('home');
  const [showExitModal, setShowExitModal] = useState(false);

  const current = navStack[navStack.length - 1];

  const pushView = (view: ViewState['view'], params?: any) => {
    setNavStack(prev => [...prev, { view, params }]);
  };

  const popView = () => {
    if (navStack.length > 1) {
      setNavStack(prev => prev.slice(0, -1));
      return true;
    }
    return false;
  };

  const handleSelectMovie = (movie: any) => {
    pushView('details', { movie });
  };

  const handlePlayMovie = (movie: any) => {
    pushView('player', { movie });
  };

  const handleCategorySelect = (category: string) => {
    pushView('category-detail', { category });
  };

  useEffect(() => {
    const handleBack = (e: KeyboardEvent) => {
       if (e.key === 'Backspace' || e.key === 'Escape') {
          if (showExitModal) {
            setShowExitModal(false);
            return;
          }
          const popped = popView();
          if (!popped && current.view === 'dashboard') {
            setShowExitModal(true);
          }
       }
    };
    window.addEventListener('keydown', handleBack);
    return () => window.removeEventListener('keydown', handleBack);
  }, [navStack, current, showExitModal]);

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--color-tv-bg)', color: 'white', fontFamily: 'var(--font-sans)' }}>
      <AnimatePresence mode="wait">
        {current.view === 'dashboard' && (
          <motion.div
             key="dashboard"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <FocusProvider>
              <Header activeTab={activeTab} onTabChange={setActiveTab} />
              
              {activeTab === 'home' && <HomePage onSelect={handleSelectMovie} onPlay={() => handlePlayMovie(MOVIES[0])} />}
              {activeTab === 'categories' && <CategoriesPage onCategorySelect={handleCategorySelect} />}
              {activeTab === 'movies' && <MoviesPage onSelect={handleSelectMovie} />}
              {activeTab === 'shows' && <ShowsPage onSelect={handleSelectMovie} />}
              {activeTab === 'favorites' && <FavouritesPage onSelect={handleSelectMovie} />}
              {activeTab === 'search' && <SearchPage />}
              {activeTab === 'profile' && <ProfilePage />}
            </FocusProvider>
          </motion.div>
        )}

        {current.view === 'category-detail' && (
          <motion.div
             key="category-detail"
             initial={{ opacity: 0, scale: 1.1 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             style={{ width: '100%', height: '100%' }}
          >
            <FocusProvider>
              <CategoryDetailPage 
                 category={current.params.category}
                 onBack={popView}
                 onSelectMovie={handleSelectMovie}
              />
            </FocusProvider>
          </motion.div>
        )}

        {current.view === 'details' && (
          <motion.div
             key="details"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             style={{ width: '100%', height: '100%' }}
          >
            <FocusProvider>
              <SeriesSeasonPage 
                 movie={current.params.movie} 
                 onBack={popView} 
                 onPlay={() => pushView('player', { movie: current.params.movie })} 
              />
            </FocusProvider>
          </motion.div>
        )}

        {current.view === 'player' && (
          <motion.div
             key="player"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             style={{ width: '100%', height: '100%' }}
          >
            <FocusProvider>
              <PlayerPage 
                 onBack={popView} 
              />
            </FocusProvider>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitModal && (
          <FocusProvider>
            <Modal 
              title="Terminate Session?"
              description="Are you sure you want to exit the 360 TV application? Your active progress will be suspended."
              confirmLabel="Exit Now"
              cancelLabel="Stay Here"
              onConfirm={() => {
                setShowExitModal(false);
              }}
              onCancel={() => setShowExitModal(false)}
            />
          </FocusProvider>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
