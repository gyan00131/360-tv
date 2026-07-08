import React, { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import { MOVIES } from '../constants';
import { Movie } from '../types/common-interface';
import '../css/categories.css';

const COLS = 3;
const ITEMS = [...MOVIES, ...MOVIES];

const CategoryDetailInner: React.FC = () => {
  const history = useHistory();
  const { categoryId } = useParams<{ categoryId: string }>();

  const { isActive: backActive, activate: activateBack, setRef: setBackRef } = useSectionFocus('cat-back', {
    itemCount: 1,
    onEnter: () => history.goBack(),
    onDown: () => activateGrid(0),
  });

  const { isActive: gridActive, activeIndex, activate: activateGrid, setRef: setGridRef } = useSectionFocus('cat-grid', {
    itemCount: ITEMS.length,
    onEnter: (i) => history.push(`/detail/${ITEMS[i].id}`),
    onUp: () => {
      if (activeIndex < COLS) activateBack(0);
    },
  });

  // Grid: override left/right/up/down for column-aware nav
  useEffect(() => {
    if (!gridActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeIndex % COLS > 0) activateGrid(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeIndex % COLS < COLS - 1 && activeIndex + 1 < ITEMS.length) activateGrid(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex - COLS >= 0) activateGrid(activeIndex - COLS);
        else activateBack(0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeIndex + COLS < ITEMS.length) activateGrid(activeIndex + COLS);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        history.push(`/detail/${ITEMS[activeIndex].id}`);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [gridActive, activeIndex, activateGrid, activateBack, history]);

  useEffect(() => { activateBack(0); }, []);

  return (
    <div className="cat-detail-container">
      <header className="cat-detail-header">
        <button
          ref={(el) => setBackRef(el, 0)}
          onClick={() => history.goBack()}
          className={`cat-detail-back-btn ${backActive ? 'focused tv-focus-outline' : ''}`}
        >
          <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>← Back</span>
        </button>
        <h1 className="cat-detail-title">{decodeURIComponent(categoryId || '')}</h1>
      </header>

      <div className="cat-detail-grid-container tv-scroll-hide">
        <div className="cat-movie-grid">
          {ITEMS.map((movie, i) => (
            <div
              key={i}
              ref={(el) => setGridRef(el, i)}
              onClick={() => history.push(`/detail/${movie.id}`)}
              className={`cat-movie-card ${gridActive && activeIndex === i ? 'focused tv-focus-outline' : ''}`}
            >
              <img src={movie.image} className="cat-movie-img" alt={movie.title} />
              <div className="cat-movie-overlay">
                <span className="cat-movie-title">{movie.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CategoryDetailPage: React.FC = () => (
  <FocusProvider>
    <CategoryDetailInner />
  </FocusProvider>
);

export default CategoryDetailPage;
