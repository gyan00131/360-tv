import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface FocusContextType {
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  register: (id: string, ref: React.RefObject<HTMLElement>, metadata?: any) => void;
  unregister: (id: string) => void;
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

interface FocusEntry {
  ref: React.RefObject<HTMLElement>;
  metadata?: any;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);



export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const elements = useRef<Map<string, FocusEntry>>(new Map());
  const navLockRef = useRef(false);
  const hasFocusRef = useRef(false);

  const register = useCallback((id: string, ref: React.RefObject<HTMLElement>, metadata?: any) => {
    elements.current.set(id, { ref, metadata });
    if (!hasFocusRef.current) {
      hasFocusRef.current = true;
      setFocusedId(id);
    }
  }, []);

  const unregister = useCallback((id: string) => {
    elements.current.delete(id);
    setFocusedId(prev => {
      if (prev === id) {
        const next = Array.from(elements.current.keys())[0] ?? null;
        if (!next) hasFocusRef.current = false;
        return next;
      }
      return prev;
    });
  }, []);

  const getFocusableEntries = () => Array.from(elements.current.entries()).filter(([, entry]) => Boolean(entry.ref.current));

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!focusedId || navLockRef.current) return;

    const currentEntry = elements.current.get(focusedId);
    if (!currentEntry?.ref.current) return;

    navLockRef.current = true;
    setTimeout(() => {
      navLockRef.current = false;
    }, 300);

    const currentRect = currentEntry.ref.current.getBoundingClientRect();
    const currentCenterY = currentRect.top + currentRect.height / 2;
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const ROW_THRESHOLD = 20;

    const candidates = getFocusableEntries()
      .filter(([id]) => id !== focusedId)
      .map(([id, entry]) => {
        const rect = entry.ref.current!.getBoundingClientRect();
        return { id, centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 };
      });

    if (candidates.length === 0) return;

    let nextId: string | null = null;

    if (direction === 'left' || direction === 'right') {
      const sameRow = candidates.filter(c => Math.abs(c.centerY - currentCenterY) < ROW_THRESHOLD);
      if (direction === 'right') {
        const right = sameRow.filter(c => c.centerX > currentCenterX).sort((a, b) => a.centerX - b.centerX);
        nextId = right[0]?.id ?? sameRow.sort((a, b) => a.centerX - b.centerX)[0]?.id ?? null;
      } else {
        const left = sameRow.filter(c => c.centerX < currentCenterX).sort((a, b) => b.centerX - a.centerX);
        nextId = left[0]?.id ?? sameRow.sort((a, b) => b.centerX - a.centerX)[0]?.id ?? null;
      }
    } else {
      if (direction === 'down') {
        const below = candidates.filter(c => c.centerY > currentCenterY + ROW_THRESHOLD);
        const pool = below.length > 0 ? below : candidates;
        nextId = pool.sort((a, b) => {
          const dy = below.length > 0 ? a.centerY - b.centerY : a.centerY - b.centerY;
          if (Math.abs(dy) > ROW_THRESHOLD) return dy;
          return Math.abs(a.centerX - currentCenterX) - Math.abs(b.centerX - currentCenterX);
        })[0]?.id ?? null;
      } else {
        const above = candidates.filter(c => c.centerY < currentCenterY - ROW_THRESHOLD);
        const pool = above.length > 0 ? above : candidates;
        nextId = pool.sort((a, b) => {
          const dy = above.length > 0 ? b.centerY - a.centerY : b.centerY - a.centerY;
          if (Math.abs(dy) > ROW_THRESHOLD) return dy;
          return Math.abs(a.centerX - currentCenterX) - Math.abs(b.centerX - currentCenterX);
        })[0]?.id ?? null;
      }
    }

    if (nextId) {
      setFocusedId(nextId);
      const nextElem = elements.current.get(nextId);
      nextElem?.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [focusedId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Escape') {
        e.preventDefault();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveFocus('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus('right');
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedId) {
            const current = elements.current.get(focusedId);
            current?.ref.current?.click();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusedId, moveFocus]);

  return (
    <FocusContext.Provider value={{ focusedId, setFocusedId, register, unregister, moveFocus }}>
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

  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  useEffect(() => {
    register(id, ref, metadataRef.current);
    return () => unregister(id);
  }, [id, register, unregister]);

  const isFocused = focusedId === id;

  return { ref, isFocused, setFocus: () => setFocusedId(id) };
};
