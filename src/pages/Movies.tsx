import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import Header from '../components/Header';
import { Movie } from '../types/common-interface';
import { fetchMovies } from '../lib/api';
import { MOVIES } from '../constants';
import '../css/shows.css';

const COLS = 4;

const MoviesInner: React.FC = () => {
  const history = useHistory();
  const [movies, setMovies] = useState<Movie[]>(MOVIES.slice(0, 8));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies()
      .then((d) => { if (d.length) setMovies(d.slice(0, 8)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { isActive, activeIndex, activate, setRef } = useSectionFocus('movies-grid', {
    itemCount: movies.length,
    onEnter: (i) => history.push(`/detail/${movies[i].id}`),
  });

  useEffect(() => {
    if (!isActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeIndex % COLS > 0) activate(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeIndex % COLS < COLS - 1 && activeIndex + 1 < movies.length) activate(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex - COLS >= 0) activate(activeIndex - COLS);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeIndex + COLS < movies.length) activate(activeIndex + COLS);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        history.push(`/detail/${movies[activeIndex].id}`);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isActive, activeIndex, activate, movies, history]);

  useEffect(() => { activate(0); }, [movies]);

  return (
    <div className="shows-container tv-scroll-hide" style={{ height: '100vh', overflowY: 'auto' }}>
      <Header />
      <div className="shows-header">
        <h2 className="shows-title">Movies</h2>
      </div>
      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', padding: '24px 0' }}>Loading...</p>
      ) : (
        <div className="shows-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {movies.map((movie, i) => (
            <div
              key={movie.id}
              ref={(el) => setRef(el, i)}
              onClick={() => history.push(`/detail/${movie.id}`)}
              className={`show-card ${isActive && activeIndex === i ? 'focused tv-focus-outline' : ''}`}
            >
              <img src={movie.image} className="show-card-image" alt={movie.title} />
              <div className="show-card-overlay">
                <h4 className="show-card-title">{movie.title}</h4>
                <span className="show-card-meta">{movie.duration}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MoviesPage: React.FC = () => (
  <FocusProvider>
    <MoviesInner />
  </FocusProvider>
);

export default MoviesPage;
