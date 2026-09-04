import { Link } from 'react-router';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { useFleet } from '@/store';
import { VehicleImage } from '@/components/site/VehicleImage';
import { Atmosphere } from '@/components/site/Atmosphere';
import { Lines, Reveal } from '@/components/site/Reveal';
import { money } from '@/lib/util';

export function Home() {
  const vehicles = useFleet((s) => s.vehicles);
  const featured = vehicles.filter((v) => v.featured).slice(0, 4);
  const hero = featured[0] ?? vehicles[0];
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '18%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <>
      <title>Nova Wheels. Exotic and luxury car rental, Houston.</title>
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[100dvh] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: imgY, scale: imgScale }}>
          {hero && (
            <motion.div
              className="absolute inset-0"
              initial={reduce ? false : { scale: 1.12, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <VehicleImage vehicle={hero} priority quiet className="absolute inset-0 w-full h-full" />
            </motion.div>
          )}
          <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(15 16 18 / 0.55) 0%, rgb(15 16 18 / 0.1) 35%, rgb(15 16 18 / 0.35) 70%, rgb(15 16 18 / 0.95) 100%)' }} />
        </motion.div>

        <motion.div style={{ opacity: textOpacity }} className="relative mx-auto max-w-[1600px] px-5 md:px-10 min-h-[100dvh] flex flex-col justify-end pb-16 md:pb-24 pt-32">
          <Lines
            as="h1"
            lines={['Drive what', 'you have earned.']}
            className="font-display font-normal text-[clamp(44px,8vw,112px)] leading-[0.98] tracking-[-0.015em] max-w-[16ch]"
            delay={0.2}
          />
          <Reveal delay={0.7} className="mt-8 max-w-[44ch]">
            <p className="text-[17px] md:text-[19px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              Exotic and luxury cars by the day, week, or month. Inspected, detailed, and delivered to your door anywhere in Texas.
            </p>
          </Reveal>
          <Reveal delay={0.85} className="mt-10 flex flex-wrap gap-3">
            <Link to="/reserve" className="btn btn-primary btn-lg">Reserve a car</Link>
            <Link to="/fleet" className="btn btn-ghost btn-lg">View the fleet</Link>
          </Reveal>
        </motion.div>
      </section>

      {/* Featured strip */}
      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-28 md:pt-40">
        <div className="flex items-end justify-between gap-8 mb-10">
          <Lines as="h2" lines={['The fleet']} className="font-display text-[clamp(36px,5vw,72px)] leading-none" />
          <Link to="/fleet" className="label-caps inline-flex items-center gap-2 hover:gap-3 transition-all pb-2" style={{ color: 'var(--fg-2)' }}>
            All {vehicles.length} cars <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-12 gap-x-6 gap-y-16">
          {featured.map((v, i) => (
            <Reveal key={v.id} delay={i * 0.05} className={[ 'md:col-span-7', 'md:col-span-5 md:mt-24', 'md:col-span-5 md:-mt-16', 'md:col-span-7' ][i % 4]}>
              <Link to={`/fleet/${v.slug}`} className="group block">
                <div className={['aspect-[16/10]', 'aspect-[4/5]', 'aspect-[4/5]', 'aspect-[16/10]'][i % 4] + ' overflow-hidden rounded-[var(--radius-lg)]'}>
                  <VehicleImage vehicle={v} className="w-full h-full transition-transform duration-[1400ms] group-hover:scale-[1.04]" sizes="(min-width: 768px) 50vw, 100vw" />
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-6">
                  <div>
                    <p className="font-display text-[26px] md:text-[32px] leading-tight">{v.make} <span className="italic">{v.model}</span></p>
                    <p className="text-[15px] mt-1" style={{ color: 'var(--fg-3)' }}>{v.tagline}</p>
                  </div>
                  <p className="tabular text-[15px] whitespace-nowrap" style={{ color: 'var(--fg-2)' }}>{money(v.rates.daily)} / day</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works: sticky headline, staggered rows */}
      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-32 md:pt-48 grid md:grid-cols-[1fr_1.2fr] gap-12 md:gap-24">
        <div className="md:sticky md:top-32 self-start">
          <Lines as="h2" lines={['From inquiry', 'to ignition', 'in an afternoon.']} className="font-display text-[clamp(36px,5vw,72px)] leading-[1.02]" />
          <Reveal delay={0.3} className="mt-8 max-w-[40ch]">
            <p className="text-[17px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              No counters, no queues, no surprise line items. Every charge is in writing before you sign, and the walk-around is done together, on camera.
            </p>
          </Reveal>
        </div>
        <ol className="flex flex-col">
          {[
            ['Choose the car', 'Pick from the fleet, tell us the dates, and we confirm availability within the hour.'],
            ['Verify once', 'License, insurance, and a card in your name. Five minutes on your phone. We keep it on file for next time.'],
            ['Sign from anywhere', 'The agreement arrives as a link. Every section has a plain-language line so you know exactly what you are agreeing to.'],
            ['We deliver', 'The car arrives detailed, full, and photographed. We walk it together, you drive.'],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.08}>
              <li className="py-10 border-b hairline grid grid-cols-[3rem_1fr] gap-6 items-start">
                <span className="font-display text-[28px] leading-none pt-1" style={{ color: 'var(--fg-3)' }} aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-[22px] md:text-[26px] font-medium leading-tight">{t}</h3>
                  <p className="mt-3 text-[16px] leading-relaxed max-w-[52ch]" style={{ color: 'var(--fg-2)' }}>{b}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Delivery: full bleed */}
      <section className="relative mt-32 md:mt-48 min-h-[80vh] flex items-end overflow-hidden">
        <Atmosphere name="delivery-night" className="absolute inset-0 w-full h-full" />
        <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(15 16 18 / 0.2), rgb(15 16 18 / 0.9))' }} />
        <div className="relative mx-auto max-w-[1600px] w-full px-5 md:px-10 pb-20 md:pb-28 pt-40 grid md:grid-cols-2 gap-12 items-end">
          <Lines as="h2" lines={['Delivered to', 'your door.']} className="font-display text-[clamp(40px,6vw,88px)] leading-[0.98]" />
          <Reveal className="md:justify-self-end max-w-[42ch]">
            <p className="text-[17px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              Home, hotel, hangar, or venue. Delivery across Houston is included on weekly and monthly rentals. Anywhere else in Texas, we quote it up front.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 text-[15px]">
              <div><dt className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Hours</dt><dd>8am to 10pm, seven days</dd></div>
              <div><dt className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Deposit release</dt><dd>Within 5 business days</dd></div>
              <div><dt className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Minimum age</dt><dd>25</dd></div>
              <div><dt className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Included miles</dt><dd>100 to 150 per day</dd></div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Rates */}
      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-32 md:pt-48">
        <Lines as="h2" lines={['Rates']} className="font-display text-[clamp(36px,5vw,72px)] leading-none" />
        <Reveal className="mt-4 max-w-[52ch]">
          <p className="text-[17px]" style={{ color: 'var(--fg-2)' }}>Weekly and monthly rates already include the discount. Taxes and deposit are shown before you sign, never after.</p>
        </Reveal>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left tabular">
            <thead>
              <tr className="label-caps" style={{ color: 'var(--fg-3)' }}>
                <th className="font-medium py-3 pr-4">Car</th>
                <th className="font-medium py-3 pr-4 text-right">Day</th>
                <th className="font-medium py-3 pr-4 text-right">Week</th>
                <th className="font-medium py-3 pr-4 text-right">Month</th>
                <th className="font-medium py-3 text-right">Deposit</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v, i) => (
                <tr key={v.id} className="group transition-colors" style={{ background: i % 2 ? 'transparent' : 'rgb(244 242 238 / 0.025)' }}>
                  <td className="py-4 pr-4 pl-3 rounded-l-md">
                    <Link to={`/fleet/${v.slug}`} className="font-display text-[20px] group-hover:italic transition-all">{v.year} {v.make} {v.model}</Link>
                  </td>
                  <td className="py-4 pr-4 text-right text-[16px]">{money(v.rates.daily)}</td>
                  <td className="py-4 pr-4 text-right text-[16px]">{money(v.rates.weekly)}</td>
                  <td className="py-4 pr-4 text-right text-[16px]">{money(v.rates.monthly)}</td>
                  <td className="py-4 pr-3 text-right text-[16px] rounded-r-md" style={{ color: 'var(--fg-2)' }}>{money(v.depositDefault)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-32 md:pt-48">
        <div className="rounded-[var(--radius-lg)] p-10 md:p-20 grid md:grid-cols-[1.3fr_1fr] gap-10 items-center" style={{ background: 'var(--surface)' }}>
          <Lines as="h2" lines={['Tell us the dates.', 'We handle the rest.']} className="font-display text-[clamp(32px,4.5vw,64px)] leading-[1.02]" />
          <Reveal className="md:justify-self-end flex flex-col items-start gap-4">
            <Link to="/reserve" className="btn btn-primary btn-lg">Reserve a car</Link>
            <a href="tel:+17135550148" className="text-[15px]" style={{ color: 'var(--fg-2)' }}>Or call (713) 555-0148</a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
