import React, { useEffect, useState, useRef, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { FocusProvider, useFocus, useSectionFocus } from "../lib/focus/FocusContext";
import { MOVIES, SERIES } from "../constants";
import { Movie } from "../types/common-interface";
import { fetchBanners, fetchMovies, fetchTvShows } from "../lib/api";
import "../css/home.css";

import Header from "../components/Header";

const FALLBACK_BANNERS = [
  {
    id: "fallback-1",
    title: "Welcome to StreamVault",
    description: "Discover the best movies and series, curated just for you.",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80",
  },
  {
    id: "fallback-2",
    title: "Top Picks",
    description: "Our editors handpick the finest content every week.",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&q=80",
  },
];

// ─── Banner ────────────────────────────────────────────────────────────────

interface BannerProps {
  onDown: () => void;
  onUp: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const Banner: React.FC<BannerProps> = ({ onDown, onUp, containerRef }) => {
  const history = useHistory();
  const [slides, setSlides] = useState(FALLBACK_BANNERS);
  const [active, setActive] = useState(0);

  const bannerRef = useRef<HTMLDivElement>(null);

  const { isActive, activate } = useSectionFocus("banner", {
    itemCount: 1,
    onEnter: () => history.push(`/player/${slides[active].id}`),
    onUp,
    onDown,
  });

  useEffect(() => {
    fetchBanners()
      .then((d) => d?.length && setSlides(d))
      .catch(() => {});
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setActive((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  // Scroll container to top when banner is focused (coming from below)
  useEffect(() => {
    if (isActive) containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [isActive]);

  // Left/Right for carousel when banner is active
  useEffect(() => {
    if (!isActive) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((p) => (p - 1 + slides.length) % slides.length);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActive((p) => (p + 1) % slides.length);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isActive, slides.length]);

  const slide = slides[active];

  return (
    <div
      ref={bannerRef}
      className={`home-banner ${isActive ? "section-focused" : ""}`}
      onClick={() => activate()}
    >
      <div className="banner-inner">
      <img src={slide.image} className="banner-image" alt={slide.title} />
      <div className="banner-gradient" />

      <div className="banner-content">
        <div className="banner-meta">
          <span className="banner-badge">Original</span>
          <span className="banner-year">2024 • SCI-FI</span>
        </div>
        <h1 className="banner-title">{slide.title}</h1>
        <p className="banner-desc">{slide.description}</p>
        <button className={`banner-play-btn ${isActive ? "focused" : ""}`}>
          <Play size={24} fill={isActive ? "black" : "none"} />
          <span>Play Now</span>
        </button>
      </div>

      {slides.length > 1 && (
        <div className="banner-dots">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`banner-dot ${i === active ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setActive(i); }}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

// ─── Content Row ───────────────────────────────────────────────────────────

interface ContentRowProps {
  sectionId: string;
  title: string;
  items: Movie[];
  isVertical?: boolean;
  onUp: () => void;
  onDown?: () => void;
  onSelect: (movie: Movie) => void;
  initialFocus?: boolean;
}

const ContentRow: React.FC<ContentRowProps> = ({
  sectionId,
  title,
  items,
  isVertical,
  onUp,
  onDown,
  onSelect,
  initialFocus,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isActive, activeIndex, activate, setRef } = useSectionFocus(sectionId, {
    itemCount: items.length,
    onEnter: (i) => onSelect(items[i]),
    onUp,
    onDown,
  });

  useEffect(() => {
    if (initialFocus) activate(0);
  }, []);

  // Sync scroll container when activeIndex changes
  useEffect(() => {
    if (!isActive || !scrollRef.current) return;
    const el = scrollRef.current.children[activeIndex] as HTMLElement;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [isActive, activeIndex]);

  return (
    <div className={`content-row ${isActive ? "row-active" : ""}`}>
      <h3 className="row-title">{title}</h3>
      <div className="row-scroll" ref={scrollRef}>
        {items.map((movie, i) => (
          <div
            key={movie.id}
            ref={(el) => setRef(el, i)}
            className={`row-item ${isVertical ? "vertical" : "horizontal"} ${isActive && activeIndex === i ? "item-focused" : ""}`}
            onClick={() => { activate(i); onSelect(movie); }}
          >
            <img src={movie.image} alt={movie.title} />
            <div className="item-overlay">
              <span className="item-title">{movie.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── HomePage ──────────────────────────────────────────────────────────────

const SECTIONS = ["banner", "row-trending", "row-series"];

const HomePageInner: React.FC = () => {
  const history = useHistory();
  const { setFocusedSection } = useFocus();
  const containerRef = useRef<HTMLDivElement>(null);
  const [movies, setMovies] = useState(MOVIES.slice(0, 8));
  const [shows, setShows] = useState(SERIES.slice(0, 8));

  useEffect(() => {
    // Start with no section focused — header owns focus on load
    setFocusedSection(null);

    // When header presses Down, activate banner
    const onContentFocus = () => setFocusedSection('banner');
    window.addEventListener('content-focus', onContentFocus);

    Promise.all([fetchMovies(), fetchTvShows()])
      .then(([m, s]) => {
        if (m.length) setMovies(m);
        if (s.length) setShows(s);
      })
      .catch(() => {});

    return () => window.removeEventListener('content-focus', onContentFocus);
  }, []);

  const goTo = useCallback((section: string) => setFocusedSection(section), [setFocusedSection]);
  const goToHeader = useCallback(() => {
    setFocusedSection(null);
    window.dispatchEvent(new CustomEvent('header-focus'));
  }, [setFocusedSection]);

  return (
    <div className="home-container tv-scroll-hide" ref={containerRef} style={{ height: '100vh', overflowY: 'auto' }}>
      <Header />
      <Banner onDown={() => goTo("row-trending")} onUp={goToHeader} containerRef={containerRef} />

      <ContentRow
        sectionId="row-trending"
        title="Trending Now"
        items={movies}
        onUp={() => goTo("banner")}
        onDown={() => goTo("row-series")}
        onSelect={(m) => history.push(`/detail/${m.id}`)}
      />

      <ContentRow
        sectionId="row-series"
        title="Exclusive Series"
        items={shows}
        isVertical
        onUp={() => goTo("row-trending")}
        onSelect={(m) => history.push(`/detail/${m.id}`)}
      />
    </div>
  );
};

const HomePage: React.FC = () => (
  <FocusProvider>
    <HomePageInner />
  </FocusProvider>
);

export default HomePage;
