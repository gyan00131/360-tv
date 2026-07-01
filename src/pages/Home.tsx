import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { useFocusable } from '../lib/focus/FocusContext';
import { MOVIES, SERIES } from '../constants';
import { Movie } from '../types/common-interface';
import { fetchMovies, fetchTvShows } from '../lib/api';
import '../css/home.css';

interface ThumbnailProps {
  movie: Movie;
  categoryId: string;
  onClick: () => void;
  isVertical?: boolean;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ movie, categoryId, onClick, isVertical }) => {
  const { ref, isFocused } = useFocusable(`${categoryId}-${movie.id}`);
  
  return (
    <div
      ref={ref as any}
      onClick={onClick}
      className={`movie-thumbnail ${isVertical ? 'vertical' : 'horizontal'} ${isFocused ? 'tv-focus-outline focused' : ''}`}
    >
      <img src={movie.image} alt={movie.title} />
      <div className="thumb-overlay">
        <div className="thumb-content">
          <h4 className="thumb-title">{movie.title}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            <span>{movie.duration}</span>
            <span>•</span>
            <span style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>{movie.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Shelf: React.FC<{ title: string; categoryId: string; onSelect: (movie: Movie) => void; items?: Movie[]; isVertical?: boolean }> = ({ title, categoryId, onSelect, items = MOVIES.slice(0, 6), isVertical }) => {
  const safeItems = items?.length ? items : MOVIES.slice(0, 6);

  return (
    <div className="shelf-container">
      <h3 className="shelf-title">{title}</h3>
      <div className="shelf-scroll tv-scroll-hide">
        {safeItems.map((movie) => (
          <Thumbnail 
            key={`${categoryId}-${movie.id}`} 
            movie={movie} 
            categoryId={categoryId} 
            onClick={() => onSelect(movie)} 
            isVertical={isVertical} 
          />
        ))}
      </div>
    </div>
  );
};

const Banner: React.FC<{ onPlay: () => void }> = ({ onPlay }) => {
  const { ref: playRef, isFocused: playFocused } = useFocusable('banner-play');

  return (
    <div className="home-banner">
      <img 
        src="https://images.unsplash.com/photo-1542204113-e9352628919f?w=1600&q=80" 
        className="banner-image"
        alt="Featured"
      />
      <div className="banner-overlay-top" />
      <div className="banner-overlay-left" />
      <div className="banner-content">
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ backgroundColor: 'var(--color-tv-accent)', color: 'white', fontSize: '12px', fontWeight: 900, padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Original</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>2024 • SCI-FI</span>
          </div>
          <h1 className="banner-title">Stelar Discovery</h1>
          <p className="banner-desc">Join the final expedition as humanity reaches for the furthest echoes of existence.</p>
          <button 
            ref={playRef as any}
            onClick={onPlay}
            className={`banner-play-btn ${playFocused ? 'focused tv-focus-outline' : ''}`}
          >
            <Play size={32} fill={playFocused ? "black" : "none"} />
            <span>Play Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const HomePage: React.FC<{ onSelect: (movie: Movie) => void; onPlay: () => void }> = ({ onSelect, onPlay }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [movieData, showData] = await Promise.all([fetchMovies(), fetchTvShows()]);
        setMovies(movieData);
        setShows(showData);
      } catch (error) {
        console.error('Failed to load home content:', error);
        setMovies(MOVIES.slice(0, 6));
        setShows(SERIES.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };

    void loadContent();
  }, []);

  return (
    <div className="home-container tv-scroll-hide">
      <Banner onPlay={onPlay} />
      <Shelf title="Trending Now" categoryId="trending" onSelect={onSelect} items={movies.slice(0, 6)} />
      <Shelf title="Exclusive Series" categoryId="exclusive" onSelect={onSelect} items={shows.slice(0, 6)} isVertical={true} />
      <Shelf title="Sci-Fi Gold" categoryId="scifi" onSelect={onSelect} items={movies.slice(6, 12)} />
      <Shelf title="Must Watch" categoryId="must" onSelect={onSelect} items={movies.slice(0, 4)} isVertical={true} />
      {loading && <p style={{ padding: '0 48px', color: 'rgba(255,255,255,0.4)' }}>Loading live content...</p>}
    </div>
  );
};

export default HomePage;
