import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import { MOVIES } from '../constants';
import { Movie } from '../types/common-interface';
import { Check } from 'lucide-react';
import '../css/favourites.css';

const FILTERS = ['Movies', 'TV Shows', 'Added last week', 'Available in 4K'];
const FAV_ITEMS = MOVIES.slice(0, 10);
const GRID_COLS = 3;

const FavouritesInner: React.FC = () => {
  const history = useHistory();

  const { isActive: filtersActive, activeIndex: filterIndex, activate: activateFilters, setRef: setFilterRef } = useSectionFocus('fav-filters', {
    itemCount: FILTERS.length,
    onDown: () => activateGrid(0),
  });

  const { isActive: gridActive, activeIndex: gridIndex, activate: activateGrid, setRef: setGridRef } = useSectionFocus('fav-grid', {
    itemCount: FAV_ITEMS.length,
    onEnter: (i) => history.push(`/detail/${FAV_ITEMS[i].id}`),
    onUp: () => {
      if (gridIndex < GRID_COLS) activateFilters(0);
    },
  });

  // Grid column-aware nav
  useEffect(() => {
    if (!gridActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (gridIndex % GRID_COLS > 0) activateGrid(gridIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (gridIndex % GRID_COLS < GRID_COLS - 1 && gridIndex + 1 < FAV_ITEMS.length) activateGrid(gridIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (gridIndex - GRID_COLS >= 0) activateGrid(gridIndex - GRID_COLS);
        else activateFilters(0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (gridIndex + GRID_COLS < FAV_ITEMS.length) activateGrid(gridIndex + GRID_COLS);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        history.push(`/detail/${FAV_ITEMS[gridIndex].id}`);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [gridActive, gridIndex, activateGrid, activateFilters, history]);

  useEffect(() => { activateFilters(0); }, []);

  return (
    <div className="fav-container tv-scroll-hide">
      <div className="fav-filters">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            ref={(el) => setFilterRef(el, i)}
            onClick={() => activateFilters(i)}
            className={`fav-filter-btn ${i === 0 ? 'active' : ''} ${filtersActive && filterIndex === i ? 'focused tv-focus-outline' : ''}`}
          >
            {i === 0 && <Check size={20} strokeWidth={4} />}
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '14px' }}>{f}</span>
          </button>
        ))}
      </div>

      <div className="fav-grid">
        {FAV_ITEMS.map((movie, i) => (
          <div
            key={movie.id}
            ref={(el) => setGridRef(el, i)}
            onClick={() => history.push(`/detail/${movie.id}`)}
            className={`fav-card ${gridActive && gridIndex === i ? 'focused tv-focus-outline' : ''}`}
          >
            <img src={movie.image} className="fav-card-image" alt={movie.title} />
            <div className="fav-card-overlay">
              <h4 className="fav-card-title-big">{movie.title.split(' ')[0]}</h4>
              <span className="fav-card-subtitle">{movie.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FavouritesPage: React.FC = () => (
  <FocusProvider>
    <FavouritesInner />
  </FocusProvider>
);

export default FavouritesPage;
