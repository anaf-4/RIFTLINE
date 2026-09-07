import { useEffect, useRef, useState, type ReactNode } from 'react';
import { OrientationProvider, useOrientation } from '../orientation';

const LANDSCAPE_W = 1280;
const LANDSCAPE_H = 720;
const PORTRAIT_W = 720;
const PORTRAIT_H = 1280;

function ScalerInner({ children }: { children: ReactNode }) {
  const orientation = useOrientation();
  const baseW = orientation === 'portrait' ? PORTRAIT_W : LANDSCAPE_W;
  const baseH = orientation === 'portrait' ? PORTRAIT_H : LANDSCAPE_H;
  const [scale, setScale] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;

    function update() {
      if (!parent) return;
      const sx = parent.clientWidth / baseW;
      const sy = parent.clientHeight / baseH;
      setScale(Math.min(sx, sy));
    }
    update();

    const ro = new ResizeObserver(update);
    ro.observe(parent);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [baseW, baseH]);

  return (
    <div
      ref={rootRef}
      style={{
        width: baseW,
        height: baseH,
        flexShrink: 0,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </div>
  );
}

export default function ViewportScaler({ children }: { children: ReactNode }) {
  return (
    <OrientationProvider>
      <ScalerInner>{children}</ScalerInner>
    </OrientationProvider>
  );
}
