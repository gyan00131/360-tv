import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import '../css/player.css';

interface PlayerParams {
  id: string;
}

const PlayerPage: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<PlayerParams>();

  const handleBack = () => {
    history.goBack();
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: 'black' }}>
      <VideoPlayer 
        url="https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8" 
        onBack={handleBack} 
      />
    </div>
  );
};

export default PlayerPage;
