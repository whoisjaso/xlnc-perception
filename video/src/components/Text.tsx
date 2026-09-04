import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { Entrance, WordReveal } from './Motion';

/** Chapter headline, lower-left, serif. One per scene at most. */
export const Headline: React.FC<{ text: string; kicker?: string; highlight?: string; delay?: number; size?: number; bottom?: number; left?: number; light?: boolean; maxWidth?: number }> = ({ text, kicker, highlight, delay = 0, size = 92, bottom = 110, left = 120, light, maxWidth = 1000 }) => (
  <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: `0 0 ${bottom}px ${left}px` }}>
    {kicker && (
      <Entrance delay={delay} from={16} config={theme.spring.snappy}>
        <div style={{ fontFamily: theme.fonts.body, fontSize: 18, letterSpacing: '0.22em', textTransform: 'uppercase', color: light ? theme.colors.accent : theme.colors.primary, marginBottom: 22, fontWeight: 500 }}>{kicker}</div>
      </Entrance>
    )}
    <WordReveal text={text} delay={delay + 4} highlight={highlight} style={{ fontFamily: theme.fonts.display, fontSize: size, lineHeight: 1.0, letterSpacing: '-0.01em', color: light ? theme.colors.ink : theme.colors.text, maxWidth, fontWeight: 400, textShadow: light ? 'none' : '0 2px 24px rgba(0,0,0,0.5)' }} />
  </AbsoluteFill>
);

/** Caption bar: the narration line, timed by Sequence. Keeps inside the safe zone. */
export const Caption: React.FC<{ text: string; light?: boolean }> = ({ text, light }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = spring({ frame, fps, config: theme.spring.snappy });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 54 }}>
      <div style={{ opacity: p * out, transform: `translateY(${interpolate(p, [0, 1], [14, 0])}px)`, maxWidth: 1280, padding: '14px 26px', borderRadius: 14, background: light ? 'rgba(20,20,22,0.88)' : 'rgba(15,16,18,0.86)', border: '1px solid rgba(244,242,238,0.10)', color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: 30, lineHeight: 1.3, textAlign: 'center', fontWeight: 500, letterSpacing: '-0.005em' }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Splits narration into caption chunks timed proportionally to word count. */
export const Captions: React.FC<{ text: string; durationInFrames: number; light?: boolean }> = ({ text, durationInFrames, light }) => {
  const chunks = chunk(text);
  const words = chunks.reduce((s, c) => s + c.split(' ').length, 0);
  let cursor = 0;
  return (
    <>
      {chunks.map((c, i) => {
        const len = Math.round((c.split(' ').length / words) * durationInFrames);
        const from = cursor; cursor += len;
        return (
          <Sequence key={i} from={from} durationInFrames={i === chunks.length - 1 ? durationInFrames - from : len}>
            <Caption text={c} light={light} />
          </Sequence>
        );
      })}
    </>
  );
};

function chunk(text: string): string[] {
  const sentences = text.replace(/\.\.\./g, '…').split(/(?<=[.!?])\s+/).filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    const w = s.split(' ');
    if (w.length <= 12) { out.push(s); continue; }
    // split long sentences at commas into ≤12-word chunks
    const parts = s.split(/(?<=,)\s+/);
    let cur = '';
    for (const p of parts) {
      if ((cur + ' ' + p).trim().split(' ').length > 12 && cur) { out.push(cur.trim()); cur = p; } else cur = (cur + ' ' + p).trim();
    }
    if (cur) out.push(cur.trim());
  }
  return out.map((s) => s.replace(/…/g, '...'));
}

/** Pill list for the benefit beats. */
export const Pills: React.FC<{ items: string[]; delay?: number; x?: number; y?: number; light?: boolean }> = ({ items, delay = 0, x = 120, y = 300, light }) => (
  <div style={{ position: 'absolute', left: x, top: y, display: 'flex', flexDirection: 'column', gap: 18 }}>
    {items.map((it, i) => (
      <Entrance key={it} delay={delay + i * 6} from={24} config={theme.spring.snappy}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '16px 26px', borderRadius: 999, background: light ? 'rgba(20,20,22,0.06)' : 'rgba(244,242,238,0.07)', border: `1px solid ${light ? 'rgba(20,20,22,0.12)' : 'rgba(244,242,238,0.12)'}`, fontFamily: theme.fonts.body, fontSize: 30, color: light ? theme.colors.ink : theme.colors.text, fontWeight: 500 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: theme.colors.primary }} />
          {it}
        </div>
      </Entrance>
    ))}
  </div>
);
