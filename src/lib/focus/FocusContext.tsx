import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

// ----------------------------------------------------------------------
// Types – now only numbers
// ----------------------------------------------------------------------

export interface KeyMap {
  up?: number | number[];
  down?: number | number[];
  left?: number | number[];
  right?: number | number[];
  select?: number | number[];
  back?: number | number[];
  exit?: number | number[];
}

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

interface FocusProviderProps {
  children: React.ReactNode;
  /** Custom key mappings – numbers only (keyCode values) */
  keyMap?: Partial<KeyMap>;
}

// ----------------------------------------------------------------------
// Default numeric key codes (common TV remote / keyboard)
// ----------------------------------------------------------------------

const defaultKeyMap: Required<KeyMap> = {
  up: 38,        // ArrowUp
  down: 40,      // ArrowDown
  left: 37,      // ArrowLeft
  right: 39,     // ArrowRight
  select: 13,    // Enter
  back: 8,       // Backspace
  exit: 27,      // Escape
};

// ----------------------------------------------------------------------
// Context
// ----------------------------------------------------------------------

const FocusContext = createContext<FocusContextType | undefined>(undefined);

// ----------------------------------------------------------------------
// Provider
// ----------------------------------------------------------------------

export const FocusProvider: React.FC<FocusProviderProps> = ({
  children,
  keyMap: userKeyMap = {},
}) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const elements = useRef<Map<string, FocusEntry>>(new Map());
  const navLockRef = useRef(false);
  const hasFocusRef = useRef(false);

  // Merge user mappings with defaults
  const mergedKeyMap = useMemo<Required<KeyMap>>(
    () => ({
      ...defaultKeyMap,
      ...userKeyMap,
    }),
    [userKeyMap]
  );

  // Build a single Map<number, string> for O(1) numeric lookups
  const actionMap = useMemo(() => {
    const map = new Map<number, string>();

    const add = (action: string, codes: number | number[]) => {
      const arr = Array.isArray(codes) ? codes : [codes];
      arr.forEach((code) => {
        map.set(code, action);
      });
    };

    add('up', mergedKeyMap.up);
    add('down', mergedKeyMap.down);
    add('left', mergedKeyMap.left);
    add('right', mergedKeyMap.right);
    add('select', mergedKeyMap.select);
    add('back', mergedKeyMap.back);
    add('exit', mergedKeyMap.exit);

    return map;
  }, [mergedKeyMap]);

  // ----------------------------------------------------------------------
  // Registration
  // ----------------------------------------------------------------------

  const register = useCallback(
    (id: string, ref: React.RefObject<HTMLElement>, metadata?: any) => {
      elements.current.set(id, { ref, metadata });
      if (!hasFocusRef.current) {
        hasFocusRef.current = true;
        setFocusedId(id);
      }
    },
    []
  );

  const unregister = useCallback((id: string) => {
    elements.current.delete(id);
    setFocusedId((prev) => {
      if (prev === id) {
        const next = Array.from(elements.current.keys())[0] ?? null;
        if (!next) hasFocusRef.current = false;
        return next;
      }
      return prev;
    });
  }, []);

  // ----------------------------------------------------------------------
  // Navigation logic (unchanged)
  // ----------------------------------------------------------------------

  const getFocusableEntries = () =>
    Array.from(elements.current.entries()).filter(([, entry]) =>
      Boolean(entry.ref.current)
    );

  const moveFocus = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
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

      // Get all focusable candidates
      let candidates = getFocusableEntries()
        .filter(([id]) => id !== focusedId)
        .map(([id, entry]) => ({
          id,
          centerX:
            entry.ref.current!.getBoundingClientRect().left +
            entry.ref.current!.getBoundingClientRect().width / 2,
          centerY:
            entry.ref.current!.getBoundingClientRect().top +
            entry.ref.current!.getBoundingClientRect().height / 2,
          metadata: entry.metadata,
        }));

      // For left/right, restrict to same group (shelf)
      if (direction === 'left' || direction === 'right') {
        const currentGroup = currentEntry.metadata?.groupId;
        if (currentGroup !== undefined) {
          candidates = candidates.filter(
            (c) => c.metadata?.groupId === currentGroup
          );
        }
      }

      if (candidates.length === 0) return;

      let nextId: string | null = null;

      if (direction === 'left' || direction === 'right') {
        const sameRow = candidates.filter(
          (c) => Math.abs(c.centerY - currentCenterY) < ROW_THRESHOLD
        );
        if (direction === 'right') {
          const right = sameRow
            .filter((c) => c.centerX > currentCenterX)
            .sort((a, b) => a.centerX - b.centerX);
          nextId =
            right[0]?.id ??
            sameRow.sort((a, b) => a.centerX - b.centerX)[0]?.id ??
            null;
        } else {
          const left = sameRow
            .filter((c) => c.centerX < currentCenterX)
            .sort((a, b) => b.centerX - a.centerX);
          nextId =
            left[0]?.id ??
            sameRow.sort((a, b) => b.centerX - a.centerX)[0]?.id ??
            null;
        }
      } else {
        // Up / Down – allow moving across groups
        if (direction === 'down') {
          const below = candidates.filter(
            (c) => c.centerY > currentCenterY + ROW_THRESHOLD
          );
          const pool = below.length > 0 ? below : candidates;
          nextId = pool
            .sort((a, b) => {
              const dy = below.length > 0 ? a.centerY - b.centerY : a.centerY - b.centerY;
              if (Math.abs(dy) > ROW_THRESHOLD) return dy;
              return (
                Math.abs(a.centerX - currentCenterX) -
                Math.abs(b.centerX - currentCenterX)
              );
            })[0]?.id ?? null;
        } else {
          const above = candidates.filter(
            (c) => c.centerY < currentCenterY - ROW_THRESHOLD
          );
          const pool = above.length > 0 ? above : candidates;
          nextId = pool
            .sort((a, b) => {
              const dy = above.length > 0 ? b.centerY - a.centerY : b.centerY - a.centerY;
              if (Math.abs(dy) > ROW_THRESHOLD) return dy;
              return (
                Math.abs(a.centerX - currentCenterX) -
                Math.abs(b.centerX - currentCenterX)
              );
            })[0]?.id ?? null;
        }
      }

      if (nextId) {
        setFocusedId(nextId);
        const nextElem = elements.current.get(nextId);
        nextElem?.ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    },
    [focusedId]
  );

  // ----------------------------------------------------------------------
  // Keyboard event handler – uses numeric keyCode only (fast Map lookup)
  // ----------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = actionMap.get(e.keyCode); // direct numeric lookup

      if (!action) return;

      e.preventDefault();

      switch (action) {
        case 'up':
          moveFocus('up');
          break;
        case 'down':
          moveFocus('down');
          break;
        case 'left':
          moveFocus('left');
          break;
        case 'right':
          moveFocus('right');
          break;
        case 'select':
          if (focusedId) {
            const current = elements.current.get(focusedId);
            current?.ref.current?.click();
          }
          break;
        case 'back':
        case 'exit':
          // Custom back/exit logic can be added here via callbacks
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusedId, moveFocus, actionMap]);

  // ----------------------------------------------------------------------
  // Provider value
  // ----------------------------------------------------------------------

  return (
    <FocusContext.Provider
      value={{ focusedId, setFocusedId, register, unregister, moveFocus }}
    >
      {children}
    </FocusContext.Provider>
  );
};

// ----------------------------------------------------------------------
// Hooks (unchanged)
// ----------------------------------------------------------------------

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