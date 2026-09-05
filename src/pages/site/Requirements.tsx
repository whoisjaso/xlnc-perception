import { Link } from 'react-router';
import { CaretDown } from '@phosphor-icons/react';
import { Lines, Reveal } from '@/components/site/Reveal';

const REQS: [string, string][] = [
  ['Age', '25 or older for every car in the fleet. 30 or older for the McLaren and the Cullinan.'],
  ['License', 'A valid driver license in your name, held for at least three years. International renters bring a passport and an International Driving Permit.'],
  ['Insurance', 'A personal auto policy with full coverage that extends to rental vehicles, or our damage waiver. We verify the declarations page before delivery.'],
  ['Payment', 'A credit card in your name for the deposit and the rental. Debit cards are accepted for the rental but not for the deposit.'],
  ['Deposit', 'Held on your card at delivery, released within five business days of return. Amount depends on the car and is shown before you sign.'],
  ['Drivers', 'Only the people named on the agreement drive the car. Additional drivers are added at signing for a flat fee and must meet the same requirements.'],
];

const FAQ: [string, string][] = [
  ['How far can I drive?', 'Every car includes 100 to 150 miles per day depending on the model, and you can stay anywhere in Texas. Trips outside the state are possible with prior approval. Extra miles are billed at the per-mile rate shown on the car page.'],
  ['What if I return it late?', 'There is a one-hour grace period. After that, late time is billed hourly, and anything beyond six hours is billed as a full extra day. If you need more time, ask before the return time and we will extend it in writing.'],
  ['What about tolls and tickets?', 'They are yours, including ones that arrive weeks later. We charge the amount plus a small administrative fee to the card on file and send you the notice.'],
  ['Can I take it on a track?', 'No. Track days, timed events, and any contest of speed are prohibited, and the GPS makes it easy to tell. It voids coverage and ends the rental.'],
  ['Do you deliver?', 'Yes, across Houston at a flat fee, included on weekly and monthly rentals. Anywhere else in Texas we quote up front.'],
  ['Is the car tracked?', 'Yes. Every car has a GPS unit. It is how we recover a car if something goes wrong, and it is disclosed in the agreement you sign.'],
  ['What happens if there is damage?', 'You are responsible for damage during the rental, up to the value of the car. Your insurance or our waiver covers most of it. We document everything with photos at both ends so the conversation is about facts.'],
];

export function Requirements() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 md:px-10 pt-36 md:pt-48">
      <title>Requirements. Nova Wheels</title>
      <Lines as="h1" lines={['Requirements']} className="font-display text-[clamp(40px,7vw,104px)] leading-[0.98]" />
      <Reveal delay={0.3} className="mt-6 max-w-[52ch]">
        <p className="text-[17px] md:text-[19px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
          Six things, and we verify all of them once. After that, your file is on record and the next rental is a text message.
        </p>
      </Reveal>

      <div className="mt-20 grid md:grid-cols-2 gap-x-16 gap-y-12">
        {REQS.map(([t, b], i) => (
          <Reveal key={t} delay={(i % 2) * 0.08}>
            <h2 className="font-display text-[30px] md:text-[36px] leading-tight">{t}</h2>
            <p className="mt-3 text-[16px] leading-relaxed max-w-[52ch]" style={{ color: 'var(--fg-2)' }}>{b}</p>
          </Reveal>
        ))}
      </div>

      <section className="pt-32 md:pt-48 max-w-[880px]">
        <Lines as="h2" lines={['Questions']} className="font-display text-[clamp(34px,5vw,72px)] leading-none" />
        <div className="mt-12">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 0.03}>
              <details className="group border-b hairline">
                <summary className="list-none cursor-pointer py-6 flex items-center justify-between gap-6 text-[19px] md:text-[22px] font-medium">
                  {q}
                  <CaretDown aria-hidden className="size-5 shrink-0 transition-transform duration-500 group-open:rotate-180" style={{ transitionTimingFunction: 'var(--ease-out-expo)', color: 'var(--fg-3)' }} />
                </summary>
                <p className="pb-8 -mt-1 text-[16px] leading-relaxed max-w-[62ch]" style={{ color: 'var(--fg-2)' }}>{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-16">
          <Link to="/reserve" className="btn btn-primary btn-lg">Reserve a car</Link>
        </Reveal>
      </section>
    </div>
  );
}
