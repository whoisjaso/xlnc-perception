# Nova Wheels pitch video

A Remotion composition that turns real screen recordings of the app into a narrated, captioned 4-minute pitch.

## Regenerate

1. Build and serve the app: `npm run build && npx vite preview --port 4173` from the repo root.
2. Record footage: `node <scratch>/rec/record.cjs` (Playwright script; drives the site, onboarding, the rental wizard, signing, and check-in with a visible cursor). Convert the WebM files to MP4 and extract JPEG sequences into `public/seq/<clip>/f_NNNNN.jpg` numbered by source frame.
3. Narration: `narration.json` holds the script. Synthesize with Kokoro (`am_michael`, speed 0.94) into `public/audio/<id>.wav` and write `public/audio/durations.json`.
4. Sound kit and music bed: `node synth.cjs` (deterministic, no downloads).
5. Render: `npx remotion render src/index.ts NovaWheels out/nova-wheels.mp4 --codec h264 --crf 19 --concurrency=4`.

Timeline is derived from the narration durations in `src/Root.tsx`; captions are chunked from the same script in `src/components/Text.tsx`.
