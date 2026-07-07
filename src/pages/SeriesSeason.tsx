import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useFocusable } from '../lib/focus/FocusContext';
import { Movie, Episode, Season } from '../types/common-interface';
import { MOVIES, SERIES } from '../constants';
import { fetchTvShowDetail } from '../lib/api';
import '../css/series-season.css';

interface DetailParams {
  id: string;
}

const SeriesSeasonPage: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<DetailParams>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  useEffect(() => {
    const local = [...MOVIES, ...SERIES].find(m => m.id === id);
    if (local) {
      setMovie(local);
      setSelectedSeason(local.seasons?.[0] || { id: 's1', title: 'Season 1', seasonNumber: 1, episodes: [] });
      return;
    }
    fetchTvShowDetail(id).then(data => {
      if (data) {
        setMovie(data);
        setSelectedSeason(data.seasons?.[0] || { id: 's1', title: 'Season 1', seasonNumber: 1, episodes: [] });
      }
    });
  }, [id]);

  const { ref: playRef, isFocused: playFocused } = useFocusable('details-play');
  const { ref: backRef, isFocused: backFocused } = useFocusable('details-back');

  const handleBack = () => {
    history.goBack();
  };

  const handlePlay = (episode?: Episode) => {
    if (movie) {
      history.push(`/player/${movie.id}`);
    }
  };

  if (!movie || !selectedSeason) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-tv-bg)',
        color: 'white'
      }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="series-container">
      {/* Hero Section */}
      <div className="series-hero">
        <div className="hero-bg">
          <img 
            src={movie.image} 
            className="hero-image"
            alt="Series Background"
          />
          <div className="hero-gradient" />
        </div>

        <div className="hero-content">
          <motion.div
             initial={{ opacity: 0, x: -50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5 }}
          >
            <div className="hero-badge">
              <span className="badge-tag">Original Series</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{movie.isSeries ? `${movie.seasons?.length} Seasons` : movie.duration}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '0 8px', borderRadius: '4px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{movie.rating}</span>
            </div>

            <h1 className="hero-title">{movie.title}</h1>
            
            <p className="hero-desc">
              {movie.description}
            </p>

            <div className="hero-actions">
              <button 
                ref={playRef as any}
                onClick={() => handlePlay()}
                className={`btn-primary ${playFocused ? 'focused tv-focus-outline' : ''}`}
              >
                <Play size={28} fill={playFocused ? "black" : "none"} />
                <span>Play S1:E1</span>
              </button>
              
              <button 
                ref={backRef as any}
                onClick={handleBack}
                className={`btn-primary ${backFocused ? 'focused tv-focus-outline' : ''}`}
              >
                <span>Back</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="episodes-section tv-scroll-hide">
        {movie.isSeries && (
          <>
            <div className="season-tabs">
              {movie.seasons?.map((season) => {
                const { ref, isFocused } = useFocusable(`season-tab-${season.id}`);
                const isActive = selectedSeason.id === season.id;
                return (
                  <button
                    key={season.id}
                    ref={ref as any}
                    onClick={() => setSelectedSeason(season)}
                    className={`season-tab ${isActive ? 'active' : ''} ${isFocused ? 'focused tv-focus-outline' : ''}`}
                  >
                    {season.title}
                    {isActive && <motion.div layoutId="activeSeason" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--color-tv-accent)' }} />}
                  </button>
                );
              })}
            </div>

            <div className="episode-list">
              {selectedSeason.episodes.map((episode) => {
                const { ref, isFocused } = useFocusable(`episode-${episode.id}`);
                return (
                  <div
                    key={episode.id}
                    ref={ref as any}
                    onClick={() => handlePlay(episode)}
                    className={`episode-row ${isFocused ? 'focused tv-focus-outline' : ''}`}
                  >
                    <div className="ep-number">{episode.episodeNumber}</div>
                    <div className="ep-thumb">
                      <img src={episode.image} alt={episode.title} />
                    </div>
                    <div className="ep-info">
                      <h4 className="ep-title">{episode.title}</h4>
                      <p className="ep-desc">{episode.description}</p>
                    </div>
                    <div className="ep-duration">{episode.duration}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SeriesSeasonPage;
