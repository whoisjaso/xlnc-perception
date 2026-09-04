import { useState } from 'react';
import { cx } from '@/lib/util';

/** Atmosphere photograph slot: public/media/atmosphere/<name>.jpg. Falls back to a lit gradient panel. */
export function Atmosphere({ name, className, alt = '' }: { name: string; className?: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        aria-hidden={!alt}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={cx('relative overflow-hidden', className)}
        style={{ background: 'radial-gradient(90% 70% at 30% 20%, rgb(84 112 230 / 0.16), transparent 60%), radial-gradient(70% 60% at 80% 90%, rgb(244 242 238 / 0.08), transparent 60%), linear-gradient(180deg, #17181c, #0f1012)' }}
      />
    );
  }
  return <img src={`/media/atmosphere/${name}.jpg`} alt={alt} className={cx('object-cover', className)} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
