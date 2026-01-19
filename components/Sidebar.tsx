
import React from 'react';
import { LayoutDashboard, Bot, BarChart3, Radio, Network, Sliders, ShieldAlert, Mic, User, Brain } from 'lucide-react';
import { ViewState, UserProfile } from '../types';

interface Props {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  user: UserProfile | null;
}

const Sidebar: React.FC<Props> = ({ currentView, onChangeView, user }) => {
  const navItems = [
    { id: ViewState.COMMAND_CENTER, label: 'Overview', icon: LayoutDashboard },
    { id: ViewState.REALITY_FORGE, label: 'Agent Forge', icon: Bot },
    { id: ViewState.RETELL_SETUP, label: 'Voice Uplink', icon: Mic },
    { id: ViewState.CALL_INTELLIGENCE, label: 'Intelligence', icon: Radio },
    { id: ViewState.WORKFLOW_MATRIX, label: 'Workflow', icon: Network },
    { id: ViewState.NEURAL_SETTINGS, label: 'Settings', icon: Sliders },
  ];

  return (
    <div id="sidebar-nav" className="w-64 bg-xlnc-card border-r border-white/5 flex flex-col h-screen z-30 relative">
      <div className="p-8 border-b border-white/5">
        <h1 className="text-3xl font-serif font-bold tracking-widest text-white">
          XLNC
        </h1>
        <div className="text-[9px] text-xlnc-gold font-medium mt-2 tracking-[0.2em] uppercase">
          Sovereign OS v2.1
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm transition-all duration-500 group
              ${currentView === item.id 
                ? 'bg-white/5 text-white' 
                : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'
              }
            `}
          >
            <item.icon size={16} className={`${currentView === item.id ? 'text-xlnc-gold' : 'text-gray-600 group-hover:text-gray-400 transition-colors'}`} strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-medium">{item.label}</span>
            
            {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-xlnc-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]"></div>
            )}
          </button>
        ))}

        {user?.isAdmin && (
          <div className="pt-6 mt-6 border-t border-white/5">
             <div className="px-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Administration</div>
             <button
                onClick={() => onChangeView(ViewState.DIVINE_DASHBOARD)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm transition-all duration-500 group mb-1
                  ${currentView === ViewState.DIVINE_DASHBOARD
                    ? 'bg-xlnc-gold/10 text-xlnc-gold border border-xlnc-gold/30'
                    : 'text-gray-500 hover:text-xlnc-gold hover:bg-xlnc-gold/5'
                  }
                `}
              >
                <Brain size={16} className={`${currentView === ViewState.DIVINE_DASHBOARD ? 'text-xlnc-gold' : 'text-gray-600 group-hover:text-xlnc-gold transition-colors'}`} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Divine AI</span>
            </button>
             <button
                onClick={() => onChangeView(ViewState.ADMIN_PANEL)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-sm transition-all duration-500 group
                  ${currentView === ViewState.ADMIN_PANEL
                    ? 'bg-red-900/20 text-red-500 border border-red-900/30'
                    : 'text-gray-500 hover:text-red-400 hover:bg-red-900/10'
                  }
                `}
              >
                <ShieldAlert size={16} className={`${currentView === ViewState.ADMIN_PANEL ? 'text-red-500' : 'text-gray-600 group-hover:text-red-500 transition-colors'}`} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-[0.15em] font-medium">Overwatch</span>
            </button>
          </div>
        )}
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/20">
        {user && (
           <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-gray-400 shrink-0">
                  <User size={14} />
              </div>
              <div className="overflow-hidden">
                  <div className="text-white font-bold text-[11px] truncate">{user.name}</div>
                  <div className="text-[9px] text-xlnc-gold uppercase tracking-widest">{user.plan}</div>
              </div>
           </div>
        )}
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_5px_rgba(76,175,80,0.4)]"></div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">System Nominal</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
