import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { FocusProvider, useFocus, useSectionFocus } from '../lib/focus/FocusContext';
import Header from '../components/Header';
import { Movie } from '../types/common-interface';
import { fetchWatchList } from '../lib/api';
import { Check } from 'lucide-react';
import '../css/favourites.css';

const FILTERS = ['Movies', 'TV Shows', 'Added last week', 'Available in 4K'];
const GRID_COLS = 3;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const applyFilter = (items: any[], filterIndex: number): Movie[] => {
  switch (filterIndex) {
    case 0: return items.filter(i => i.type === 'movie');
    case 1: return items.filter(i => i.type === 'tvshow' || i.type === 'tv_show');
    case 2: return items.filter(i => i.created_at && Date.now() - new Date(i.created_at).getTime() <= ONE_WEEK_MS);
    case 3: return items.filter(i => i.is_4k || i.quality === '4k' || i.quality === '4K');
    default: return items;
  }
};

const FavouritesInner: React.FC = () => {
  const history = useHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(0);

  const { setFocusedSection } = useFocus();

  // ── filter section ──────────────────────────────────────────────
  const { isActive: filtersActive, activeIndex: filterIndex, activate: activateFilters, setRef: setFilterRef } =
    useSectionFocus('fav-filters', {
      itemCount: FILTERS.length,
      isVertical: false, // left/right handled by default context handler — no custom needed
      onDown: () => activateGrid(0),
      onUp: () => {
        setFocusedSection(null);
        window.dispatchEvent(new CustomEvent('header-focus'));
      },
    });

  // ── grid section ─────────────────────────────────────────────────
  const { isActive: gridActive, activeIndex: gridIndex, activate: activateGrid, setRef: setGridRef } =
    useSectionFocus('fav-grid', {
      itemCount: filtered.length,
      isVertical: true, // disables default left/right handler; custom handles grid nav
      onEnter: (i) => { if (filtered[i]) history.push(`/detail/${filtered[i].id}`); },
    });

  // ── fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchWatchList()
      .then((data) => { setAllItems(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── re-filter when tab or data changes ───────────────────────────
  useEffect(() => {
    setFiltered(applyFilter(allItems, activeFilter));
  }, [activeFilter, allItems]);

  // ── select filter tab ────────────────────────────────────────────
  const selectFilter = useCallback((i: number) => {
    setActiveFilter(i);
    activateFilters(i);
  }, [activateFilters]);

  // ── grid keyboard nav ────────────────────────────────────────────
  useEffect(() => {
    if (!gridActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (gridIndex % GRID_COLS > 0) activateGrid(gridIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (gridIndex % GRID_COLS < GRID_COLS - 1 && gridIndex + 1 < filtered.length) activateGrid(gridIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (gridIndex - GRID_COLS >= 0) activateGrid(gridIndex - GRID_COLS);
        else activateFilters(filterIndex);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (gridIndex + GRID_COLS < filtered.length) activateGrid(gridIndex + GRID_COLS);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[gridIndex]) history.push(`/detail/${filtered[gridIndex].id}`);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [gridActive, gridIndex, filtered, filterIndex, activateGrid, activateFilters, history]);

  // ── header → content focus ───────────────────────────────────────
  useEffect(() => {
    const onContentFocus = () => activateFilters(0);
    window.addEventListener('content-focus', onContentFocus);
    return () => window.removeEventListener('content-focus', onContentFocus);
  }, []);

  // ── initial focus ────────────────────────────────────────────────
  useEffect(() => { activateFilters(0); }, []);

  return (
    <div className="fav-container tv-scroll-hide" ref={containerRef} style={{ height: '100vh', overflowY: 'auto' }}>
      <Header />
      <div className="fav-filters">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            ref={(el) => setFilterRef(el, i)}
            onClick={() => selectFilter(i)}
            className={`fav-filter-btn ${activeFilter === i ? 'active' : ''} ${filtersActive && filterIndex === i ? 'focused tv-focus-outline' : ''}`}
          >
            {activeFilter === i && <Check size={20} strokeWidth={4} />}
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '14px' }}>{f}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', padding: '24px 0' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', padding: '24px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>No items found</p>
      ) : (
        <div className="fav-grid">
          {filtered.map((movie, i) => (
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
      )}
    </div>
  );
};

const FavouritesPage: React.FC = () => (
  <FocusProvider>
    <FavouritesInner />
  </FocusProvider>
);

export default FavouritesPage;
