import { useMemo } from 'react';
import type { ContractContext } from '@/lib/contract';
import { renderContractHtml } from '@/lib/contract';

const STYLE = `
.contract{font-family:var(--font-sans);color:var(--fg);line-height:1.55;font-size:14.5px}
.contract header{margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid var(--line)}
.contract .co{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--fg-3);margin:0 0 10px}
.contract h1{font-family:var(--font-display);font-weight:400;font-size:34px;line-height:1.05;margin:0}
.contract .meta{margin:10px 0 0;color:var(--fg-3);font-size:13px}
.contract .intro{margin:16px 0 0;color:var(--fg-2);max-width:66ch}
.contract .clause{margin:0 0 22px;break-inside:avoid}
.contract h3{font-size:15px;font-weight:600;margin:0 0 6px}
.contract p{margin:0 0 8px;max-width:78ch}
.contract .plain{padding:10px 14px;border-left:1px solid var(--accent-ink);color:var(--fg-2);font-size:13.5px;background:color-mix(in oklab,var(--accent) 6%,transparent);border-radius:0 8px 8px 0}
.contract .sig{margin-top:18px}
.contract .sig-line{height:80px;border-bottom:1px solid var(--line-strong);display:flex;align-items:flex-end}
.contract .sig-line img{height:76px;width:auto}
.contract .sig-meta{font-size:12.5px;color:var(--fg-3);margin-top:6px}
@media print{.contract{color:#111;font-size:11.5pt}.contract .plain{background:#f3f3f3;border-left-color:#333;color:#222}.contract h3{font-size:12pt}}
`;

export function ContractDoc({ ctx, className }: { ctx: ContractContext; className?: string }) {
  const html = useMemo(() => renderContractHtml(ctx), [ctx]);
  return (
    <div className={className}>
      <style>{STYLE}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
