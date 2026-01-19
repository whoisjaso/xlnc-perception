
import React from 'react';
import { Code, Cpu, Zap } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen px-6 flex items-center justify-center bg-xlnc-bg">
      <div className="max-w-6xl mx-auto py-20">
         
         {/* Header */}
         <div className="text-center mb-24 animate-slide-up">
             <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-8 uppercase tracking-tight">The Architects</h1>
             <div className="w-24 h-1 bg-xlnc-gold mx-auto mb-8"></div>
             <p className="text-gray-400 font-light text-xl max-w-3xl mx-auto leading-relaxed">
                 Two minds. One protocol. Converging to engineer the infrastructure of your digital sovereignty.
             </p>
         </div>

         {/* Founders Grid */}
         <div className="grid md:grid-cols-2 gap-12 mb-24">
             
             {/* Jason */}
             <div className="opulent-card p-10 text-center group hover:border-xlnc-gold/50 transition-all duration-500 hover:transform hover:-translate-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                 <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full border-2 border-xlnc-gold p-1 mb-8 relative">
                     <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative z-10">
                         <span className="text-3xl font-serif font-bold text-white">JO</span>
                     </div>
                     <div className="absolute inset-0 border border-xlnc-gold rounded-full animate-pulse opacity-20"></div>
                 </div>
                 <h3 className="text-3xl font-serif text-white mb-2">Jason Obawemimo</h3>
                 <p className="text-xlnc-gold font-mono text-[10px] uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4 inline-block">Vision // Strategy</p>
                 <p className="text-gray-400 text-sm leading-loose font-light italic">
                    "Poverty is a mindset. Wealth is a law. I architect the systems that enforce that law, turning chaotic potential into structured dominion."
                 </p>
             </div>

             {/* Mark */}
             <div className="opulent-card p-10 text-center group hover:border-neon-cyan/50 transition-all duration-500 hover:transform hover:-translate-y-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                 <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full border-2 border-neon-cyan p-1 mb-8 relative">
                     <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative z-10">
                         <span className="text-3xl font-serif font-bold text-white">M</span>
                     </div>
                     <div className="absolute inset-0 border border-neon-cyan rounded-full animate-pulse opacity-20"></div>
                 </div>
                 <h3 className="text-3xl font-serif text-white mb-2">Mark</h3>
                 <p className="text-neon-cyan font-mono text-[10px] uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4 inline-block">Execution // Code</p>
                 <p className="text-gray-400 text-sm leading-loose font-light italic">
                    "Code is the modern steel. I forge the neural pathways and automation matrices that power the empire, ensuring zero latency between intent and result."
                 </p>
             </div>

         </div>

         {/* Unified Vision */}
         <div className="border-t border-white/5 pt-20 text-center space-y-10 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.6s' }}>
             <div className="inline-block">
                <h2 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-wide mb-2">The Origin Protocol</h2>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-xlnc-gold to-transparent"></div>
             </div>
             
             <div className="space-y-8 text-lg text-gray-300 leading-loose font-light">
                 <p>
                     We didn't build XLNC to compete with agencies. We built it to obsolete them.
                 </p>
                 <p>
                     Most systems are designed to keep you dependent. We realized that true power comes from ownership of the machine. 
                     Combining high-level strategic vision with ruthless technical execution, we created the <span className="text-white font-bold">Perception Engine</span>.
                 </p>
                 <p>
                     It allows a 20-year-old entrepreneur to project the authority of a Fortune 500 corporation. 
                     It allows a local business to dominate a market while the owners sleep.
                 </p>
             </div>
             
             <div className="pt-12 opacity-60">
                 <div className="inline-flex flex-col items-center gap-4 text-gray-500 font-mono text-xs uppercase tracking-[0.2em]">
                    <div className="flex gap-4">
                        <Cpu size={16} />
                        <Code size={16} />
                        <Zap size={16} />
                    </div>
                    <span>Engineered by Jason & Mark</span>
                    <span className="text-xlnc-gold">Est. 2025</span>
                 </div>
             </div>
         </div>

      </div>
    </div>
  );
};

export default About;
