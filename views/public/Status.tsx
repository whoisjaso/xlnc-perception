import React from 'react';
import { Activity, Server, Globe, Wifi, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';

const Status: React.FC = () => {
  const regions = [
    { name: 'US-East (Virginia)', latency: '12ms', status: 'OPERATIONAL' },
    { name: 'US-West (Oregon)', latency: '24ms', status: 'OPERATIONAL' },
    { name: 'EU-Central (Frankfurt)', latency: '88ms', status: 'OPERATIONAL' },
    { name: 'Asia-Pacific (Tokyo)', latency: '112ms', status: 'REROUTING' },
  ];

  const systems = [
    { name: 'Voice Synthesis Core', uptime: '99.99%', load: '42%' },
    { name: 'Revenue Matrix (n8n)', uptime: '100.00%', load: '18%' },
    { name: 'Neural API Gateway', uptime: '99.95%', load: '65%' },
    { name: 'CRM Sync Protocol', uptime: '99.98%', load: '12%' },
  ];

  return (
    <div className="pt-24 min-h-screen px-6 bg-xlnc-bg">
      <div className="max-w-6xl mx-auto py-20">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 pb-8 border-b border-white/10">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-status-success rounded-full animate-pulse shadow-[0_0_10px_rgba(46,125,50,0.8)]"></div>
                    <span className="text-status-success font-mono font-bold uppercase tracking-widest text-sm">All Systems Nominal</span>
                </div>
                <h1 className="text-4xl font-serif text-white">System Matrix</h1>
            </div>
            <div className="text-right mt-6 md:mt-0">
                <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">Last Updated</div>
                <div className="text-white font-mono">{new Date().toISOString()}</div>
            </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Global Map Visual */}
            <div className="lg:col-span-2 space-y-8">
                <div className="opulent-card p-8 min-h-[400px] relative overflow-hidden flex items-center justify-center">
                    {/* Abstract Map Background */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-contain bg-no-repeat bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-xlnc-card via-transparent to-transparent"></div>
                    
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {regions.map((r) => (
                            <div key={r.name} className="bg-black/60 border border-white/10 p-4 backdrop-blur-sm flex items-center justify-between group hover:border-xlnc-gold/30 transition-all">
                                <div>
                                    <div className="flex items-center gap-2 text-gray-300 font-bold text-xs uppercase tracking-wider mb-1">
                                        <Globe size={12} /> {r.name}
                                    </div>
                                    <div className="text-xlnc-gold font-mono text-xs">{r.latency}</div>
                                </div>
                                <div className={`text-[10px] font-bold uppercase px-2 py-1 border ${
                                    r.status === 'OPERATIONAL' 
                                    ? 'border-status-success/30 text-status-success bg-status-success/5' 
                                    : 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5'
                                }`}>
                                    {r.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Incident Log */}
                <div className="bg-xlnc-panel border border-xlnc-border p-8">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Activity size={14} /> Incident Log
                    </h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-16 text-[10px] text-gray-500 font-mono pt-1">TODAY</div>
                            <div className="flex-1">
                                <div className="text-sm text-white font-medium mb-1">No active incidents reported.</div>
                                <p className="text-xs text-gray-600">The matrix is operating within standard parameters.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 opacity-60">
                             <div className="w-16 text-[10px] text-gray-500 font-mono pt-1">2 DAYS AGO</div>
                             <div className="flex-1">
                                <div className="text-sm text-white font-medium mb-1">Latency Spike - APAC Region</div>
                                <p className="text-xs text-gray-600">Resolved in 42 seconds via automated rerouting protocols.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Component Status */}
            <div className="space-y-4">
                {systems.map((sys) => (
                    <div key={sys.name} className="opulent-card p-6 group hover:border-white/20">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-sm">
                                    <Cpu size={16} className="text-xlnc-gold" />
                                </div>
                                <span className="text-sm font-bold text-white uppercase tracking-wide">{sys.name}</span>
                            </div>
                            <CheckCircle2 size={16} className="text-status-success" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                            <div>
                                <div className="text-[9px] text-gray-500 font-mono uppercase">Uptime</div>
                                <div className="text-sm text-white font-mono">{sys.uptime}</div>
                            </div>
                            <div>
                                <div className="text-[9px] text-gray-500 font-mono uppercase">System Load</div>
                                <div className="text-sm text-neon-cyan font-mono">{sys.load}</div>
                            </div>
                        </div>
                        <div className="mt-3 w-full bg-gray-800 h-[2px] rounded-full overflow-hidden">
                             <div className="bg-xlnc-gold h-full animate-pulse" style={{ width: sys.uptime.replace('%', '') + '%' }}></div>
                        </div>
                    </div>
                ))}

                <div className="bg-gradient-to-br from-xlnc-gold/10 to-transparent border border-xlnc-gold/30 p-6 text-center mt-8">
                    <Wifi size={24} className="text-xlnc-gold mx-auto mb-3" />
                    <h4 className="text-white font-serif text-lg mb-2">Subscribe to Updates</h4>
                    <p className="text-xs text-gray-400 mb-4">Get instant alerts if the sovereignty of the network is compromised.</p>
                    <button className="w-full py-2 bg-xlnc-gold text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
                        Connect Feed
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Status;