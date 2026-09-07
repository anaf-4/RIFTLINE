import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Orientation = 'landscape' | 'portrait';

const OrientationContext = createContext<Orientation>('landscape');

function detect(): Orientation {
  if (typeof document === 'undefined') return 'landscape';
  const el = document.documentElement;
  return el.clientHeight > el.clientWidth ? 'portrait' : 'landscape';
}

export function OrientationProvider({ children }: { children: ReactNode }) {
  const [orientation, setOrientation] = useState<Orientation>(detect());

  useEffect(() => {
    function update() {
      setOrientation(detect());
    }
    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return <OrientationContext.Provider value={orientation}>{children}</OrientationContext.Provider>;
}

export function useOrientation(): Orientation {
  return useContext(OrientationContext);
}
