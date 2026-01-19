
import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Lock, Key, AlertCircle, CheckCircle2, Loader2, Terminal } from 'lucide-react';
import { UserProfile } from '../../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
  onNavigateHome: () => void;
}

const SignUp: React.FC<Props> = ({ onComplete, onNavigateHome }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    accessCode: ''
  });
  const [status, setStatus] = useState('IDLE' as 'IDLE' | 'VERIFYING' | 'ERROR' | 'SUCCESS');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMasterOverride, setIsMasterOverride] = useState(false);

  // Effect to detect Master Key entry for visual flair
  useEffect(() => {
    const code = formData.accessCode.toUpperCase();
    if (['JASON-ROOT', 'MARK-OVERRIDE'].includes(code)) {
        setIsMasterOverride(true);
    } else {
        setIsMasterOverride(false);
    }
  }, [formData.accessCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Basic Validation
    if (!formData.name || !formData.email || !formData.password || !formData.accessCode) {
        setErrorMessage('All fields are mandatory for sovereign access.');
        setStatus('ERROR');
        return;
    }

    setStatus('VERIFYING');

    // Simulate API Verification Delay
    setTimeout(() => {
        const code = formData.accessCode.toUpperCase();
        
        // 1. Master Override Keys (For You and Mark)
        const masterKeys = ['JASON-ROOT', 'MARK-OVERRIDE'];
        
        // 2. Admin Panel Generated Regex Patterns
        const adminPattern = /^XLNC-ROOT-[A-Z0-9]{4}-[A-Z0-9]{4}-[0-9]{4}$/;
        const stdPattern = /^XLNC-STD-[A-Z0-9]{4}-[A-Z0-9]{4}-[0-9]{4}$/;
        
        const isMaster = masterKeys.includes(code);
        const isAdminKey = adminPattern.test(code);
        const isStdKey = stdPattern.test(code);
        const isLegacyVip = ['XLNC-VIP-2025', 'EMPIRE-BUILDER'].includes(code);

        if (!isMaster && !isAdminKey && !isStdKey && !isLegacyVip && !code.startsWith('PAY-')) {
             setErrorMessage('Access Key Invalid. Entity not recognized by Protocol.');
             setStatus('ERROR');
             return;
        }

        // Determine Privileges
        const grantAdmin = isMaster || isAdminKey;
        const planLevel = grantAdmin ? 'EMPIRE' : 'SOVEREIGN';
        
        const profile: UserProfile = {
            name: formData.name,
            email: formData.email,
            isAdmin: grantAdmin,
            plan: planLevel
        };

        setStatus('SUCCESS');
        
        setTimeout(() => {
            onComplete(profile);
        }, 1000);

    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] to-black z-0"></div>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-xlnc-gold to-transparent transition-opacity duration-1000 ${isMasterOverride ? 'opacity-100 shadow-[0_0_30px_#D4AF37]' : 'opacity-50'}`}></div>
      
      <div className="w-full max-w-lg relative z-10">
        
        <div className="text-center mb-12">
             <div 
                onClick={onNavigateHome}
                className="inline-flex items-center justify-center gap-4 mb-6 cursor-pointer group mx-auto hover:scale-105 transition-transform duration-500"
             >
                <div className="relative w-8 h-8">
                     <svg viewBox="0 0 40 40" fill="none" className={`absolute inset-0 w-full h-full transition-all duration-500 ${isMasterOverride ? 'drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]' : 'opacity-80'}`}>
                        <path d="M20 0L40 20L20 40L0 20L20 0Z" stroke="#D4AF37" strokeWidth="1"/>
                        <path d="M20 8L32 20L20 32L8 20L20 8Z" fill="#D4AF37"/>
                    </svg>
                </div>
                <span className="text-3xl font-serif font-bold text-white tracking-[0.3em]">XLNC</span>
             </div>
             <h1 className="text-xl font-mono uppercase tracking-[0.2em] text-gray-400">Restricted Access</h1>
             <p className="text-xs text-gray-600 mt-2">Paid Membership / Invitation Only</p>
        </div>

        <div className={`opulent-card p-10 md:p-12 animate-fade-in border-t transition-all duration-500 ${isMasterOverride ? 'border-xlnc-gold shadow-[0_0_50px_rgba(212,175,55,0.1)]' : 'border-xlnc-gold/30'}`}>
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Access Key Field - Visual Priority */}
                <div className={`bg-white/5 border p-6 rounded-sm relative overflow-hidden group transition-colors duration-300 text-center ${isMasterOverride ? 'border-xlnc-gold bg-xlnc-gold/10' : 'border-xlnc-gold/20 focus-within:border-xlnc-gold/60'}`}>
                    {isMasterOverride && (
                        <div className="absolute top-2 right-2 text-[9px] font-bold bg-xlnc-gold text-black px-2 py-0.5 uppercase tracking-widest animate-pulse">
                            Root Override Detected
                        </div>
                    )}
                    <div className="absolute top-0 left-0 w-1 h-full bg-xlnc-gold/50"></div>
                    <label className="flex items-center justify-center gap-2 text-[9px] font-bold text-xlnc-gold uppercase tracking-[0.2em] mb-4">
                        <Key size={10} /> Access Key
                    </label>
                    <input 
                        type="text" 
                        value={formData.accessCode}
                        onChange={e => setFormData({...formData, accessCode: e.target.value.toUpperCase()})}
                        className="w-full bg-transparent border-none p-0 text-white font-mono text-xl placeholder-gray-700 focus:ring-0 focus:outline-none tracking-[0.15em] uppercase text-center"
                        placeholder="XLNC-XXXX-XXXX"
                        autoComplete="off"
                    />
                </div>

                <div className="space-y-6">
                    <div className="group text-center">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-3">Identity Name</label>
                         <input 
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-black/50 border-b border-white/10 py-3 px-4 text-white text-center focus:border-xlnc-gold focus:outline-none transition-all text-sm placeholder-gray-800"
                            placeholder="e.g. Jason Obawemimo"
                         />
                    </div>
                    
                    <div className="group text-center">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-3">Secure Email</label>
                         <input 
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-black/50 border-b border-white/10 py-3 px-4 text-white text-center focus:border-xlnc-gold focus:outline-none transition-all text-sm placeholder-gray-800"
                            placeholder="e.g. jobawems@gmail.com"
                         />
                    </div>

                    <div className="group text-center">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-3">Password</label>
                         <input 
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-black/50 border-b border-white/10 py-3 px-4 text-white text-center focus:border-xlnc-gold focus:outline-none transition-all text-sm placeholder-gray-800"
                            placeholder="••••••••"
                         />
                    </div>
                </div>

                {status === 'ERROR' && (
                    <div className="flex items-center justify-center gap-2 text-status-alert text-[10px] font-bold uppercase tracking-widest bg-status-alert/10 p-3 border border-status-alert/20 animate-fade-in text-center">
                        <AlertCircle size={12} /> {errorMessage}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={status === 'VERIFYING' || status === 'SUCCESS'}
                    className={`w-full py-5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-500 flex items-center justify-center gap-2 shadow-lg
                        ${status === 'SUCCESS' 
                            ? 'bg-status-success text-white hover:bg-status-success cursor-default'
                            : isMasterOverride 
                                ? 'bg-xlnc-gold text-black hover:bg-white shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                : 'bg-white text-black hover:bg-xlnc-gold hover:text-black'
                        }
                    `}
                >
                    {status === 'VERIFYING' && <Loader2 className="animate-spin" />}
                    {status === 'SUCCESS' && <><CheckCircle2 size={14} /> Protocol Accepted</>}
                    {status === 'IDLE' && (isMasterOverride ? <><Terminal size={14} /> Execute Override</> : <><Shield size={14} /> Initialize Account</>)}
                    {status === 'ERROR' && "Retry Uplink"}
                </button>

                <div className="text-center border-t border-white/5 pt-8">
                     <p className="text-[9px] text-gray-600 tracking-wide">
                        By initiating this protocol, you agree to the Terms of Dominion.
                        <br/>Unauthorized access attempts are logged.
                     </p>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
