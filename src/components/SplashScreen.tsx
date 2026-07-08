import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'var(--color-tv-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [1, 1.1, 1], opacity: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ display: 'flex', alignItems: 'center', gap: '24px' }}
      >
        <div style={{ width: '96px', height: '96px', backgroundColor: 'var(--color-tv-accent)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(45deg)' }}>
          <Play size={48} fill="white" style={{ transform: 'rotate(-45deg)', marginLeft: '4px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <span style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-0.05em', color: 'white', fontStyle: 'italic', textTransform: 'uppercase' }}>JET STREAM</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.4em', color: 'var(--color-tv-accent)', textTransform: 'uppercase' }}>Loading Core Engine</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
