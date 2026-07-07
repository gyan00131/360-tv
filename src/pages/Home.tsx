import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useFocusable } from '../lib/focus/FocusContext';
import { MOVIES, SERIES } from '../constants';
import { Movie } from '../types/common-interface';
import { fetchBanners, fetchMovies, fetchTvShows } from '../lib/api';
import '../css/home.css';

interface BannerSlide {
  id: string;
  title: string;
  description: string;
  image: string;
}

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

const Banner: React.FC = () => {
  const history = useHistory();
  const { ref: playRef, isFocused: playFocused } = useFocusable('banner-play');
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const handlePlay = () => {
    if (bannerSlides[activeSlide]) {
      history.push(`/player/${bannerSlides[activeSlide].id}`);
    }
  };

  useEffect(() => {
    fetchBanners()
      .then(setBannerSlides)
      .catch(() => setBannerSlides([]));
  }, []);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveSlide((c) => (c + 1) % bannerSlides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [bannerSlides.length]);

  const slide = bannerSlides[activeSlide];

  return (
    <div className="home-banner">
      {slide && <img src={slide.image} className="banner-image" alt={slide.title} />}
      <div className="banner-overlay-top" />
      <div className="banner-overlay-left" />
      <div className="banner-overlay-bottom" />

      {/* Banner Content */}
      {slide && (
        <div className="banner-content">
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ backgroundColor: 'var(--color-tv-accent)', color: 'white', fontSize: '12px', fontWeight: 900, padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Original</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>2024 • SCI-FI</span>
            </div>
            <h1 className="banner-title">{slide.title}</h1>
            <p className="banner-desc">{slide.description}</p>
            <button
              ref={playRef as any}
              onClick={handlePlay}
              className={`banner-play-btn ${playFocused ? 'focused tv-focus-outline' : ''}`}
            >
              <Play size={32} fill={playFocused ? 'black' : 'none'} />
              <span>Play Now</span>
            </button>
          </div>

          {/* Slide dots */}
          {bannerSlides.length > 1 && (
            <div className="banner-dots">
              {bannerSlides.map((_, i) => (
                <div
                  key={i}
                  className={`banner-dot ${i === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const HomePage: React.FC = () => {
  const history = useHistory();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSelectMovie = (movie: Movie) => {
    history.push(`/detail/${movie.id}`);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [movieData, showData] = await Promise.all([fetchMovies(), fetchTvShows()]);
        setMovies(movieData);
        setShows(showData);
      } catch {
        setMovies(MOVIES.slice(0, 6));
        setShows(SERIES.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="home-container tv-scroll-hide">
      <Banner />
      <div className="home-shelves">
        <Shelf title="Trending Now" categoryId="trending" onSelect={handleSelectMovie} items={movies.slice(0, 6)} />
        <Shelf title="Exclusive Series" categoryId="exclusive" onSelect={handleSelectMovie} items={shows.slice(0, 6)} isVertical />
        <Shelf title="Sci-Fi Gold" categoryId="scifi" onSelect={handleSelectMovie} items={movies.slice(6, 12)} />
        <Shelf title="Must Watch" categoryId="must" onSelect={handleSelectMovie} items={movies.slice(0, 4)} isVertical />
        {loading && <p style={{ padding: '0 48px', color: 'rgba(255,255,255,0.4)' }}>Loading live content...</p>}
      </div>
    </div>
  );
};

export default HomePage;
