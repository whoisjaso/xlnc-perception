
import React, { useState } from 'react';
import { CheckCircle2, Scan, Cpu, Globe, Crosshair, Zap, Shield, ArrowRight, Terminal } from 'lucide-react';

const Services: React.FC = () => {
  const [activePhase, setActivePhase] = useState(0);

  const phases = [
    {
      id: "01",
      title: "Neural Mapping",
      subtitle: "The Audit",
      icon: Scan,
      desc: "We do not guess. We scan. We strip your business down to its raw logic gate. We identify where human friction is bleeding capital and where entropy has set in. This is a full diagnostic of your operational consciousness.",
      status: "ANALYZING...",
      output: ["Entropy Leaks Identified", "Workflow Bottlenecks Mapped", "Revenue Void Calculated"]
    },
    {
      id: "02",
      title: "Synthetic Injection",
      subtitle: "The Build",
      icon: Cpu,
      desc: "This is surgery. We excise the manual processes and graft AI agents into the wound. We clone your best closer's voice. We weave n8n logic threads through your CRM. The system is rebuilt from the skeleton up.",
      status: "COMPILING...",
      output: ["Voice Model Synthesized", "Logic Grid Established", "Human Error Removed"]
    },
    {
      id: "03",
      title: "Reality Override",
      subtitle: "The Launch",
      icon: Globe,
      desc: "We flip the switch. The old manual reality dies. The new automated empire breathes. Leads are processed instantly. Revenue is reclaimed automatically. You step back and watch the dashboard turn green.",
      status: "DEPLOYING...",
      output: ["Dominion Achieved", "Latency Eliminated", "Cashflow Accelerated"]
    }
  ];

  const upgrades = [
    {
      title: "Revenue Recovery Automata",
      icon: Crosshair,
      code: "MOD-REC-01",
      desc: "A hunter-killer protocol designed solely to reactivate dead leads. It pursues relentlessly until the target buys or blocks."
    },
    {
      title: "Speed-to-Lead Interceptor",
      icon: Zap,
      code: "MOD-SPD-04",
      desc: "Instant voice connection within 120ms of form submission. The lead doesn't even have time to put their phone down."
    },
    {
      title: "Sovereign Gatekeeper",
      icon: Shield,
      code: "MOD-SEC-09",
      desc: "Filters low-intent traffic before it ever touches your calendar. Only the worthy pass through the digital velvet rope."
    }
  ];

  return (
    <div className="pt-24 min-h-screen bg-xlnc-bg relative overflow-hidden">
      {/* Background Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}
      />
      
      <div className="max-w-7xl mx-auto py-20 px-6 relative z-10">
         
         {/* Manifesto Header */}
         <div className="mb-32 animate-slide-up">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px w-12 bg-xlnc-gold"></div>
                <span className="text-xlnc-gold text-[10px] font-bold uppercase tracking-[0.3em]">Operational Protocol</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-serif text-white mb-8 tracking-tight leading-[0.9]">
                The Execution<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 via-gray-200 to-gray-500">Layer</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed font-light">
                Ideas are ghosts. Execution is the exorcism. <br/>
                We do not "consult". We install systems of dominance directly into your revenue stream.
            </p>
         </div>

         {/* The 3-Phase Process */}
         <div className="grid lg:grid-cols-3 gap-8 mb-32 relative">
             {/* Connector Line (Desktop) */}
             <div className="hidden lg:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>

             {phases.map((phase, idx) => (
                 <div 
                    key={phase.id} 
                    className="relative group cursor-default"
                    onMouseEnter={() => setActivePhase(idx)}
                 >
                     {/* Number Node */}
                     <div className={`relative z-10 w-24 h-24 mb-8 bg-xlnc-bg border transition-all duration-500 flex items-center justify-center group-hover:scale-110
                        ${activePhase === idx ? 'border-xlnc-gold shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/10 text-gray-600'}
                     `}>
                        <phase.icon size={32} className={`transition-colors duration-500 ${activePhase === idx ? 'text-xlnc-gold' : 'text-gray-600'}`} />
                        <div className={`absolute top-0 right-0 bg-black text-[9px] font-bold px-2 py-1 border-l border-b ${activePhase === idx ? 'border-xlnc-gold text-xlnc-gold' : 'border-white/10 text-gray-600'}`}>
                            {phase.id}
                        </div>
                     </div>

                     {/* Content */}
                     <div className={`p-8 border transition-all duration-500 min-h-[340px] flex flex-col justify-between
                        ${activePhase === idx ? 'bg-xlnc-panel border-xlnc-gold/30' : 'bg-transparent border-white/5 hover:border-white/10'}
                     `}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`text-2xl font-serif transition-colors ${activePhase === idx ? 'text-white' : 'text-gray-500'}`}>{phase.title}</h3>
                                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest pt-2">// {phase.subtitle}</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-loose font-light mb-8">
                                {phase.desc}
                            </p>
                        </div>

                        {/* Terminal Output Visual */}
                        <div className="bg-black/40 border-t border-white/5 pt-4 font-mono text-[10px] space-y-2">
                            <div className={`flex items-center gap-2 ${activePhase === idx ? 'text-xlnc-gold animate-pulse' : 'text-gray-700'}`}>
                                <Terminal size={10} />
                                <span>STATUS: {phase.status}</span>
                            </div>
                            {phase.output.map((out, i) => (
                                <div key={i} className={`flex items-center gap-2 pl-4 transition-all duration-500 delay-${i*100} ${activePhase === idx ? 'opacity-100' : 'opacity-0'}`}>
                                    <span className="text-gray-600">{'>'}&gt;</span>
                                    <span className="text-gray-300">{out}</span>
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>
             ))}
         </div>

         {/* Tactical Upgrades */}
         <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
                <h2 className="text-3xl font-serif text-white">Tactical Loadout</h2>
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest hidden md:block">
                    Available Modules: 3 // Clearance: Sovereign
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {upgrades.map((mod, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 p-6 hover:bg-white/[0.04] hover:border-xlnc-gold/30 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-black border border-white/10 group-hover:border-xlnc-gold/50 transition-colors">
                                <mod.icon size={20} className="text-gray-400 group-hover:text-xlnc-gold transition-colors" />
                            </div>
                            <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest group-hover:text-xlnc-gold">{mod.code}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-xlnc-gold transition-colors">{mod.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed font-light mb-6">
                            {mod.desc}
                        </p>
                        <button className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">
                            <CheckCircle2 size={12} /> Install Module
                        </button>
                    </div>
                ))}
            </div>
         </div>

         {/* CTA */}
         <div className="mt-32 text-center">
             <div className="inline-flex flex-col items-center">
                 <p className="text-gray-500 text-sm mb-8 font-light italic">"The simulation breaks when you stop playing by its rules."</p>
                 <button className="group relative px-10 py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-xlnc-gold transition-all duration-500">
                    <span className="relative z-10 flex items-center gap-3">
                        Initiate Sequence <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                 </button>
             </div>
         </div>

      </div>
    </div>
  );
};

export default Services;
