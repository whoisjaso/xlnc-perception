
import React, { useState } from 'react';
import { ArrowRight, Check, Database, Link, ShieldCheck, Cpu, Layers, Loader2, X, Key, Globe, Wifi, AlertCircle, CheckCircle2, Smartphone, Scan } from 'lucide-react';
import { CRMType } from '../types';

interface Props {
  onComplete: () => void;
}

const CRM_PROVIDERS: { type: CRMType; name: string; desc: string; fields: { key: string; label: string; placeholder: string }[] }[] = [
    { 
        type: 'GOHIGHLEVEL', 
        name: 'GoHighLevel', 
        desc: 'Full-stack agency automation.',
        fields: [
            { key: 'apiKey', label: 'Location API Key', placeholder: 'loc_...' },
            { key: 'agencyKey', label: 'Agency API Key (Optional)', placeholder: 'ag_...' }
        ]
    },
    { 
        type: 'HUBSPOT', 
        name: 'HubSpot', 
        desc: 'Enterprise CRM & Marketing.',
        fields: [
            { key: 'accessToken', label: 'Private App Access Token', placeholder: 'pat-na1-...' }
        ]
    },
    { 
        type: 'ZOHO', 
        name: 'Zoho One', 
        desc: 'Integrated operating system.',
        fields: [
            { key: 'clientId', label: 'Client ID', placeholder: '1000.NM...' },
            { key: 'clientSecret', label: 'Client Secret', placeholder: '...' },
            { key: 'region', label: 'Data Center Region', placeholder: 'US / EU / CN' }
        ]
    },
    { 
        type: 'GOOGLESHEETS', 
        name: 'Google Sheets', 
        desc: 'Raw data ingestion stream.',
        fields: [
            { key: 'sheetId', label: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA5nFMd...' },
            { key: 'tabName', label: 'Tab Name', placeholder: 'Sheet1' }
        ]
    },
    { 
        type: 'SALESFORCE', 
        name: 'Salesforce', 
        desc: 'Fortune 500 standard.',
        fields: [
            { key: 'instanceUrl', label: 'Instance URL', placeholder: 'https://your-domain.my.salesforce.com' },
            { key: 'consumerKey', label: 'Consumer Key', placeholder: '...' }
        ]
    },
];

const OnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1 as 1 | 2 | 3 | 4);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1 State (Identity)
  const [identity, setIdentity] = useState({ name: '', email: '', password: '' });
  const [identityError, setIdentityError] = useState('');

  // Step 2 State (2FA Security)
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAStatus, setTwoFAStatus] = useState('IDLE' as 'IDLE' | 'VERIFYING' | 'SUCCESS' | 'ERROR');

  // Step 3 State (Retell)
  const [retellKey, setRetellKey] = useState('');
  const [retellStatus, setRetellStatus] = useState('IDLE' as 'IDLE' | 'VERIFYING' | 'VERIFIED' | 'FAILURE');
  const [retellErrorDetail, setRetellErrorDetail] = useState('');

  // Step 4 State (CRMs)
  const [connectedCRMs, setConnectedCRMs] = useState(new Set() as Set<CRMType>);
  const [configuringCRM, setConfiguringCRM] = useState(null as CRMType | null);
  const [crmValues, setCrmValues] = useState({} as Record<string, any>);
  const [verifyingCRM, setVerifyingCRM] = useState(false);
  const [testStatus, setTestStatus] = useState('IDLE' as 'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILURE');

  // Handlers
  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIdentityError('');

    if (!identity.name.trim() || !identity.email.trim()) {
        setIdentityError('Identity parameters required.');
        return;
    }

    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setStep(2);
    }, 600);
  };

  const handleVerify2FA = () => {
      if (twoFACode.length !== 6) {
          setTwoFAStatus('ERROR');
          return;
      }
      setTwoFAStatus('VERIFYING');
      
      setTimeout(() => {
          setTwoFAStatus('SUCCESS');
      }, 1500);
  };

  const handleRetellVerify = () => {
    setRetellErrorDetail('');
    
    if (!retellKey.trim()) {
        setRetellStatus('FAILURE');
        setRetellErrorDetail('API Key required.');
        return;
    }

    setRetellStatus('VERIFYING');
    
    setTimeout(() => {
        const key = retellKey.trim();
        // Strict syntax validation for Retell API keys
        const isValidPrefix = key.startsWith('re_') || key.startsWith('key_');
        const isValidLength = key.length > 20; // Typical keys are long

        if (isValidPrefix && isValidLength) {
            setRetellStatus('VERIFIED');
        } else {
            setRetellStatus('FAILURE');
            setRetellErrorDetail("Invalid Format. Must start with 're_' or 'key_'.");
        }
    }, 1500);
  };

  const openCRMConfig = (type: CRMType) => {
     setConfiguringCRM(type);
     setTestStatus('IDLE');
  };

  const handleTestConnection = () => {
      const provider = CRM_PROVIDERS.find(p => p.type === configuringCRM);
      if (!provider) return;

      setTestStatus('TESTING');

      // Retrieve values for validation
      const currentValues = provider.fields.map(f => crmValues[`${configuringCRM}_${f.key}`]);
      
      // Check if ANY field is empty -> Trigger Mock Protocol
      const isAnyEmpty = currentValues.some(v => !v || v.toString().trim().length === 0);
      
      setTimeout(() => {
          if (isAnyEmpty) {
              // Auto-populate with mock data to simulate SUCCESS for demo/testing
              const newValues = { ...crmValues };
              provider.fields.forEach(f => {
                  let mockValue = 'mock_key_12345';
                  if (configuringCRM === 'HUBSPOT' && f.key === 'accessToken') mockValue = 'pat-na1-mock-token-882';
                  if (configuringCRM === 'SALESFORCE' && f.key === 'instanceUrl') mockValue = 'https://na1.salesforce.com';
                  if (configuringCRM === 'GOHIGHLEVEL' && f.key === 'apiKey') mockValue = 'loc_mock_key_99';
                  
                  newValues[`${configuringCRM}_${f.key}`] = mockValue;
              });
              setCrmValues(newValues);
              setTestStatus('SUCCESS');
          } else {
              // Strict Validation on USER ENTERED data
              let isValid = true;
              
              // HubSpot Check
              if (configuringCRM === 'HUBSPOT') {
                  const token = crmValues['HUBSPOT_accessToken'];
                  if (token && !token.startsWith('pat-')) isValid = false;
              }
              
              // Salesforce Check
              if (configuringCRM === 'SALESFORCE') {
                  const url = crmValues['SALESFORCE_instanceUrl'];
                  if (url && !url.startsWith('https://')) isValid = false;
              }

              // Google Sheets Check
              if (configuringCRM === 'GOOGLESHEETS') {
                  const id = crmValues['GOOGLESHEETS_sheetId'];
                  if (id && id.length < 10) isValid = false;
              }
              
              if (isValid) {
                  setTestStatus('SUCCESS');
              } else {
                  setTestStatus('FAILURE');
              }
          }
      }, 1500);
  };

  const handleSaveCRM = () => {
    if (!configuringCRM) return;
    if (testStatus !== 'SUCCESS') {
        handleTestConnection(); // Force test if not done
        return;
    }

    setVerifyingCRM(true);
    
    setTimeout(() => {
        setVerifyingCRM(false);
        setConnectedCRMs(prev => new Set(prev).add(configuringCRM));
        setConfiguringCRM(null);
    }, 1000);
  };

  const handleDisconnectCRM = (type: CRMType, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const next = new Set(connectedCRMs);
    next.delete(type);
    setConnectedCRMs(next);
  };

  const updateCRMValue = (key: string, value: string) => {
      setCrmValues(prev => ({
          ...prev,
          [`${configuringCRM}_${key}`]: value
      }));
      if (testStatus !== 'IDLE') setTestStatus('IDLE');
  };

  const finish = () => {
    setIsLoading(true);
    setTimeout(() => {
        onComplete();
    }, 1500);
  };

  // Helper to get current config fields
  const currentProvider = CRM_PROVIDERS.find(p => p.type === configuringCRM);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] to-black z-0"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-xlnc-gold to-transparent opacity-50"></div>

      <div className="relative z-10 w-full max-w-4xl p-6 md:p-12">
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-12 px-4">
            {[
                { s: 1, l: 'Identity' }, 
                { s: 2, l: 'Security' },
                { s: 3, l: 'Voice Core' }, 
                { s: 4, l: 'Revenue Matrix' }
            ].map((item, idx) => (
                <div key={item.s} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-500
                        ${step >= item.s ? 'border-xlnc-gold bg-xlnc-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]' : 'border-white/10 text-gray-500 bg-black'}
                    `}>
                        {step > item.s ? <Check size={14} /> : item.s}
                    </div>
                    <span className={`hidden md:block text-[10px] uppercase tracking-[0.2em] font-bold transition-colors ${step >= item.s ? 'text-white' : 'text-gray-600'}`}>
                        {item.l}
                    </span>
                    {idx < 3 && <div className={`w-8 md:w-12 h-[1px] ml-4 transition-colors ${step > item.s ? 'bg-xlnc-gold' : 'bg-gray-800'}`}></div>}
                </div>
            ))}
        </div>

        {/* Content Area */}
        <div className="opulent-card min-h-[600px] p-10 flex flex-col relative overflow-hidden">
            
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
                <div key="step1" className="animate-slide-up flex-1 flex flex-col justify-center items-center h-full w-full">
                    <div className="w-full max-w-md flex flex-col justify-center text-center">
                        <h2 className="text-3xl font-serif text-white mb-2">Establish Sovereignty</h2>
                        <p className="text-gray-500 text-sm mb-8 font-light">Create your admin credentials for the XLNC Perception Engine.</p>
                        
                        <form onSubmit={handleIdentitySubmit} className="space-y-6 text-center">
                            <div className="group">
                                 <label className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.2em] block mb-3">Designation (Name)</label>
                                 <input 
                                    type="text" 
                                    value={identity.name}
                                    onChange={e => setIdentity({...identity, name: e.target.value})}
                                    className="w-full bg-white/5 border-b border-white/10 py-3 px-4 text-white text-center focus:border-xlnc-gold focus:bg-white/10 focus:outline-none transition-all"
                                    placeholder="e.g. Jason Obawemimo"
                                 />
                            </div>
                            <div className="group">
                                 <label className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.2em] block mb-3">Comms Channel (Email)</label>
                                 <input 
                                    type="email" 
                                    value={identity.email}
                                    onChange={e => setIdentity({...identity, email: e.target.value})}
                                    className="w-full bg-white/5 border-b border-white/10 py-3 px-4 text-white text-center focus:border-xlnc-gold focus:bg-white/10 focus:outline-none transition-all"
                                    placeholder="e.g. admin@empire.com"
                                 />
                            </div>

                            {identityError && (
                                <div className="text-status-alert text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                    {identityError}
                                </div>
                            )}

                            <div className="pt-4">
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-xlnc-gold hover:text-black transition-all duration-500 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Initialize Profile <ArrowRight size={14} /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STEP 2: 2FA SECURITY */}
            {step === 2 && (
                <div key="step2" className="animate-slide-up flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                         <div>
                            <h2 className="text-3xl font-serif text-white mb-2">Security Protocol</h2>
                            <p className="text-gray-500 text-sm font-light">Enable Two-Factor Authentication to secure your sovereign domain.</p>
                         </div>
                         <ShieldCheck className="text-xlnc-gold opacity-50" size={48} strokeWidth={1} />
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row gap-12 items-center mb-8">
                        {/* QR Section */}
                        <div className="flex-1 w-full max-w-xs">
                            <div className="bg-white/5 p-6 border border-white/10 rounded-sm flex flex-col items-center">
                                <div className="w-48 h-48 bg-white p-2 mb-6">
                                    {/* Simple Mock QR */}
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/XLNC:Admin?secret=XLNCSECUREKEY123&issuer=XLNC" alt="2FA QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                                </div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Smartphone size={14} /> Scan with Authenticator
                                </p>
                                <div className="font-mono text-[10px] text-xlnc-gold bg-black/50 px-3 py-2 rounded border border-xlnc-gold/20 tracking-wider">
                                    XLNC-SEC-8839-2938
                                </div>
                            </div>
                        </div>

                        {/* Input Section */}
                        <div className="flex-1 w-full space-y-8">
                             <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.2em] block">
                                    <Scan size={12} className="inline mr-2" /> Verification Code
                                 </label>
                                 <p className="text-xs text-gray-500 mb-4">Enter the 6-digit code generated by your device.</p>
                                 
                                 <input 
                                    type="text" 
                                    maxLength={6}
                                    value={twoFACode}
                                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-black/40 border border-white/10 py-6 px-4 text-white font-mono text-3xl tracking-[0.5em] text-center focus:border-xlnc-gold focus:outline-none transition-all placeholder-gray-800 rounded-sm"
                                    placeholder="000000"
                                 />
                             </div>

                             {twoFAStatus === 'ERROR' && (
                                <div className="text-status-alert text-[10px] font-bold uppercase tracking-widest animate-fade-in flex items-center justify-center gap-2 p-2 bg-status-alert/10 border border-status-alert/20">
                                    <AlertCircle size={12} /> Invalid Security Token
                                </div>
                             )}

                             <button 
                                onClick={handleVerify2FA}
                                disabled={twoFAStatus === 'SUCCESS' || twoFAStatus === 'VERIFYING'}
                                className={`w-full py-4 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2 border
                                    ${twoFAStatus === 'SUCCESS' 
                                        ? 'bg-status-success text-white border-status-success cursor-default' 
                                        : 'bg-xlnc-gold text-black border-xlnc-gold hover:bg-white'
                                    }
                                `}
                            >
                                {twoFAStatus === 'VERIFYING' && <Loader2 className="animate-spin" />}
                                {twoFAStatus === 'SUCCESS' && <><CheckCircle2 size={14} /> Authentication Secured</>}
                                {twoFAStatus === 'IDLE' && "Verify Token"}
                                {twoFAStatus === 'ERROR' && "Retry Verification"}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                         <button onClick={() => setStep(3)} className="text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-white px-6 py-4">
                            Skip Protocol
                        </button>
                        <button 
                            onClick={() => setStep(3)}
                            disabled={twoFAStatus !== 'SUCCESS'}
                            className={`px-8 py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-500 flex items-center gap-2
                                ${twoFAStatus !== 'SUCCESS' ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500' : 'hover:bg-xlnc-gold'}
                            `}
                        >
                            Proceed <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: RETELL SYNC */}
            {step === 3 && (
                <div key="step3" className="animate-slide-up">
                    <div className="flex justify-between items-start mb-8">
                         <div>
                            <h2 className="text-3xl font-serif text-white mb-2">Voice Core Uplink</h2>
                            <p className="text-gray-500 text-sm font-light">Connect your Retell AI dashboard to sync call logs and agent states.</p>
                         </div>
                         <Cpu className="text-xlnc-gold opacity-50" size={48} strokeWidth={1} />
                    </div>

                    <div className={`bg-black/40 border p-8 mb-8 relative overflow-hidden transition-colors duration-300 ${retellStatus === 'FAILURE' ? 'border-status-alert/50' : 'border-white/10'}`}>
                        <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300 ${retellStatus === 'FAILURE' ? 'bg-status-alert' : 'bg-xlnc-gold'}`}></div>
                        <div className="mb-6">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-3">Retell API Key</label>
                            <input 
                                type="password" 
                                value={retellKey}
                                onChange={e => {
                                    setRetellKey(e.target.value);
                                    if (retellStatus === 'FAILURE') setRetellStatus('IDLE');
                                }}
                                className="w-full bg-transparent border border-white/10 py-4 px-4 text-white font-mono text-sm focus:border-xlnc-gold focus:outline-none transition-all"
                                placeholder="re_... or key_..."
                             />
                        </div>
                        
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 {retellStatus === 'VERIFYING' && <Loader2 size={16} className="text-xlnc-gold animate-spin" />}
                                 {retellStatus === 'VERIFIED' && <ShieldCheck size={16} className="text-status-success" />}
                                 {retellStatus === 'FAILURE' && <AlertCircle size={16} className="text-status-alert" />}
                                 
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                     retellStatus === 'VERIFIED' ? 'text-status-success' : 
                                     retellStatus === 'FAILURE' ? 'text-status-alert' : 
                                     'text-gray-500'
                                 }`}>
                                    {retellStatus === 'IDLE' ? 'Waiting for Input' : 
                                     retellStatus === 'VERIFYING' ? 'Handshaking...' : 
                                     retellStatus === 'FAILURE' ? 'Connection Refused' :
                                     'Uplink Secure'}
                                 </span>
                             </div>
                             <button 
                                onClick={handleRetellVerify}
                                disabled={retellStatus === 'VERIFIED' || retellStatus === 'VERIFYING'}
                                className={`px-6 py-3 border text-[10px] font-bold uppercase tracking-widest transition-all
                                    ${retellStatus === 'VERIFIED' 
                                        ? 'border-status-success text-status-success bg-status-success/10 cursor-default' 
                                        : retellStatus === 'FAILURE'
                                        ? 'border-status-alert text-status-alert hover:bg-status-alert/10'
                                        : 'border-white/10 text-white hover:border-xlnc-gold hover:text-xlnc-gold'
                                    }
                                `}
                            >
                                {retellStatus === 'VERIFIED' ? 'Synced' : retellStatus === 'VERIFYING' ? 'Checking...' : 'Verify Connection'}
                             </button>
                        </div>
                        
                        {retellStatus === 'FAILURE' && (
                            <div className="mt-4 text-[10px] text-status-alert font-mono uppercase tracking-wide animate-fade-in">
                                {retellErrorDetail || "Error: Invalid API Key Format. Credentials must begin with 're_' or 'key_'."}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4">
                        <button onClick={() => setStep(4)} className="text-gray-500 text-[10px] font-bold uppercase tracking-widest hover:text-white px-6">
                            Skip Protocol
                        </button>
                        <button 
                            onClick={() => setStep(4)}
                            disabled={retellStatus !== 'VERIFIED'}
                            className={`px-8 py-4 bg-xlnc-gold text-black text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-500 flex items-center gap-2
                                ${retellStatus !== 'VERIFIED' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'}
                            `}
                        >
                            Proceed <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: CRM MATRIX */}
            {step === 4 && !configuringCRM && (
                <div key="step4" className="animate-slide-up h-full flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                         <div>
                            <h2 className="text-3xl font-serif text-white mb-2">The Revenue Matrix</h2>
                            <p className="text-gray-500 text-sm font-light">Select your data silos. XLNC will orchestrate the flow between them.</p>
                         </div>
                         <Layers className="text-neon-cyan opacity-50" size={48} strokeWidth={1} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {CRM_PROVIDERS.map((crm) => {
                            const isConnected = connectedCRMs.has(crm.type);
                            
                            return (
                                <div 
                                    key={crm.type}
                                    onClick={() => openCRMConfig(crm.type)}
                                    className={`
                                        relative p-6 border transition-all duration-300 cursor-pointer group
                                        ${isConnected 
                                            ? 'bg-xlnc-gold/5 border-xlnc-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                                            : 'bg-white/5 border-white/5 hover:border-white/20'
                                        }
                                    `}
                                >
                                    {/* Connection Status Indicator */}
                                    <div className="absolute top-4 right-4">
                                        {isConnected ? (
                                            <button 
                                                onClick={(e) => handleDisconnectCRM(crm.type, e)}
                                                className="text-gray-500 hover:text-red-500 transition-colors"
                                                title="Disconnect"
                                            >
                                                <div className="w-2 h-2 bg-status-success rounded-full shadow-[0_0_5px_rgba(46,125,50,0.8)]"></div>
                                            </button>
                                        ) : (
                                            <div className="w-2 h-2 bg-gray-700 rounded-full group-hover:bg-gray-500 transition-colors"></div>
                                        )}
                                    </div>

                                    <Database 
                                        size={24} 
                                        className={`mb-4 transition-colors ${isConnected ? 'text-xlnc-gold' : 'text-gray-600 group-hover:text-white'}`} 
                                        strokeWidth={1.5}
                                    />
                                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 ${isConnected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                        {crm.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {crm.desc}
                                    </p>

                                    {isConnected ? (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[9px] text-xlnc-gold font-bold uppercase tracking-widest">
                                            <Link size={10} /> Stream Active
                                        </div>
                                    ) : (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[9px] text-gray-600 font-bold uppercase tracking-widest group-hover:text-white transition-colors">
                                            <Key size={10} /> Configure
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-white/10">
                         <button 
                            onClick={finish}
                            className="w-full py-4 bg-white text-black text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-xlnc-gold hover:text-black transition-all duration-500 shadow-lg flex items-center justify-center gap-3"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "Enter Command Center"}
                        </button>
                    </div>
                </div>
            )}

            {/* CONFIG OVERLAY */}
            {step === 4 && configuringCRM && currentProvider && (
                <div className="absolute inset-0 z-20 bg-xlnc-card/95 backdrop-blur-xl p-10 flex flex-col animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-serif text-white mb-1">Configure {currentProvider.name}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Secure Credentials Vault</p>
                        </div>
                        <button 
                            onClick={() => setConfiguringCRM(null)}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 space-y-6 max-w-xl relative">
                         {/* Validation Overlay Feedback */}
                         {testStatus !== 'IDLE' && (
                            <div className={`absolute -top-6 right-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest animate-fade-in
                                ${testStatus === 'SUCCESS' ? 'text-status-success' : testStatus === 'FAILURE' ? 'text-status-alert' : 'text-xlnc-gold'}
                            `}>
                                {testStatus === 'TESTING' && <Loader2 size={12} className="animate-spin" />}
                                {testStatus === 'SUCCESS' && <CheckCircle2 size={12} />}
                                {testStatus === 'FAILURE' && <AlertCircle size={12} />}
                                <span>
                                    {testStatus === 'TESTING' ? 'Pinging Server...' : 
                                     testStatus === 'SUCCESS' ? 'Connection Verified (Mock)' : 
                                     'Connection Failed'}
                                </span>
                            </div>
                        )}

                        {currentProvider.fields.map((field) => (
                            <div key={field.key} className="group">
                                <label className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.2em] block mb-3">
                                    {field.label}
                                </label>
                                <input 
                                    type="text" 
                                    value={crmValues[`${configuringCRM}_${field.key}`] || ''}
                                    onChange={(e) => updateCRMValue(field.key, e.target.value)}
                                    className={`w-full bg-black/40 border-b py-3 px-4 text-white focus:bg-white/5 focus:outline-none transition-all font-mono text-sm
                                        ${testStatus === 'FAILURE' ? 'border-status-alert/50 focus:border-status-alert' : 'border-white/10 focus:border-xlnc-gold'}
                                    `}
                                    placeholder={field.placeholder}
                                />
                            </div>
                        ))}
                        
                        {testStatus === 'FAILURE' && (
                            <div className="p-3 bg-status-alert/10 border border-status-alert/20 text-status-alert text-xs font-mono">
                                Error: Authentication rejected by host. Verify credential format (e.g., 'pat-' for HubSpot).
                            </div>
                        )}
                        {testStatus === 'SUCCESS' && (
                             <div className="p-3 bg-status-success/10 border border-status-success/20 text-status-success text-xs font-mono">
                                Protocol Accepted: Mock Data Stream Initialized for testing.
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                        {/* Left Side - Test Button */}
                        <button 
                            onClick={handleTestConnection}
                            disabled={testStatus === 'TESTING'}
                            className="flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:border-xlnc-gold hover:text-xlnc-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Wifi size={14} />
                            {testStatus === 'TESTING' ? 'Testing...' : 'Test Connection'}
                        </button>

                        {/* Right Side - Actions */}
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setConfiguringCRM(null)}
                                className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveCRM}
                                disabled={verifyingCRM}
                                className="px-8 py-3 bg-xlnc-gold text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center gap-2"
                            >
                                {verifyingCRM ? <Loader2 className="animate-spin" size={14} /> : 'Verify & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
