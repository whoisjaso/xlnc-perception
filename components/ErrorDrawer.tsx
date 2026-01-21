import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, RefreshCw, Check, Clock, Server } from 'lucide-react';
import { useErrorStore } from '../src/stores/useErrorStore';
import { divineApi, ErrorLogEntry } from '../src/services/divine';
import { useAuthStore } from '../src/stores/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ErrorDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { errors, isLoading, setErrors, setLoading, setStats, clearUnread } = useErrorStore();
  const { user } = useAuthStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.clientId) {
      loadErrors();
      loadStats();
      clearUnread();
    }
  }, [isOpen, user?.clientId]);

  const loadErrors = async () => {
    try {
      setLoading(true);
      const { errors } = await divineApi.getClientErrors(20, false);
      setErrors(errors);
    } catch (error) {
      console.error('Failed to load errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { stats } = await divineApi.getClientErrorStats(24);
      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleAcknowledge = async (errorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setAcknowledging(errorId);
      await divineApi.acknowledgeError(errorId);
      // Update local state
      setErrors(errors.map(err =>
        err.id === errorId ? { ...err, context: { ...err.context, acknowledged: true } } : err
      ));
    } catch (error) {
      console.error('Failed to acknowledge:', error);
    } finally {
      setAcknowledging(null);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'error':
        return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
      default:
        return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle size={14} className="text-red-500" />;
      case 'error':
        return <AlertTriangle size={14} className="text-orange-500" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-yellow-500" />;
      default:
        return <Server size={14} className="text-blue-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  // Don't show if user has no client
  if (!user?.clientId) {
    return (
      <div className="fixed right-0 top-12 bottom-32 w-96 bg-xlnc-black border-l border-white/10 z-40 flex flex-col shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-sm font-bold text-white uppercase tracking-wider">System Issues</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-gray-500 text-sm text-center">
            Your account is not linked to a client.<br />
            Contact support to enable error monitoring.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-12 bottom-32 w-96 bg-xlnc-black border-l border-white/10 z-40 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} className="text-yellow-500" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">System Issues</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadErrors}
            className="text-gray-500 hover:text-white p-1 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Error List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {isLoading && errors.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-gray-500" />
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-12">
            <Check size={32} className="text-emerald-500 mx-auto mb-3" />
            <div className="text-sm text-white font-medium">All Systems Operational</div>
            <div className="text-[10px] text-gray-500 mt-1">No issues detected in the last 24 hours</div>
          </div>
        ) : (
          errors.map((error) => {
            const isAcknowledged = (error.context as any)?.acknowledged;
            return (
              <div
                key={error.id}
                className={`border ${getSeverityStyle(error.severity)} p-3 cursor-pointer transition-all hover:bg-white/5 ${isAcknowledged ? 'opacity-60' : ''}`}
                onClick={() => setExpandedId(expandedId === error.id ? null : error.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getSeverityIcon(error.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{error.service}</div>
                      <div className="text-[10px] text-gray-500 truncate">{error.operation}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] text-gray-500 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(error.createdAt)}
                    </span>
                    {expandedId === error.id ? (
                      <ChevronUp size={12} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={12} className="text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedId === error.id && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    <div className="text-[11px] text-gray-400 bg-black/30 p-2 font-mono break-words">
                      {error.errorMessage}
                    </div>

                    <div className="flex items-center gap-2 text-[9px] text-gray-500">
                      <span className={`px-1.5 py-0.5 uppercase font-bold ${getSeverityStyle(error.severity)}`}>
                        {error.severity}
                      </span>
                      <span>|</span>
                      <span>{error.errorType}</span>
                    </div>

                    {!isAcknowledged && (
                      <button
                        onClick={(e) => handleAcknowledge(error.id, e)}
                        disabled={acknowledging === error.id}
                        className="text-[9px] font-bold uppercase px-2 py-1 border border-white/20 text-gray-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {acknowledging === error.id ? 'Acknowledging...' : 'Acknowledge'}
                      </button>
                    )}

                    {isAcknowledged && (
                      <div className="text-[9px] text-gray-500 flex items-center gap-1">
                        <Check size={10} />
                        Acknowledged
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {errors.length > 0 && (
        <div className="p-3 border-t border-white/10 text-[10px] text-gray-500 text-center">
          Showing {errors.length} unresolved {errors.length === 1 ? 'issue' : 'issues'}
        </div>
      )}
    </div>
  );
};

export default ErrorDrawer;
