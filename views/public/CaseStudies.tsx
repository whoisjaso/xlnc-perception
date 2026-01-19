
import React, { useState } from 'react';
import { TrendingUp, Clock, DollarSign, Activity, CheckCircle2, ArrowRight, Lock, Database, Zap, BarChart3 } from 'lucide-react';

const CaseStudies: React.FC = () => {
  const [activeFile, setActiveFile] = useState<number | null>(0);

  const archives = [
    {
      id: "FILE-001",
      sector: "Automotive Sales",
      entity: "Triple J Auto Investment",
      status: "DOMINION ACHIEVED",
      entropy: {
        desc: "Human limitation. Sales representatives fatigued after 6:00 PM. Inbound leads were met with voicemail, creating a 'Vacuum of Trust' and allowing competitors to intercept.",
        stats: [
            { label: "Missed Calls", value: "34%" },
            { label: "Response Time", value: "45m" }
        ]
      },
      correction: {
        desc: "Deployed 'Night Watch' Neural Interceptor. A 24/7 voice agent with aggressive appointment-setting protocols. It does not sleep. It does not hesitate.",
        stats: [
            { label: "Capture Rate", value: "100%" },
            { label: "Response Time", value: "200ms" }
        ]
      },
      outcome: {
        revenue: "+$42,000",
        timeline: "30 Days",
        quote: "The system booked 12 appointments while I was asleep. I woke up richer."
      }
    },
    {
      id: "FILE-002",
      sector: "Legal Services",
      entity: "Apex Litigation Partners",
      status: "TIME RECLAIMED",
      entropy: {
        desc: "Misallocation of high-value cognitive resources. Senior partners billing $1,000/hr were wasting cycles filtering low-intent leads. A massive inefficiency in capital allocation.",
        stats: [
            { label: "Wasted Hours", value: "15/wk" },
            { label: "Burnout Risk", value: "HIGH" }
        ]
      },
      correction: {
        desc: "Installed 'The Gatekeeper' Logic Matrix. An intent-filtering voice protocol that rigorously qualifies prospects before they ever touch the calendar.",
        stats: [
            { label: "Signal Purity", value: "99%" },
            { label: "Admin Load", value: "0%" }
        ]
      },
      outcome: {
        revenue: "Saved $18k/mo",
        timeline: "Immediate",
        quote: "My calendar is no longer a graveyard of wasted time. It is a sniper's nest."
      }
    },
    {
      id: "FILE-003",
      sector: "High Ticket Consulting",
      entity: "Sovereign Health",
      status: "AUTHORITY ESTABLISHED",
      entropy: {
        desc: "Inconsistent nurture sequences. Leads were 'chased' manually, creating a dynamic of desperation. Low status positioning resulted in price resistance.",
        stats: [
            { label: "Close Rate", value: "12%" },
            { label: "Perceived Value", value: "LOW" }
        ]
      },
      correction: {
        desc: "Implemented 'Omnipresence' Workflow. An automated n8n matrix that surrounds the lead with value and social proof across SMS, Voice, and Email simultaneously.",
        stats: [
            { label: "Close Rate", value: "38%" },
            { label: "Authority", value: "ABSOLUTE" }
        ]
      },
      outcome: {
        revenue: "3.5x ROI",
        timeline: "60 Days",
        quote: "We don't chase anymore. We select. The dynamic has completely flipped."
      }
    },
    {
      id: "FILE-004",
      sector: "Accounting & Tax",
      entity: "Smart Tax Nation",
      status: "SCALE UNLOCKED",
      entropy: {
        desc: "Seasonal bottlenecking. High-value CPAs were wasting billable hours answering basic inquiries. Inbound volume during tax season caused total operational paralysis.",
        stats: [
            { label: "Billable Loss", value: "$4k/day" },
            { label: "Missed Calls", value: "65%" }
        ]
      },
      correction: {
        desc: "Installed 'Fiscal Guard' Neural Interface. An AI that triages tax inquiries, collects documents via secure links, and books appointments only for qualified high-net-worth filings.",
        stats: [
            { label: "Triage Speed", value: "Instant" },
            { label: "Admin Saved", value: "40 hrs/wk" }
        ]
      },
      outcome: {
        revenue: "+30% YoY",
        timeline: "1 Tax Season",
        quote: "We scaled our client base by 30% without hiring a single new receptionist. The AI is the most profitable employee I have."
      }
    }
  ];

  return (
    <div className="pt-24 min-h-screen bg-xlnc-bg relative overflow-hidden">
       {/* Ambient Background */}
       <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}
      />

       <div className="max-w-7xl mx-auto py-20 px-6 relative z-10">
            
            {/* Header */}
            <div className="text-center mb-24 animate-slide-up">
                <div className="inline-flex items-center gap-3 border border-white/10 px-4 py-1 rounded-full mb-6 bg-black/50 backdrop-blur-sm">
                    <CheckCircle2 size={12} className="text-status-success" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Evidence of Dominion</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-serif text-white mb-6 tracking-tight">
                    Validated<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">Reality</span>
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                    We do not deal in "projected" results. We deal in historical fact.
                    <br/>These are not testimonials. They are the flight logs of those who have ascended.
                </p>
            </div>

            {/* The Archive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* File Selector (Left) */}
                <div className="lg:col-span-4 space-y-4">
                    {archives.map((file, idx) => (
                        <div 
                            key={file.id}
                            onClick={() => setActiveFile(idx)}
                            className={`p-6 border transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                                activeFile === idx 
                                ? 'bg-xlnc-gold/10 border-xlnc-gold text-white' 
                                : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'
                            }`}
                        >
                            {activeFile === idx && <div className="absolute left-0 top-0 w-1 h-full bg-xlnc-gold"></div>}
                            
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[9px] font-mono uppercase tracking-widest opacity-70">{file.id}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                                    activeFile === idx ? 'border-xlnc-gold text-xlnc-gold' : 'border-gray-700 text-gray-600'
                                }`}>{file.status}</span>
                            </div>
                            <h3 className={`text-xl font-serif mb-1 ${activeFile === idx ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{file.entity}</h3>
                            <p className="text-xs uppercase tracking-wide opacity-50">{file.sector}</p>
                        </div>
                    ))}

                    <div className="p-8 border border-dashed border-white/10 text-center opacity-50 mt-8">
                        <Lock size={24} className="mx-auto mb-3 text-gray-600" />
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Additional Archives Classified</p>
                        <p className="text-[9px] text-gray-600 mt-1">Level 5 Clearance Required</p>
                    </div>
                </div>

                {/* File Details (Right) */}
                <div className="lg:col-span-8">
                    {activeFile !== null && (
                        <div className="opulent-card p-8 md:p-12 animate-fade-in relative">
                            {/* Decorative Elements */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
                                <div className="text-[9px] font-mono text-status-success uppercase tracking-widest">Verified Log</div>
                            </div>

                            <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/10 pb-6 flex items-center gap-4">
                                <Database size={24} className="text-xlnc-gold" />
                                {archives[activeFile].entity}
                            </h2>

                            <div className="grid md:grid-cols-2 gap-12 relative">
                                {/* Center Line */}
                                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2"></div>
                                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black border border-xlnc-gold rounded-full items-center justify-center z-10">
                                    <ArrowRight size={14} className="text-xlnc-gold" />
                                </div>

                                {/* Before State (Entropy) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Activity size={16} className="text-status-alert" />
                                        <h3 className="text-xs font-bold text-status-alert uppercase tracking-[0.2em]">Entropy State (Before)</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed font-light">
                                        {archives[activeFile].entropy.desc}
                                    </p>
                                    <div className="bg-red-900/10 border border-red-900/20 p-4 space-y-3">
                                        {archives[activeFile].entropy.stats.map((stat, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs">
                                                <span className="text-red-400/70 uppercase tracking-wide">{stat.label}</span>
                                                <span className="text-red-400 font-mono font-bold">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* After State (Correction) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Zap size={16} className="text-xlnc-gold" />
                                        <h3 className="text-xs font-bold text-xlnc-gold uppercase tracking-[0.2em]">Neural Injection (After)</h3>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed font-light">
                                        {archives[activeFile].correction.desc}
                                    </p>
                                    <div className="bg-xlnc-gold/5 border border-xlnc-gold/20 p-4 space-y-3">
                                        {archives[activeFile].correction.stats.map((stat, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs">
                                                <span className="text-xlnc-gold/70 uppercase tracking-wide">{stat.label}</span>
                                                <span className="text-white font-mono font-bold">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Impact Summary */}
                            <div className="mt-12 pt-8 border-t border-white/10">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Operator Transcript</div>
                                        <p className="text-lg text-white font-serif italic">
                                            "{archives[activeFile].outcome.quote}"
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Total Impact</div>
                                        <div className="text-4xl font-serif text-xlnc-gold mb-1">
                                            {archives[activeFile].outcome.revenue}
                                        </div>
                                        <div className="text-xs text-emerald-500 font-mono">
                                            Realized in {archives[activeFile].outcome.timeline}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* The Law of Compound Leverage */}
            <div className="mt-32 border-t border-white/10 pt-20 text-center">
                <BarChart3 size={32} className="mx-auto mb-6 text-gray-600" />
                <h2 className="text-2xl md:text-4xl font-serif text-white mb-6">The Law of Compound Leverage</h2>
                <p className="text-gray-500 max-w-3xl mx-auto font-light leading-relaxed text-sm md:text-base">
                    Every manual task you automate is not just time saved. It is an error removed. <br/>
                    As errors decrease, trust increases. As trust increases, velocity increases. <br/>
                    <span className="text-white">This is how empires are built: Not by effort, but by removing the friction of being human.</span>
                </p>
            </div>
       </div>
    </div>
  );
};

export default CaseStudies;
