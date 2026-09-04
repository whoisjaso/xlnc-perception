import { Link } from 'react-router';
import { Atmosphere } from '@/components/site/Atmosphere';
import { Lines, Reveal } from '@/components/site/Reveal';

export function Experience() {
  return (
    <div>
      <title>The Experience. Nova Wheels</title>
      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-36 md:pt-48 grid md:grid-cols-[1.2fr_1fr] gap-12 items-end">
        <Lines as="h1" lines={['Built by people', 'who own these cars.']} className="font-display text-[clamp(40px,7vw,104px)] leading-[0.98]" />
        <Reveal delay={0.3} className="max-w-[44ch]">
          <p className="text-[17px] md:text-[19px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
            Nova Wheels started because renting an exotic in Texas meant a strip-mall counter, a photocopied contract, and a deposit that came back whenever it came back. We built the company we wanted to rent from.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-24 md:pt-32">
        <Reveal>
          <div className="aspect-[21/9] overflow-hidden rounded-[var(--radius-lg)]">
            <Atmosphere name="lot-dusk" className="w-full h-full" alt="The Nova Wheels lot at dusk" />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-24 md:pt-40">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-12 md:gap-24">
          <Lines as="h2" lines={['What you can', 'count on.']} className="font-display text-[clamp(34px,5vw,72px)] leading-[1.02] md:sticky md:top-32 self-start" />
          <div className="flex flex-col gap-16">
            {[
              ['Every charge in writing first', 'Rate, deposit, mileage, fuel, late fees, tolls. It is all in the agreement, with a plain-language line under each section. Nothing is discovered on the invoice.'],
              ['The walk-around is on camera', 'We photograph and film the car with you at delivery and at return. Timestamped. You get a copy. If a mark was there before, it is on record before you drive.'],
              ['Deposits come back on a schedule', 'Card holds are released within five business days of return. Any deduction arrives itemized with the photo that justifies it.'],
              ['A person answers', 'Your rental has a name attached. Extensions, questions, a flat tire at midnight: you text the same number the whole time.'],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 0.05}>
                <h3 className="text-[24px] md:text-[28px] font-medium leading-tight max-w-[28ch]">{t}</h3>
                <p className="mt-4 text-[16px] md:text-[17px] leading-relaxed max-w-[56ch]" style={{ color: 'var(--fg-2)' }}>{b}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-32 md:pt-48 grid md:grid-cols-2 gap-6">
        <Reveal>
          <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]">
            <Atmosphere name="detail-bay" className="w-full h-full" alt="Detailing bay" />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="md:mt-24">
          <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]">
            <Atmosphere name="handover" className="w-full h-full" alt="Keys handed over at delivery" />
          </div>
          <p className="mt-6 text-[17px] leading-relaxed max-w-[44ch]" style={{ color: 'var(--fg-2)' }}>
            Cars are detailed and inspected after every rental, serviced at the dealer, and photographed before they leave the lot.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-32 md:pt-48">
        <div className="rounded-[var(--radius-lg)] p-10 md:p-20 grid md:grid-cols-[1.3fr_1fr] gap-10 items-center" style={{ background: 'var(--surface)' }}>
          <Lines as="h2" lines={['See the fleet.']} className="font-display text-[clamp(32px,4.5vw,64px)] leading-[1.02]" />
          <Reveal className="md:justify-self-end">
            <Link to="/fleet" className="btn btn-primary btn-lg">View the fleet</Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
