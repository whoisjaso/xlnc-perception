import React, { useState } from 'react';
import { Bot, Zap, Lock, CheckCircle2, History, Copy, RotateCcw, Terminal, ArrowRight, FileText, Play, Pause, Brain, Plus, Search, Filter, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { AgentConfig } from '../types';
import { generateRealityScript, generateVoicePreview } from '../services/gemini';
import OperationalLoader from '../components/OperationalLoader';
import { agentsAPI } from '../src/services/api';
import { useAuthStore } from '../src/stores/useAuthStore';

interface Props {
  addLog: (msg: string, type: any) => void;
}

interface ArchivedConstruct {
    id: string;
    timestamp: string;
    config: AgentConfig;
    script: string;
}

const TRAIT_PRESETS = [
    "Uses subtle flattery",
    "Projects an aura of exclusivity",
    "Uses silence for dominance",
    "Feigns disinterest to build value",
    "Refers to 'The Founders' often",
    "Uses high-finance terminology",
    "Never apologizes, only redirects",
    "Speaks with measured pacing"
];

const RealityForge: React.FC<Props> = ({ addLog }) => {
  const { accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [step, setStep] = useState('CONFIG' as 'CONFIG' | 'PREVIEW');
  const [viewMode, setViewMode] = useState('FORGE' as 'FORGE' | 'ARCHIVES');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [archives, setArchives] = useState([] as ArchivedConstruct[]);
  
  // Archive Filtering
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilterIndustry, setArchiveFilterIndustry] = useState('ALL');

  const [config, setConfig] = useState({
    name: '',
    industry: 'Automotive',
    tone: 'AUTHORITATIVE',
    goal: 'Book Appointment',
    traits: '',
  } as AgentConfig);

  const handleGenerate = async () => {
    if (!config.name) {
        alert("Protocol Identity Required");
        return;
    }

    setIsLoading(true);
    addLog(`Initiating Construct: ${config.name}...`, 'INFO');
    addLog(`Engaging Gemini 3.0 Thinking Mode...`, 'INFO');
    
    setTimeout(async () => {
        const script = await generateRealityScript(config);
        setGeneratedScript(script);
        
        // Save to Archives
        const newConstruct: ArchivedConstruct = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleString(),
            config: { ...config },
            script: script
        };
        setArchives(prev => [newConstruct, ...prev]);

        setIsLoading(false);
        setStep('PREVIEW');
        addLog(`Reality Construct Stabilized`, 'SUCCESS');
    }, 500);
  };

  const handlePreviewVoice = async () => {
      if (!generatedScript) return;
      
      if (audioUrl) {
          // Toggle play
          const audio = document.getElementById('rf-audio-preview') as HTMLAudioElement;
          if (audio) {
              if (isPlaying) {
                  audio.pause();
                  setIsPlaying(false);
              } else {
                  audio.play();
                  setIsPlaying(true);
                  // Ensure listener is attached
                  audio.onended = () => setIsPlaying(false);
              }
          }
          return;
      }

      addLog("Synthesizing Voice Model (Gemini TTS)...", "INFO");
      const base64Audio = await generateVoicePreview(generatedScript.substring(0, 200)); // Preview first 200 chars
      if (base64Audio) {
          // Convert base64 to blob url
          const binaryString = atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mp3' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          setTimeout(() => {
            const audio = document.getElementById('rf-audio-preview') as HTMLAudioElement;
            if (audio) {
                audio.play();
                setIsPlaying(true);
                audio.onended = () => setIsPlaying(false);
            }
          }, 100);
      }
  };

  const handleDeploy = async () => {
    if (!accessToken) {
      addLog('Authentication required. Please login to deploy agents.', 'ERROR');
      return;
    }

    if (!generatedScript) {
      addLog('No system prompt generated. Please generate a construct first.', 'ERROR');
      return;
    }

    setIsLoading(true);
    addLog('Syncing with Neural Network...', 'WARN');
    addLog('Transmitting construct to Retell AI...', 'INFO');

    try {
      const response = await agentsAPI.deploy({
        name: config.name,
        systemPrompt: generatedScript,
        industry: config.industry,
        tone: config.tone as 'AGGRESSIVE' | 'AUTHORITATIVE' | 'EXCLUSIVE' | 'URGENT',
        goal: config.goal,
        traits: config.traits,
        voiceConfig: {
          voiceId: 'elevenlabs-adrian',
          language: 'en-US',
          temperature: 0.7,
        },
      });

      const agentData = response.data.data.agent;

      addLog(`✨ Agent Deployed: ${agentData.name}`, 'SUCCESS');
      addLog(`Retell Agent ID: ${agentData.retellAgentId}`, 'INFO');
      addLog('Construct Active. Dominion Established.', 'SUCCESS');

      // Reset form
      setStep('CONFIG');
      setConfig({ name: '', industry: 'Automotive', tone: 'AUTHORITATIVE', goal: '', traits: '' });
      setGeneratedScript('');
      setAudioUrl(null);
      setIsPlaying(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Deployment failed';
      addLog(`Deployment Failed: ${errorMessage}`, 'ERROR');

      if (error.response?.status === 400) {
        addLog('Configure your Retell AI credentials in Voice Uplink first.', 'WARN');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addLog("Script copied to clipboard", "INFO");
  };

  const handleRestore = (item: ArchivedConstruct) => {
    setConfig(item.config);
    setGeneratedScript(item.script);
    setStep('PREVIEW');
    setViewMode('FORGE');
    setAudioUrl(null);
    addLog(`Restoring Construct: ${item.config.name}`, "INFO");
  };

  const handleAddTrait = (trait: string) => {
    const current = config.traits || '';
    if (current.includes(trait)) return;
    const separator = current.length > 0 && !current.endsWith(', ') ? ', ' : '';
    setConfig({...config, traits: current + separator + trait});
  };

  // Filter Logic
  const filteredArchives = archives.filter(arch => {
      const searchLower = archiveSearch.toLowerCase();
      const matchesSearch = 
        arch.config.name.toLowerCase().includes(searchLower) ||
        arch.config.goal.toLowerCase().includes(searchLower) ||
        arch.script.toLowerCase().includes(searchLower);
      
      const matchesIndustry = archiveFilterIndustry === 'ALL' || arch.config.industry === archiveFilterIndustry;
      
      return matchesSearch && matchesIndustry;
  });

  return (
    <div className="p-12 max-w-5xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <OperationalLoader 
        active={isLoading} 
        messages={[
            "Aligning Frequencies...",
            "Constructing Persona...",
            "Injecting Authority Patterns...",
            "Finalizing Architecture..."
        ]}
      />

      <header className="mb-12 border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h2 className="text-4xl font-serif text-white mb-3 tracking-tight">Reality Forge</h2>
            <p className="text-gray-500 text-sm font-light tracking-wide">Design the voice of your empire.</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex p-1 bg-black border border-white/10 rounded-sm">
            <button 
                onClick={() => setViewMode('FORGE')}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'FORGE' ? 'bg-xlnc-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'text-gray-500 hover:text-white'}`}
            >
                <Bot size={14} /> Forge
            </button>
            <button 
                onClick={() => setViewMode('ARCHIVES')}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'ARCHIVES' ? 'bg-xlnc-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'text-gray-500 hover:text-white'}`}
            >
                <History size={14} /> Archives
            </button>
        </div>
      </header>

      {viewMode === 'FORGE' ? (
        <>
            {step === 'CONFIG' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
                <div className="space-y-8">
                    {/* Identity Input */}
                    <div className="group">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 block group-hover:text-xlnc-gold transition-colors duration-300">Identity Designation</label>
                        <div className="relative">
                            <input 
                                id="rf-identity-input"
                                type="text" 
                                value={config.name}
                                onChange={e => setConfig({...config, name: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 py-4 px-5 text-lg text-white placeholder-gray-700 focus:border-xlnc-gold focus:bg-white/[0.02] focus:outline-none transition-all duration-300 font-serif tracking-wide shadow-inner"
                                placeholder="Name the Construct..."
                            />
                            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-xlnc-gold transition-all duration-500 group-hover:w-full"></div>
                        </div>
                    </div>

                    {/* Sector Select */}
                    <div className="group relative">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 block group-hover:text-xlnc-gold transition-colors duration-300">Target Sector</label>
                        <select 
                            value={config.industry}
                            onChange={e => setConfig({...config, industry: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 py-4 px-5 text-white focus:border-xlnc-gold focus:outline-none text-sm tracking-wide appearance-none cursor-pointer hover:bg-white/[0.02] transition-all"
                        >
                            <option value="Automotive">Automotive Sales</option>
                            <option value="Real Estate">Real Estate Investment</option>
                            <option value="High Ticket Coaching">High Ticket Consulting</option>
                            <option value="Medical Aesthetics">Medical Aesthetics</option>
                        </select>
                        <div className="absolute right-4 top-[3.2rem] pointer-events-none text-gray-600 group-hover:text-xlnc-gold transition-colors">
                            <ChevronDown size={16} />
                        </div>
                    </div>

                    {/* Traits Textarea */}
                    <div className="group">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 group-hover:text-xlnc-gold transition-colors duration-300">
                            <span className="flex items-center gap-2"><Brain size={12} /> Behavioral Implants</span>
                        </label>
                        <div className="relative">
                            <textarea 
                                value={config.traits || ''}
                                onChange={e => setConfig({...config, traits: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 p-5 text-white placeholder-gray-700 focus:border-xlnc-gold focus:outline-none transition-colors font-sans text-sm leading-relaxed h-32 resize-none shadow-inner"
                                placeholder="e.g. Projects 'Old Money' energy, uses subtle flattery, pauses frequently for effect, mocks price objections..."
                            />
                             <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-xlnc-gold transition-all duration-500 group-hover:w-full"></div>
                        </div>
                        
                         {/* Trait Presets */}
                         <div className="flex flex-wrap gap-2 mt-4">
                            {TRAIT_PRESETS.map(t => (
                                <button 
                                    key={t}
                                    onClick={() => handleAddTrait(t)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.02] border border-white/10 hover:border-xlnc-gold hover:text-xlnc-gold hover:bg-xlnc-gold/5 text-[9px] font-bold uppercase tracking-wide transition-all rounded-sm"
                                >
                                    <Plus size={10} /> {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Tone Selector */}
                    <div className="group">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 group-hover:text-xlnc-gold transition-colors">Psychological Frame</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['AGGRESSIVE', 'AUTHORITATIVE', 'EXCLUSIVE', 'URGENT'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setConfig({...config, tone: t as any})}
                                    className={`p-4 border text-[10px] font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/btn ${
                                        config.tone === t 
                                        ? 'border-xlnc-gold bg-xlnc-gold/10 text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                                        : 'border-white/10 bg-black/40 text-gray-500 hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                    {config.tone === t && (
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-xlnc-gold shadow-[0_0_5px_rgba(212,175,55,0.8)]"></div>
                                    )}
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Goal Input */}
                    <div className="group">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 block group-hover:text-xlnc-gold transition-colors duration-300">Primary Objective</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={config.goal}
                                onChange={e => setConfig({...config, goal: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 py-4 px-5 text-lg text-white placeholder-gray-700 focus:border-xlnc-gold focus:bg-white/[0.02] focus:outline-none transition-all duration-300 font-serif tracking-wide shadow-inner"
                                placeholder="Define the Outcome..."
                            />
                             <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-xlnc-gold transition-all duration-500 group-hover:w-full"></div>
                        </div>
                    </div>

                    {/* Manifest Button */}
                    <button 
                        id="rf-generate-btn"
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className={`w-full py-5 relative overflow-hidden group transition-all duration-500 border border-transparent
                            ${isLoading ? 'bg-gray-900 cursor-not-allowed' : 'bg-white hover:bg-xlnc-gold hover:border-xlnc-gold hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]'}
                        `}
                    >
                        {/* Shine effect */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shine_1s_ease-in-out]"></div>
                        
                        <span className={`relative z-10 text-[11px] font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-3 ${isLoading ? 'text-gray-500' : 'text-black'}`}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={14} /> Architecting Reality...
                                </>
                            ) : (
                                <>
                                    <Zap size={14} className="group-hover:fill-black transition-colors" /> Manifest Construct
                                </>
                            )}
                        </span>
                    </button>
                    <style>{`
                        @keyframes shine {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                    `}</style>
                </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <div className="opulent-card p-8 relative mb-8 border border-xlnc-gold/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 z-20">
                             <div className="bg-black border border-xlnc-gold text-xlnc-gold text-[9px] font-bold px-4 py-1 uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center gap-2">
                                <Sparkles size={10} /> Generated Architecture
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 z-10 flex flex-col items-end">
                            <style>{`
                                @keyframes rf-wave {
                                    0%, 100% { height: 4px; opacity: 0.5; }
                                    50% { height: 16px; opacity: 1; }
                                }
                            `}</style>
                            
                            <div className="flex items-center gap-3">
                                {isPlaying && (
                                    <div className="flex items-center gap-1 h-6 px-2 bg-black/40 border border-xlnc-gold/30 rounded-sm">
                                        {[...Array(8)].map((_, i) => (
                                            <div 
                                                key={i} 
                                                className="w-0.5 bg-xlnc-gold rounded-full" 
                                                style={{ 
                                                    animation: `rf-wave 0.6s ease-in-out infinite`,
                                                    animationDelay: `${i * 0.05}s`
                                                }} 
                                            />
                                        ))}
                                    </div>
                                )}

                                <button 
                                    onClick={handlePreviewVoice}
                                    className={`flex items-center gap-3 border text-[9px] font-bold uppercase tracking-widest px-4 py-2 transition-all duration-300 group ${
                                        isPlaying 
                                        ? 'bg-xlnc-gold text-black border-xlnc-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                        : 'bg-black/40 border-white/10 text-gray-300 hover:text-white hover:border-white/50'
                                    }`}
                                >
                                    {isPlaying ? (
                                        <>
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                                            </span>
                                            <span>Transmitting</span>
                                            <Pause size={12} fill="currentColor" />
                                        </>
                                    ) : (
                                        <>
                                            <span>{audioUrl ? 'Replay Transmission' : 'Synthesize Voice'}</span>
                                            <Play size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                            <audio id="rf-audio-preview" src={audioUrl || ''} className="hidden" />
                        </div>

                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 leading-loose font-light h-[400px] overflow-y-auto custom-scrollbar p-6 border border-white/5 bg-black/40 shadow-inner">
                            {generatedScript}
                        </pre>
                    </div>
                    
                    <div className="flex gap-6 pt-6 border-t border-white/5">
                        <button 
                            onClick={() => setStep('CONFIG')}
                            className="flex-1 py-4 border border-white/10 text-gray-400 hover:text-white hover:border-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-white/5"
                        >
                            Refine Parameters
                        </button>
                        <button 
                            onClick={handleDeploy}
                            disabled={isLoading}
                            className="flex-1 py-4 bg-xlnc-gold text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={14}/> : <><CheckCircle2 size={14} /> Deploy to Network</>}
                        </button>
                    </div>
                </div>
            )}
        </>
      ) : (
        // ARCHIVES VIEW
        <div className="animate-fade-in space-y-6">
            
            {/* Search & Filter Controls */}
            {archives.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-white/5 border border-white/5">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500 group-hover:text-xlnc-gold transition-colors" size={14} />
                        <input 
                            type="text" 
                            value={archiveSearch}
                            onChange={(e) => setArchiveSearch(e.target.value)}
                            placeholder="SEARCH MEMORY BANKS..."
                            className="w-full bg-black/40 border border-white/10 pl-10 pr-4 py-3 text-[10px] font-bold text-white tracking-widest placeholder-gray-600 focus:border-xlnc-gold focus:outline-none transition-all uppercase"
                        />
                    </div>
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500 group-hover:text-xlnc-gold transition-colors" size={14} />
                        <select 
                            value={archiveFilterIndustry}
                            onChange={(e) => setArchiveFilterIndustry(e.target.value)}
                            className="bg-black/40 border border-white/10 pl-10 pr-8 py-3 text-[10px] font-bold text-white tracking-widest focus:border-xlnc-gold focus:outline-none appearance-none uppercase min-w-[200px] cursor-pointer"
                        >
                            <option value="ALL">ALL SECTORS</option>
                            <option value="Automotive">Automotive</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="High Ticket Coaching">High Ticket</option>
                            <option value="Medical Aesthetics">Medical</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 group-hover:text-white" />
                    </div>
                </div>
            )}

            {filteredArchives.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg bg-white/[0.01]">
                    {archives.length === 0 ? (
                        <>
                            <History className="mx-auto h-12 w-12 text-gray-800 mb-4" />
                            <h3 className="text-xl text-white font-serif mb-2">No Constructs Found</h3>
                            <p className="text-gray-500 text-sm font-light">Generate new reality architectures to populate the archives.</p>
                            <button 
                                onClick={() => setViewMode('FORGE')}
                                className="mt-6 text-xlnc-gold text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
                            >
                                Return to Forge
                            </button>
                        </>
                    ) : (
                        <>
                            <Search className="mx-auto h-12 w-12 text-gray-800 mb-4" />
                            <h3 className="text-xl text-white font-serif mb-2">Query Returned Null</h3>
                            <p className="text-gray-500 text-sm font-light">No constructs match your filter parameters.</p>
                            <button 
                                onClick={() => {setArchiveSearch(''); setArchiveFilterIndustry('ALL');}}
                                className="mt-6 text-xlnc-gold text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
                            >
                                Clear Filters
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredArchives.map((arch) => (
                        <div key={arch.id} className="opulent-card p-6 group hover:border-xlnc-gold/30 transition-all duration-300 bg-black/40">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[9px] text-xlnc-gold font-bold uppercase tracking-[0.2em] mb-1">
                                        {arch.config.industry} // {arch.config.tone}
                                    </div>
                                    <h3 className="text-2xl font-serif text-white group-hover:text-xlnc-gold transition-colors">{arch.config.name}</h3>
                                </div>
                                <div className="text-[10px] text-gray-600 font-mono">
                                    {arch.timestamp}
                                </div>
                            </div>
                            
                            <p className="text-gray-500 text-xs mb-6 line-clamp-2 font-light leading-relaxed">
                                Goal: {arch.config.goal}
                            </p>

                            <div className="flex gap-3 border-t border-white/5 pt-4">
                                <button 
                                    onClick={() => handleCopy(arch.script)}
                                    className="flex-1 py-2 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-white hover:border-white transition-all flex items-center justify-center gap-2 hover:bg-white/5"
                                >
                                    <Copy size={12} /> Copy Script
                                </button>
                                <button 
                                    onClick={() => handleRestore(arch)}
                                    className="flex-1 py-2 bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-xlnc-gold hover:text-black transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={12} /> Re-Initialize
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default RealityForge;