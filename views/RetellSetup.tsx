
import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, AlertCircle, Wifi, CheckCircle2, Loader2, Key, Fingerprint, HelpCircle, Info, Bell, Mail, Zap, ServerCrash } from 'lucide-react';
import { fetchRetellCalls } from '../services/retell';

interface Props {
  addLog: (msg: string, type: any) => void;
}

const RetellSetup: React.FC<Props> = ({ addLog }) => {
  const [apiKey, setApiKey] = useState('');
  const [agentId, setAgentId] = useState('');
  const [status, setStatus] = useState('IDLE' as 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'FAILED');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState('' as 'AUTH' | 'AGENT' | 'NETWORK' | 'UNKNOWN' | '');

  // Alert Configuration State
  const [alertEmail, setAlertEmail] = useState('');
  const [triggers, setTriggers] = useState({
      sentiment: false,
      booked: false,
      handoff: false
  });
  const [alertSaveState, setAlertSaveState] = useState('IDLE' as 'IDLE' | 'SAVING' | 'SAVED');

  // Load existing credentials & Alerts
  useEffect(() => {
    const storedKey = localStorage.getItem('xlnc_retell_key');
    const storedAgent = localStorage.getItem('xlnc_retell_agent');
    const storedEmail = localStorage.getItem('xlnc_alert_email');
    const storedTriggers = localStorage.getItem('xlnc_alert_triggers');

    if (storedKey) {
        setApiKey(storedKey);

        // Validate stored agent ID - clear if it's actually a key
        if (storedAgent && !storedAgent.startsWith('key_')) {
            setAgentId(storedAgent);
        } else if (storedAgent && storedAgent.startsWith('key_')) {
            console.warn('Invalid agent ID detected (looks like API key), clearing...');
            localStorage.removeItem('xlnc_retell_agent');
            setAgentId('');
        }

        setStatus('CONNECTED');
    }

    if (storedEmail) setAlertEmail(storedEmail);
    if (storedTriggers) {
        try {
            setTriggers(JSON.parse(storedTriggers));
        } catch (e) {
            console.error("Failed to parse triggers", e);
        }
    }
  }, []);

  const handleConnect = async () => {
    setErrorMsg('');
    setErrorType('');

    if (!apiKey) {
        setErrorMsg('Protocol Error: API Key required.');
        setErrorType('AUTH');
        setStatus('FAILED');
        return;
    }

    // Pre-flight Validation
    if (!apiKey.startsWith('re_') && !apiKey.startsWith('key_')) {
        setErrorMsg('Format Error: Key must start with "re_" or "key_".');
        setErrorType('AUTH');
        setStatus('FAILED');
        return;
    }

    // Validate Agent ID format if provided
    if (agentId && agentId.startsWith('key_')) {
        setErrorMsg('Format Error: Agent ID cannot be an API key. Use the format "agent_..."');
        setErrorType('AGENT');
        setStatus('FAILED');
        localStorage.removeItem('xlnc_retell_agent');
        return;
    }

    setStatus('CONNECTING');
    addLog('Initiating Retell Neural Bridge...', 'INFO');

    try {
        // Verification via list-calls (Service handles fallback logic now)
        const calls = await fetchRetellCalls(apiKey, agentId || undefined, 1); 

        localStorage.setItem('xlnc_retell_key', apiKey.trim());
        if (agentId) localStorage.setItem('xlnc_retell_agent', agentId.trim());
        else localStorage.removeItem('xlnc_retell_agent');
        
        setStatus('CONNECTED');
        
        if (calls.length === 0 && agentId) {
            addLog(`Retell Connected. Warning: No data found for Agent '${agentId}'.`, 'WARN');
        } else {
            addLog('Retell Voice Core: SYNCHRONIZED', 'SUCCESS');
        }

    } catch (e: any) {
        console.error(e);
        setStatus('FAILED');
        
        const rawError = e.message || e.toString();
        let displayError = rawError;
        let type: 'AUTH' | 'AGENT' | 'NETWORK' | 'UNKNOWN' = 'UNKNOWN';

        // Detailed Granular Error Mapping
        if (rawError.includes("Authentication")) {
             displayError = "Authentication Failed: API Key is invalid or expired.";
             type = 'AUTH';
             localStorage.removeItem('xlnc_retell_key'); // Clear bad key
        } else if (rawError.includes("Agent")) {
             displayError = `Agent ID Error: The Agent '${agentId}' could not be verified.`;
             type = 'AGENT';
        } else if (rawError.includes("Network") || rawError.includes("Failed to fetch")) {
             displayError = "Network Error: Connection blocked. Disable Adblock/VPN.";
             type = 'NETWORK';
        } else if (rawError.includes("Route") || rawError.includes("404")) {
             displayError = "API Endpoint Error: Please check system status.";
             type = 'NETWORK';
        } else {
             displayError = rawError.replace(/^Error:\s*/i, '').trim();
        }

        setErrorMsg(displayError);
        setErrorType(type);
        addLog(`Uplink Failed: ${displayError}`, 'CRITICAL');
    }
  };

  const handleDisconnect = () => {
      localStorage.removeItem('xlnc_retell_key');
      localStorage.removeItem('xlnc_retell_agent');
      setApiKey('');
      setAgentId('');
      setStatus('IDLE');
      addLog('Retell Uplink Severed', 'WARN');
  };

  const handleSaveAlerts = () => {
      setAlertSaveState('SAVING');
      setTimeout(() => {
          localStorage.setItem('xlnc_alert_email', alertEmail);
          localStorage.setItem('xlnc_alert_triggers', JSON.stringify(triggers));
          setAlertSaveState('SAVED');
          addLog(`Neural Alerts updated for ${alertEmail || 'System'}`, 'SUCCESS');
          setTimeout(() => setAlertSaveState('IDLE'), 2000);
      }, 800);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar flex flex-col">
        <div className="flex-1 flex flex-col justify-center p-12 max-w-5xl mx-auto w-full">
            <header className="mb-12 border-b border-white/5 pb-8">
                <h2 className="text-4xl font-serif text-white mb-3 flex items-center gap-4">
                    <Mic className="text-xlnc-gold" /> Retell Voice Uplink
                </h2>
                <p className="text-gray-500 text-sm font-light tracking-wide">
                    Establish a low-latency neural bridge to the Retell AI infrastructure.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in items-start">
                
                {/* Configuration Panel Column */}
                <div className="space-y-8">
                    
                    {/* Credentials Vault */}
                    <div className="opulent-card p-8 border-t border-xlnc-gold/20">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Credentials Vault</h3>
                        
                        <div className="space-y-6">
                            <div className="group">
                                <label className="flex items-center gap-2 text-[9px] font-bold text-xlnc-gold uppercase tracking-[0.2em] mb-3">
                                    <Key size={10} /> API Key
                                </label>
                                <input 
                                    type="password" 
                                    value={apiKey}
                                    onChange={e => { setApiKey(e.target.value); if (errorType === 'AUTH') setStatus('IDLE'); }}
                                    className={`w-full bg-black/40 border py-4 px-4 text-white font-mono text-sm focus:outline-none transition-all placeholder-gray-800 ${errorType === 'AUTH' ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-xlnc-gold'}`}
                                    placeholder="re_... or key_..."
                                />
                            </div>

                            <div className="group">
                                <label className="flex items-center gap-2 text-[9px] font-bold text-xlnc-gold uppercase tracking-[0.2em] mb-3">
                                    <Fingerprint size={10} /> Agent ID (Optional)
                                </label>
                                <input 
                                    type="text" 
                                    value={agentId}
                                    onChange={e => { setAgentId(e.target.value); if (errorType === 'AGENT') setStatus('IDLE'); }}
                                    className={`w-full bg-black/40 border py-4 px-4 text-white font-mono text-sm focus:outline-none transition-all placeholder-gray-800 ${errorType === 'AGENT' ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-xlnc-gold'}`}
                                    placeholder="agent_..."
                                />
                                <div className="mt-2 flex items-start gap-2 text-[9px] text-gray-500 leading-relaxed">
                                    <HelpCircle size={12} className="shrink-0 mt-0.5" /> 
                                    <span>
                                        To find your Agent ID: Go to Retell Dashboard &gt; Agents. 
                                        Copy the ID starting with <code>agent_</code> or from the URL.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {status === 'FAILED' && (
                            <div className="mt-6 p-4 bg-red-900/10 border border-red-900/30 flex items-start gap-3 animate-fade-in">
                                {errorType === 'NETWORK' ? <ServerCrash size={16} className="text-red-500 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />}
                                <div className="flex flex-col">
                                    <span className="text-xs text-red-400 font-bold uppercase tracking-wide mb-1">
                                        {errorType === 'AUTH' ? 'Invalid Credentials' : errorType === 'AGENT' ? 'Agent Configuration Issue' : errorType === 'NETWORK' ? 'Connection Failed' : 'Uplink Error'}
                                    </span>
                                    <span className="text-xs text-red-400/80 font-mono break-words leading-relaxed">{errorMsg}</span>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                            {status === 'CONNECTED' ? (
                                <button 
                                    onClick={handleDisconnect}
                                    className="w-full py-4 border border-red-900/50 text-red-500 text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-red-900/10 transition-all"
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button 
                                    onClick={handleConnect}
                                    disabled={status === 'CONNECTING'}
                                    className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-3
                                        ${status === 'CONNECTING' ? 'opacity-70 cursor-wait bg-xlnc-gold text-black' : 'bg-xlnc-gold text-black hover:bg-white'}
                                    `}
                                >
                                    {status === 'CONNECTING' && <Loader2 className="animate-spin" />}
                                    {status === 'IDLE' || status === 'FAILED' ? <Wifi size={16} /> : null}
                                    
                                    {status === 'IDLE' ? 'Establish Connection' : 
                                    status === 'CONNECTING' ? 'Handshaking...' : 
                                    'Retry Connection'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Neural Alerts Section */}
                    <div className="opulent-card p-8 border-t border-white/10">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Bell size={12} /> Neural Alerts
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="group">
                                <label className="flex items-center gap-2 text-[9px] font-bold text-xlnc-gold uppercase tracking-[0.2em] mb-3">
                                    <Mail size={10} /> Notification Channel (Email)
                                </label>
                                <input 
                                    type="email" 
                                    value={alertEmail}
                                    onChange={e => setAlertEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 py-4 px-4 text-white font-mono text-sm focus:border-xlnc-gold focus:outline-none transition-all placeholder-gray-800"
                                    placeholder="alerts@empire.com"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-2">
                                    Critical Event Triggers
                                </label>
                                
                                {/* Toggle: Sentiment */}
                                <div 
                                    onClick={() => setTriggers(p => ({...p, sentiment: !p.sentiment}))}
                                    className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${triggers.sentiment ? 'bg-status-alert/10 border-status-alert/50' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <AlertCircle size={14} className={triggers.sentiment ? 'text-status-alert' : 'text-gray-500'} />
                                        <div>
                                            <div className={`text-[10px] font-bold uppercase tracking-widest ${triggers.sentiment ? 'text-white' : 'text-gray-500'}`}>Sentiment Breach</div>
                                            <div className="text-[9px] text-gray-600">Notify when sentiment &lt; -0.5</div>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full border ${triggers.sentiment ? 'bg-status-alert border-status-alert' : 'border-gray-600'}`}></div>
                                </div>

                                {/* Toggle: Conversion */}
                                <div 
                                    onClick={() => setTriggers(p => ({...p, booked: !p.booked}))}
                                    className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${triggers.booked ? 'bg-status-success/10 border-status-success/50' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={14} className={triggers.booked ? 'text-status-success' : 'text-gray-500'} />
                                        <div>
                                            <div className={`text-[10px] font-bold uppercase tracking-widest ${triggers.booked ? 'text-white' : 'text-gray-500'}`}>Conversion Signal</div>
                                            <div className="text-[9px] text-gray-600">Notify on 'Appointment Booked'</div>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full border ${triggers.booked ? 'bg-status-success border-status-success' : 'border-gray-600'}`}></div>
                                </div>

                                 {/* Toggle: Intervention */}
                                 <div 
                                    onClick={() => setTriggers(p => ({...p, handoff: !p.handoff}))}
                                    className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${triggers.handoff ? 'bg-xlnc-gold/10 border-xlnc-gold/50' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Zap size={14} className={triggers.handoff ? 'text-xlnc-gold' : 'text-gray-500'} />
                                        <div>
                                            <div className={`text-[10px] font-bold uppercase tracking-widest ${triggers.handoff ? 'text-white' : 'text-gray-500'}`}>Human Intervention</div>
                                            <div className="text-[9px] text-gray-600">Notify on 'Handoff Requested'</div>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full border ${triggers.handoff ? 'bg-xlnc-gold border-xlnc-gold' : 'border-gray-600'}`}></div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveAlerts}
                                disabled={alertSaveState === 'SAVING'}
                                className={`w-full py-3 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2
                                    ${alertSaveState === 'SAVED' ? 'bg-emerald-900/20 text-emerald-500 border border-emerald-900' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white hover:text-black'}
                                `}
                            >
                                {alertSaveState === 'SAVING' && <Loader2 className="animate-spin" size={12} />}
                                {alertSaveState === 'SAVED' ? 'Protocols Active' : 'Update Alert Matrix'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Monitor Panel Column */}
                <div className="space-y-8">
                    <div className="bg-xlnc-panel border border-xlnc-border p-8 h-full flex flex-col relative overflow-hidden min-h-[400px]">
                        {/* Background Grid */}
                        <div 
                            className="absolute inset-0 opacity-[0.05] pointer-events-none"
                            style={{
                                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                                backgroundSize: '20px 20px'
                            }}
                        />

                        <div className="relative z-10 flex justify-between items-start mb-12">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                Signal Telemetry
                            </h3>
                            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500 ${
                                status === 'CONNECTED' ? 'bg-status-success text-status-success' : 
                                status === 'CONNECTING' ? 'bg-xlnc-gold text-xlnc-gold animate-pulse' :
                                status === 'FAILED' ? 'bg-red-500 text-red-500' :
                                'bg-gray-700 text-gray-700'
                            }`}></div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
                            {status === 'IDLE' && (
                                <div className="text-gray-600">
                                    <Wifi size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-mono uppercase tracking-widest">Waiting for Credentials</p>
                                    
                                    <div className="mt-8 p-4 bg-white/5 border border-white/5 text-left max-w-xs mx-auto">
                                        <div className="flex items-start gap-2 text-xlnc-gold mb-2">
                                            <Info size={14} className="shrink-0 mt-0.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">No Webhook Required</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 leading-relaxed">
                                            This dashboard polls the Retell API directly. You do <span className="text-white">not</span> need to configure webhooks for this dashboard to display call logs.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {status === 'CONNECTING' && (
                                <div className="text-xlnc-gold">
                                    <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-50" />
                                    <p className="text-xs font-mono uppercase tracking-widest">Negotiating Protocol...</p>
                                </div>
                            )}

                            {status === 'CONNECTED' && (
                                <div className="text-status-success animate-slide-up">
                                    <ShieldCheck size={48} className="mx-auto mb-4" />
                                    <h4 className="text-xl font-serif text-white mb-2">System Nominal</h4>
                                    <p className="text-xs font-mono uppercase tracking-widest text-emerald-500/70">Latency: 24ms // Packets: Secure</p>
                                    
                                    <div className="mt-8 w-full bg-black/40 border border-white/5 p-4 text-left space-y-2">
                                        <div className="flex justify-between text-[9px] font-mono uppercase text-gray-500">
                                            <span>Source ID</span>
                                            <span className="text-white truncate max-w-[150px]">{agentId || 'ALL_AGENTS'}</span>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-mono uppercase text-gray-500">
                                            <span>Concurrency</span>
                                            <span className="text-white">Unlimited</span>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-mono uppercase text-gray-500">
                                            <span>Websocket</span>
                                            <span className="text-status-success">Open</span>
                                        </div>
                                        {alertEmail && (
                                            <div className="flex justify-between text-[9px] font-mono uppercase text-gray-500 border-t border-white/5 pt-2 mt-2">
                                                <span>Alerts Active</span>
                                                <span className="text-xlnc-gold">Enabled</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {status === 'FAILED' && (
                                <div className="text-red-500">
                                    <AlertCircle size={48} className="mx-auto mb-4" />
                                    <p className="text-xs font-mono uppercase tracking-widest">Connection Refused</p>
                                    <p className="text-[9px] text-red-400/70 mt-2 max-w-[220px] mx-auto leading-relaxed">
                                        {errorMsg || "Check Credentials Vault"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RetellSetup;
