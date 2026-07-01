import React, { useEffect, useState } from 'react';
import { useFocusable } from '../lib/focus/FocusContext';
import { SERIES } from '../constants';
import { Movie } from '../types/common-interface';
import { fetchTvShows } from '../lib/api';
import '../css/shows.css';

const ShowCard: React.FC<{ series: Movie; onClick: () => void }> = ({ series, onClick }) => {
  const { ref, isFocused } = useFocusable(`show-${series.id}`);
  return (
    <div
      ref={ref as any}
      onClick={onClick}
      className={`show-card ${isFocused ? 'focused tv-focus-outline' : ''}`}
    >
      <img src={series.image} className="show-card-image" alt={series.title} />
      <div className="show-card-overlay">
        <h4 className="show-card-title">{series.title}</h4>
        <span className="show-card-meta">{series.duration}</span>
      </div>
    </div>
  );
};

const ShowsPage: React.FC<{ onSelect: (series: Movie) => void }> = ({ onSelect }) => {
  const [shows, setShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShows = async () => {
      try {
        const data = await fetchTvShows();
        setShows(data);
      } catch (error) {
        console.error('Failed to load shows:', error);
        setShows(SERIES.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };

    void loadShows();
  }, []);

  return (
    <div className="shows-container tv-scroll-hide">
      <div className="shows-header">
        <h2 className="shows-title">TV Shows</h2>
        <div className="shows-filter-group">
           {['All', 'Trending', 'New', '4K'].map((filter) => {
             const { ref, isFocused } = useFocusable(`filter-${filter}`);
             return (
               <button 
                 key={filter} 
                 ref={ref as any}
                 className={`shows-filter-btn ${isFocused ? 'focused tv-focus-outline' : ''}`}
               >
                 {filter}
               </button>
             );
           })}
        </div>
      </div>

      {loading ? <p style={{ color: 'rgba(255,255,255,0.4)', padding: '24px 0' }}>Loading live TV shows...</p> : null}
      <div className="shows-grid">
        {(shows.length ? shows : SERIES).map((series) => (
          <ShowCard key={series.id} series={series} onClick={() => onSelect(series)} />
        ))}
      </div>
    </div>
  );
};

export default ShowsPage;
