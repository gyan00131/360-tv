import React, { useEffect, useState } from 'react';
import { useFocusable } from '../lib/focus/FocusContext';
import { MOVIES } from '../constants';
import { fetchSearchResults } from '../lib/api';
import { Movie } from '../types/common-interface';
import '../css/search.css';

const ResultCard: React.FC<{ movie: Movie }> = ({ movie }) => {
  const { ref, isFocused } = useFocusable(`search-result-${movie.id}`);

  return (
    <div
      ref={ref as any}
      className={`result-card ${isFocused ? 'focused tv-focus-outline' : ''}`}
    >
      <img src={movie.image} className="result-thumb" alt={movie.title} />
      <div className="result-info">
        <h4>{movie.title}</h4>
        <p>{movie.duration} • {movie.rating}</p>
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const keys = [
    'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '1', '2', '3', '4',
    '5', '6', '7', '8', '9', '0',
    'SPACE', 'BACK'
  ];

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchSearchResults(query);
        setResults(data);
      } catch (error) {
        console.error('Failed to search content:', error);
        setResults(MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6));
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <div className="search-container">
      {/* Keyboard Side */}
      <div className="search-input-side">
        <div className="search-buffer-box">
          <span className="search-buffer-label">Search Buffer</span>
          <div className="search-buffer-text">
            {query}<span className="animate-pulse">|</span>
          </div>
        </div>

        <div className="keyboard-grid">
          {keys.map((key) => {
             const { ref, isFocused } = useFocusable(`key-${key}`);
             return (
               <button
                 key={key}
                 ref={ref as any}
                 onClick={() => {
                   if (key === 'BACK') setQuery(prev => prev.slice(0, -1));
                   else if (key === 'SPACE') setQuery(prev => prev + ' ');
                   else setQuery(prev => prev + key);
                 }}
                 className={`keyboard-key ${key === 'SPACE' || key === 'BACK' ? 'wide' : ''} ${isFocused ? 'focused tv-focus-outline' : ''}`}
               >
                 {key}
               </button>
             );
          })}
        </div>
      </div>

      {/* Results Side */}
      <div className="search-results-side">
         <h3 className="results-title">Live Results</h3>
         {query.length > 0 ? (
           loading ? (
             <div className="awaiting-input"><span className="awaiting-text">Searching...</span></div>
           ) : (
             <div className="results-grid">
               {results.map((m, i) => (
                  <ResultCard key={`${m.id}-${i}`} movie={m} />
               ))}
             </div>
           )
         ) : (
           <div className="awaiting-input">
              <span className="awaiting-text">Awaiting Input...</span>
           </div>
         )}
      </div>
    </div>
  );
};

export default SearchPage;
