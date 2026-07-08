import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Switch, Route, useLocation } from 'react-router-dom';
import { APP_CONFIG } from './config';

// Components
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';

// Pages - Lazy loaded
const HomePage = lazy(() => import('./pages/Home'));
const CategoriesPage = lazy(() => import('./pages/Categories'));
const MoviesPage = lazy(() => import('./pages/Movies'));
const ShowsPage = lazy(() => import('./pages/Shows'));
const FavouritesPage = lazy(() => import('./pages/Favourites'));
const SearchPage = lazy(() => import('./pages/Search'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const PlayerPage = lazy(() => import('./pages/Player'));
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetail'));
const SeriesSeasonPage = lazy(() => import('./pages/SeriesSeason'));
const LoginPage = lazy(() => import('./pages/Login'));

const AppRouter: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('tv_auth_token')));
  const requireLogin = APP_CONFIG.auth.requireLoginForPlayback;
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/player');

  if (requireLogin && !loggedIn) {
    return <LoginPage onSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {!isPlayer && <Header />}
        <Suspense
          fallback={
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-tv-bg)',
              color: 'white'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h1>Loading…</h1>
                <div style={{ marginTop: '20px', fontSize: '24px' }}>
                  <span>●</span>
                  <span style={{ marginLeft: '10px' }}>●</span>
                  <span style={{ marginLeft: '10px' }}>●</span>
                </div>
              </div>
            </div>
          }
        >
          <div style={{ width: '100%', height: '100%' }}>
            <Switch>
              <Route exact path="/" component={HomePage} />
              <Route path="/categories" component={CategoriesPage} />
              <Route path="/movies" component={MoviesPage} />
              <Route path="/shows" component={ShowsPage} />
              <Route path="/favorites" component={FavouritesPage} />
              <Route path="/search" component={SearchPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/category/:categoryId" component={CategoryDetailPage} />
              <Route path="/detail/:id" component={SeriesSeasonPage} />
              <Route path="/player/:id" component={PlayerPage} />
            </Switch>
          </div>
        </Suspense>
      </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'var(--color-tv-bg)' }}>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </div>
  );
}

export default App;
