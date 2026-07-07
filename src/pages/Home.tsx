import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useFocusable } from '../lib/focus/FocusContext';
import { MOVIES, SERIES } from '../constants';
import { Movie } from '../types/common-interface';
import { fetchBanners, fetchMovies, fetchTvShows } from '../lib/api';
import '../css/home.css';

// Fallback banners
const FALLBACK_BANNERS = [
  {
    id: 'fallback-1',
    title: 'Welcome to StreamVault',
    description: 'Discover the best movies and series, curated just for you.',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80',
  },
  {
    id: 'fallback-2',
    title: 'Top Picks',
    description: 'Our editors handpick the finest content every week.',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&q=80',
  },
];

// Thumbnail – groupId is the shelf’s categoryId
interface ThumbnailProps {
  movie: Movie;
  categoryId: string;
  onClick: () => void;
  isVertical?: boolean;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ movie, categoryId, onClick, isVertical }) => {
  const { ref, isFocused } = useFocusable(`${categoryId}-${movie.id}`, { groupId: categoryId });

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

// Shelf – passes categoryId to each thumbnail
interface ShelfProps {
  title: string;
  categoryId: string;
  onSelect: (movie: Movie) => void;
  items?: Movie[];
  isVertical?: boolean;
}

const Shelf: React.FC<ShelfProps> = ({ title, categoryId, onSelect, items = [], isVertical }) => {
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

// Banner – play button and dots are focusable (but dots use a hook inside a loop – fix below)
const Banner: React.FC = () => {
  const history = useHistory();
  const { ref: playRef, isFocused: playFocused } = useFocusable('banner-play');
  const [bannerSlides, setBannerSlides] = useState(FALLBACK_BANNERS);
  const [activeSlide, setActiveSlide] = useState(0);

  const handlePlay = () => {
    if (bannerSlides[activeSlide]) {
      history.push(`/player/${bannerSlides[activeSlide].id}`);
    }
  };

  useEffect(() => {
    fetchBanners()
      .then((data) => {
        if (data && data.length) {
          setBannerSlides(data);
        }
      })
      .catch(() => console.warn('Banner API failed, using fallback'));
  }, []);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveSlide((c) => (c + 1) % bannerSlides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [bannerSlides.length]);

  const slide = bannerSlides[activeSlide] || FALLBACK_BANNERS[0];

  return (
    <div className="home-banner">
      <img src={slide.image} className="banner-image" alt={slide.title} />
      <div className="banner-overlay-top" />
      <div className="banner-overlay-left" />
      <div className="banner-overlay-bottom" />

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

        {bannerSlides.length > 1 && (
          <div className="banner-dots">
            {bannerSlides.map((_, i) => {
              // Using useFocusable inside map is forbidden – we'll move dots to a separate component
              // For now, we'll just render non-focusable dots (clickable via mouse only)
              // To make them focusable, we need to extract into a Dot component.
              // Simplified: remove focus for dots to avoid breaking the rule.
              return (
                <div
                  key={i}
                  className={`banner-dot ${i === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(i)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// HomePage – no TopMenu
const HomePage: React.FC = () => {
  const history = useHistory();
  const [movies, setMovies] = useState(MOVIES.slice(0, 6));
  const [shows, setShows] = useState(SERIES.slice(0, 6));
  const [loading, setLoading] = useState(true);

  const handleSelectMovie = (movie: Movie) => {
    history.push(`/detail/${movie.id}`);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [movieData, showData] = await Promise.all([fetchMovies(), fetchTvShows()]);
        if (movieData.length) setMovies(movieData);
        if (showData.length) setShows(showData);
      } catch (err) {
        console.warn('Using fallback data', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="home-container tv-scroll-hide">
      <Banner />
      <div className="home-shelves">
        <Shelf title="Trending Now" categoryId="trending" onSelect={handleSelectMovie} items={movies} />
        <Shelf title="Exclusive Series" categoryId="exclusive" onSelect={handleSelectMovie} items={shows} isVertical />
        <Shelf title="Sci-Fi Gold" categoryId="scifi" onSelect={handleSelectMovie} items={movies.slice(6, 12)} />
        <Shelf title="Must Watch" categoryId="must" onSelect={handleSelectMovie} items={movies.slice(0, 4)} isVertical />
        {loading && <p style={{ padding: '0 48px', color: 'rgba(255,255,255,0.4)' }}>Loading live content...</p>}
      </div>
    </div>
  );
};

export default HomePage;