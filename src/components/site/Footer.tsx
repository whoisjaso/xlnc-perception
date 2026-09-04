import { Link } from 'react-router';
import { Wordmark } from '@/components/brand/Wordmark';

export function Footer() {
  return (
    <footer className="mt-32 border-t hairline">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10 py-16 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-5">
          <Wordmark size="lg" />
          <p className="max-w-[36ch] text-[15px] leading-relaxed" style={{ color: 'var(--fg-3)' }}>
            Exotic and luxury vehicles by the day, week, or month. Delivered anywhere in Texas. Every car detailed, inspected, and photographed before it reaches you.
          </p>
        </div>
        <FooterCol title="Rent" links={[['The Fleet', '/fleet'], ['Reserve', '/reserve'], ['Requirements', '/requirements']]} />
        <FooterCol title="Company" links={[['The Experience', '/experience'], ['Contact', '/contact'], ['Team sign in', '/admin']]} />
        <div className="flex flex-col gap-3 text-[15px]" style={{ color: 'var(--fg-2)' }}>
          <p className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>Concierge</p>
          <a href="tel:+17135550148" className="hover:text-[var(--fg)] transition-colors">(713) 555-0148</a>
          <a href="mailto:concierge@novawheels.com" className="hover:text-[var(--fg)] transition-colors">concierge@novawheels.com</a>
          <p style={{ color: 'var(--fg-3)' }}>Seven days, 8am to 10pm</p>
        </div>
      </div>
      <div className="mx-auto max-w-[1600px] px-5 md:px-10 pb-10 flex flex-wrap justify-between gap-4 text-[13px]" style={{ color: 'var(--fg-3)' }}>
        <p>Nova Wheels LLC, Houston, Texas</p>
        <p>Renters must be 25 or older with a valid license and full-coverage insurance.</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="flex flex-col gap-3 text-[15px]" style={{ color: 'var(--fg-2)' }}>
      <p className="label-caps mb-1" style={{ color: 'var(--fg-3)' }}>{title}</p>
      {links.map(([label, to]) => (
        <Link key={to} to={to} className="hover:text-[var(--fg)] transition-colors w-fit">{label}</Link>
      ))}
    </div>
  );
}
