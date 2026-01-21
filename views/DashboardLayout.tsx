
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TerminalLog from '../components/TerminalLog';
import CommandCenter from './CommandCenter';
import RealityForge from './RealityForge';
import CallIntelligence from './CallIntelligence';
import AdminPanel from './admin/AdminPanel';
import RetellSetup from './RetellSetup';
import DivineDashboard from './DivineDashboard';
import SystemTutorial from '../components/SystemTutorial';
import SovereignChat from '../components/SovereignChat';
import ErrorNotificationBadge from '../components/ErrorNotificationBadge';
import ErrorDrawer from '../components/ErrorDrawer';
import { useErrorSocket } from '../src/hooks/useErrorSocket';
import { ViewState, SystemLog, UserProfile } from '../types';
import { LogOut, User, HelpCircle } from 'lucide-react';

interface Props {
    onLogout: () => void;
    user: UserProfile | null;
    onboardingActive?: boolean;
}

const DashboardLayout: React.FC<Props> = ({ onLogout, user, onboardingActive = false }) => {
  const [currentView, setCurrentView] = useState(ViewState.COMMAND_CENTER as ViewState);
  const [logs, setLogs] = useState([] as SystemLog[]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasStartedTutorial, setHasStartedTutorial] = useState(false);
  const [showErrorDrawer, setShowErrorDrawer] = useState(false);

  // Initialize WebSocket connection for real-time error updates
  useErrorSocket();

  // Determine starting view
  useEffect(() => {
    if (user?.isAdmin) {
        // Admins can start anywhere, but Command Center is standard
    }
  }, [user]);

  // Manage Tutorial Trigger - Disabled auto-show, user can click Tutorial button
  // useEffect(() => {
  //   if (!onboardingActive && !hasStartedTutorial) {
  //       const timer = setTimeout(() => {
  //           setShowTutorial(true);
  //           setHasStartedTutorial(true);
  //       }, 1500); // Small delay after onboarding closes to allow for clean transition
  //       return () => clearTimeout(timer);
  //   }
  // }, [onboardingActive, hasStartedTutorial]);

  // Helper to add logs with a unique ID and timestamp
  const addLog = (message: string, type: SystemLog['type'] = 'INFO') => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: timeString,
      message,
      type
    }]);
  };

  // Initial Startup "Theater"
  useEffect(() => {
    const startupSequence = [
      { msg: "Initializing XLNC Kernel...", type: 'INFO', delay: 500 },
      { msg: "Connecting to Revenue Matrix...", type: 'INFO', delay: 1200 },
      { msg: "Bypassing Firewall Protocols...", type: 'WARN', delay: 2000 },
      { msg: `Identity Verified: ${user?.name || 'Operator'}`, type: 'SUCCESS', delay: 2800 },
      { msg: user?.isAdmin ? "Clearance Level: OMEGA (Admin)" : "Clearance Level: SOVEREIGN", type: 'SUCCESS', delay: 3500 },
    ];

    startupSequence.forEach(({ msg, type, delay }) => {
      setTimeout(() => addLog(msg, type as any), delay);
    });
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewState.COMMAND_CENTER:
        return <CommandCenter />;
      case ViewState.REALITY_FORGE:
        return <RealityForge addLog={addLog} />;
      case ViewState.RETELL_SETUP:
        return <RetellSetup addLog={addLog} />;
      case ViewState.CALL_INTELLIGENCE:
        return <CallIntelligence />;
      case ViewState.ADMIN_PANEL:
        // Security check in render
        return user?.isAdmin ? <AdminPanel /> : <CommandCenter />;
      case ViewState.DIVINE_DASHBOARD:
        // Divine system requires admin access
        return user?.isAdmin ? <DivineDashboard /> : <CommandCenter />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 font-mono">
            <div className="bg-xlnc-panel border border-xlnc-border p-8 max-w-md text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-status-danger/50"></div>
                <div className="text-4xl mb-4 opacity-20 font-bold">ACCESS DENIED</div>
                <h2 className="text-xl text-white mb-2 font-bold">MODULE LOCKED</h2>
                <p className="text-sm mb-6">This neural sector requires Level 5 Clearance (Sovereign Tier).</p>
                <button 
                    onClick={() => addLog('Access Request Denied. Upgrade Required.', 'CRITICAL')}
                    className="border border-status-danger text-status-danger px-6 py-2 text-xs uppercase tracking-widest hover:bg-status-danger hover:text-white transition-colors"
                >
                    Request Unlock
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-xlnc-bg text-white overflow-hidden selection:bg-cyan-500 selection:text-black">
      {showTutorial && (
        <SystemTutorial 
            onComplete={() => setShowTutorial(false)} 
            onChangeView={setCurrentView} 
        />
      )}
      
      <Sidebar currentView={currentView} onChangeView={setCurrentView} user={user} />
      
      <main className="flex-1 relative flex flex-col h-full">
        {/* Top Status Bar */}
        <div className="h-12 border-b border-xlnc-border flex items-center justify-between px-6 bg-xlnc-black/50 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${user?.isAdmin ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Network: Secure</span>
            </div>
            <div className="h-4 w-[1px] bg-xlnc-border"></div>
            <div className="text-[10px] font-mono text-gray-500 uppercase">
                Lat: 24ms
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Error Notification Badge - shows when there are issues */}
            {user?.clientId && (
              <ErrorNotificationBadge onClick={() => setShowErrorDrawer(true)} />
            )}

            <button
                onClick={() => setShowTutorial(true)}
                className="text-gray-500 hover:text-xlnc-gold transition-colors flex items-center gap-2"
                title="System Tutorial"
            >
                <HelpCircle size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Tutorial</span>
            </button>
            <div className="flex items-center gap-3">
                <div className={`text-[10px] font-mono uppercase tracking-widest ${user?.isAdmin ? 'text-red-500' : 'text-cyan-500'}`}>
                    {user?.name} // {user?.isAdmin ? 'OVERWATCH' : 'ADMIN'}
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                    <User size={12} />
                </div>
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-white transition-colors" title="Logout">
                <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-xlnc-black to-xlnc-black">
          {/* Subtle Grid Background */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }}
          />
          
          {renderView()}

          {/* Floating Chat Widget */}
          <SovereignChat />

          {/* Error Drawer - slide out panel for viewing system issues */}
          <ErrorDrawer isOpen={showErrorDrawer} onClose={() => setShowErrorDrawer(false)} />
        </div>

        <TerminalLog logs={logs} />
      </main>
    </div>
  );
};

export default DashboardLayout;
