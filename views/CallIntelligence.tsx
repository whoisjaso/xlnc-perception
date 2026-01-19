
import React, { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, FileText, Brain, User, MessageSquare, Radio, X, Bot, Loader2, AlertCircle, Filter } from 'lucide-react';
import { CallLog } from '../types';
import { fetchRetellCalls } from '../services/retell';

const SentimentBadge: React.FC<{ value: number }> = ({ value }) => {
    const color = value > 0.5 ? 'text-status-success' : value < 0 ? 'text-status-alert' : 'text-gray-400';
    const label = value > 0.5 ? 'POSITIVE' : value < 0 ? 'NEGATIVE' : 'NEUTRAL';
    return (
        <span className={`text-[9px] font-bold tracking-wider border border-opacity-20 px-2 py-0.5 ${value > 0.5 ? 'border-status-success bg-status-success/10 text-status-success' : value < 0 ? 'border-status-alert bg-status-alert/10 text-status-alert' : 'border-gray-500 bg-gray-500/10 text-gray-400'}`}>
            {label}
        </span>
    );
};

const OutcomeBadge: React.FC<{ outcome: string }> = ({ outcome }) => {
    return (
        <span className="text-[9px] font-bold text-white uppercase tracking-wider border border-white/10 px-2 py-1 bg-white/5 rounded-sm">
            {outcome ? outcome.replace(/_/g, ' ') : 'UNKNOWN'}
        </span>
    );
};

const CallIntelligence: React.FC = () => {
  const [selectedCall, setSelectedCall] = useState(null as CallLog | null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtering State
  const [filterOutcome, setFilterOutcome] = useState('ALL');
  const [filterSentiment, setFilterSentiment] = useState('ALL');
  const [filterDuration, setFilterDuration] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const [callLogs, setCallLogs] = useState([] as CallLog[]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null as HTMLAudioElement | null);

  // Load Data from Retell Service
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        const apiKey = localStorage.getItem('xlnc_retell_key');
        const agentId = localStorage.getItem('xlnc_retell_agent');

        if (!apiKey) {
            setError('NO_CREDENTIALS');
            setIsLoading(false);
            return;
        }

        try {
            const logs = await fetchRetellCalls(apiKey, agentId || undefined);
            setCallLogs(logs);
            setError('');
        } catch (err: any) {
            console.error(err);
            // Show specific error if available
            if (err.message.includes("401")) setError("AUTH_ERROR");
            else if (err.message.includes("404")) setError("AGENT_ERROR");
            else setError('API_ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    loadData();
  }, []);

  // Manage Audio Lifecycle
  useEffect(() => {
    if (selectedCall) {
        // Stop previous audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);

        // Prepare new audio if URL exists
        if (selectedCall.audioUrl) {
            const audio = new Audio(selectedCall.audioUrl);
            audio.onended = () => setIsPlaying(false);
            audio.onerror = (e) => console.error("Audio Playback Error", e);
            audioRef.current = audio;
        }
    }

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, [selectedCall]);

  const togglePlayback = () => {
    if (!selectedCall) return;
    if (!audioRef.current && !selectedCall.audioUrl) return;

    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => {
                console.error("Playback Error:", e);
                alert("Audio playback blocked by browser or invalid URL.");
            });
            setIsPlaying(true);
        }
    }
  };

  // Extract unique outcomes for the dropdown, ensuring they are valid strings
  const uniqueOutcomes = Array.from(new Set(callLogs.map(c => c.outcome))).filter((o): o is string => typeof o === 'string' && o.length > 0);

  const filteredCalls = callLogs.filter(c => {
    // 1. Text Search
    const matchesSearch = c.caller.includes(searchTerm) || 
        (c.summary && c.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.outcome && c.outcome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Outcome Filter
    if (filterOutcome !== 'ALL' && c.outcome !== filterOutcome) return false;

    // 3. Sentiment Filter
    if (filterSentiment === 'POSITIVE' && c.sentiment <= 0.5) return false;
    if (filterSentiment === 'NEGATIVE' && c.sentiment >= 0) return false;
    if (filterSentiment === 'NEUTRAL' && (c.sentiment < 0 || c.sentiment > 0.5)) return false;

    // 4. Duration Filter
    const seconds = c.durationSeconds || 0;
    if (filterDuration === 'SHORT' && seconds > 60) return false; // < 1m
    if (filterDuration === 'MEDIUM' && (seconds <= 60 || seconds > 300)) return false; // 1-5m
    if (filterDuration === 'LONG' && seconds <= 300) return false; // > 5m

    return true;
  });

  if (error === 'NO_CREDENTIALS') {
      return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle size={48} className="mb-4 text-xlnc-gold opacity-50" />
              <h3 className="text-xl text-white font-serif mb-2">Credentials Missing</h3>
              <p className="text-xs mb-6 max-w-md text-center">
                  To access Call Intelligence, you must first link your Retell AI account in the setup module.
              </p>
          </div>
      );
  }

  return (
    <div className="flex h-full animate-fade-in">
        {/* Left Panel - List */}
        <div className={`flex-1 flex flex-col border-r border-white/5 bg-black/20 transition-all duration-500 ${selectedCall ? 'hidden md:flex md:w-1/3 md:flex-none' : 'w-full'}`}>
            <div className="p-6 border-b border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif text-white">Signal Intelligence</h2>
                    {isLoading && <Loader2 size={16} className="animate-spin text-xlnc-gold" />}
                </div>
                
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input 
                            id="ci-search-bar"
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="SEARCH FREQUENCIES..." 
                            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-[10px] font-bold tracking-widest text-white focus:border-xlnc-gold focus:outline-none transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 border rounded-sm flex items-center justify-center transition-colors ${showFilters ? 'bg-xlnc-gold border-xlnc-gold text-black' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white hover:text-white'}`}
                    >
                        <Filter size={16} />
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-3 gap-2 mt-4 animate-fade-in">
                        {/* Outcome Filter */}
                        <select 
                            value={filterOutcome} 
                            onChange={e => setFilterOutcome(e.target.value)}
                            className="bg-black/40 border border-white/10 text-[9px] text-white p-2 rounded-sm focus:border-xlnc-gold outline-none uppercase"
                        >
                            <option value="ALL">All Outcomes</option>
                            {uniqueOutcomes.map(o => (
                                <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
                            ))}
                        </select>

                        {/* Sentiment Filter */}
                        <select 
                            value={filterSentiment} 
                            onChange={e => setFilterSentiment(e.target.value)}
                            className="bg-black/40 border border-white/10 text-[9px] text-white p-2 rounded-sm focus:border-xlnc-gold outline-none uppercase"
                        >
                            <option value="ALL">All Sentiment</option>
                            <option value="POSITIVE">Positive</option>
                            <option value="NEUTRAL">Neutral</option>
                            <option value="NEGATIVE">Negative</option>
                        </select>

                        {/* Duration Filter */}
                        <select 
                            value={filterDuration} 
                            onChange={e => setFilterDuration(e.target.value)}
                            className="bg-black/40 border border-white/10 text-[9px] text-white p-2 rounded-sm focus:border-xlnc-gold outline-none uppercase"
                        >
                            <option value="ALL">All Duration</option>
                            <option value="SHORT">&lt; 1 Min</option>
                            <option value="MEDIUM">1 - 5 Min</option>
                            <option value="LONG">&gt; 5 Min</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar" id="ci-call-list">
                {error && (
                    <div className="p-6 text-center text-status-alert text-xs font-bold uppercase tracking-widest border-b border-status-alert/20 bg-status-alert/5">
                        {error === 'AUTH_ERROR' ? 'API Key Invalid' : error === 'AGENT_ERROR' ? 'Agent ID Not Found' : 'Connection Failed'}
                    </div>
                )}
                
                {!isLoading && filteredCalls.length === 0 && !error && (
                    <div className="p-6 text-center text-gray-600">
                        <div className="text-xs font-bold uppercase tracking-widest mb-2">
                            {callLogs.length === 0 ? "No Signals Detected" : "No Match"}
                        </div>
                        {callLogs.length === 0 && (
                            <p className="text-[10px]">
                                No calls found. If you just connected, check back after making a test call.
                            </p>
                        )}
                    </div>
                )}

                {filteredCalls.map((call) => (
                    <div 
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className={`p-6 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.02] group ${selectedCall?.id === call.id ? 'bg-white/[0.05] border-l-2 border-l-xlnc-gold' : 'border-l-2 border-l-transparent'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-mono text-white font-bold group-hover:text-xlnc-gold transition-colors">{call.caller}</span>
                            <span className="text-[10px] text-gray-600">{call.timestamp}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            <OutcomeBadge outcome={call.outcome} />
                            <span className="text-[9px] font-mono text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded-sm">{call.duration}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 font-light leading-relaxed">
                            {call.summary}
                        </p>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Panel - Details */}
        {selectedCall ? (
            <div className="flex-[2] flex flex-col h-full bg-xlnc-bg animate-slide-up overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-start bg-black/40">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-3xl font-serif text-white">{selectedCall.caller}</h2>
                            <SentimentBadge value={selectedCall.sentiment} />
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                            <span>ID: {selectedCall.id}</span>
                            <span>Duration: {selectedCall.duration}</span>
                            {selectedCall.agentId && <span>Agent: {selectedCall.agentId}</span>}
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedCall(null)}
                        className="md:hidden p-2 text-gray-500"
                    >
                        <X size={20} />
                    </button>
                    <div className="hidden md:flex gap-3">
                         <button className="flex items-center gap-2 px-4 py-2 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:border-white transition-all">
                            <FileText size={14} /> Export
                         </button>
                         <button 
                            onClick={togglePlayback}
                            disabled={!selectedCall.audioUrl}
                            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 min-w-[140px] justify-center group
                                ${!selectedCall.audioUrl 
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : isPlaying 
                                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse' 
                                    : 'bg-xlnc-gold text-black hover:bg-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                }
                            `}
                         >
                            {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" />}
                            {isPlaying ? 'HALT AUDIO' : 'PLAY RECORDING'}
                         </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Analysis Column */}
                        <div className="space-y-6">
                            <div className="opulent-card p-6">
                                <h3 className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Brain size={14} /> Neural Analysis
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed font-light mb-4">
                                    {selectedCall.summary}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCall.topics.map(t => (
                                        <span key={t} className="text-[9px] text-gray-500 border border-gray-800 px-2 py-1 rounded-full uppercase">#{t}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-xlnc-panel border border-xlnc-border p-6">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
                                    Outcome Probability
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">Conversion</div>
                                        <div className="h-1 bg-gray-800 w-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: selectedCall.sentiment > 0.5 ? '85%' : '30%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transcript Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <MessageSquare size={14} /> Live Transcript
                                </h3>
                                <span className="text-[9px] text-gray-600 font-mono">SECURE LOG</span>
                            </div>

                            <div className="space-y-4">
                                {selectedCall.transcript.map((line, idx) => (
                                    <div key={idx} className={`flex gap-4 ${line.speaker === 'AI' ? 'flex-row' : 'flex-row-reverse'}`}>
                                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${line.speaker === 'AI' ? 'bg-xlnc-gold/10 text-xlnc-gold border border-xlnc-gold/20' : 'bg-gray-800 text-gray-400'}`}>
                                            {line.speaker === 'AI' ? <Bot size={14} /> : <User size={14} />}
                                        </div>
                                        <div className={`flex-1 p-4 rounded-sm border ${line.speaker === 'AI' ? 'bg-xlnc-card border-white/5' : 'bg-white/5 border-transparent'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${line.speaker === 'AI' ? 'text-xlnc-gold' : 'text-gray-500'}`}>
                                                    {line.speaker === 'AI' ? 'Sovereign Agent' : 'Client'}
                                                </span>
                                                <span className="text-[9px] text-gray-700 font-mono">{line.time}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 font-light leading-relaxed">
                                                {line.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        ) : (
            <div className="hidden md:flex flex-[2] flex-col items-center justify-center text-gray-600">
                <div className="w-20 h-20 border border-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Radio size={32} className="text-gray-700" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Select a Frequency to Decrypt</p>
            </div>
        )}
    </div>
  );
};

export default CallIntelligence;
