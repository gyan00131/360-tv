import React from 'react';
import { useFocusable } from '../lib/focus/FocusContext';
import { MOVIES } from '../constants';
import { Movie } from '../types/common-interface';
import { Check } from 'lucide-react';
import '../css/favourites.css';

const FavouriteCard: React.FC<{ movie: Movie; onClick: () => void }> = ({ movie, onClick }) => {
  const { ref, isFocused } = useFocusable(`fav-${movie.id}`);
  return (
    <div
      ref={ref as any}
      onClick={onClick}
      className={`fav-card ${isFocused ? 'focused tv-focus-outline' : ''}`}
    >
      <img src={movie.image} className="fav-card-image" alt={movie.title} />
      <div className="fav-card-overlay">
        <h4 className="fav-card-title-big">{movie.title.split(' ')[0]}</h4>
        <span className="fav-card-subtitle">{movie.title}</span>
      </div>
    </div>
  );
};

const FavouritesPage: React.FC<{ onSelect: (movie: Movie) => void }> = ({ onSelect }) => {
  const filters = ['Movies', 'TV Shows', 'Added last week', 'Available in 4K'];
  const favItems = MOVIES.slice(0, 10);

  return (
    <div className="fav-container tv-scroll-hide">
      <div className="fav-filters">
        {filters.map((f, i) => {
          const { ref, isFocused } = useFocusable(`fav-filter-${i}`);
          const isActive = i === 0;
          return (
            <button
              key={f}
              ref={ref as any}
              className={`fav-filter-btn ${isActive ? 'active' : ''} ${isFocused ? 'focused tv-focus-outline' : ''}`}
            >
              {isActive && <Check size={20} strokeWidth={4} />}
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '14px' }}>{f}</span>
            </button>
          );
        })}
      </div>

      <div className="fav-grid">
        {favItems.map((movie) => (
          <FavouriteCard key={movie.id} movie={movie} onClick={() => onSelect(movie)} />
        ))}
      </div>
    </div>
  );
};

export default FavouritesPage;
