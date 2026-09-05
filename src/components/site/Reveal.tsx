import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export function Reveal({ children, delay = 0, className, y = 28, once = true, amount = 0.25 }: { children: ReactNode; delay?: number; className?: string; y?: number; once?: boolean; amount?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Line-by-line masked headline reveal. */
export function Lines({ lines, className, delay = 0, as: Tag = 'h1' }: { lines: string[]; className?: string; delay?: number; as?: 'h1' | 'h2' | 'h3' | 'p' }) {
  const reduce = useReducedMotion();
  return (
    <Tag className={className}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className="block"
            initial={reduce ? false : { y: '105%' }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, delay: delay + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
