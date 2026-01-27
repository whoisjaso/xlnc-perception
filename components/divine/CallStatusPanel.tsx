// Divine Agentic Intelligence System - Real-time Call Status Panel
// Displays active and recent calls via WebSocket

import React from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useCallSocket, ActiveCall, CallEvent } from '../../src/hooks/useCallSocket';

interface CallStatusPanelProps {
  clientId?: string; // Optional filter by client
  showRecent?: boolean; // Show recent ended calls
  maxRecent?: number; // Max recent calls to show (default 5)
}

const CallStatusPanel: React.FC<CallStatusPanelProps> = ({
  clientId,
  showRecent = true,
  maxRecent = 5
}) => {
  const { activeCalls, recentCalls, isConnected, reconnect } = useCallSocket();

  // Filter by clientId if provided
  const filteredActive = clientId
    ? activeCalls.filter(c => c.clientId === clientId)
    : activeCalls;
  const filteredRecent = clientId
    ? recentCalls.filter(c => c.clientId === clientId).slice(0, maxRecent)
    : recentCalls.slice(0, maxRecent);

  const formatDuration = (ms?: number): string => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const getTimeSince = (timestamp: string): string => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Phone size={18} className="text-xlnc-gold" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Call Status</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-[9px] uppercase ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
            {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
          <button
            onClick={reconnect}
            className="text-gray-500 hover:text-white transition-colors p-1"
            title="Reconnect"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Active Calls */}
      <div className="mb-4">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Active Calls ({filteredActive.length})
        </div>

        {filteredActive.length === 0 ? (
          <div className="text-center py-4 text-gray-600 border border-dashed border-white/10">
            <Phone size={20} className="mx-auto mb-2 opacity-30" />
            <div className="text-[10px]">No active calls</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActive.map((call) => (
              <div key={call.callId} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  {call.direction === 'outbound' ? (
                    <PhoneOutgoing size={14} className="text-emerald-500" />
                  ) : (
                    <PhoneIncoming size={14} className="text-emerald-500" />
                  )}
                  <div>
                    <div className="text-sm text-white font-medium">
                      ***{call.phone || '????'}
                    </div>
                    <div className="text-[9px] text-gray-500">
                      {call.direction || 'inbound'} | {call.clientId}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-500">
                  <Clock size={10} />
                  {getTimeSince(call.startedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Calls */}
      {showRecent && (
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            Recent Calls
          </div>

          {filteredRecent.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              <div className="text-[10px]">No recent calls</div>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRecent.map((call) => (
                <div key={call.callId} className="flex items-center justify-between p-2 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2">
                    <PhoneOff size={12} className="text-gray-500" />
                    <span className="text-[11px] text-gray-400">***{call.phone || '????'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{formatDuration(call.durationMs)}</span>
                    <span>{getTimeSince(call.timestamp)}</span>
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

export default CallStatusPanel;
