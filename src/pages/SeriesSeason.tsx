import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import { Movie, Episode, Season } from '../types/common-interface';
import { MOVIES, SERIES } from '../constants';
import { fetchTvShowDetail } from '../lib/api';
import '../css/series-season.css';

const SeriesSeasonInner: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
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

  const seasons = movie?.seasons || [];
  const episodes = selectedSeason?.episodes || [];

  // Section: hero actions (Play + Back)
  const { isActive: heroActive, activeIndex: heroIndex, activate: activateHero, setRef: setHeroRef } = useSectionFocus('series-hero', {
    itemCount: 2,
    onEnter: (i) => {
      if (i === 0 && movie) history.push(`/player/${movie.id}`);
      else history.goBack();
    },
    onDown: () => seasons.length ? activateSeasons(0) : activateEpisodes(0),
  });

  // Section: season tabs
  const { isActive: seasonsActive, activeIndex: seasonIndex, activate: activateSeasons, setRef: setSeasonRef } = useSectionFocus('series-seasons', {
    itemCount: seasons.length,
    onEnter: (i) => setSelectedSeason(seasons[i]),
    onUp: () => activateHero(0),
    onDown: () => activateEpisodes(0),
  });

  // Section: episode list
  const { isActive: epsActive, activeIndex: epIndex, activate: activateEpisodes, setRef: setEpRef } = useSectionFocus('series-episodes', {
    itemCount: episodes.length,
    onEnter: (i) => movie && history.push(`/player/${movie.id}`),
    onUp: () => seasons.length ? activateSeasons(0) : activateHero(0),
  });

  useEffect(() => { if (movie) activateHero(0); }, [movie]);

  if (!movie || !selectedSeason) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="series-container">
      <div className="series-hero">
        <div className="hero-bg">
          <img src={movie.image} className="hero-image" alt={movie.title} />
          <div className="hero-gradient" />
        </div>
        <div className="hero-content">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="hero-badge">
              <span className="badge-tag">Original Series</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{movie.isSeries ? `${movie.seasons?.length} Seasons` : movie.duration}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '0 8px', borderRadius: '4px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{movie.rating}</span>
            </div>
            <h1 className="hero-title">{movie.title}</h1>
            <p className="hero-desc">{movie.description}</p>
            <div className="hero-actions">
              <button
                ref={(el) => setHeroRef(el, 0)}
                onClick={() => history.push(`/player/${movie.id}`)}
                className={`btn-primary ${heroActive && heroIndex === 0 ? 'focused tv-focus-outline' : ''}`}
              >
                <Play size={28} fill={heroActive && heroIndex === 0 ? 'black' : 'none'} />
                <span>Play S1:E1</span>
              </button>
              <button
                ref={(el) => setHeroRef(el, 1)}
                onClick={() => history.goBack()}
                className={`btn-primary ${heroActive && heroIndex === 1 ? 'focused tv-focus-outline' : ''}`}
              >
                <span>Back</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="episodes-section tv-scroll-hide">
        {movie.isSeries && (
          <>
            <div className="season-tabs">
              {seasons.map((season, i) => (
                <button
                  key={season.id}
                  ref={(el) => setSeasonRef(el, i)}
                  onClick={() => { setSelectedSeason(season); activateSeasons(i); }}
                  className={`season-tab ${selectedSeason.id === season.id ? 'active' : ''} ${seasonsActive && seasonIndex === i ? 'focused tv-focus-outline' : ''}`}
                >
                  {season.title}
                  {selectedSeason.id === season.id && (
                    <motion.div layoutId="activeSeason" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--color-tv-accent)' }} />
                  )}
                </button>
              ))}
            </div>

            <div className="episode-list">
              {episodes.map((episode, i) => (
                <div
                  key={episode.id}
                  ref={(el) => setEpRef(el, i)}
                  onClick={() => history.push(`/player/${movie.id}`)}
                  className={`episode-row ${epsActive && epIndex === i ? 'focused tv-focus-outline' : ''}`}
                >
                  <div className="ep-number">{episode.episodeNumber}</div>
                  <div className="ep-thumb"><img src={episode.image} alt={episode.title} /></div>
                  <div className="ep-info">
                    <h4 className="ep-title">{episode.title}</h4>
                    <p className="ep-desc">{episode.description}</p>
                  </div>
                  <div className="ep-duration">{episode.duration}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SeriesSeasonPage: React.FC = () => (
  <FocusProvider>
    <SeriesSeasonInner />
  </FocusProvider>
);

export default SeriesSeasonPage;
