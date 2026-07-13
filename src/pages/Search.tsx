import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { FocusProvider, useFocus, useSectionFocus } from '../lib/focus/FocusContext';
import Header from '../components/Header';
import { fetchSearchResults } from '../lib/api';
import { Movie } from '../types/common-interface';
import '../css/search.css';

// ── Keyboard layout ──────────────────────────────────────────────
// 6 cols × 6 rows = 36 keys + 2 wide keys (SPACE, CLR) on last row
const ALPHA_ROWS = [
  ['A','B','C','D','E','F'],
  ['G','H','I','J','K','L'],
  ['M','N','O','P','Q','R'],
  ['S','T','U','V','W','X'],
  ['Y','Z','1','2','3','4'],
  ['5','6','7','8','9','0'],
];
const ALPHA_KEYS = ALPHA_ROWS.flat(); // 36 keys, indices 0-35
const ACTION_KEYS = ['SPACE', 'DEL', 'CLR']; // indices 36, 37, 38
const KEYS = [...ALPHA_KEYS, ...ACTION_KEYS];
const KEY_COLS = 6;
const ALPHA_COUNT = ALPHA_KEYS.length; // 36

const RES_COLS = 2;

const SearchInner: React.FC = () => {
  const history = useHistory();
  const { setFocusedSection } = useFocus();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  // ── fetch results ────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      try { setResults(await fetchSearchResults(query)); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const pressKey = useCallback((key: string) => {
    if (key === 'DEL') setQuery(p => p.slice(0, -1));
    else if (key === 'CLR') setQuery('');
    else if (key === 'SPACE') setQuery(p => p + ' ');
    else setQuery(p => p + key);
  }, []);

  const goToHeader = useCallback(() => {
    setFocusedSection(null);
    window.dispatchEvent(new CustomEvent('header-focus'));
  }, [setFocusedSection]);

  // ── keyboard section ─────────────────────────────────────────────
  const { isActive: kbActive, activeIndex: kbIndex, activate: activateKb, setRef: setKbRef } =
    useSectionFocus('search-keyboard', {
      itemCount: KEYS.length,
      isVertical: true,
      noDefaultNav: true,
      onEnter: (i) => pressKey(KEYS[i]),
    });

  // ── results section ──────────────────────────────────────────────
  const { isActive: resActive, activeIndex: resIndex, activate: activateResults, setRef: setResRef } =
    useSectionFocus('search-results', {
      itemCount: results.length,
      isVertical: true,
      noDefaultNav: true,
      onEnter: (i) => { if (results[i]) history.push(`/detail/${results[i].id}`); },
    });

  // ── keyboard nav ─────────────────────────────────────────────────
  useEffect(() => {
    if (!kbActive) return;
    const handle = (e: KeyboardEvent) => {
      const isAlpha = kbIndex < ALPHA_COUNT;
      const col = isAlpha ? kbIndex % KEY_COLS : (kbIndex - ALPHA_COUNT) * 2; // action: SPACE=0, DEL=2, CLR=4
      const row = isAlpha ? Math.floor(kbIndex / KEY_COLS) : ALPHA_ROWS.length;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isAlpha) {
          if (col > 0) activateKb(kbIndex - 1);
        } else {
          // action row: SPACE(0)→stay, DEL(1)→SPACE(0), CLR(2)→DEL(1)
          const ai = kbIndex - ALPHA_COUNT;
          if (ai > 0) activateKb(ALPHA_COUNT + ai - 1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isAlpha) {
          if (col < KEY_COLS - 1) activateKb(kbIndex + 1);
          else if (results.length > 0) activateResults(0);
        } else {
          const ai = kbIndex - ALPHA_COUNT;
          if (ai < ACTION_KEYS.length - 1) activateKb(ALPHA_COUNT + ai + 1);
          else if (results.length > 0) activateResults(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (isAlpha) {
          if (row > 0) activateKb(kbIndex - KEY_COLS);
          else goToHeader();
        } else {
          // action → last alpha row, map col back: SPACE→col0, DEL→col2, CLR→col4
          const ai = kbIndex - ALPHA_COUNT;
          const targetCol = ai * 2;
          activateKb(ALPHA_COUNT - KEY_COLS + targetCol);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (isAlpha) {
          if (kbIndex + KEY_COLS < ALPHA_COUNT) {
            activateKb(kbIndex + KEY_COLS);
          } else {
            // bottom alpha row → action row: cols 0-1→SPACE, 2-3→DEL, 4-5→CLR
            const ai = Math.floor(col / 2);
            activateKb(ALPHA_COUNT + ai);
          }
        }
        // action row bottom: stay
      } else if (e.key === 'Enter') {
        e.preventDefault();
        pressKey(KEYS[kbIndex]);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [kbActive, kbIndex, results.length, activateKb, activateResults, pressKey, goToHeader]);

  // ── results nav ──────────────────────────────────────────────────
  useEffect(() => {
    if (!resActive) return;
    const handle = (e: KeyboardEvent) => {
      const col = resIndex % RES_COLS;
      const row = Math.floor(resIndex / RES_COLS);

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (col > 0) activateResults(resIndex - 1);
        else activateKb(ALPHA_COUNT - 1); // left edge → keyboard last alpha
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (col < RES_COLS - 1 && resIndex + 1 < results.length) activateResults(resIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (row > 0) activateResults(resIndex - RES_COLS);
        else goToHeader(); // top row → header
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (resIndex + RES_COLS < results.length) activateResults(resIndex + RES_COLS);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[resIndex]) history.push(`/detail/${results[resIndex].id}`);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [resActive, resIndex, results, activateResults, activateKb, goToHeader, history]);

  // ── header → content ─────────────────────────────────────────────
  useEffect(() => {
    const onContentFocus = () => activateKb(0);
    window.addEventListener('content-focus', onContentFocus);
    return () => window.removeEventListener('content-focus', onContentFocus);
  }, []);

  useEffect(() => { activateKb(0); }, []);

  return (
    <div className="search-container tv-scroll-hide" style={{ height: '100vh', overflowY: 'auto' }}>
      <Header />
      <div className="search-body">
        {/* ── LEFT: keyboard 40% ── */}
        <div className="search-left">
          <div className="search-buffer-box">
            <span className="search-buffer-label">Search</span>
            <div className="search-buffer-text">
              {query || <span className="search-placeholder">Type to search...</span>}
              <span className="search-cursor">|</span>
            </div>
          </div>

          <div className="keyboard-grid">
            {ALPHA_KEYS.map((key, i) => (
              <button
                key={key + i}
                ref={(el) => setKbRef(el, i)}
                onClick={() => pressKey(key)}
                className={`keyboard-key ${kbActive && kbIndex === i ? 'focused' : ''}`}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="keyboard-actions">
            <button
              ref={(el) => setKbRef(el, ALPHA_COUNT)}
              onClick={() => pressKey('SPACE')}
              className={`keyboard-action-btn ${kbActive && kbIndex === ALPHA_COUNT ? 'focused' : ''}`}
            >
              ⎵ Space
            </button>
            <button
              ref={(el) => setKbRef(el, ALPHA_COUNT + 1)}
              onClick={() => pressKey('DEL')}
              className={`keyboard-action-btn ${kbActive && kbIndex === ALPHA_COUNT + 1 ? 'focused' : ''}`}
            >
              ⌫ Del
            </button>
            <button
              ref={(el) => setKbRef(el, ALPHA_COUNT + 2)}
              onClick={() => pressKey('CLR')}
              className={`keyboard-action-btn keyboard-action-clr ${kbActive && kbIndex === ALPHA_COUNT + 2 ? 'focused' : ''}`}
            >
              ✕ Clear
            </button>
          </div>
        </div>

        {/* ── RIGHT: results 60% ── */}
        <div className="search-right">
          <h3 className="results-title">
            {query ? `Results for "${query}"` : 'Live Results'}
          </h3>

          {!query.trim() ? (
            <div className="awaiting-input">
              <span className="awaiting-text">Start Typing...</span>
            </div>
          ) : loading ? (
            <div className="awaiting-input">
              <span className="awaiting-text">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="awaiting-input">
              <span className="awaiting-text">No Results</span>
            </div>
          ) : (
            <div className="results-grid">
              {results.map((m, i) => (
                <div
                  key={`${m.id}-${i}`}
                  ref={(el) => setResRef(el, i)}
                  onClick={() => { activateResults(i); history.push(`/detail/${m.id}`); }}
                  className={`result-card ${resActive && resIndex === i ? 'focused' : ''}`}
                >
                  <img src={m.image} className="result-thumb" alt={m.title} />
                  <div className="result-info">
                    <h4>{m.title}</h4>
                    <p>{m.duration} • {m.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
