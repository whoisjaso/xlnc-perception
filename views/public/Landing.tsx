
import React, { useState } from 'react';
import { ArrowRight, Crown, Diamond, Scale, Mic2, Radio, Zap } from 'lucide-react';
import DiscoveryAgent from '../../components/DiscoveryAgent';

interface Props {
    onEnter: () => void;
}

const Landing: React.FC<Props> = ({ onEnter }) => {
  const [isCallActive, setIsCallActive] = useState(false);

  return (
    <div className="pt-24 min-h-screen bg-xlnc-bg">
        <DiscoveryAgent isOpen={isCallActive} onClose={() => setIsCallActive(false)} />

        {/* Hero Section */}
        <section className="relative py-40 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">
             {/* Ambient Gold Glow - Dynamic */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-xlnc-gold/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
             
             <div className="max-w-5xl mx-auto text-center relative z-10 space-y-12">
                 <div className="inline-flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-xlnc-gold to-transparent"></div>
                    <div className="flex items-center gap-3 border border-xlnc-gold/20 bg-black/50 backdrop-blur-md px-4 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-status-success rounded-full animate-pulse"></div>
                        <span className="text-xlnc-gold text-[9px] uppercase tracking-[0.3em] font-bold">
                            System Online
                        </span>
                    </div>
                 </div>
                 
                 <h1 className="text-5xl md:text-9xl font-serif font-medium text-white tracking-tight leading-[1] animate-slide-up opacity-0" style={{ animationDelay: '0.2s' }}>
                     The Architecture<br />
                     <span className="text-gray-600 italic font-script pr-4 text-4xl md:text-7xl">of</span>
                     <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FCF6BA] via-[#BF953F] to-[#AA771C]">Dominion</span>
                 </h1>
                 
                 <p className="text-sm md:text-lg text-gray-400 max-w-2xl mx-auto leading-loose font-light tracking-wide animate-slide-up opacity-0" style={{ animationDelay: '0.4s' }}>
                     XLNC is not a tool. It is a transfer of power. 
                     We replace chaos with order, noise with signal, and human effort with automated leverage.
                     <span className="block mt-4 text-white/80">Enter the era of the sovereign operator.</span>
                 </p>
                 
                 <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-8 animate-slide-up opacity-0" style={{ animationDelay: '0.6s' }}>
                     
                     {/* Primary Action */}
                     <button 
                        onClick={onEnter}
                        className="group relative inline-flex items-center justify-center px-12 py-5 bg-white text-black text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-xlnc-gold hover:text-black transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                     >
                         Enter The Console
                         <ArrowRight size={14} className="ml-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                     </button>

                     {/* AI Voice Trigger - The "Moonshot" */}
                     <button 
                        onClick={() => setIsCallActive(true)}
                        className="group relative flex items-center gap-4 px-10 py-5 border border-xlnc-gold/30 text-xlnc-gold bg-xlnc-gold/5 hover:bg-xlnc-gold/10 text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-500 overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                     >
                        <div className="absolute inset-0 bg-xlnc-gold/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out blur-xl"></div>
                        <span className="relative z-10 flex items-center gap-3">
                            <Mic2 size={16} className="animate-pulse" />
                            <span>TRY FREE DEMO</span>
                        </span>
                     </button>
                 </div>
                 
                 <div className="flex items-center justify-center gap-6 mt-8 opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-2 text-[9px] text-gray-600 uppercase tracking-widest">
                        <Radio size={12} />
                        <span>Live AI Neural Link</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                    <div className="flex items-center gap-2 text-[9px] text-gray-600 uppercase tracking-widest">
                        <Zap size={12} />
                        <span>Sub-100ms Latency</span>
                    </div>
                 </div>
             </div>
        </section>

        {/* Pillars of Authority */}
        <section className="py-32 px-6 border-t border-white/5 bg-xlnc-card/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5">
                    
                    <div className="p-16 bg-xlnc-bg hover:bg-white/[0.02] transition-colors duration-500 group cursor-default">
                        <Crown className="w-10 h-10 text-xlnc-gold mb-10 opacity-80 group-hover:opacity-100 transition-opacity" strokeWidth={1} />
                        <h3 className="text-2xl font-serif text-white mb-6">Status</h3>
                        <p className="text-gray-500 text-sm leading-loose font-light">
                            Market positioning is engineering, not accident. Our neural agents project the infrastructure of a multi-national corporation, instantly elevating your perceived value above the noise.
                        </p>
                    </div>

                    <div className="p-16 bg-xlnc-bg hover:bg-white/[0.02] transition-colors duration-500 group cursor-default">
                        <Scale className="w-10 h-10 text-gray-400 mb-10 opacity-80 group-hover:opacity-100 transition-opacity" strokeWidth={1} />
                        <h3 className="text-2xl font-serif text-white mb-6">Law</h3>
                        <p className="text-gray-500 text-sm leading-loose font-light">
                            Business is governed by laws of efficiency. We automate the enforcement of these laws, ensuring every lead is judged, qualified, and processed without human hesitation.
                        </p>
                    </div>

                    <div className="p-16 bg-xlnc-bg hover:bg-white/[0.02] transition-colors duration-500 group cursor-default">
                        <Diamond className="w-10 h-10 text-white mb-10 opacity-80 group-hover:opacity-100 transition-opacity" strokeWidth={1} />
                        <h3 className="text-2xl font-serif text-white mb-6">Wealth</h3>
                        <p className="text-gray-500 text-sm leading-loose font-light">
                            Wealth is the byproduct of leverage. By removing the friction of human error from revenue generation, we create a frictionless path to capital accumulation.
                        </p>
                    </div>

                </div>
            </div>
        </section>
    </div>
  );
};

export default Landing;
