import React from 'react';
import { Shield, Scale, FileText, AlertOctagon } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen px-6 bg-xlnc-bg">
      <div className="max-w-4xl mx-auto py-20">
        
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center p-4 border border-white/10 rounded-full mb-6">
            <Scale size={24} className="text-xlnc-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Terms of Dominion</h1>
          <p className="text-gray-500 font-mono uppercase tracking-widest text-xs">Effective Date: 2025.01.01 // Protocol V2.1</p>
        </div>

        {/* Content Blocks */}
        <div className="space-y-12">
          
          <div className="opulent-card p-8 md:p-12">
            <div className="flex items-start gap-4">
              <span className="text-xlnc-gold font-serif text-2xl">01</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Acceptance of Architecture</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  By accessing the XLNC Perception Engine ("The System"), you acknowledge that you are entering a sovereign digital environment. 
                  You agree that the System is designed for high-frequency automation and that your use of these tools constitutes a binding agreement 
                  to adhere to our operational standards.
                </p>
              </div>
            </div>
          </div>

          <div className="opulent-card p-8 md:p-12">
            <div className="flex items-start gap-4">
              <span className="text-xlnc-gold font-serif text-2xl">02</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Usage Protocols</h3>
                <p className="text-gray-400 font-light leading-relaxed mb-4">
                  You are granted a limited, non-exclusive, revocable license to utilize the Neural Voice Agents and Workflow Matrix. 
                  Any attempt to reverse-engineer, decompile, or subvert the System's code is a violation of international IP law and will result in immediate termination of access.
                </p>
                <ul className="space-y-2 text-sm text-gray-500 font-mono pl-4 border-l border-white/10">
                  <li>{'>'}&gt; No unauthorized API probing.</li>
                  <li>{'>'}&gt; No utilization of agents for illegal solicitation.</li>
                  <li>{'>'}&gt; No reselling of access keys without Enterprise licensing.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="opulent-card p-8 md:p-12">
            <div className="flex items-start gap-4">
              <span className="text-xlnc-gold font-serif text-2xl">03</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Limitation of Liability</h3>
                <p className="text-gray-400 font-light leading-relaxed">
                  XLNC provides tools for leverage, not guarantees of wealth. While our systems are engineered for dominance, market conditions vary. 
                  We are not liable for lost revenue, missed calls due to carrier latency, or the psychological impact of your sudden increase in operational efficiency.
                </p>
              </div>
            </div>
          </div>

          <div className="opulent-card p-8 md:p-12 bg-red-900/5 border-red-900/20">
             <div className="flex items-start gap-4">
               <AlertOctagon className="text-red-500 shrink-0 mt-1" size={24} />
               <div>
                 <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Termination of Access</h3>
                 <p className="text-gray-400 font-light leading-relaxed">
                    XLNC reserves the right to sever your neural uplink at any time, for any reason. 
                    Common triggers for termination include payment failure, abusive language toward support automata, or misuse of voice cloning technology.
                 </p>
               </div>
             </div>
          </div>

        </div>

        <div className="mt-20 pt-10 border-t border-white/10 text-center">
            <p className="text-gray-600 text-xs">
                For legal inquiries, transmit signals to <span className="text-white hover:text-xlnc-gold cursor-pointer transition-colors">legal@xlnc.empire</span>
            </p>
        </div>

      </div>
    </div>
  );
};

export default Terms;