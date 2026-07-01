import React from 'react';
import VideoPlayer from '../components/VideoPlayer';
import '../css/player.css';

interface PlayerPageProps {
  onBack: () => void;
}

const PlayerPage: React.FC<PlayerPageProps> = ({ onBack }) => {
  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: 'black' }}>
      <VideoPlayer 
        url="https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8" 
        onBack={onBack} 
      />
    </div>
  );
};

export default PlayerPage;
