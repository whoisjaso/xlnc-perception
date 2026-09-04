import { Lines, Reveal } from '@/components/site/Reveal';
import { Atmosphere } from '@/components/site/Atmosphere';

export function Contact() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 md:px-10 pt-36 md:pt-48 grid md:grid-cols-[1fr_1fr] gap-16 items-start">
      <title>Contact. Nova Wheels</title>
      <div>
        <Lines as="h1" lines={['Talk to a', 'person.']} className="font-display text-[clamp(40px,7vw,104px)] leading-[0.98]" />
        <Reveal delay={0.3} className="mt-12 grid sm:grid-cols-2 gap-x-10 gap-y-10 text-[17px]">
          <div>
            <p className="label-caps mb-2" style={{ color: 'var(--fg-3)' }}>Concierge</p>
            <a href="tel:+17135550148" className="block text-[24px] font-display">(713) 555-0148</a>
            <a href="mailto:concierge@novawheels.com" className="block mt-1" style={{ color: 'var(--fg-2)' }}>concierge@novawheels.com</a>
          </div>
          <div>
            <p className="label-caps mb-2" style={{ color: 'var(--fg-3)' }}>Hours</p>
            <p>8am to 10pm</p>
            <p style={{ color: 'var(--fg-2)' }}>Seven days a week</p>
          </div>
          <div>
            <p className="label-caps mb-2" style={{ color: 'var(--fg-3)' }}>Showroom</p>
            <p>By appointment</p>
            <p style={{ color: 'var(--fg-2)' }}>Houston, Texas</p>
          </div>
          <div>
            <p className="label-caps mb-2" style={{ color: 'var(--fg-3)' }}>Reservations</p>
            <p>Confirmed within the hour, 8am to 10pm</p>
          </div>
        </Reveal>
      </div>
      <Reveal delay={0.2}>
        <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]">
          <Atmosphere name="showroom" className="w-full h-full" alt="Nova Wheels showroom" />
        </div>
      </Reveal>
    </div>
  );
}
