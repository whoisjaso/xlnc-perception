import React, { useState } from 'react';
import { Radio, Network, Database, Cpu, Zap, Activity, Lock, Share2, Disc } from 'lucide-react';

const Solutions: React.FC = () => {
  const [activeModule, setActiveModule] = useState<number | null>(null);

  const modules = [
    {
      id: "01",
      name: "Neural Voice Interceptors",
      icon: Radio,
      short: "Conversational Hypnosis Engine",
      description: "Human sales reps sleep. They miss calls. They struggle with language barriers. Our Interceptors are Omnipresent. They operate 24/7 in 29+ languages, deploying scarcity heuristics and tonal mirroring to qualify leads with zero latency. You are always open. You are always closing.",
      specs: [
        { label: "Latency", value: "< 400ms" },
        { label: "Operation", value: "24/7/365" },
        { label: "Languages", value: "Universal" }
      ],
      visual: (
        <div className="relative w-full h-full flex items-center justify-center">
             <div className="absolute inset-0 bg-xlnc-gold/5 animate-pulse rounded-full blur-xl"></div>
             {/* Audio Waveform Viz */}
             <div className="flex items-center gap-1 h-12">
                {[...Array(12)].map((_, i) => (
                    <div 
                        key={i} 
                        className="w-1 bg-xlnc-gold" 
                        style={{ 
                            height: `${Math.random() * 100}%`,
                            animation: `soundWave 1s infinite ease-in-out ${i * 0.1}s` 
                        }} 
                    />
                ))}
             </div>
             <style>{`
                @keyframes soundWave {
                    0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
                    50% { transform: scaleY(1); opacity: 1; }
                }
             `}</style>
        </div>
      )
    },
    {
      id: "02",
      name: "The Nexus Matrix",
      icon: Network,
      short: "Digital Nervous System",
      description: "Chaos is a leak in your revenue vessel. The Nexus (powered by n8n) weaves a logic grid through your entire operation. Data flows from voice to CRM to dispatch instantly. It is the end of human error.",
      specs: [
        { label: "Uptime", value: "99.99%" },
        { label: "Data Loss", value: "0.00%" },
        { label: "Logic", value: "Absolute" }
      ],
      visual: (
         <div className="relative w-full h-full">
            <div className="absolute inset-0 grid grid-cols-3 gap-2 opacity-30">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-neon-cyan/50 relative">
                        <div className="absolute top-0 left-0 w-1 h-1 bg-neon-cyan"></div>
                    </div>
                ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border border-neon-cyan rotate-45 flex items-center justify-center">
                    <div className="w-12 h-12 bg-neon-cyan/10"></div>
                </div>
            </div>
         </div>
      )
    },
    {
      id: "03",
      name: "Sovereign Memory",
      icon: Database,
      short: "Total Recall CRM Sync",
      description: "Data is the currency of the new world. Our architecture ensures that every word spoken, every objection raised, and every dollar promised is etched into your CRM immediately. You own the truth.",
      specs: [
        { label: "Encryption", value: "AES-256" },
        { label: "Storage", value: "Immutable" },
        { label: "Access", value: "Instant" }
      ],
      visual: (
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-24 h-32 border-x border-white/20 relative">
                <div className="absolute top-0 left-0 w-full h-px bg-white/50 animate-[scan_2s_linear_infinite]"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-px w-full bg-white/10 my-4"></div>
                ))}
            </div>
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
      )
    }
  ];

  return (
    <div className="pt-24 min-h-screen bg-xlnc-bg relative overflow-hidden">
      {/* Background Schematic Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
        }}
      />

      <div className="max-w-7xl mx-auto py-20 px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-32 animate-slide-up">
            <div className="inline-flex items-center gap-3 border border-white/10 px-4 py-1 rounded-full mb-6 bg-black/50 backdrop-blur-sm">
                <Cpu size={12} className="text-xlnc-gold" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">System Architecture v2.1</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-serif text-white mb-6 tracking-tight">
                The Blueprints<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-xlnc-gold via-white to-xlnc-gold">Of Dominion</span>
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                We do not sell software. We engineer the skeletal structure of your market dominance.
                Every module is a force multiplier designed to remove human friction.
            </p>
        </div>

        {/* The Central Spine Layout */}
        <div className="relative">
            {/* The Spine Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-xlnc-gold/50 to-transparent hidden md:block"></div>
            
            <div className="space-y-32">
                {modules.map((module, index) => {
                    const isEven = index % 2 === 0;
                    return (
                        <div 
                            key={module.id} 
                            className={`flex flex-col md:flex-row items-center gap-12 md:gap-24 relative group ${!isEven ? 'md:flex-row-reverse' : ''}`}
                            onMouseEnter={() => setActiveModule(index)}
                            onMouseLeave={() => setActiveModule(null)}
                        >
                            {/* Connection Node on Spine */}
                            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-xlnc-bg border border-xlnc-gold rotate-45 items-center justify-center z-20">
                                <div className={`w-1.5 h-1.5 bg-xlnc-gold transition-all duration-500 ${activeModule === index ? 'scale-100' : 'scale-0'}`}></div>
                            </div>

                            {/* Text Side */}
                            <div className={`flex-1 text-left ${isEven ? 'md:text-right' : 'md:text-left'} animate-fade-in`}>
                                <div className={`flex items-center gap-4 mb-4 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                    <div className="text-xlnc-gold font-mono text-sm border border-xlnc-gold/30 px-2 py-1">SYS-{module.id}</div>
                                    <h3 className="text-3xl font-serif text-white">{module.name}</h3>
                                </div>
                                <h4 className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] mb-6">{module.short}</h4>
                                <p className="text-gray-400 leading-loose font-light mb-8">
                                    {module.description}
                                </p>
                                
                                {/* Technical Specs Table */}
                                <div className={`inline-grid grid-cols-3 gap-px bg-white/10 border border-white/10 ${isEven ? 'md:mr-0' : 'md:ml-0'}`}>
                                    {module.specs.map((spec) => (
                                        <div key={spec.label} className="bg-black/80 p-4 text-center group-hover:bg-white/5 transition-colors">
                                            <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{spec.label}</div>
                                            <div className="text-xs text-white font-mono font-bold">{spec.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Visual Side (The Black Box) */}
                            <div className="flex-1 w-full">
                                <div className="aspect-square md:aspect-video bg-black/40 border border-white/10 relative overflow-hidden group-hover:border-xlnc-gold/50 transition-all duration-700">
                                    {/* Tech Overlay */}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        <div className="w-1 h-1 bg-white/20"></div>
                                        <div className="w-1 h-1 bg-white/20"></div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-600 uppercase">
                                        Status: Online
                                    </div>

                                    {/* Inner Visual */}
                                    <div className="absolute inset-0 p-12 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                                        {module.visual}
                                    </div>

                                    {/* Glass Glare */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* Bottom Connector */}
            <div className="mt-32 text-center">
                <div className="inline-flex flex-col items-center gap-6">
                    <div className="h-20 w-px bg-gradient-to-b from-xlnc-gold/50 to-transparent"></div>
                    <div className="w-3 h-3 bg-xlnc-gold rounded-full animate-pulse shadow-[0_0_20px_#D4AF37]"></div>
                    <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">End of Schematic</p>
                </div>
            </div>

        </div>

        {/* Floating Technical Decor */}
        <div className="fixed bottom-12 left-12 hidden lg:block opacity-30 pointer-events-none">
             <div className="flex flex-col gap-2 font-mono text-[9px] text-xlnc-gold">
                 <div className="flex items-center gap-2">
                     <Activity size={10} />
                     <span>CORE_TEMP: 42°C</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <Lock size={10} />
                     <span>ENCRYPTION: ACTIVE</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <Share2 size={10} />
                     <span>NODES: 3/3 ONLINE</span>
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Solutions;