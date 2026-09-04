import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router';

let instance: Lenis | null = null;
export const getLenis = () => instance;

export function SmoothScroll({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    instance = lenis;
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); instance = null; };
  }, []);
  useEffect(() => {
    instance?.scrollTo(0, { immediate: true });
    if (!instance) window.scrollTo(0, 0);
  }, [pathname]);
  return <>{children}</>;
}
