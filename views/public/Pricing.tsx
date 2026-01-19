import React, { useState } from 'react';
import { Check, X, Zap, Globe, Clock, Brain, Infinity } from 'lucide-react';

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  return (
    <div className="pt-24 min-h-screen px-6 bg-xlnc-bg relative overflow-hidden">
        {/* Background Grids */}
         <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }}
        />

      <div className="max-w-7xl mx-auto py-20 text-center relative z-10">
        <span className="text-xlnc-gold text-[10px] uppercase tracking-[0.4em] block mb-4 animate-pulse">Protocol Access</span>
        <h2 className="text-4xl md:text-6xl font-serif text-white mb-6 tracking-tight">
            Acquire <span className="text-transparent bg-clip-text bg-gradient-to-r from-xlnc-gold via-white to-xlnc-gold">Leverage</span>
        </h2>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Wealth is not created by working harder. It is created by owning the machinery of production. 
            <br/>Replace biological limitations with infinite synthetic scale.
        </p>

        {/* Frequency Toggle */}
        <div className="flex justify-center mb-16">
            <div className="p-1 border border-white/10 bg-black/40 rounded-full flex items-center gap-2">
                <button 
                    onClick={() => setBillingCycle('MONTHLY')}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${billingCycle === 'MONTHLY' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                    Lunar Cycle
                </button>
                <button 
                    onClick={() => setBillingCycle('ANNUAL')}
                    className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'ANNUAL' ? 'bg-xlnc-gold text-black' : 'text-gray-500 hover:text-white'}`}
                >
                    Solar Cycle <span className="text-[8px] bg-black text-xlnc-gold px-1.5 py-0.5 rounded-sm">-20% ENTROPY</span>
                </button>
            </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
            {/* Tier 1 */}
            <div className="bg-[#080808] border border-white/5 p-10 flex flex-col text-left relative hover:border-white/20 transition-all duration-500 group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 group-hover:bg-gray-600 transition-colors"></div>
                <h3 className="text-2xl font-serif text-white mb-1">Initiate</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-8">The Awakening</p>
                
                <div className="text-4xl font-serif text-white mb-2">
                    {billingCycle === 'MONTHLY' ? '$500' : '$400'}
                    <span className="text-sm font-sans font-light text-gray-600 ml-2">/ MO</span>
                </div>
                <p className="text-xs text-gray-600 mb-8 font-mono">Billed {billingCycle === 'MONTHLY' ? 'Monthly' : 'Annually'}</p>
                
                <ul className="space-y-6 flex-1 mb-12">
                    <li className="flex items-start gap-4 text-sm text-gray-400 font-light group-hover:text-gray-300">
                         <Clock size={14} className="mt-1 text-gray-600" /> 
                         <span>500 Automated Minutes<br/><span className="text-xs text-gray-600">~8 hrs of labor replaced</span></span>
                    </li>
                    <li className="flex items-start gap-4 text-sm text-gray-400 font-light group-hover:text-gray-300">
                         <Globe size={14} className="mt-1 text-gray-600" /> 
                         <span>Standard Neural Response</span>
                    </li>
                    <li className="flex items-start gap-4 text-sm text-gray-400 font-light group-hover:text-gray-300">
                         <Zap size={14} className="mt-1 text-gray-600" /> 
                         <span>Basic CRM Sync</span>
                    </li>
                </ul>
                <button className="w-full py-4 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300">
                    Begin Protocol
                </button>
            </div>

            {/* Tier 2 - Sovereign */}
            <div className="bg-[#050505] border border-xlnc-gold/40 p-10 flex flex-col text-left relative shadow-[0_0_50px_rgba(212,175,55,0.08)] scale-105 z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-xlnc-bg border border-xlnc-gold text-xlnc-gold text-[9px] font-bold px-4 py-1 uppercase tracking-[0.2em] whitespace-nowrap">
                    Recommended Architecture
                </div>
                <h3 className="text-2xl font-serif text-white mb-1">Sovereign</h3>
                <p className="text-[10px] text-xlnc-gold uppercase tracking-widest mb-8">Total Dominion</p>
                
                <div className="text-4xl font-serif text-xlnc-gold mb-2">
                    {billingCycle === 'MONTHLY' ? '$1,500' : '$1,200'}
                    <span className="text-sm font-sans font-light text-gray-600 ml-2">/ MO</span>
                </div>
                <p className="text-xs text-gray-600 mb-8 font-mono">Billed {billingCycle === 'MONTHLY' ? 'Monthly' : 'Annually'}</p>
                
                <ul className="space-y-6 flex-1 mb-12">
                    <li className="flex items-start gap-4 text-sm text-white font-light">
                        <Infinity size={14} className="mt-1 text-xlnc-gold" /> 
                        <span>Unlimited Minutes<br/><span className="text-xs text-gray-500">Infinite Scalability</span></span>
                    </li>
                    <li className="flex items-start gap-4 text-sm text-white font-light">
                        <Brain size={14} className="mt-1 text-xlnc-gold" /> 
                        <span>Psychological Tuning<br/><span className="text-xs text-gray-500">Aggressive/Exclusive Modes</span></span>
                    </li>
                    <li className="flex items-start gap-4 text-sm text-white font-light">
                        <Zap size={14} className="mt-1 text-xlnc-gold" /> 
                        <span>Priority Latency (500ms)<br/><span className="text-xs text-gray-500">Faster than human thought</span></span>
                    </li>
                     <li className="flex items-start gap-4 text-sm text-white font-light">
                        <Check size={14} className="mt-1 text-xlnc-gold" /> 
                        <span>Custom Voice Cloning</span>
                    </li>
                </ul>
                <button className="w-full py-4 bg-xlnc-gold text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    Secure Membership
                </button>
            </div>

            {/* Tier 3 - Empire */}
            <div className="bg-[#080808] border border-white/5 p-10 flex flex-col text-left relative hover:border-white/20 transition-all duration-500 group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 group-hover:bg-white transition-colors"></div>
                <h3 className="text-2xl font-serif text-white mb-1">Empire</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-8">Whitelabel / God Mode</p>
                
                <div className="text-4xl font-serif text-white mb-2">Custom</div>
                <p className="text-xs text-gray-600 mb-8 font-mono">Enterprise Licensing</p>
                
                <ul className="space-y-6 flex-1 mb-12">
                    <li className="flex items-start gap-4 text-sm text-gray-400 font-light group-hover:text-gray-300">
                         <span className="w-1 h-1 bg-white mt-2 rounded-full"></span> 
                         <span>Private Server Shards</span>
                    </li>
                    <li className="flex items-start gap-4 text-sm text-gray-400 font-light group-hover:text-gray-300">
                         <span className="w-1 h-1 bg-white mt-2 rounded-full"></span> 
                         <span>Full Whitelabeling</span>
                    </li>
                    <li className="flex items-start gap-4 text-sm text-gray-400 font-light group-hover:text-gray-300">
                         <span className="w-1 h-1 bg-white mt-2 rounded-full"></span> 
                         <span>Dedicated War Room</span>
                    </li>
                </ul>
                <button className="w-full py-4 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300">
                    Contact HQ
                </button>
            </div>
        </div>

        {/* The Mathematics of Dominion - Comparison */}
        <div className="max-w-5xl mx-auto border-t border-white/10 pt-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-serif text-white mb-4">The Arbitrage of Labor</h2>
                <p className="text-gray-500 font-light">
                    Why hire biological limitation when you can rent infinite synthetic potential?
                </p>
            </div>

            <div className="grid md:grid-cols-3 border border-white/10 bg-black/40 backdrop-blur-sm">
                
                {/* Headers Column (Hidden on mobile usually, but kept simple here) */}
                <div className="hidden md:block p-8 border-r border-white/10 bg-white/[0.02]">
                    <div className="h-12 mb-8"></div> {/* Spacer */}
                    <div className="space-y-8 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                        <div className="h-8 flex items-center">Operational Window</div>
                        <div className="h-8 flex items-center">Linguistic Range</div>
                        <div className="h-8 flex items-center">Emotional Variance</div>
                        <div className="h-8 flex items-center">Memory Retention</div>
                        <div className="h-8 flex items-center">Est. Monthly Cost</div>
                    </div>
                </div>

                {/* Legacy Business */}
                <div className="p-8 border-r border-white/10 opacity-60">
                    <div className="h-12 mb-8 flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        <h3 className="text-lg font-serif text-gray-400">Biological Staff</h3>
                    </div>
                    <div className="space-y-8 text-sm text-gray-400 font-mono">
                        <div className="h-8 flex items-center gap-2"><Clock size={14} /> 8 Hours / Day</div>
                        <div className="h-8 flex items-center gap-2"><Globe size={14} /> 1 Language</div>
                        <div className="h-8 flex items-center gap-2"><Zap size={14} /> High (Fatigue)</div>
                        <div className="h-8 flex items-center gap-2"><X size={14} /> Fallible</div>
                        <div className="h-8 flex items-center gap-2 text-red-400 font-bold">$3,500 - $5,000</div>
                    </div>
                </div>

                {/* Sovereign Business */}
                <div className="p-8 bg-xlnc-gold/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-xlnc-gold"></div>
                    <div className="h-12 mb-8 flex items-center gap-3">
                        <div className="w-2 h-2 bg-xlnc-gold rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-serif text-white">XLNC Protocol</h3>
                    </div>
                    <div className="space-y-8 text-sm text-white font-mono">
                        <div className="h-8 flex items-center gap-2"><Infinity size={14} className="text-xlnc-gold" /> 24/7/365 (Omnipresent)</div>
                        <div className="h-8 flex items-center gap-2"><Globe size={14} className="text-xlnc-gold" /> Universal (29+ Tongues)</div>
                        <div className="h-8 flex items-center gap-2"><Check size={14} className="text-xlnc-gold" /> Zero (Stoic)</div>
                        <div className="h-8 flex items-center gap-2"><Brain size={14} className="text-xlnc-gold" /> Perfect (CRM Sync)</div>
                        <div className="h-8 flex items-center gap-2 text-xlnc-gold font-bold">$500 - $1,500</div>
                    </div>
                </div>

            </div>
            
            <div className="mt-12 text-center">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Result</p>
                <p className="text-2xl font-serif text-white">
                    You are not just saving money. You are escaping the gravitational pull of mediocrity.
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Pricing;