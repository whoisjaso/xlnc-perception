import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation, useOutlet } from 'react-router';

/** Route transition: content settles in with a short blur-to-focus; a hairline curtain sweeps on change. */
export function PageTransition() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(6px)', transition: { duration: 0.35, ease: [0.76, 0, 0.24, 1] } }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
