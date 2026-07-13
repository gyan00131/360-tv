import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FocusProvider, useFocus, useSectionFocus } from '../lib/focus/FocusContext';
import Header from '../components/Header';
import { SERIES } from '../constants';
import { Movie } from '../types/common-interface';
import { fetchTvShows } from '../lib/api';
import '../css/shows.css';

const FILTERS = ['All', 'Trending', 'New', '4K'];
const GRID_COLS = 3;

const ShowsInner: React.FC = () => {
  const history = useHistory();
  const [shows, setShows] = useState<Movie[]>(SERIES.slice(0, 6));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTvShows()
      .then((d) => { if (d.length) setShows(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { setFocusedSection } = useFocus();

  const { isActive: filtersActive, activeIndex: filterIndex, activate: activateFilters, setRef: setFilterRef } = useSectionFocus('shows-filters', {
    itemCount: FILTERS.length,
    onDown: () => activateGrid(0),
    onUp: () => {
      setFocusedSection(null);
      window.dispatchEvent(new CustomEvent('header-focus'));
    },
  });

  const { isActive: gridActive, activeIndex: gridIndex, activate: activateGrid, setRef: setGridRef } = useSectionFocus('shows-grid', {
    itemCount: shows.length,
    onEnter: (i) => history.push(`/detail/${shows[i].id}`),
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
        if (gridIndex % GRID_COLS < GRID_COLS - 1 && gridIndex + 1 < shows.length) activateGrid(gridIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (gridIndex - GRID_COLS >= 0) activateGrid(gridIndex - GRID_COLS);
        else activateFilters(0);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (gridIndex + GRID_COLS < shows.length) activateGrid(gridIndex + GRID_COLS);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        history.push(`/detail/${shows[gridIndex].id}`);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [gridActive, gridIndex, activateGrid, activateFilters, shows, history]);

  useEffect(() => { activateFilters(0); }, []);

  return (
    <div className="shows-container tv-scroll-hide" style={{ height: '100vh', overflowY: 'auto' }}>
      <Header />
      <div className="shows-header">
        <h2 className="shows-title">TV Shows</h2>
        <div className="shows-filter-group">
          {FILTERS.map((filter, i) => (
            <button
              key={filter}
              ref={(el) => setFilterRef(el, i)}
              onClick={() => activateFilters(i)}
              className={`shows-filter-btn ${filtersActive && filterIndex === i ? 'focused tv-focus-outline' : ''}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ color: 'rgba(255,255,255,0.4)', padding: '24px 0' }}>Loading...</p>}

      <div className="shows-grid">
        {shows.map((series, i) => (
          <div
            key={series.id}
            ref={(el) => setGridRef(el, i)}
            onClick={() => history.push(`/detail/${series.id}`)}
            className={`show-card ${gridActive && gridIndex === i ? 'focused tv-focus-outline' : ''}`}
          >
            <img src={series.image} className="show-card-image" alt={series.title} />
            <div className="show-card-overlay">
              <h4 className="show-card-title">{series.title}</h4>
              <span className="show-card-meta">{series.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ShowsPage: React.FC = () => (
  <FocusProvider>
    <ShowsInner />
  </FocusProvider>
);

export default ShowsPage;
