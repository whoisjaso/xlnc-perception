import { Composition, Sequence, Audio, staticFile, AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import './fonts.css';
import narration from '../narration.json';
import durations from '../public/audio/durations.json';
import { Sting, Hook, Clip, SignScene, Pitch, Chapter, type ClipScene } from './scenes';

const FPS = 30;
const sec = (s: number) => Math.round(s * FPS);
const dur = (id: string, pad = 1.1) => sec((durations as Record<string, number>)[id] + pad);
const text = (id: string) => (narration as { id: string; text: string }[]).find((n) => n.id === id)!.text;

// Clip offsets (seconds into each recording) chosen from the footage.
const clip = (id: string, over: Partial<ClipScene> & { clip: string }): ClipScene => ({ id, text: text(id), ...over });

const SCENES: { key: string; frames: number; node: React.ReactNode; light?: boolean }[] = [
  { key: 'sting', frames: sec(3.6), node: <Sting /> },
  { key: 's01', frames: dur('s01_hook', 0.8), node: <Hook id="s01_hook" text={text('s01_hook')} /> },
  { key: 's02', frames: dur('s02_site'), node: <Clip {...clip('s02_site', { clip: 'clips/c01_home.mp4', startFrom: sec(0), playbackRate: 1.15, headline: 'Your customers land here first.', highlight: 'first.', width: 1500, y: 20 })} /> },
  { key: 's02b', frames: sec(7), node: <Clip {...clip('s02_site', { clip: 'clips/c02_menu.mp4', startFrom: sec(1.2), playbackRate: 1.1, width: 1500, y: 20, url: 'novawheels.com' })} id="__mute" text="" /> },
  { key: 's03', frames: dur('s03_vehicle'), node: <Clip {...clip('s03_vehicle', { clip: 'clips/c03_fleet_vehicle.mp4', startFrom: sec(6), playbackRate: 1.15, headline: 'Every rate. Every rule. Up front.', highlight: 'front.', width: 1500, y: 20, url: 'novawheels.com/fleet' })} /> },
  { key: 's04', frames: dur('s04_reserve'), node: <Clip {...clip('s04_reserve', { clip: 'clips/c04_reserve.mp4', startFrom: sec(1.5), playbackRate: 1.35, headline: 'Booking takes four screens.', highlight: 'four', width: 1500, y: 20, url: 'novawheels.com/reserve' })} /> },
  { key: 'ch2', frames: sec(2.8), node: <Chapter number="The operation" title="What your customers never see." light /> , light: true },
  { key: 's05', frames: dur('s05_admin'), node: <Clip {...clip('s05_admin', { clip: 'clips/c05_login_onboarding.mp4', startFrom: sec(1.2), playbackRate: 1.5, headline: 'Sets itself up like a new phone.', highlight: 'phone.', light: true, width: 1500, y: 20, url: 'novawheels.com/admin' })} /> , light: true },
  { key: 's06', frames: dur('s06_hub'), node: <Clip {...clip('s06_hub', { clip: 'clips/c05_login_onboarding.mp4', startFrom: sec(50), playbackRate: 1, headline: 'Every morning starts here.', highlight: 'here.', light: true, width: 1500, y: 20, url: 'novawheels.com/admin' })} /> , light: true },
  { key: 's07', frames: dur('s07_wizard'), node: <Clip {...clip('s07_wizard', { clip: 'clips/c07_wizard_identity.mp4', startFrom: sec(0), playbackRate: 0.62, headline: 'Handle a rental. One question per screen.', highlight: 'One', light: true, width: 1500, y: 20, url: 'novawheels.com/admin/rental/new' })} /> , light: true },
  { key: 's08', frames: dur('s08_identity'), node: <Clip {...clip('s08_identity', { clip: 'clips/c07_wizard_identity.mp4', startFrom: sec(6), playbackRate: 1.6, headline: 'Identity you can defend.', highlight: 'defend.', light: true, width: 1500, y: 20, url: 'novawheels.com/admin/rental/new' })} /> , light: true },
  { key: 's09', frames: dur('s09_money'), node: <Clip {...clip('s09_money', { clip: 'clips/c08_wizard_money.mp4', startFrom: sec(2), playbackRate: 1.5, headline: 'Card on file. Always.', highlight: 'Always.', light: true, width: 1500, y: 20, url: 'novawheels.com/admin/rental/new' })} /> , light: true },
  { key: 's10', frames: dur('s10_contract'), node: <Clip {...clip('s10_contract', { clip: 'clips/c09_review_sign.mp4', startFrom: sec(15), playbackRate: 1.2, headline: 'The contract writes itself.', highlight: 'itself.', light: true, width: 1500, y: 20, url: 'novawheels.com/admin/rental/new/sign' })} /> , light: true },
  { key: 's11', frames: dur('s11_sign'), node: <SignScene id="s11_sign" text={text('s11_sign')} />, light: true },
  { key: 's12', frames: dur('s12_ops'), node: <Clip {...clip('s12_ops', { clip: 'clips/c11_ops.mp4', startFrom: sec(0.5), playbackRate: 1.35, headline: 'Check-in does the math.', highlight: 'math.', light: true, width: 1500, y: 20, url: 'novawheels.com/admin/rentals' })} /> , light: true },
  { key: 's13', frames: dur('s13_close', 2.4), node: <Pitch id="s13_close" text={text('s13_close')} /> },
];

const TRANSITION = 14;
export const TOTAL = SCENES.reduce((s, x) => s + x.frames, 0) - TRANSITION * (SCENES.length - 1);

const Film: React.FC = () => (
  <AbsoluteFill style={{ background: '#0f1012' }}>
    <Audio src={staticFile('sfx/bed.wav')} volume={0.16} />
    <TransitionSeries>
      {SCENES.flatMap((s, i) => {
        const seq = <TransitionSeries.Sequence key={s.key} durationInFrames={s.frames}>{s.node}</TransitionSeries.Sequence>;
        if (i === SCENES.length - 1) return [seq];
        return [seq, <TransitionSeries.Transition key={s.key + '-t'} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />];
      })}
    </TransitionSeries>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="NovaWheels" component={Film} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
);
