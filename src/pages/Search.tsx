import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import { MOVIES } from '../constants';
import { fetchSearchResults } from '../lib/api';
import { Movie } from '../types/common-interface';
import '../css/search.css';

const KEYS = [
  'A','B','C','D','E','F',
  'G','H','I','J','K','L',
  'M','N','O','P','Q','R',
  'S','T','U','V','W','X',
  'Y','Z','1','2','3','4',
  '5','6','7','8','9','0',
  'SPACE','BACK',
];
const KEY_COLS = 6;

const SearchInner: React.FC = () => {
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const data = await fetchSearchResults(query);
        setResults(data);
      } catch {
        setResults(MOVIES.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6));
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const pressKey = (key: string) => {
    if (key === 'BACK') setQuery(p => p.slice(0, -1));
    else if (key === 'SPACE') setQuery(p => p + ' ');
    else setQuery(p => p + key);
  };

  const { isActive: kbActive, activeIndex: kbIndex, activate: activateKb, setRef: setKbRef } = useSectionFocus('search-keyboard', {
    itemCount: KEYS.length,
    onEnter: (i) => pressKey(KEYS[i]),
    onRight: () => activateResults(0),
  });

  const { isActive: resActive, activeIndex: resIndex, activate: activateResults, setRef: setResRef } = useSectionFocus('search-results', {
    itemCount: results.length,
    onEnter: (i) => history.push(`/detail/${results[i].id}`),
    onLeft: () => activateKb(kbIndex),
  });

  // Keyboard grid: column-aware nav
  useEffect(() => {
    if (!kbActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (kbIndex % KEY_COLS > 0) activateKb(kbIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (kbIndex % KEY_COLS < KEY_COLS - 1 && kbIndex + 1 < KEYS.length) activateKb(kbIndex + 1);
        else activateResults(0); // right edge → results
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (kbIndex - KEY_COLS >= 0) activateKb(kbIndex - KEY_COLS);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (kbIndex + KEY_COLS < KEYS.length) activateKb(kbIndex + KEY_COLS);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        pressKey(KEYS[kbIndex]);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [kbActive, kbIndex, activateKb, activateResults]);

  // Results: up/down nav
  useEffect(() => {
    if (!resActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        activateKb(kbIndex); // left edge → keyboard
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (resIndex > 0) activateResults(resIndex - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (resIndex < results.length - 1) activateResults(resIndex + 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[resIndex]) history.push(`/detail/${results[resIndex].id}`);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [resActive, resIndex, activateResults, activateKb, kbIndex, results, history]);

  useEffect(() => { activateKb(0); }, []);

  return (
    <div className="search-container">
      <div className="search-input-side">
        <div className="search-buffer-box">
          <span className="search-buffer-label">Search Buffer</span>
          <div className="search-buffer-text">
            {query}<span className="animate-pulse">|</span>
          </div>
        </div>
        <div className="keyboard-grid">
          {KEYS.map((key, i) => (
            <button
              key={key}
              ref={(el) => setKbRef(el, i)}
              onClick={() => pressKey(key)}
              className={`keyboard-key ${key === 'SPACE' || key === 'BACK' ? 'wide' : ''} ${kbActive && kbIndex === i ? 'focused tv-focus-outline' : ''}`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="search-results-side">
        <h3 className="results-title">Live Results</h3>
        {query.length > 0 ? (
          loading ? (
            <div className="awaiting-input"><span className="awaiting-text">Searching...</span></div>
          ) : (
            <div className="results-grid">
              {results.map((m, i) => (
                <div
                  key={`${m.id}-${i}`}
                  ref={(el) => setResRef(el, i)}
                  onClick={() => history.push(`/detail/${m.id}`)}
                  className={`result-card ${resActive && resIndex === i ? 'focused tv-focus-outline' : ''}`}
                >
                  <img src={m.image} className="result-thumb" alt={m.title} />
                  <div className="result-info">
                    <h4>{m.title}</h4>
                    <p>{m.duration} • {m.rating}</p>
                  </div>
                </div>
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

const SearchPage: React.FC = () => (
  <FocusProvider>
    <SearchInner />
  </FocusProvider>
);

export default SearchPage;
