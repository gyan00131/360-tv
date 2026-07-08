import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import '../css/categories.css';

const COLS = 3;

const CAT_ITEMS = [
  { name: 'Action', grad: 'grad-action' },
  { name: 'Documentaries', grad: 'grad-docs' },
  { name: 'Black Voices', grad: 'grad-black' },
  { name: 'Comedy', grad: 'grad-comedy' },
  { name: 'Nature', grad: 'grad-nature' },
  { name: 'Fantasy', grad: 'grad-fantasy' },
  { name: 'Foreign', grad: 'grad-foreign' },
  { name: 'Horror', grad: 'grad-horror' },
  { name: 'LGBTQ', grad: 'grad-lgbtq' },
  { name: 'War & Military', grad: 'grad-war' },
  { name: 'Musicals', grad: 'grad-musicals' },
];

const CategoriesInner: React.FC = () => {
  const history = useHistory();

  const { isActive, activeIndex, activate, setRef } = useSectionFocus('categories-grid', {
    itemCount: CAT_ITEMS.length,
    onEnter: (i) => history.push(`/category/${encodeURIComponent(CAT_ITEMS[i].name.toLowerCase())}`),
    // Grid: left/right handled by default; up/down move by COLS
  });

  // Override: grid needs up/down to move by COLS rows
  useEffect(() => {
    if (!isActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activeIndex % COLS > 0) activate(activeIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activeIndex % COLS < COLS - 1 && activeIndex + 1 < CAT_ITEMS.length) activate(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeIndex - COLS >= 0) activate(activeIndex - COLS);
        // at top edge: do nothing (release would go to header)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeIndex + COLS < CAT_ITEMS.length) activate(activeIndex + COLS);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        history.push(`/category/${encodeURIComponent(CAT_ITEMS[activeIndex].name.toLowerCase())}`);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isActive, activeIndex, activate, history]);

  useEffect(() => { activate(0); }, []);

  return (
    <div className="categories-container tv-scroll-hide" onClick={() => activate(activeIndex)}>
      <div className="categories-grid">
        {CAT_ITEMS.map((cat, i) => (
          <div
            key={i}
            ref={(el) => setRef(el, i)}
            onClick={() => history.push(`/category/${encodeURIComponent(cat.name.toLowerCase())}`)}
            className={`category-card ${cat.grad} ${isActive && activeIndex === i ? 'focused tv-focus-outline' : ''}`}
          >
            <div className="category-card-overlay" />
            <span className="category-card-name">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CategoriesPage: React.FC = () => (
  <FocusProvider>
    <CategoriesInner />
  </FocusProvider>
);

export default CategoriesPage;
