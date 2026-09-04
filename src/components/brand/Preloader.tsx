import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const KEY = 'nw.preloaded';
const LETTERS = 'NOVA WHEELS'.split('');

export function usePreloadOnce() {
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem(KEY); } catch { return true; }
  });
  const done = () => {
    try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    setShow(false);
  };
  return { show, done };
}

/** Cinematic first-load: letters rise out of a mask, a hairline fills, the curtain lifts. */
export function Preloader({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    if (reduce) { onDone(); return; }
    const t = setTimeout(() => setExiting(true), 2050);
    return () => clearTimeout(t);
  }, [reduce, onDone]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!exiting && (
        <motion.div
          key="preloader"
          role="status"
          aria-label="Loading Nova Wheels"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: '#0f1012', color: '#f4f2ee' }}
          exit={{ y: '-100%', transition: { duration: 1.1, ease: [0.76, 0, 0.24, 1] } }}
        >
          <div className="overflow-hidden px-6">
            <div className="flex font-display font-medium uppercase text-[clamp(28px,6vw,72px)] tracking-[0.28em] leading-none">
              {LETTERS.map((ch, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
                >
                  {ch === ' ' ? ' ' : ch}
                </motion.span>
              ))}
            </div>
          </div>
          <motion.div
            className="mt-10 h-px w-[min(60vw,320px)] origin-left"
            style={{ background: 'rgb(244 242 238 / 0.35)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.p
            className="label-caps mt-6"
            style={{ color: 'rgb(244 242 238 / 0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            Houston
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
