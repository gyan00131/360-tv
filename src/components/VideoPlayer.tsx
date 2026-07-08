import React, { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';
import { Settings as SettingsIcon, Check, Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import { AnimatePresence, motion } from 'motion/react';
import { formatTime } from '../lib/util';
import '../css/player.css';

interface VideoPlayerProps {
  url: string;
  onBack: () => void;
}

// Controls: [rewind, play/pause, forward, settings, exit] = 5 items horizontal
const CTRL_REWIND = 0;
const CTRL_PLAY   = 1;
const CTRL_FWD    = 2;
const CTRL_SET    = 3;
const CTRL_EXIT   = 4;

const VideoPlayerInner: React.FC<VideoPlayerProps> = ({ url, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<shaka.Player | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'root' | 'quality' | 'audio' | 'cc'>('root');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [qualities, setQualities] = useState<shaka.extern.Track[]>([]);
  const [audioTracks, setAudioTracks] = useState<shaka.extern.Track[]>([]);
  const [ccTracks, setCcTracks] = useState<shaka.extern.Track[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [currentCc, setCurrentCc] = useState<string | null>(null);

  const { isActive, activeIndex, activate, setRef } = useSectionFocus('player-controls', {
    itemCount: 5,
    onEnter: (i) => {
      if (i === CTRL_REWIND) { if (videoRef.current) videoRef.current.currentTime -= 10; resetControlsTimeout(); }
      else if (i === CTRL_PLAY) { togglePlay(); }
      else if (i === CTRL_FWD) { if (videoRef.current) videoRef.current.currentTime += 10; resetControlsTimeout(); }
      else if (i === CTRL_SET) { setShowSettings(s => !s); }
      else if (i === CTRL_EXIT) { onBack(); }
    },
  });

  useEffect(() => { activate(CTRL_PLAY); }, []);

  const togglePlay = () => {
    if (!videoRef.current || isAdPlaying) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
    resetControlsTimeout();
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings) setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      resetControlsTimeout();
      if (e.key === 'Backspace' || e.key === 'Escape') {
        e.preventDefault();
        if (showSettings) {
          if (settingsView !== 'root') setSettingsView('root');
          else setShowSettings(false);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handle, true);
    return () => window.removeEventListener('keydown', handle, true);
  }, [showSettings, settingsView, onBack]);

  useEffect(() => {
    const initPlayer = async () => {
      if (!videoRef.current) return;
      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) return;
      const p = new shaka.Player(videoRef.current);
      setPlayer(p);
      videoRef.current.addEventListener('timeupdate', () => setCurrentTime(videoRef.current?.currentTime || 0));
      videoRef.current.addEventListener('loadedmetadata', () => setDuration(videoRef.current?.duration || 0));
      videoRef.current.addEventListener('play', () => setIsPlaying(true));
      videoRef.current.addEventListener('pause', () => setIsPlaying(false));
      p.addEventListener('error', (e: any) => console.error('Shaka error:', e.detail));
      try {
        await p.load(url);
        updateTracks(p);
      } catch (e) {
        console.error('Error loading video:', e);
      }
    };
    initPlayer();
    return () => { if (player) player.destroy(); };
  }, [url]);

  const updateTracks = (p: shaka.Player) => {
    const variants = p.getVariantTracks();
    const text = p.getTextTracks();
    const uq = variants.filter((v, i, s) => i === s.findIndex(t => t.height === v.height)).sort((a, b) => (b.height || 0) - (a.height || 0));
    setQualities(uq);
    const ua = variants.filter((v, i, s) => i === s.findIndex(t => t.language === v.language));
    setAudioTracks(ua);
    setCcTracks(text);
    const av = variants.find(v => v.active);
    if (av) { setCurrentQuality(av.height || null); setCurrentAudio(av.language); }
    const at = text.find(t => t.active);
    if (at) setCurrentCc(at.language);
  };

  const selectQuality = (height: number) => {
    if (!player) return;
    const track = qualities.find(q => q.height === height);
    if (track) { player.configure({ abr: { enabled: false } }); player.selectVariantTrack(track, true); setCurrentQuality(height); }
  };

  const selectAudio = (lang: string) => { if (!player) return; player.selectAudioLanguage(lang); setCurrentAudio(lang); };

  const selectCc = (lang: string | null) => {
    if (!player) return;
    if (lang === null) { player.setTextTrackVisibility(false); setCurrentCc(null); }
    else { player.setTextTrackVisibility(true); const t = ccTracks.find(t => t.language === lang); if (t) player.selectTextTrack(t); setCurrentCc(lang); }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveShowControls = showControls && !isAdPlaying;

  return (
    <div ref={containerRef} className="player-container" onMouseMove={resetControlsTimeout}>
      <video ref={videoRef} className="player-video" autoPlay playsInline />

      <AnimatePresence>
        {effectiveShowControls && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="center-controls">
            <button ref={(el) => setRef(el, CTRL_REWIND)} onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; resetControlsTimeout(); }} className={`control-btn small ${isActive && activeIndex === CTRL_REWIND ? 'focused' : ''}`}>
              <RotateCcw size={40} />
            </button>
            <button ref={(el) => setRef(el, CTRL_PLAY)} onClick={togglePlay} className={`control-btn large ${isActive && activeIndex === CTRL_PLAY ? 'focused' : ''}`}>
              {isPlaying ? <Pause size={64} fill="currentColor" /> : <Play size={64} fill="currentColor" style={{ marginLeft: '8px' }} />}
            </button>
            <button ref={(el) => setRef(el, CTRL_FWD)} onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; resetControlsTimeout(); }} className={`control-btn small ${isActive && activeIndex === CTRL_FWD ? 'focused' : ''}`}>
              <RotateCw size={40} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {effectiveShowControls && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="top-bar">
              <button ref={(el) => setRef(el, CTRL_EXIT)} onClick={onBack} className={`btn-primary ${isActive && activeIndex === CTRL_EXIT ? 'focused' : ''}`} style={{ fontSize: '16px', padding: '12px 32px' }}>
                Exit Player
              </button>
              <button ref={(el) => setRef(el, CTRL_SET)} onClick={() => setShowSettings(s => !s)} className={`control-btn small ${isActive && activeIndex === CTRL_SET ? 'focused' : ''}`} style={{ padding: '16px' }}>
                <SettingsIcon size={24} />
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bottom-bar">
              <div style={{ maxWidth: '90%', margin: '0 auto' }}>
                <div className="progress-container">
                  <motion.div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="player-timer-row">
                  <span style={{ color: 'white' }}>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <div className="settings-overlay">
            <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} className="settings-panel">
              <h2 style={{ fontSize: '32px', marginBottom: '40px', textTransform: 'uppercase', fontStyle: 'italic', color: 'white' }}>Player Settings</h2>
              <SettingsMenu
                settingsView={settingsView}
                setSettingsView={setSettingsView}
                currentQuality={currentQuality}
                currentAudio={currentAudio}
                currentCc={currentCc}
                qualities={qualities}
                audioTracks={audioTracks}
                ccTracks={ccTracks}
                selectQuality={selectQuality}
                selectAudio={selectAudio}
                selectCc={selectCc}
                onClose={() => setShowSettings(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SettingsMenuProps {
  settingsView: 'root' | 'quality' | 'audio' | 'cc';
  setSettingsView: (v: 'root' | 'quality' | 'audio' | 'cc') => void;
  currentQuality: number | null;
  currentAudio: string | null;
  currentCc: string | null;
  qualities: shaka.extern.Track[];
  audioTracks: shaka.extern.Track[];
  ccTracks: shaka.extern.Track[];
  selectQuality: (h: number) => void;
  selectAudio: (l: string) => void;
  selectCc: (l: string | null) => void;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = (props) => {
  const rootItems = ['Quality', 'Language', 'Captions', 'Close'];
  const { isActive, activeIndex, activate, setRef } = useSectionFocus('settings-menu', {
    itemCount: rootItems.length,
    onEnter: (i) => {
      if (i === 0) props.setSettingsView('quality');
      else if (i === 1) props.setSettingsView('audio');
      else if (i === 2) props.setSettingsView('cc');
      else props.onClose();
    },
  });

  useEffect(() => { activate(0); }, [props.settingsView]);

  if (props.settingsView === 'root') {
    return (
      <div className="tv-scroll-hide" style={{ overflowY: 'auto' }}>
        <button ref={(el) => setRef(el, 0)} onClick={() => props.setSettingsView('quality')} className={`settings-item ${isActive && activeIndex === 0 ? 'focused' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '18px' }}>Quality</span>
            <span style={{ fontSize: '14px', opacity: 0.5 }}>{props.currentQuality ? `${props.currentQuality}p` : 'Auto'}</span>
          </div>
        </button>
        <button ref={(el) => setRef(el, 1)} onClick={() => props.setSettingsView('audio')} className={`settings-item ${isActive && activeIndex === 1 ? 'focused' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '18px' }}>Language</span>
            <span style={{ fontSize: '14px', opacity: 0.5 }}>{props.currentAudio || 'Default'}</span>
          </div>
        </button>
        <button ref={(el) => setRef(el, 2)} onClick={() => props.setSettingsView('cc')} className={`settings-item ${isActive && activeIndex === 2 ? 'focused' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '18px' }}>Captions</span>
            <span style={{ fontSize: '14px', opacity: 0.5 }}>{props.currentCc || 'Off'}</span>
          </div>
        </button>
        <button ref={(el) => setRef(el, 3)} onClick={props.onClose} className={`settings-item ${isActive && activeIndex === 3 ? 'focused' : ''}`} style={{ marginTop: '32px' }}>
          Close
        </button>
      </div>
    );
  }

  const subItems = props.settingsView === 'quality'
    ? props.qualities.map(q => ({ label: `${q.height}p`, active: props.currentQuality === q.height, action: () => { props.selectQuality(q.height!); props.setSettingsView('root'); } }))
    : props.settingsView === 'audio'
    ? props.audioTracks.map(t => ({ label: t.language.toUpperCase(), active: props.currentAudio === t.language, action: () => { props.selectAudio(t.language); props.setSettingsView('root'); } }))
    : props.ccTracks.map(t => ({ label: t.language.toUpperCase(), active: props.currentCc === t.language, action: () => { props.selectCc(t.language); props.setSettingsView('root'); } }));

  return (
    <div className="tv-scroll-hide" style={{ overflowY: 'auto' }}>
      <button onClick={() => props.setSettingsView('root')} style={{ marginBottom: '24px' }}>← Back</button>
      {subItems.map((item, i) => (
        <button key={i} ref={(el) => setRef(el, i)} onClick={item.action} className={`settings-item ${isActive && activeIndex === i ? 'focused' : ''}`}>
          <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '18px' }}>{item.label}</span>
          {item.active && <Check size={18} />}
        </button>
      ))}
    </div>
  );
};

const VideoPlayer: React.FC<VideoPlayerProps> = (props) => (
  <FocusProvider>
    <VideoPlayerInner {...props} />
  </FocusProvider>
);

export default VideoPlayer;
