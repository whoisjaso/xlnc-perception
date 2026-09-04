import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Recorded footage as a JPEG sequence (public/seq/<clip>/f_NNNNN.jpg, numbered by source frame).
 * Deterministic and fast: no decoder seeks per frame.
 */
const RANGES: Record<string, [number, number]> = { c01_home: [0, 779], c02_menu: [0, 329], c03_fleet_vehicle: [150, 719], c04_reserve: [30, 599], c05_login_onboarding: [30, 1829], c07_wizard_identity: [0, 1439], c08_wizard_money: [60, 1229], c09_review_sign: [390, 1229], c10_sign_phone: [90, 779], c11_ops: [0, 1259] };

const Footage: React.FC<{ clip: string; startFrom: number; playbackRate: number; endAt?: number; style?: React.CSSProperties }> = ({ clip, startFrom, playbackRate, endAt, style }) => {
  const frame = useCurrentFrame();
  const name = clip.replace(/^clips\//, '').replace(/\.mp4$/, '');
  let n = Math.round(startFrom + frame * playbackRate);
  if (endAt !== undefined) n = Math.min(n, endAt);
  const r = RANGES[name]; if (r) n = Math.max(r[0], Math.min(r[1], n));
  if (name === 'c05_login_onboarding' && n > 809 && n < 1470) n = 809;
  return <Img src={staticFile(`seq/${name}/f_${String(n).padStart(5, '0')}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
};
import { theme } from '../theme';

/**
 * A recorded clip inside a browser window or a phone.
 * Slow scale drift keeps it alive; the frame carries the depth.
 */
export const Browser: React.FC<{ clip: string; startFrom?: number; endAt?: number; delay?: number; scaleTo?: number; width?: number; x?: number; y?: number; rotate?: number; url?: string; volume?: number; playbackRate?: number }> = ({ clip, startFrom = 0, endAt, delay = 0, scaleTo = 1.04, width = 1560, x = 0, y = 0, rotate = 0, url = 'novawheels.com', playbackRate = 1 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  const drift = interpolate(frame, [0, durationInFrames], [1, scaleTo], { easing: theme.ease.inOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const h = (width * 9) / 16;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width, transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${drift * interpolate(p, [0, 1], [0.94, 1])})`, opacity: p, borderRadius: 18, overflow: 'hidden', background: theme.colors.surface, border: '1px solid rgba(244,242,238,0.10)', boxShadow: '0 24px 40px -18px rgba(0,0,0,0.75)' }}>
        <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#1a1b1f', borderBottom: '1px solid rgba(244,242,238,0.08)' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c, opacity: 0.85 }} />)}
          <div style={{ marginLeft: 18, flex: 1, maxWidth: 520, height: 26, borderRadius: 8, background: 'rgba(244,242,238,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textDim, fontFamily: theme.fonts.body, fontSize: 13, letterSpacing: 0.2 }}>{url}</div>
        </div>
        <div style={{ position: 'relative', width, height: h, overflow: 'hidden', background: theme.colors.bg }}>
          <Footage clip={clip} startFrom={startFrom} endAt={endAt} playbackRate={playbackRate} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Phone: React.FC<{ clip: string; startFrom?: number; endAt?: number; delay?: number; x?: number; y?: number; height?: number; rotate?: number; playbackRate?: number }> = ({ clip, startFrom = 0, endAt, delay = 0, x = 0, y = 0, height = 900, rotate = 0, playbackRate = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  const float = Math.sin(frame / 30) * 4;
  const w = (height * 430) / 932;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: w + 24, height: height + 24, padding: 12, borderRadius: 64, background: '#0b0b0d', border: '1px solid rgba(244,242,238,0.14)', boxShadow: '0 30px 44px -18px rgba(0,0,0,0.8)', transform: `translate(${x}px, ${y + float}px) rotate(${rotate}deg) scale(${interpolate(p, [0, 1], [0.92, 1])})`, opacity: p }}>
        <div style={{ width: w, height, borderRadius: 52, overflow: 'hidden', background: theme.colors.porcelain, position: 'relative' }}>
          <Footage clip={clip} startFrom={startFrom} endAt={endAt} playbackRate={playbackRate} />
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 110, height: 32, borderRadius: 20, background: '#0b0b0d' }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
