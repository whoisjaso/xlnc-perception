import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useFleet } from '@/store';
import type { VehicleClass } from '@/lib/types';
import { VehicleImage } from '@/components/site/VehicleImage';
import { Lines, Reveal } from '@/components/site/Reveal';
import { money, cx } from '@/lib/util';

const CLASSES: { value: VehicleClass | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'supercar', label: 'Supercars' },
  { value: 'grand-tourer', label: 'Grand tourers' },
  { value: 'luxury-suv', label: 'SUVs' },
  { value: 'convertible', label: 'Convertibles' },
  { value: 'ev', label: 'Electric' },
];

export function Fleet() {
  const vehicles = useFleet((s) => s.vehicles);
  const [cls, setCls] = useState<VehicleClass | 'all'>('all');
  const list = useMemo(() => vehicles.filter((v) => v.status !== 'retired' && (cls === 'all' || v.class === cls)), [vehicles, cls]);

  return (
    <div className="mx-auto max-w-[1600px] px-5 md:px-10 pt-36 md:pt-48">
      <title>The Fleet. Nova Wheels</title>
      <div className="grid md:grid-cols-[1fr_auto] gap-10 items-end">
        <div>
          <Lines as="h1" lines={['Twelve cars.', 'No compromises.']} className="font-display text-[clamp(40px,7vw,104px)] leading-[0.98]" />
          <Reveal delay={0.3} className="mt-6 max-w-[48ch]">
            <p className="text-[17px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
              Every car is under three years old, serviced by the dealer, and detailed before every rental. Rates fall on weekly and monthly terms.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.4}>
          <div role="radiogroup" aria-label="Filter by class" className="flex flex-wrap gap-2">
            {CLASSES.map((c) => (
              <button
                key={c.value}
                role="radio"
                aria-checked={cls === c.value}
                onClick={() => setCls(c.value)}
                className={cx('h-10 px-4 rounded-full text-[13px] font-medium border transition-colors', cls === c.value ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]' : 'border-[var(--line-strong)] hover:border-[var(--fg)]')}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="mt-20 grid md:grid-cols-12 gap-x-6 gap-y-16">
        {list.map((v, i) => {
          const pattern = i % 3;
          const span = pattern === 0 ? 'md:col-span-7' : pattern === 1 ? 'md:col-span-5 md:mt-20' : 'md:col-span-12 md:px-[10%]';
          const aspect = pattern === 0 ? 'aspect-[16/10]' : pattern === 1 ? 'aspect-[4/5]' : 'aspect-[21/9]';
          return (
            <Reveal key={v.id} className={span} delay={(i % 2) * 0.08}>
              <Link to={`/fleet/${v.slug}`} className="group block">
                <div className={cx(aspect, 'relative overflow-hidden rounded-[var(--radius-lg)]')}>
                  <VehicleImage vehicle={v} className="w-full h-full transition-transform duration-[1400ms] group-hover:scale-[1.04]" />
                  {v.status !== 'available' && (
                    <p className="absolute top-4 left-4 label-caps h-7 px-3 inline-flex items-center rounded-full" style={{ background: 'rgb(15 16 18 / 0.7)', color: 'var(--fg-2)' }}>
                      {v.status === 'rented' ? 'Out now' : v.status === 'reserved' ? 'Reserved' : 'In service'}
                    </p>
                  )}
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-6">
                  <div>
                    <p className="font-display text-[26px] md:text-[32px] leading-tight">{v.year} {v.make} <span className="italic">{v.model}</span></p>
                    <p className="text-[15px] mt-1 max-w-[46ch]" style={{ color: 'var(--fg-3)' }}>{v.tagline}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="tabular text-[16px]">{money(v.rates.daily)} <span style={{ color: 'var(--fg-3)' }}>/ day</span></p>
                    <p className="tabular text-[13px] mt-1" style={{ color: 'var(--fg-3)' }}>{money(v.rates.weekly)} / week</p>
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
