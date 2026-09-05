import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from './theme';
import { Stack } from './components/Layers';
import { Browser, Phone } from './components/Device';
import { Headline, Captions, Pills } from './components/Text';
import { Entrance, Exit, WordReveal, Breathe, Counter } from './components/Motion';

/* ---------- shared: narration + captions for a scene ---------- */
export const Narration: React.FC<{ id: string; text: string; light?: boolean }> = ({ id, text, light }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <>
      <Audio src={staticFile(`audio/${id}.wav`)} volume={1} />
      <Captions text={text} durationInFrames={durationInFrames} light={light} />
    </>
  );
};

const Sfx: React.FC<{ name: string; at: number; volume?: number }> = ({ name, at, volume = 0.5 }) => (
  <Sequence from={Math.max(0, at)}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} /></Sequence>
);

/* ---------- 0. Logo sting ---------- */
export const Sting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const letters = 'NOVA WHEELS'.split('');
  const line = spring({ frame: frame - 18, fps, config: theme.spring.slow });
  const dotP = spring({ frame: frame - 34, fps, config: theme.spring.bouncy });
  return (
    <Stack>
      <Sfx name="hit" at={0} volume={0.6} />
      <Sfx name="shimmer" at={30} volume={0.35} />
      <Exit duration={durationInFrames}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontFamily: theme.fonts.display, fontSize: 132, letterSpacing: '0.28em', color: theme.colors.text, lineHeight: 1 }}>
            {letters.map((ch, i) => {
              const p = spring({ frame: frame - 6 - i * 2.2, fps, config: theme.spring.smooth });
              return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${interpolate(p, [0, 1], [70, 0])}px)`, whiteSpace: 'pre' }}>{ch}</span>;
            })}
          </div>
          <div style={{ marginTop: 44, width: 420, height: 1, background: theme.colors.primary, transform: `scaleX(${line})`, transformOrigin: 'left', boxShadow: `0 0 24px ${theme.colors.glow}` }} />
          <div style={{ marginTop: 26, fontFamily: theme.fonts.body, fontSize: 18, letterSpacing: '0.24em', textTransform: 'uppercase', color: theme.colors.textDim, opacity: dotP, transform: `translateY(${interpolate(dotP, [0, 1], [10, 0])}px)` }}>Exotic rental, run properly</div>
        </AbsoluteFill>
      </Exit>
    </Stack>
  );
};

/* ---------- generic: clip in a browser + headline + narration ---------- */
export interface ClipScene {
  id: string; text: string; clip: string; startFrom?: number; endAt?: number; playbackRate?: number;
  headline?: string; kicker?: string; highlight?: string; headlineAt?: number; headlineFor?: number;
  light?: boolean; x?: number; y?: number; width?: number; rotate?: number; url?: string;
}
export const Clip: React.FC<ClipScene> = (s) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <Stack light={s.light}>
      <Sfx name="whoosh" at={0} volume={0.35} />
      <Exit duration={durationInFrames}>
        <Browser clip={s.clip} startFrom={s.startFrom} endAt={s.endAt} playbackRate={s.playbackRate} delay={2} x={s.x} y={s.y} width={s.width} rotate={s.rotate} url={s.url} />
        {s.headline && (
          <Sequence from={s.headlineAt ?? 8} durationInFrames={s.headlineFor ?? 110}>
            <HeadlineCard text={s.headline} kicker={s.kicker} highlight={s.highlight} light={s.light} />
          </Sequence>
        )}
      </Exit>
      {s.text ? <Narration id={s.id} text={s.text} light={s.light} /> : null}
    </Stack>
  );
};

/** Headline with its own exit so it can leave before the clip does. */
const HeadlineCard: React.FC<{ text: string; kicker?: string; highlight?: string; light?: boolean }> = ({ text, kicker, highlight, light }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <Exit duration={durationInFrames} length={10}>
      <Sfx name="click" at={2} volume={0.4} />
      {light ? (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 150px 110px' }}>
          <Entrance delay={0} from={24}>
            <div style={{ padding: '28px 36px 30px', borderRadius: 22, background: 'rgba(245,244,241,0.97)', border: '1px solid rgba(20,20,22,0.10)', boxShadow: '0 16px 30px -16px rgba(0,0,0,0.3)', maxWidth: 820 }}>
              <WordReveal text={text} delay={4} highlight={highlight} style={{ fontFamily: theme.fonts.display, fontSize: 72, lineHeight: 1.02, color: theme.colors.ink, fontWeight: 400 }} />
            </div>
          </Entrance>
        </AbsoluteFill>
      ) : (
        <Headline text={text} kicker={kicker} highlight={highlight} size={84} left={110} bottom={150} maxWidth={820} />
      )}
    </Exit>
  );
};

/* ---------- hook: full-bleed site footage with the thesis over it ---------- */
export const Hook: React.FC<{ id: string; text: string }> = ({ id, text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1.06, 1.0], { easing: theme.ease.inOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const second = spring({ frame: frame - Math.round(durationInFrames * 0.62), fps, config: theme.spring.smooth });
  return (
    <Stack>
      <Sfx name="riser" at={durationInFrames - 34} volume={0.5} />
      <Exit duration={durationInFrames}>
        <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
          <Browser clip="clips/c01_home.mp4" startFrom={Math.round(fps * 4.2)} width={1920} delay={0} scaleTo={1} url="novawheels.com" />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(15,16,18,0.55), rgba(15,16,18,0.7) 45%, rgba(15,16,18,0.35) 70%, rgba(15,16,18,0.85))' }} />
        <Sequence from={Math.round(fps * 0.6)} durationInFrames={Math.round(durationInFrames * 0.6)}>
          <Headline text="Built to make your fleet look like this." highlight="this." size={96} left={120} bottom={590} maxWidth={1100} />
        </Sequence>
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 590px 120px', opacity: second, transform: `translateY(${interpolate(second, [0, 1], [30, 0])}px)` }}>
          <div style={{ fontFamily: theme.fonts.display, fontSize: 96, lineHeight: 1, color: theme.colors.text, maxWidth: 1100 }}>And <span style={{ color: theme.colors.primary, fontStyle: 'italic' }}>run</span> like this.</div>
        </AbsoluteFill>
      </Exit>
      <Narration id={id} text={text} />
    </Stack>
  );
};

/* ---------- signing on a phone, with the desktop clip behind ---------- */
export const SignScene: React.FC<{ id: string; text: string }> = ({ id, text }) => {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Stack light>
      <Sfx name="whoosh" at={0} volume={0.35} />
      <Exit duration={durationInFrames}>
        <Browser clip="clips/c09_review_sign.mp4" startFrom={Math.round(fps * 14)} width={1240} x={-300} y={-40} delay={2} scaleTo={1.02} url="novawheels.com/admin" />
        <Phone clip="clips/c10_sign_phone.mp4" startFrom={Math.round(fps * 3)} delay={14} x={560} y={40} height={860} rotate={-2} playbackRate={1.6} />
        <Sequence from={10} durationInFrames={120}>
          <Exit duration={120} length={10}>
            <Headline text="Sign here. Or on their phone." highlight="phone." light size={72} left={110} bottom={120} maxWidth={620} />
          </Exit>
        </Sequence>
      </Exit>
      <Narration id={id} text={text} light />
    </Stack>
  );
};

/* ---------- pitch: benefits list with a soft counter ---------- */
export const Pitch: React.FC<{ id: string; text: string }> = ({ id, text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const items = ['Customers book from the website, not your DMs', 'A brand people expect to pay more for', 'Every dollar in writing before the keys move', 'A stack of paperwork becomes six minutes on a screen'];
  const perItem = Math.round((durationInFrames * 0.72) / items.length);
  const close = spring({ frame: frame - Math.round(durationInFrames * 0.8), fps, config: theme.spring.smooth });
  return (
    <Stack>
      {items.map((_, i) => <Sfx key={i} name="click" at={Math.round(fps * 1.4) + i * perItem - 2} volume={0.45} />)}
      <Sfx name="hit" at={Math.round(durationInFrames * 0.8) - 3} volume={0.55} />
      <Exit duration={durationInFrames}>
        <AbsoluteFill style={{ padding: '120px 120px 0' }}>
          <Entrance delay={4}>
            <div style={{ fontFamily: theme.fonts.display, fontSize: 76, color: theme.colors.text, lineHeight: 1.05, maxWidth: 1100 }}>What this does for the business.</div>
          </Entrance>
          <div style={{ position: 'absolute', left: 120, top: 300, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {items.map((it, i) => {
              const at = Math.round(fps * 1.4) + i * perItem;
              const p = spring({ frame: frame - at, fps, config: theme.spring.snappy });
              return (
                <div key={it} style={{ display: 'flex', alignItems: 'center', gap: 22, opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-30, 0])}px)` }}>
                  <span style={{ width: 14, height: 14, borderRadius: 7, background: i === Math.min(items.length - 1, Math.floor((frame - Math.round(fps * 1.4)) / perItem)) ? theme.colors.primary : 'rgba(244,242,238,0.25)', boxShadow: i === Math.min(items.length - 1, Math.floor((frame - Math.round(fps * 1.4)) / perItem)) ? `0 0 20px ${theme.colors.glow}` : 'none' }} />
                  <span style={{ fontFamily: theme.fonts.body, fontSize: 40, color: theme.colors.text, fontWeight: 500 }}>{it}</span>
                </div>
              );
            })}
          </div>
          <div style={{ position: 'absolute', right: 140, top: 300, width: 520, opacity: interpolate(frame, [Math.round(fps * 1.2), Math.round(fps * 2)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
            <Breathe>
              <div style={{ borderRadius: 22, padding: '34px 38px', background: 'rgba(244,242,238,0.05)', border: '1px solid rgba(244,242,238,0.12)' }}>
                <div style={{ fontFamily: theme.fonts.body, fontSize: 16, letterSpacing: '0.2em', textTransform: 'uppercase', color: theme.colors.textDim }}>A rental, start to signed</div>
                <div style={{ fontFamily: theme.fonts.display, fontSize: 120, lineHeight: 1, color: theme.colors.text, marginTop: 12 }}><Counter to={6} delay={Math.round(fps * 1.4)} /><span style={{ fontSize: 40, color: theme.colors.textDim, marginLeft: 12 }}>min</span></div>
                <div style={{ marginTop: 26, height: 1, background: 'rgba(244,242,238,0.12)' }} />
                <div style={{ fontFamily: theme.fonts.body, fontSize: 16, letterSpacing: '0.2em', textTransform: 'uppercase', color: theme.colors.textDim, marginTop: 24 }}>Clauses protecting the owner</div>
                <div style={{ fontFamily: theme.fonts.display, fontSize: 84, lineHeight: 1, color: theme.colors.text, marginTop: 10 }}><Counter to={18} delay={Math.round(fps * 2.2)} /></div>
              </div>
            </Breathe>
          </div>
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: close, background: `rgba(15,16,18,${0.92 * close})` }}>
            <div style={{ transform: `scale(${interpolate(close, [0, 1], [0.96, 1])})`, textAlign: 'center' }}>
              <div style={{ fontFamily: theme.fonts.display, fontSize: 120, letterSpacing: '0.26em', color: theme.colors.text, lineHeight: 1 }}>NOVA WHEELS</div>
              <div style={{ marginTop: 30, fontFamily: theme.fonts.display, fontSize: 56, color: theme.colors.primary, fontStyle: 'italic' }}>Let's put it to work.</div>
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      </Exit>
      <Narration id={id} text={text} />
    </Stack>
  );
};

/* ---------- Chapter card: a beat of stillness between sections ---------- */
export const Chapter: React.FC<{ number: string; title: string; light?: boolean }> = ({ number, title, light }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <Stack light={light}>
      <Sfx name="hit" at={0} volume={0.4} />
      <Exit duration={durationInFrames} length={10}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 120 }}>
          <Entrance delay={2} from={20} config={theme.spring.snappy}>
            <div style={{ fontFamily: theme.fonts.body, fontSize: 18, letterSpacing: '0.24em', textTransform: 'uppercase', color: light ? theme.colors.accent : theme.colors.primary, fontWeight: 500 }}>{number}</div>
          </Entrance>
          <WordReveal text={title} delay={6} per={4} style={{ fontFamily: theme.fonts.display, fontSize: 120, lineHeight: 1, color: light ? theme.colors.ink : theme.colors.text, marginTop: 24, maxWidth: 1300 }} />
        </AbsoluteFill>
      </Exit>
    </Stack>
  );
};

export { Pills };
