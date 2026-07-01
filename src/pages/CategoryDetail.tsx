import React from 'react';
import { useFocusable } from '../lib/focus/FocusContext';
import { MOVIES } from '../constants';
import { Movie } from '../types/common-interface';
import '../css/categories.css';

interface CategoryDetailPageProps {
  category: string;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
}

const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({ category, onBack, onSelectMovie }) => {
  const { ref: backRef, isFocused: backFocused } = useFocusable('category-back');

  return (
    <div className="cat-detail-container">
      {/* Background Decor */}
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '40vh', backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)', pointerEvents: 'none' }} />
      
      <header className="cat-detail-header">
        <button 
          ref={backRef as any}
          onClick={onBack}
          className={`cat-detail-back-btn ${backFocused ? 'focused tv-focus-outline' : ''}`}
        >
           <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Back</span>
        </button>
        <h1 className="cat-detail-title">{category}</h1>
      </header>

      <div className="cat-detail-grid-container tv-scroll-hide">
        <div className="cat-movie-grid">
          {[...MOVIES, ...MOVIES].map((movie, i) => {
             const { ref, isFocused } = useFocusable(`cat-movie-${i}`);
             return (
               <div
                 key={i}
                 ref={ref as any}
                 onClick={() => onSelectMovie(movie)}
                 className={`cat-movie-card ${isFocused ? 'focused tv-focus-outline' : ''}`}
               >
                 <img src={movie.image} className="cat-movie-img" alt={movie.title} />
                 <div className="cat-movie-overlay">
                    <span className="cat-movie-title">{movie.title}</span>
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailPage;
