import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

interface FocusContextType {
  focusedSection: string | null;
  setFocusedSection: (id: string | null) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  return (
    <FocusContext.Provider value={{ focusedSection, setFocusedSection }}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
};

// Each section calls this hook to manage its own focus
export const useSectionFocus = (sectionId: string, options: {
  itemCount: number;
  isVertical?: boolean;
  noDefaultNav?: boolean;
  onEnter?: (index: number) => void;
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
}) => {
  const { focusedSection, setFocusedSection } = useFocus();
  const isActive = focusedSection === sectionId;
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const activate = useCallback((index = 0) => {
    setFocusedSection(sectionId);
    setActiveIndex(index);
  }, [sectionId, setFocusedSection]);

  // Scroll active item into view
  useEffect(() => {
    if (isActive) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isActive, activeIndex]);

  useEffect(() => {
    if (!isActive) return;

    const handle = (e: KeyboardEvent) => {
      if (options.noDefaultNav) {
        if (e.key === 'Enter') { e.preventDefault(); options.onEnter?.(activeIndex); }
        return;
      }
      const prev = options.isVertical ? 'ArrowUp' : 'ArrowLeft';
      const next = options.isVertical ? 'ArrowDown' : 'ArrowRight';

      if (e.key === prev) {
        e.preventDefault();
        if (activeIndex > 0) setActiveIndex(i => i - 1);
        // left edge: do nothing (stay)
      } else if (e.key === next) {
        e.preventDefault();
        if (activeIndex < options.itemCount - 1) setActiveIndex(i => i + 1);
        // right edge: do nothing (stay)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        options.onUp?.();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        options.onDown?.();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        options.onEnter?.(activeIndex);
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isActive, activeIndex, options]);

  const setRef = useCallback((el: HTMLElement | null, index: number) => {
    itemRefs.current[index] = el;
  }, []);

  return { isActive, activeIndex, activate, setRef };
};
