import { useEffect, useId, useRef, useState } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { suggestAddresses, formatAddress, type AddressSuggestion } from '@/lib/address';
import type { Address } from '@/lib/types';
import { US_STATES, cx } from '@/lib/util';

/** Smart mailing address: type, pick, done. Falls back to manual fields. */
export function AddressInput({ value, onChange, autoFocus, line = true }: { value?: Address; onChange: (a: Address | undefined) => void; autoFocus?: boolean; line?: boolean }) {
  const [q, setQ] = useState(value?.formatted ?? '');
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const listId = useId();

  useEffect(() => {
    if (manual) return;
    if (value?.formatted && q === value.formatted) return;
    if (q.trim().length < 4) { setItems([]); return; }
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await suggestAddresses(q, ctrl.signal);
        if (!ctrl.signal.aborted) { setItems(res); setOpen(res.length > 0); setActive(0); }
      } catch { /* aborted or offline */ } finally { if (!ctrl.signal.aborted) setLoading(false); }
    }, 220);
    return () => clearTimeout(t);
  }, [q, manual, value?.formatted]);

  const pick = (s: AddressSuggestion) => {
    onChange(s.address);
    setQ(s.address.formatted ?? formatAddress(s.address));
    setOpen(false);
  };

  if (manual) {
    const a: Address = value ?? { line1: '', city: '', state: 'TX', postalCode: '', country: 'US' };
    const set = (patch: Partial<Address>) => { const next = { ...a, ...patch }; next.formatted = formatAddress(next); onChange(next); };
    return (
      <div className="grid grid-cols-6 gap-4">
        <input className="field-box col-span-6" placeholder="Street address" value={a.line1} onChange={(e) => set({ line1: e.target.value })} autoFocus aria-label="Street address" autoComplete="address-line1" />
        <input className="field-box col-span-6" placeholder="Apt, suite, unit (optional)" value={a.line2 ?? ''} onChange={(e) => set({ line2: e.target.value })} aria-label="Address line 2" autoComplete="address-line2" />
        <input className="field-box col-span-3" placeholder="City" value={a.city} onChange={(e) => set({ city: e.target.value })} aria-label="City" autoComplete="address-level2" />
        <select className="field-box col-span-1" value={a.state} onChange={(e) => set({ state: e.target.value })} aria-label="State" autoComplete="address-level1">
          {US_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="field-box col-span-2" placeholder="ZIP" inputMode="numeric" value={a.postalCode} onChange={(e) => set({ postalCode: e.target.value.replace(/\D/g, '').slice(0, 5) })} aria-label="ZIP code" autoComplete="postal-code" />
        <button className="col-span-6 text-left text-[14px] underline underline-offset-4" style={{ color: 'var(--fg-3)' }} onClick={() => setManual(false)}>Search instead</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          className={cx(line ? 'field' : 'field-box', 'pr-10')}
          placeholder="Start typing the street address"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => { setQ(e.target.value); if (value) onChange(undefined); }}
          onFocus={() => items.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (items[active]) pick(items[active]); }
            if (e.key === 'Escape') { setOpen(false); }
          }}
        />
        <MapPin aria-hidden className={cx('absolute right-2 top-1/2 -translate-y-1/2 size-5 transition-opacity', loading && 'animate-pulse')} style={{ color: value ? 'var(--accent-ink)' : 'var(--fg-3)' }} />
      </div>
      {open && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-2 w-full rounded-[var(--radius)] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-2)' }}>
          {items.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(s); }}
              onMouseEnter={() => setActive(i)}
              className="px-4 py-3 cursor-pointer"
              style={{ background: i === active ? 'var(--surface-2)' : 'transparent' }}
            >
              <p className="text-[15px] font-medium">{s.label}</p>
              <p className="text-[13px]" style={{ color: 'var(--fg-3)' }}>{s.secondary}</p>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="mt-3 text-[14px] underline underline-offset-4" style={{ color: 'var(--fg-3)' }} onClick={() => setManual(true)}>Enter it manually</button>
    </div>
  );
}
