import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useFocusable } from '../lib/focus/FocusContext';
import { Movie } from '../types/common-interface';
import { fetchMovies } from '../lib/api';
import '../css/common.css';
import '../css/shows.css';

interface MoviesPageProps {
  onSelect?: (movie: Movie) => void;
}

const MovieCard: React.FC<{ movie: Movie; onClick: () => void }> = ({ movie, onClick }) => {
  const { ref, isFocused } = useFocusable(`movie-${movie.id}`);

  return (
    <div
      ref={ref as any}
      onClick={onClick}
      className={`show-card ${isFocused ? 'focused tv-focus-outline' : ''}`}
    >
      <img src={movie.image} className="show-card-image" alt={movie.title} />
      <div className="show-card-overlay">
        <h4 className="show-card-title">{movie.title}</h4>
        <span className="show-card-meta">{movie.duration}</span>
      </div>
    </div>
  );
};

const MoviesPage: React.FC<MoviesPageProps> = ({ onSelect }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await fetchMovies();
        setMovies(data);
      } catch (error) {
        console.error('Failed to load movies:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadMovies();
  }, []);

  return (
    <div className="placeholder-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="placeholder-card"
      >
        <div style={{ textAlign: 'center' }}>
          <h2 className="placeholder-title">Movies</h2>
          <div className="placeholder-line" />
          {loading ? (
            <p className="placeholder-text">Loading live movie catalog...</p>
          ) : (
            <div className="shows-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', textAlign: 'left' }}>
              {movies.slice(0, 8).map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={() => onSelect?.(movie)} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MoviesPage;
