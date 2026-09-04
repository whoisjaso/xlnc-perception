import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Plus } from '@phosphor-icons/react';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Button, Field, Input, Pill, Textarea, Toggle } from '@/components/ui';
import { ContractDoc } from '@/components/admin/ContractDoc';
import { useCustomers, useFleet, useRentals, useSettings, useTemplates } from '@/store';
import type { Clause, ContractTemplate } from '@/lib/types';
import { SEED_RENTALS } from '@/data/seed';
import { nowIso, uid, cx } from '@/lib/util';
import { successChord } from '@/lib/sound';

export function Contracts() {
  const templates = useTemplates();
  const nav = useNavigate();
  const create = () => {
    const base = templates.getDefault();
    const t: ContractTemplate = { ...base, id: uid('tpl'), name: `${base.name} (copy)`, isDefault: false, version: 1, updatedAt: nowIso(), clauses: base.clauses.map((c) => ({ ...c })) };
    templates.upsert(t);
    nav(`/admin/contracts/${t.id}`);
  };
  return (
    <Page>
      <title>Contract templates. Nova Wheels</title>
      <PageHeader title="Contract templates" subtitle="Every rental generates its agreement from one of these. Each clause carries a plain-language line the renter sees next to the legal text." actions={<Button variant="accent" onClick={create}><Plus className="size-4" /> Duplicate default</Button>} />
      <ul className="rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
        {templates.templates.map((t, i) => (
          <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-4" style={{ borderTop: i ? '1px solid var(--line)' : undefined }}>
            <Link to={`/admin/contracts/${t.id}`} className="hover:underline underline-offset-4"><span className="font-medium">{t.name}</span><span className="block text-[13px]" style={{ color: 'var(--fg-3)' }}>v{t.version} · {t.clauses.filter((c) => c.enabled).length} of {t.clauses.length} clauses on</span></Link>
            <span className="flex items-center gap-2">{t.isDefault ? <Pill tone="accent">Default</Pill> : <Button size="sm" variant="quiet" onClick={() => templates.setDefault(t.id)}>Make default</Button>}</span>
          </li>
        ))}
      </ul>
    </Page>
  );
}

export function ContractEditor() {
  const { id } = useParams();
  const templates = useTemplates();
  const settings = useSettings((s) => s.settings);
  const fleet = useFleet((s) => s.vehicles);
  const customers = useCustomers((s) => s.customers);
  const rentals = useRentals((s) => s.rentals);
  const existing = templates.byId(id ?? '');
  const [t, setT] = useState<ContractTemplate | undefined>(existing);
  const [preview, setPreview] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  if (!t) return <Page><p>Template not found.</p></Page>;
  const setClause = (cid: string, p: Partial<Clause>) => setT({ ...t, clauses: t.clauses.map((c) => (c.id === cid ? { ...c, ...p } : c)) });
  const addClause = () => { const c: Clause = { id: uid('cl'), title: 'New clause', body: '', plain: '', required: false, enabled: true, category: 'legal' }; setT({ ...t, clauses: [...t.clauses, c] }); setOpen(c.id); };
  const save = () => { templates.upsert({ ...t, version: t.version + 1 }); successChord(); };

  // Preview against a real rental if one exists, otherwise the seed sample.
  const sample = rentals.find((r) => fleet.some((v) => v.id === r.vehicleId) && customers.some((c) => c.id === r.customerId)) ?? SEED_RENTALS[0];
  const ctx = useMemo(() => {
    const v = fleet.find((x) => x.id === sample.vehicleId) ?? fleet[0];
    const c = customers.find((x) => x.id === sample.customerId) ?? customers[0];
    return v && c ? { rental: sample, vehicle: v, customer: c, company: settings, template: t } : null;
  }, [sample, fleet, customers, settings, t]);

  return (
    <Page wide>
      <title>{`${t.name}. Nova Wheels`}</title>
      <PageHeader title={t.name} subtitle={`Version ${t.version}`} actions={<><Button variant="quiet" size="sm" onClick={() => setPreview((p) => !p)}>{preview ? 'Edit' : 'Preview'}</Button><Link to="/admin/contracts" className="btn btn-quiet btn-sm">Templates</Link><Button variant="accent" size="sm" onClick={save}>Save as v{t.version + 1}</Button></>} />
      {preview && ctx ? (
        <div className="rounded-[var(--radius-lg)] p-6 md:p-12" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}><ContractDoc ctx={ctx} /></div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="rounded-[var(--radius-lg)] p-6 grid gap-4" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <Field label="Template name" htmlFor="tn"><Input id="tn" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} /></Field>
            <Field label="Introduction" htmlFor="ti"><Textarea id="ti" value={t.intro} onChange={(e) => setT({ ...t, intro: e.target.value })} /></Field>
            <Field label="Signature block" htmlFor="ts"><Textarea id="ts" value={t.signatureBlock} onChange={(e) => setT({ ...t, signatureBlock: e.target.value })} /></Field>
          </section>
          <section className="rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            {t.clauses.map((c, i) => (
              <div key={c.id} style={{ borderTop: i ? '1px solid var(--line)' : undefined }}>
                <div className="flex items-center gap-4 px-5 py-3">
                  <button className="flex-1 text-left" onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}>
                    <span className="text-[15px] font-medium">{i + 1}. {c.title}</span>
                    <span className="ml-3 text-[12px] uppercase tracking-[0.1em]" style={{ color: 'var(--fg-3)' }}>{c.category}{c.required ? ' · required' : ''}</span>
                  </button>
                  <div className={cx(c.required && 'opacity-40 pointer-events-none')}><Toggle id={`en-${c.id}`} label="" checked={c.enabled} onChange={(v) => setClause(c.id, { enabled: v })} /></div>
                </div>
                {open === c.id && (
                  <div className="px-5 pb-5 grid gap-4">
                    <Field label="Title" htmlFor={`t-${c.id}`}><Input id={`t-${c.id}`} value={c.title} onChange={(e) => setClause(c.id, { title: e.target.value })} /></Field>
                    <Field label="Legal text" htmlFor={`b-${c.id}`} hint="Tokens like {{renter.fullName}}, {{terms.rate}}, {{deposit.amount}}, {{vehicle.vin}} fill in per rental."><Textarea id={`b-${c.id}`} className="min-h-40 font-mono text-[13px]" value={c.body} onChange={(e) => setClause(c.id, { body: e.target.value })} /></Field>
                    <Field label="In plain terms" htmlFor={`p-${c.id}`} hint="One or two sentences a renter reads instead of the legal text."><Textarea id={`p-${c.id}`} value={c.plain} onChange={(e) => setClause(c.id, { plain: e.target.value })} /></Field>
                    {!c.required && <Button size="sm" variant="quiet" className="justify-self-start" onClick={() => setT({ ...t, clauses: t.clauses.filter((x) => x.id !== c.id) })}>Delete clause</Button>}
                  </div>
                )}
              </div>
            ))}
            <div className="px-5 py-4" style={{ borderTop: '1px solid var(--line)' }}><Button size="sm" variant="ghost" onClick={addClause}><Plus className="size-4" /> Add clause</Button></div>
          </section>
        </div>
      )}
    </Page>
  );
}
