import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface FocusContextType {
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  register: (id: string, ref: React.RefObject<HTMLElement>, metadata?: any) => void;
  unregister: (id: string) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const elements = useRef<Map<string, { ref: React.RefObject<HTMLElement>; metadata?: any }>>(new Map());

  const register = useCallback((id: string, ref: React.RefObject<HTMLElement>, metadata?: any) => {
    elements.current.set(id, { ref, metadata });
    if (!focusedId) setFocusedId(id);
  }, [focusedId]);

  const unregister = useCallback((id: string) => {
    elements.current.delete(id);
  }, []);

  useEffect(() => {
    // Ensure focus is never lost
    if (!focusedId && elements.current.size > 0) {
      setFocusedId(Array.from(elements.current.keys())[0]);
    }
    
    const interval = setInterval(() => {
      if (focusedId && !elements.current.has(focusedId)) {
        if (elements.current.size > 0) {
          setFocusedId(Array.from(elements.current.keys())[0]);
        } else {
          setFocusedId(null);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [focusedId]);

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!focusedId) return;

    const currentElem = elements.current.get(focusedId);
    if (!currentElem?.ref.current) return;

    // Special logic for Top Menu right end
    if (direction === 'right' && (focusedId as string).startsWith('nav-')) {
       // Check if this is the last item in the nav group
       const navElements = Array.from(elements.current.keys())
         .filter(id => (id as string).startsWith('nav-'))
         .sort(); // Assuming alphabetical or predictable order if possible, but let's be more robust
       const isLastNav = focusedId === 'nav-search'; // Hardcoded for this specific app's last nav item
       if (isLastNav) return; 
    }

    // Special logic: Down from any Top Nav item -> Go to Banner
    if (direction === 'down' && (focusedId as string).startsWith('nav-')) {
       if (elements.current.has('banner-play')) {
         setFocusedId('banner-play');
         return;
       }
    }

    const currentRect = currentElem.ref.current.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestMatch: string | null = null;
    let minScore = Infinity;

    elements.current.forEach((value, id) => {
      if (id === focusedId) return;
      if (!value.ref.current) return;

      const targetRect = value.ref.current.getBoundingClientRect();
      const targetCenter = {
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2
      };

      // Check if target is in the correct directional half-plane
      let isInDirection = false;
      const threshold = 10; // Tolerance for alignment

      if (direction === 'left' && targetRect.right <= currentRect.left + threshold) {
        isInDirection = true;
      } else if (direction === 'right' && targetRect.left >= currentRect.right - threshold) {
        isInDirection = true;
      } else if (direction === 'up' && targetRect.bottom <= currentRect.top + threshold) {
        isInDirection = true;
      } else if (direction === 'down' && targetRect.top >= currentRect.bottom - threshold) {
        isInDirection = true;
      }

      if (!isInDirection) return;

      // Distance and alignment calculation
      const dx = Math.abs(targetCenter.x - currentCenter.x);
      const dy = Math.abs(targetCenter.y - currentCenter.y);
      
      let score = 0;
      if (direction === 'left' || direction === 'right') {
        // Favor targets that are closer horizontally and better aligned vertically
        score = dx + (dy * 3); 
      } else {
        // Favor targets that are closer vertically and better aligned horizontally
        score = dy + (dx * 3);
      }

      if (score < minScore) {
        minScore = score;
        bestMatch = id;
      }
    });

    if (bestMatch) {
      setFocusedId(bestMatch);
      const nextElem = elements.current.get(bestMatch);
      nextElem?.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [focusedId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          moveFocus('up');
          break;
        case 'ArrowDown':
          moveFocus('down');
          break;
        case 'ArrowLeft':
          moveFocus('left');
          break;
        case 'ArrowRight':
          moveFocus('right');
          break;
        case 'Enter':
          if (focusedId) {
            const current = elements.current.get(focusedId);
            current?.ref.current?.click();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) moveFocus('down');
      if (e.deltaY < 0) moveFocus('up');
      if (e.deltaX > 0) moveFocus('right');
      if (e.deltaX < 0) moveFocus('left');
    };

    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [focusedId, moveFocus]);

  return (
    <FocusContext.Provider value={{ focusedId, setFocusedId, register, unregister }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) throw new Error('useFocus must be used within a FocusProvider');
  return context;
};

export const useFocusable = (id: string, metadata?: any) => {
  const { focusedId, setFocusedId, register, unregister } = useFocus();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    register(id, ref, metadata);
    return () => unregister(id);
  }, [id, register, unregister, metadata]);

  const isFocused = focusedId === id;

  return { ref, isFocused, setFocus: () => setFocusedId(id) };
};
