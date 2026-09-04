import { AbsoluteFill, staticFile, useCurrentFrame } from 'remotion';
import { theme } from '../theme';

/** Bottom layer: slow-drifting light on near-black. Never a flat solid. */
export const BgMesh: React.FC<{ light?: boolean }> = ({ light }) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 70) * 60;
  const d2 = Math.cos(frame / 90) * 50;
  return (
    <AbsoluteFill style={{ background: light ? theme.colors.porcelain : theme.colors.bg }}>
      <div style={{ position: 'absolute', width: 1400, height: 1400, borderRadius: '50%', top: -700, left: -400 + d1, background: `radial-gradient(circle, ${theme.colors.primary}${light ? '22' : '1f'}, transparent 62%)` }} />
      <div style={{ position: 'absolute', width: 1100, height: 1100, borderRadius: '50%', bottom: -600, right: -300 - d2, background: `radial-gradient(circle, ${light ? 'rgba(20,20,22,0.10)' : 'rgba(244,242,238,0.07)'}, transparent 65%)` }} />
    </AbsoluteFill>
  );
};

/** Above content, below grain: unifies recordings and graphics. */
export const Grade: React.FC<{ light?: boolean }> = ({ light }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.primary, opacity: light ? 0.035 : 0.05 }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.10), transparent 26%, transparent 74%, rgba(0,0,0,0.22))' }} />
  </AbsoluteFill>
);

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ pointerEvents: 'none', backgroundImage: `url(${staticFile('noise.png')})`, backgroundSize: '256px', backgroundPosition: `${(Math.floor(frame / 3) * 37) % 256}px ${(Math.floor(frame / 3) * 53) % 256}px`, opacity: 0.035 }} />;
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.26) 100%)' }} />
);

/** The full five-layer stack around a scene's content. */
export const Stack: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <AbsoluteFill>
    <BgMesh light={light} />
    {children}
    <Grade light={light} />
    <Grain />
    <Vignette />
  </AbsoluteFill>
);
