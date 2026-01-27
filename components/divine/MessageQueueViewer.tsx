// Divine Agentic Intelligence System - Message Queue Viewer
// Real-time message queue monitoring and management

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  RefreshCw,
  Loader,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { divineApi, QueueMessage, QueueStats } from '../../src/services/divine';
import { useSocketMessages } from '../../src/hooks/useSocketMessages';

const MessageQueueViewer: React.FC = () => {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [failedMessages, setFailedMessages] = useState<QueueMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'failed'>('all');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  // WebSocket real-time updates
  const { stats: wsStats, recentEvents, isConnected, reconnect } = useSocketMessages();

  // Merge WebSocket stats with polled stats (prefer real-time)
  const displayStats = wsStats || stats;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, messagesData, failedData] = await Promise.all([
        divineApi.getQueueStats(),
        divineApi.getQueueMessages({ limit: 50 }),
        divineApi.getFailedMessages(),
      ]);
      setStats(statsData.stats);
      setMessages(messagesData.messages);
      setFailedMessages(failedData.messages);
    } catch (error) {
      console.error('Failed to load queue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (messageId: string) => {
    setRetrying((prev) => new Set(prev).add(messageId));
    try {
      await divineApi.retryMessage(messageId);
      await loadData();
    } catch (error) {
      console.error('Failed to retry message:', error);
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  };

  const handleCancel = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to cancel this message?')) return;
    try {
      await divineApi.cancelMessage(messageId);
      await loadData();
    } catch (error) {
      console.error('Failed to cancel message:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'processing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'failed': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'cancelled': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle size={12} />;
      case 'pending': return <Clock size={12} />;
      case 'processing': return <Loader size={12} className="animate-spin" />;
      case 'failed': return <XCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const displayMessages = activeTab === 'failed' ? failedMessages : messages;

  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare size={18} className="text-xlnc-gold" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Message Queue</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px]">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-gray-500">{isConnected ? 'Live' : 'Disconnected'}</span>
            {!isConnected && (
              <button onClick={reconnect} className="text-xlnc-gold hover:underline">
                Reconnect
              </button>
            )}
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {displayStats && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-yellow-500">{displayStats.pending}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Pending</div>
          </div>
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-blue-500">{displayStats.processing}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Processing</div>
          </div>
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-emerald-500">{displayStats.sent}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Sent</div>
          </div>
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-red-500">{displayStats.failed}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Failed</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
            activeTab === 'all'
              ? 'border-xlnc-gold bg-xlnc-gold/10 text-xlnc-gold'
              : 'border-white/10 text-gray-500 hover:text-white'
          }`}
        >
          All Messages ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab('failed')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all ${
            activeTab === 'failed'
              ? 'border-red-500 bg-red-500/10 text-red-500'
              : 'border-white/10 text-gray-500 hover:text-white'
          }`}
        >
          Failed ({failedMessages.length})
        </button>
      </div>

      {/* Messages List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="text-xlnc-gold animate-spin" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No messages in queue
          </div>
        ) : (
          displayMessages.map((message) => (
            <div
              key={message.id}
              className="border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
            >
              <div
                className="p-3 cursor-pointer"
                onClick={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {message.channel === 'sms' ? (
                      <MessageSquare size={14} className="text-blue-500" />
                    ) : (
                      <Mail size={14} className="text-purple-500" />
                    )}
                    <div>
                      <div className="text-sm text-white font-mono">{message.recipient}</div>
                      <div className="text-[10px] text-gray-500">
                        {message.channel.toUpperCase()} | {new Date(message.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-1 border ${getStatusColor(message.status)}`}>
                      {getStatusIcon(message.status)}
                      {message.status}
                    </span>
                    {expandedMessage === message.id ? (
                      <ChevronUp size={14} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedMessage === message.id && (
                <div className="border-t border-white/5 p-3 space-y-3">
                  {message.subject && (
                    <div>
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Subject</div>
                      <div className="text-sm text-white">{message.subject}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase mb-1">Body</div>
                    <div className="text-sm text-gray-400 bg-black/50 p-2 max-h-24 overflow-y-auto">
                      {message.body.substring(0, 200)}{message.body.length > 200 ? '...' : ''}
                    </div>
                  </div>
                  {message.lastError && (
                    <div>
                      <div className="text-[9px] text-red-500 uppercase mb-1">Error</div>
                      <div className="text-sm text-red-400 bg-red-500/10 p-2">{message.lastError}</div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>Attempts: {message.attempts}/{message.maxAttempts}</span>
                    {message.providerId && <span>| Provider ID: {message.providerId}</span>}
                  </div>

                  {/* Actions */}
                  {(message.status === 'failed' || message.status === 'pending') && (
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      {message.status === 'failed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRetry(message.id); }}
                          disabled={retrying.has(message.id)}
                          className="flex items-center gap-1 text-[9px] font-bold uppercase px-3 py-1.5 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-all"
                        >
                          {retrying.has(message.id) ? (
                            <Loader size={10} className="animate-spin" />
                          ) : (
                            <RotateCcw size={10} />
                          )}
                          Retry
                        </button>
                      )}
                      {message.status === 'pending' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancel(message.id); }}
                          className="flex items-center gap-1 text-[9px] font-bold uppercase px-3 py-1.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={10} />
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Real-time Event Feed */}
      {recentEvents.length > 0 && (
        <div className="bg-black/30 border border-white/5 p-3 mt-4">
          <div className="text-[9px] text-gray-500 uppercase mb-2">Recent Activity (Live)</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recentEvents.slice(0, 10).map((event, idx) => (
              <div key={idx} className="text-[10px] text-gray-400 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  event.status === 'sent' ? 'bg-emerald-500' :
                  event.status === 'failed' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
                <span className="truncate">{event.channel} to ...{event.recipient.slice(-4)} - {event.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageQueueViewer;
