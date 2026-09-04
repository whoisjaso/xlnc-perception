import { Link, useParams } from 'react-router';
import { ArrowLeft } from '@phosphor-icons/react';
import { useFleet } from '@/store';
import { VehicleImage } from '@/components/site/VehicleImage';
import { Lines, Reveal } from '@/components/site/Reveal';
import { money, num } from '@/lib/util';

const CLASS_LABEL: Record<string, string> = { supercar: 'Supercar', 'grand-tourer': 'Grand tourer', 'luxury-sedan': 'Luxury sedan', 'luxury-suv': 'Luxury SUV', convertible: 'Convertible', ev: 'Electric', classic: 'Classic' };

export function VehiclePage() {
  const { slug } = useParams();
  const vehicles = useFleet((s) => s.vehicles);
  const v = vehicles.find((x) => x.slug === slug);
  if (!v) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 md:px-10 pt-48">
        <p className="font-display text-[40px]">That car is not in the fleet.</p>
        <Link to="/fleet" className="btn btn-ghost mt-8">Back to the fleet</Link>
      </div>
    );
  }
  const others = vehicles.filter((x) => x.id !== v.id && x.class === v.class).slice(0, 2).concat(vehicles.filter((x) => x.id !== v.id && x.class !== v.class).slice(0, 2)).slice(0, 3);

  const specs: [string, string][] = [
    ['Power', v.horsepower ? `${num(v.horsepower)} hp` : ''],
    ['0 to 60', v.zeroToSixty ? `${v.zeroToSixty}s` : ''],
    ['Top speed', v.topSpeed ? `${v.topSpeed} mph` : ''],
    ['Drive', v.drive ?? ''],
    ['Gearbox', v.transmission ?? ''],
    ['Seats', v.seats ? String(v.seats) : ''],
    ['Exterior', v.color],
    ['Interior', v.interior ?? ''],
  ].filter(([, val]) => val) as [string, string][];

  return (
    <div>
      <title>{`${v.year} ${v.make} ${v.model}. Nova Wheels`}</title>
      <section className="relative min-h-[92vh] overflow-hidden flex items-end">
        <VehicleImage vehicle={v} priority quiet className="absolute inset-0 w-full h-full" />
        <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(15 16 18 / 0.5), rgb(15 16 18 / 0.05) 40%, rgb(15 16 18 / 0.92))' }} />
        <div className="relative mx-auto max-w-[1600px] w-full px-5 md:px-10 pb-16 pt-40">
          <Link to="/fleet" className="label-caps inline-flex items-center gap-2 mb-10" style={{ color: 'var(--fg-2)' }}><ArrowLeft aria-hidden className="size-3.5" /> The fleet</Link>
          <div className="grid md:grid-cols-[1fr_auto] gap-10 items-end">
            <div>
              <p className="label-caps mb-4" style={{ color: 'var(--fg-2)' }}>{v.year} · {CLASS_LABEL[v.class]}</p>
              <Lines as="h1" lines={[v.make, v.model + (v.trim ? ` ${v.trim}` : '')]} className="font-display text-[clamp(44px,8vw,120px)] leading-[0.95] tracking-[-0.01em]" />
            </div>
            <Reveal delay={0.4} className="md:text-right">
              <p className="font-display text-[40px] leading-none tabular" style={{ color: 'var(--accent-ink)' }}>{money(v.rates.daily)}<span className="text-[18px] ml-2" style={{ color: 'var(--fg-2)' }}>per day</span></p>
              <Link to={`/reserve?vehicle=${v.slug}`} className="btn btn-primary btn-lg mt-6">Reserve this car</Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-24 md:pt-32 grid md:grid-cols-[1.1fr_1fr] gap-16">
        <Reveal>
          <p className="font-display text-[clamp(26px,3vw,40px)] leading-[1.25] max-w-[28ch]">{v.tagline}</p>
          <p className="mt-8 text-[17px] leading-relaxed max-w-[58ch]" style={{ color: 'var(--fg-2)' }}>{v.description}</p>
        </Reveal>
        <Reveal delay={0.15}>
          <dl className="grid grid-cols-2 gap-x-8">
            {specs.map(([k, val]) => (
              <div key={k} className="py-4 border-b hairline">
                <dt className="label-caps" style={{ color: 'var(--fg-3)' }}>{k}</dt>
                <dd className="mt-1 text-[18px] tabular">{val}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-24 md:pt-32">
        <Lines as="h2" lines={['Terms for this car']} className="font-display text-[clamp(32px,4.5vw,64px)] leading-none" />
        <div className="mt-12 grid md:grid-cols-[1fr_1fr_1fr] gap-px rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--line)' }}>
          {[
            ['Daily', money(v.rates.daily), `${num(v.includedMilesPerDay)} miles included`],
            ['Weekly', money(v.rates.weekly), `${num(v.includedMilesPerDay * 7)} miles included`],
            ['Monthly', money(v.rates.monthly), `${num(v.includedMilesPerDay * 30)} miles included`],
          ].map(([k, price, note], i) => (
            <div key={k} className="p-8 md:p-10" style={{ background: i === 1 ? 'var(--surface-2)' : 'var(--surface)' }}>
              <p className="label-caps" style={{ color: 'var(--fg-3)' }}>{k}</p>
              <p className="font-display text-[44px] leading-none mt-4 tabular">{price}</p>
              <p className="mt-3 text-[15px]" style={{ color: 'var(--fg-2)' }}>{note}</p>
            </div>
          ))}
        </div>
        <dl className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 text-[15px]">
          <div><dt className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Security deposit</dt><dd className="tabular">{money(v.depositDefault)}, released within 5 business days</dd></div>
          <div><dt className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Extra miles</dt><dd className="tabular">{money(v.overagePerMile, { cents: true })} per mile</dd></div>
          <div><dt className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Minimum age</dt><dd>{v.minRenterAge}</dd></div>
          <div><dt className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Insurance</dt><dd>Your full-coverage policy, or our damage waiver</dd></div>
        </dl>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-10 pt-32">
        <Lines as="h2" lines={['Also in the fleet']} className="font-display text-[clamp(32px,4.5vw,64px)] leading-none" />
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {others.map((o, i) => (
            <Reveal key={o.id} delay={i * 0.06} className={i === 1 ? 'md:mt-12' : ''}>
              <Link to={`/fleet/${o.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]">
                  <VehicleImage vehicle={o} className="w-full h-full transition-transform duration-[1400ms] group-hover:scale-[1.04]" />
                </div>
                <p className="font-display text-[24px] mt-4">{o.make} <span className="italic">{o.model}</span></p>
                <p className="text-[14px] tabular mt-1" style={{ color: 'var(--fg-3)' }}>{money(o.rates.daily)} / day</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
