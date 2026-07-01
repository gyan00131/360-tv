import React, { useEffect, useRef, useState } from 'react';
import shaka from 'shaka-player';
import { Settings as SettingsIcon, Check, Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
import { useFocusable, FocusProvider } from '../lib/focus/FocusContext';
import { AnimatePresence, motion } from 'motion/react';
import { formatTime } from '../lib/util';
import '../css/player.css';

interface VideoPlayerProps {
  url: string;
  onBack: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<shaka.Player | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'root' | 'quality' | 'audio' | 'cc'>('root');
  
  // Playback States
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // States for player tracks
  const [qualities, setQualities] = useState<shaka.extern.Track[]>([]);
  const [audioTracks, setAudioTracks] = useState<shaka.extern.Track[]>([]);
  const [ccTracks, setCcTracks] = useState<shaka.extern.Track[]>([]);
  
  const [currentQuality, setCurrentQuality] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [currentCc, setCurrentCc] = useState<string | null>(null);

  const { ref: settingsBtnRef, isFocused: settingsFocused } = useFocusable('player-settings');
  const { ref: backBtnRef, isFocused: backFocused } = useFocusable('player-exit');
  const { ref: playPauseRef, isFocused: playPauseFocused, setFocus: setCenterFocus } = useFocusable('player-play-pause');
  const { ref: rewindRef, isFocused: rewindFocused } = useFocusable('player-rewind');
  const { ref: forwardRef, isFocused: forwardFocused } = useFocusable('player-forward');

  useEffect(() => {
    // Initial focus on center play/pause
    const timer = setTimeout(() => {
      setCenterFocus();
    }, 600);
    return () => clearTimeout(timer);
  }, [setCenterFocus]);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings) {
        setShowControls(false);
      }
    }, 4000);
  };

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      // Any key interaction brings back the controls
      resetControlsTimeout();

      if (e.key === 'Backspace' || e.key === 'Escape') {
        if (showSettings) {
          if (settingsView !== 'root') {
            setSettingsView('root');
          } else {
            setShowSettings(false);
          }
          e.stopPropagation();
          e.preventDefault();
          return;
        }
      }

      if (!showSettings) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (isAdPlaying) return; 
          
          if (!settingsFocused && !backFocused && !playPauseFocused && !rewindFocused && !forwardFocused) {
            if (videoRef.current) {
              if (videoRef.current.paused) videoRef.current.play();
              else videoRef.current.pause();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeys, true);
    return () => {
      window.removeEventListener('keydown', handleKeys, true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showSettings, settingsView, settingsFocused, backFocused, playPauseFocused, rewindFocused, forwardFocused]);

  useEffect(() => {
    const initPlayer = async () => {
      if (!videoRef.current) return;

      shaka.polyfill.installAll();
      if (!shaka.Player.isBrowserSupported()) {
        console.error('Browser not supported for shaka player');
        return;
      }

      const playerInstance = new shaka.Player(videoRef.current);
      setPlayer(playerInstance);

      videoRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(videoRef.current?.currentTime || 0);
      });
      videoRef.current.addEventListener('loadedmetadata', () => {
        setDuration(videoRef.current?.duration || 0);
      });
      videoRef.current.addEventListener('play', () => setIsPlaying(true));
      videoRef.current.addEventListener('pause', () => setIsPlaying(false));

      playerInstance.addEventListener('error', (event: any) => {
        console.error('Shaka error:', event.detail);
      });

      try {
        await playerInstance.load(url);
        updateTracks(playerInstance);
        
        const google = (window as any).google;
        if (google && google.ima) {
          try {
            const adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=';
            const adDisplayContainer = new google.ima.AdDisplayContainer(containerRef.current, videoRef.current);
            const adsLoader = new google.ima.AdsLoader(adDisplayContainer);
            
            adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, 
              (e: any) => {
                const adsManager = e.getAdsManager(videoRef.current);
                adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => {
                  setIsAdPlaying(true);
                  setShowControls(false);
                  if (videoRef.current) videoRef.current.pause();
                });
                adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => {
                  setIsAdPlaying(false);
                  if (videoRef.current) videoRef.current.play();
                });
                adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
                  setIsAdPlaying(false);
                  if (videoRef.current) videoRef.current.play();
                });
                adsManager.init(videoRef.current?.clientWidth || 1920, videoRef.current?.clientHeight || 1080, google.ima.ViewMode.NORMAL);
                adsManager.start();
              }, false);

            const adsRequest = new google.ima.AdsRequest();
            adsRequest.adTagUrl = adTagUrl;
            adDisplayContainer.initialize();
            adsLoader.requestAds(adsRequest);
          } catch (imaErr) {
            console.error('Failed to initialize IMA:', imaErr);
          }
        }
      } catch (e) {
        console.error('Error loading video content:', e);
      }
    };

    initPlayer();
    return () => {
      if (player) player.destroy();
    };
  }, [url]);

  const updateTracks = (p: shaka.Player) => {
    const variants = p.getVariantTracks();
    const text = p.getTextTracks();
    const uniqueQualities = variants.filter((v, i, self) => 
      i === self.findIndex((t) => t.height === v.height)
    ).sort((a, b) => (b.height || 0) - (a.height || 0));
    setQualities(uniqueQualities);
    const uniqueAudio = variants.filter((v, i, self) => 
      i === self.findIndex((t) => t.language === v.language)
    );
    setAudioTracks(uniqueAudio);
    setCcTracks(text);
    const activeVariant = variants.find(v => v.active);
    if (activeVariant) {
      setCurrentQuality(activeVariant.height || null);
      setCurrentAudio(activeVariant.language);
    }
    const activeText = text.find(t => t.active);
    if (activeText) setCurrentCc(activeText.language);
  };

  const selectQuality = (height: number) => {
    if (!player) return;
    const track = qualities.find(q => q.height === height);
    if (track) {
      player.configure({ abr: { enabled: false } });
      player.selectVariantTrack(track, true);
      setCurrentQuality(height);
    }
  };

  const selectAudio = (lang: string) => {
    if (!player) return;
    player.selectAudioLanguage(lang);
    setCurrentAudio(lang);
  };

  const selectCc = (lang: string | null) => {
    if (!player) return;
    if (lang === null) {
      player.setTextTrackVisibility(false);
      setCurrentCc(null);
    } else {
      player.setTextTrackVisibility(true);
      const track = ccTracks.find(t => t.language === lang);
      if (track) player.selectTextTrack(track);
      setCurrentCc(lang);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveShowControls = showControls && !isAdPlaying;

  return (
    <div 
      ref={containerRef} 
      className="player-container"
      onMouseMove={resetControlsTimeout}
    >
      <video ref={videoRef} className="player-video" autoPlay playsInline />

      {/* Center Controls */}
      <AnimatePresence>
        {effectiveShowControls && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="center-controls"
          >
            <button
              ref={rewindRef as any}
              onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; resetControlsTimeout(); }}
              className={`control-btn small ${rewindFocused ? 'focused' : ''}`}
            >
              <RotateCcw size={40} />
            </button>
            <button
              ref={playPauseRef as any}
              onClick={() => { 
                if (videoRef.current) {
                  if (videoRef.current.paused) videoRef.current.play();
                  else videoRef.current.pause();
                }
                resetControlsTimeout();
              }}
              className={`control-btn large ${playPauseFocused ? 'focused' : ''}`}
            >
              {isPlaying ? <Pause size={64} fill="currentColor" /> : <Play size={64} fill="currentColor" style={{ marginLeft: '8px' }} />}
            </button>
            <button
              ref={forwardRef as any}
              onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; resetControlsTimeout(); }}
              className={`control-btn small ${forwardFocused ? 'focused' : ''}`}
            >
              <RotateCw size={40} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {effectiveShowControls && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="top-bar">
              <button 
                ref={backBtnRef as any}
                onClick={onBack}
                className={`btn-primary ${backFocused ? 'focused' : ''}`}
                style={{ fontSize: '16px', padding: '12px 32px' }}
              >
                Exit Player
              </button>
              <button 
                ref={settingsBtnRef as any}
                onClick={() => setShowSettings(!showSettings)}
                className={`control-btn small ${settingsFocused ? 'focused' : ''}`}
                style={{ padding: '16px' }}
              >
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
            <motion.div 
              initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
              className="settings-panel"
            >
              <h2 style={{ fontSize: '32px', marginBottom: '40px', textTransform: 'uppercase', fontStyle: 'italic', color: 'white' }}>Player Settings</h2>
              <FocusProvider>
                <div className="tv-scroll-hide" style={{ overflowY: 'auto' }}>
                  {settingsView === 'root' && (
                    <>
                      <SettingItem label="Quality" value={currentQuality ? `${currentQuality}p` : 'Auto'} onClick={() => setSettingsView('quality')} id="set-quality" />
                      <SettingItem label="Language" value={currentAudio || 'Default'} onClick={() => setSettingsView('audio')} id="set-audio" />
                      <SettingItem label="Captions" value={currentCc || 'Off'} onClick={() => setSettingsView('cc')} id="set-cc" />
                      <button onClick={() => setShowSettings(false)} id="set-close" style={{ width: '100%', marginTop: '32px' }}>Close</button>
                    </>
                  )}
                  {settingsView === 'quality' && (
                    <>
                      <button onClick={() => setSettingsView('root')} style={{ marginBottom: '24px' }}>← Back</button>
                      {qualities.map(q => (
                        <SettingItem key={q.id} label={`${q.height}p`} active={currentQuality === q.height} onClick={() => { selectQuality(q.height!); setSettingsView('root'); }} id={`q-${q.height}`} />
                      ))}
                    </>
                  )}
                  {settingsView === 'audio' && (
                    <>
                      <button onClick={() => setSettingsView('root')} style={{ marginBottom: '24px' }}>← Back</button>
                      {audioTracks.map(t => (
                        <SettingItem key={t.id} label={t.language.toUpperCase()} active={currentAudio === t.language} onClick={() => { selectAudio(t.language); setSettingsView('root'); }} id={`a-${t.language}`} />
                      ))}
                    </>
                  )}
                </div>
              </FocusProvider>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingItem: React.FC<{ label: string; value?: string; active?: boolean; onClick: () => void; id: string }> = ({ label, value, active, onClick, id }) => {
  const { ref, isFocused } = useFocusable(id);
  return (
    <button ref={ref as any} onClick={onClick} className={`settings-item ${isFocused ? 'focused' : ''}`}>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '18px' }}>{label}</span>
        {value && <span style={{ fontSize: '14px', opacity: 0.5 }}>{value}</span>}
      </div>
      {active && <Check size={18} />}
    </button>
  );
};

export default VideoPlayer;
