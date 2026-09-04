import { useCallback } from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Footer } from '@/components/site/Footer';
import { PageTransition } from '@/components/site/PageTransition';
import { SmoothScroll } from '@/components/site/SmoothScroll';
import { Preloader, usePreloadOnce } from '@/components/brand/Preloader';

export function SiteLayout() {
  const { show, done } = usePreloadOnce();
  const onDone = useCallback(() => done(), [done]);
  return (
    <div className="world-site grain min-h-[100dvh]" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <a href="#main" className="skip-link">Skip to content</a>
      {show && <Preloader onDone={onDone} />}
      <SmoothScroll>
        <div id="top-sentinel" aria-hidden className="absolute top-0 h-px w-px" />
        <SiteHeader />
        <main id="main">
          <PageTransition />
        </main>
        <Footer />
      </SmoothScroll>
    </div>
  );
}
