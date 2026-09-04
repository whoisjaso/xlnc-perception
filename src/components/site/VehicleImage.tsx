import { useEffect, useState } from 'react';
import type { Vehicle } from '@/lib/types';
import { cx } from '@/lib/util';

// Probe cache: one request per image URL for the life of the page, so a
// missing photograph never flashes an empty box before the plate appears.
const probes = new Map<string, Promise<boolean>>();
const known = new Map<string, boolean>();
function probe(src: string): Promise<boolean> {
  if (!probes.has(src)) {
    probes.set(src, new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => { known.set(src, true); resolve(true); };
      img.onerror = () => { known.set(src, false); resolve(false); };
      img.src = src;
    }));
  }
  return probes.get(src)!;
}

/**
 * Renders the vehicle photograph. Until photography is dropped into
 * public/media/vehicles/<slug>.jpg it falls back to a typographic plate,
 * so the layout is honest about what is missing instead of showing stock.
 */
export function VehicleImage({ vehicle, className, sizes, priority, plateClass = 'plate', quiet }: { vehicle: Vehicle; className?: string; sizes?: string; priority?: boolean; plateClass?: 'plate' | 'plate-light'; quiet?: boolean }) {
  const src = vehicle.heroImage;
  const [ok, setOk] = useState<boolean | null>(src ? known.get(src) ?? null : false);
  useEffect(() => {
    if (!src) { setOk(false); return; }
    let live = true;
    void probe(src).then((r) => { if (live) setOk(r); });
    return () => { live = false; };
  }, [src]);

  if (!src || ok === false || ok === null) {
    const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    if (quiet || ok === null) return <div className={cx('relative overflow-hidden', plateClass, className)} role="img" aria-label={label} />;
    return (
      <div className={cx('relative overflow-hidden flex items-end @container', plateClass, className)} role="img" aria-label={label}>
        <div className="p-[6%] w-full">
          <p className="font-display text-[clamp(18px,11cqw,84px)] leading-[0.95] tracking-[-0.01em]" style={{ color: plateClass === 'plate' ? 'rgb(244 242 238 / 0.9)' : 'rgb(20 20 22 / 0.85)' }}>
            {vehicle.make}
            <br />
            <span className="italic font-normal">{vehicle.model}</span>
          </p>
          <p className="label-caps mt-[3%]" style={{ color: plateClass === 'plate' ? 'rgb(244 242 238 / 0.45)' : 'rgb(20 20 22 / 0.5)', fontSize: 'clamp(9px, 2.4cqw, 11px)' }}>
            {vehicle.color}
          </p>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}`}
      className={cx('object-cover', className)}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
    />
  );
}
