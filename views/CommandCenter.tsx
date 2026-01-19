
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Activity, Zap, Globe, Cpu, CheckCircle2, Lock, Radio, Server, Database, AlertCircle, ArrowUpRight, DollarSign, Loader2 } from 'lucide-react';
import { callsAPI } from '../src/services/api';
import { useCallStore } from '../src/stores/useCallStore';
import { useAuthStore } from '../src/stores/useAuthStore';
import { CallLog } from '../types';

// --- Theatrical Components ---

const ExecutiveCounter: React.FC<{ value: number | string; label: string; prefix?: string; suffix?: string; trend?: 'UP' | 'DOWN' | 'NEUTRAL'; decimals?: number }> = ({ value, label, prefix = '', suffix = '', trend, decimals = 0 }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string);
  
  return (
    <div className="opulent-card opulent-card-hover p-6">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</span>
        {trend && (
          <span className={`text-[9px] font-medium px-1.5 py-0.5 border ${
              trend === 'UP' ? 'border-status-success/20 text-status-success' : 
              trend === 'DOWN' ? 'border-status-alert/20 text-status-alert' :
              'border-gray-700 text-gray-500'
          }`}>
            {trend === 'UP' ? '▲' : trend === 'DOWN' ? '▼' : '—'}
          </span>
        )}
      </div>
      
      <h3 className="text-3xl font-serif text-white tracking-tight">
        <span className="text-gray-600 text-xl mr-1 font-light">{prefix}</span>
        {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : value}
        <span className="text-gray-600 text-sm ml-1">{suffix}</span>
      </h3>
    </div>
  );
};

const LiveFeed: React.FC<{ events: CallLog[] }> = ({ events }) => {
    return (
        <div className="opulent-card p-6 h-full flex flex-col" id="cmd-feed">
             <h3 className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Activity size={12} />
                Operational Stream
            </h3>
            <div className="space-y-6 flex-1 relative overflow-y-auto custom-scrollbar pr-2">
                {events.length > 0 ? (
                    events.slice(0, 10).map((evt) => (
                        <div key={evt.id} className="flex gap-4 items-start animate-fade-in">
                            <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${
                                evt.sentiment > 0.5 ? 'bg-status-success shadow-[0_0_5px_rgba(46,125,50,0.8)]' : 
                                evt.sentiment < 0 ? 'bg-status-alert' : 'bg-xlnc-gold'
                            }`}></div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex justify-between items-center w-full gap-4">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold truncate">{evt.caller}</span>
                                    <span className="text-[9px] text-gray-600 font-mono whitespace-nowrap">{evt.timestamp.split(',')[1]?.trim().slice(0,5)}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{evt.outcome || 'PROCESSING'}</span>
                                <span className="text-xs text-gray-400 font-light font-sans leading-relaxed border-l border-white/5 pl-3 line-clamp-2">
                                    {evt.summary}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30">
                        <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center mb-4">
                             <Radio size={20} className="text-white" />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-center text-gray-500">
                            Awaiting Neural Input<br/>System Standby
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

const CommandCenter: React.FC = () => {
  const { calls, setCalls, setLoading, isLoading } = useCallStore();
  const { accessToken } = useAuthStore();
  const [metrics, setMetrics] = useState({
      totalCalls: 0,
      conversionRate: 0,
      totalCost: 0,
      totalMinutes: 0
  });
  const [chartData, setChartData] = useState<{name: string, calls: number, positive: number}[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Data Fetching from Backend API
  useEffect(() => {
      const fetchData = async () => {
          if (!accessToken) {
              setLoading(false);
              return;
          }

          setIsConnected(true);
          setLoading(true);

          try {
              // Fetch calls from backend database
              const { data } = await callsAPI.getAll({ limit: 100 });
              const callData = data.data.calls.map((c: any) => ({
                  id: c.id,
                  caller: c.fromNumber || c.toNumber || 'Unknown',
                  duration: formatDuration(c.durationMs || 0),
                  durationSeconds: Math.round((c.durationMs || 0) / 1000),
                  outcome: c.callOutcome || 'PROCESSING',
                  sentiment: parseFloat(c.userSentiment || '0'),
                  summary: c.callSummary || 'Processing...',
                  transcript: c.transcript || [],
                  timestamp: new Date(c.startTimestamp).toLocaleString(),
                  topics: [],
                  cost: (c.costCents || 0) / 100,
              }));

              setCalls(callData);
              processMetrics(callData);
          } catch (e) {
              console.error("Failed to fetch dashboard data", e);
              setIsConnected(false);
          } finally {
              setLoading(false);
          }
      };

      fetchData();
  }, [accessToken]);

  // Helper: Format duration
  const formatDuration = (ms: number): string => {
      if (!ms) return "0s";
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
  };

  // Metrics Processing Logic
  const processMetrics = (data: CallLog[]) => {
      const total = data.length;
      const totalCost = data.reduce((acc, curr) => acc + (curr.cost || 0), 0);
      const totalSeconds = data.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
      
      // Conversion Logic: Checks for positive outcomes keywords
      const conversions = data.filter(c => {
          const o = (c.outcome || '').toLowerCase();
          return o.includes('booked') || o.includes('scheduled') || o.includes('qualified') || o.includes('sale') || o.includes('success');
      }).length;

      const rate = total > 0 ? (conversions / total) * 100 : 0;

      setMetrics({
          totalCalls: total,
          conversionRate: rate,
          totalCost: totalCost,
          totalMinutes: Math.round(totalSeconds / 60)
      });

      // Chart Data: Group by Day of Week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const grouped = new Array(7).fill(0).map((_, i) => ({ name: days[i], calls: 0, positive: 0, dayIndex: i }));
      
      data.forEach(c => {
          const date = new Date(c.timestamp);
          if (!isNaN(date.getTime())) {
            const dayIndex = date.getDay();
            if (grouped[dayIndex]) {
                grouped[dayIndex].calls += 1;
                if (c.sentiment > 0.5) grouped[dayIndex].positive += 1;
            }
          }
      });

      setChartData(grouped);
  };

  return (
    <div className="p-8 lg:p-12 h-full overflow-y-auto custom-scrollbar bg-xlnc-bg">
      
      {/* Header */}
      <header className="flex justify-between items-end mb-12 border-b border-white/5 pb-6" id="cmd-header">
        <div>
            <h2 className="text-3xl font-serif text-white mb-2">Command Center</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                Executive Overview // {isConnected ? 'SIGNAL: ACTIVE' : 'SIGNAL: DISCONNECTED'}
            </p>
        </div>
        <div className="flex gap-4">
             {isLoading ? (
                <div className="flex items-center gap-2 text-xlnc-gold text-[10px] font-bold uppercase tracking-widest">
                    <Loader2 className="animate-spin" size={14} /> Syncing Neural Grid...
                </div>
             ) : (
                <button 
                    id="cmd-action" 
                    onClick={() => window.location.reload()}
                    className="bg-white/5 border border-white/10 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 group"
                >
                    <span className="group-hover:animate-pulse">{isConnected ? 'Refresh Data' : 'Initialize Protocol'}</span>
                </button>
             )}
        </div>
      </header>

      {!isConnected && !isLoading && (
          <div className="mb-8 p-4 border border-xlnc-gold/30 bg-xlnc-gold/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <AlertCircle className="text-xlnc-gold" size={20} />
                  <span className="text-xs text-white uppercase tracking-widest">Connect your Retell AI account to visualize real-time data.</span>
              </div>
          </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="cmd-metrics">
        <ExecutiveCounter 
            label="Total Interactions" 
            value={metrics.totalCalls} 
            trend={metrics.totalCalls > 0 ? "UP" : "NEUTRAL"}
        />
        <ExecutiveCounter 
            label="Conversion Rate" 
            value={metrics.conversionRate} 
            suffix="%" 
            trend={metrics.conversionRate > 10 ? "UP" : "NEUTRAL"}
            decimals={1}
        />
        <ExecutiveCounter 
            label="Capital Deployed" 
            value={metrics.totalCost} 
            prefix="$" 
            decimals={2}
        />
         <div className="opulent-card p-6 flex flex-col justify-between opacity-90">
            <div className="relative z-10 flex justify-between items-start">
                <span className="text-[9px] font-bold text-xlnc-gold uppercase tracking-[0.2em]">Neural Load</span>
                <Lock size={14} className="text-xlnc-gold" />
            </div>
            <div className="relative z-10 mt-4">
                 <div className="text-xl font-serif text-white">Sovereign Tier</div>
                 <div className="text-[10px] text-gray-500 mt-2 font-light">{metrics.totalMinutes} / 500 Minutes Consumed</div>
            </div>
            <div className="w-full bg-gray-800 h-[2px] mt-4 rounded-full overflow-hidden">
                 <div className="bg-xlnc-gold h-full transition-all duration-1000" style={{ width: `${Math.min((metrics.totalMinutes / 500) * 100, 100)}%` }}></div>
            </div>
         </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 opulent-card p-8" id="cmd-chart">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Traffic Frequency</h3>
                </div>
                <div className="flex gap-1 opacity-50 pointer-events-none">
                    {['D', 'W', 'M'].map(p => (
                        <button key={p} className={`w-8 h-8 text-[10px] flex items-center justify-center border ${p === 'W' ? 'border-xlnc-gold text-xlnc-gold' : 'border-transparent text-gray-600'}`}>
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[300px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#444" tick={{fontFamily: 'Inter', fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#444" tick={{fontFamily: 'Inter', fontSize: 10}} axisLine={false} tickLine={false} dx={-10} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '0px' }}
                            itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase' }}
                            labelStyle={{ color: '#888', fontSize: '10px', marginBottom: '5px' }}
                        />
                        <Bar dataKey="calls" fill="#333" radius={[2, 2, 0, 0]} barSize={30}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.calls > 0 ? 'url(#gold-gradient)' : '#222'} />
                            ))}
                        </Bar>
                        <defs>
                            <linearGradient id="gold-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#8A7020" stopOpacity={0.3}/>
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
                
                {metrics.totalCalls === 0 && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center bg-black/80 p-4 border border-white/10 backdrop-blur-sm">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">System Idle</div>
                            <div className="text-[9px] text-gray-700">No data packets received</div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Feed */}
        <LiveFeed events={calls} />

      </div>
    </div>
  );
};

export default CommandCenter;
