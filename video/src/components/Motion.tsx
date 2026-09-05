import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

/** Premium entrance: opacity + rise + scale on a smooth spring. */
export const Entrance: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties; from?: number; config?: { damping: number; stiffness: number; mass: number } }> = ({ delay = 0, children, style, from = 40, config = theme.spring.smooth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config });
  return (
    <div style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [from, 0])}px) scale(${interpolate(p, [0, 1], [0.96, 1])})`, ...style }}>{children}</div>
  );
};

/** Exit wrapper: fades and lifts everything in the last frames of a scene. */
export const Exit: React.FC<{ children: React.ReactNode; duration: number; length?: number }> = ({ children, duration, length = 12 }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [duration - length, duration - 2], [0, -36], { easing: theme.ease.in, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const o = interpolate(frame, [duration - length, duration - 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div style={{ position: 'absolute', inset: 0, opacity: o, transform: `translateY(${y}px)` }}>{children}</div>;
};

export const WordReveal: React.FC<{ text: string; delay?: number; per?: number; style?: React.CSSProperties; highlight?: string }> = ({ text, delay = 0, per = 3, style, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.28em', rowGap: '0.05em', ...style }}>
      {text.split(' ').map((word, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.snappy });
        const hl = highlight && word.replace(/[.,]/g, '') === highlight;
        return (
          <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${interpolate(p, [0, 1], [26, 0])}px)`, color: hl ? theme.colors.primary : undefined, fontStyle: hl ? 'italic' : undefined }}>{word}</span>
        );
      })}
    </div>
  );
};

export const Breathe: React.FC<{ children: React.ReactNode; amount?: number; style?: React.CSSProperties }> = ({ children, amount = 1, style }) => {
  const frame = useCurrentFrame();
  const s = 1 + Math.sin(frame / 26) * 0.006 * amount;
  const y = Math.sin(frame / 34) * 2.5 * amount;
  return <div style={{ transform: `translateY(${y}px) scale(${s})`, ...style }}>{children}</div>;
};

export const Counter: React.FC<{ to: number; delay?: number; prefix?: string; suffix?: string; decimals?: number; style?: React.CSSProperties }> = ({ to, delay = 0, prefix = '', suffix = '', decimals = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 30, stiffness: 60, mass: 1 } });
  const v = interpolate(p, [0, 1], [0, to]);
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{prefix}{v.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
};
