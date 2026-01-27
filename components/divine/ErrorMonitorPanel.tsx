// Divine Agentic Intelligence System - Error Monitor Panel
// Real-time error monitoring and resolution

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Loader,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { divineApi, ErrorStats, ErrorLogEntry } from '../../src/services/divine';

interface ErrorMonitorPanelProps {
  clientId?: string;
}

const ErrorMonitorPanel: React.FC<ErrorMonitorPanelProps> = ({ clientId }) => {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<Set<string>>(new Set());
  const [showResolved, setShowResolved] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168;
      const [statsData, errorsData] = await Promise.all([
        divineApi.getErrorStats(hours),
        showResolved ? divineApi.getRecentErrors(50) : divineApi.getUnresolvedErrors(),
      ]);
      setStats(statsData.stats);

      // Filter by clientId if provided
      const filteredErrors = clientId
        ? errorsData.errors.filter((e: ErrorLogEntry) => e.clientId === clientId)
        : errorsData.errors;
      setErrors(filteredErrors);
    } catch (error) {
      console.error('Failed to load error data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [showResolved, timeRange, clientId]);

  const handleResolve = async (errorId: string) => {
    setResolving((prev) => new Set(prev).add(errorId));
    try {
      await divineApi.resolveError(errorId);
      await loadData();
    } catch (error) {
      console.error('Failed to resolve error:', error);
    } finally {
      setResolving((prev) => {
        const next = new Set(prev);
        next.delete(errorId);
        return next;
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'error': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'info': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle size={14} />;
      case 'error': return <AlertCircle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'info': return <Info size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Error Monitor</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <div className="flex border border-white/10">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-[9px] font-bold uppercase transition-colors ${
                  timeRange === range
                    ? 'bg-xlnc-gold/20 text-xlnc-gold'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {range}
              </button>
            ))}
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

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-white">{stats.total}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Total ({timeRange === '7d' ? '7 days' : timeRange})</div>
          </div>
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-red-500">{stats.bySeverity['critical'] || 0}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Critical</div>
          </div>
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-orange-500">{stats.bySeverity['error'] || 0}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Errors</div>
          </div>
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-yellow-500">{stats.bySeverity['warning'] || 0}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Warnings</div>
          </div>
        </div>
      )}

      {/* By Service */}
      {stats && Object.keys(stats.byService).length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Errors by Service</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byService).map(([service, count]) => (
              <span
                key={service}
                className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 text-gray-400"
              >
                {service}: <span className="text-white font-bold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-8 h-4 rounded-full transition-colors ${showResolved ? 'bg-xlnc-gold' : 'bg-white/20'}`}>
            <div className={`w-3 h-3 rounded-full bg-white transform transition-transform mt-0.5 ${showResolved ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Show Resolved</span>
        </label>
      </div>

      {/* Errors List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading && errors.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="text-xlnc-gold animate-spin" />
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
            <div className="text-sm text-gray-500">No unresolved errors</div>
          </div>
        ) : (
          errors.map((error) => (
            <div
              key={error.id}
              className={`border bg-white/[0.02] hover:bg-white/[0.04] transition-all ${
                error.resolved ? 'border-white/5 opacity-60' : 'border-white/10'
              }`}
            >
              <div
                className="p-3 cursor-pointer"
                onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 border ${getSeverityColor(error.severity)}`}>
                      {getSeverityIcon(error.severity)}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{error.service}</div>
                      <div className="text-[10px] text-gray-500">{error.operation}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {error.resolved && (
                      <span className="flex items-center gap-1 text-[9px] text-emerald-500 uppercase">
                        <CheckCircle size={10} /> Resolved
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500">
                      {new Date(error.createdAt).toLocaleTimeString()}
                    </span>
                    {expandedError === error.id ? (
                      <ChevronUp size={14} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedError === error.id && (
                <div className="border-t border-white/5 p-3 space-y-3">
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase mb-1">Error Message</div>
                    <div className="text-sm text-red-400 bg-red-500/5 p-2 border border-red-500/20">
                      {error.errorMessage}
                    </div>
                  </div>

                  {error.stackTrace && (
                    <div>
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Stack Trace</div>
                      <pre className="text-[10px] text-gray-400 bg-black/50 p-2 overflow-x-auto max-h-32">
                        {error.stackTrace}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-gray-500">
                    {error.clientId && <span>Client: {error.clientId}</span>}
                    {error.errorType && <span>Type: {error.errorType}</span>}
                  </div>

                  {/* Resolve Button */}
                  {!error.resolved && (
                    <div className="pt-2 border-t border-white/5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResolve(error.id); }}
                        disabled={resolving.has(error.id)}
                        className="flex items-center gap-1 text-[9px] font-bold uppercase px-3 py-1.5 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-all"
                      >
                        {resolving.has(error.id) ? (
                          <Loader size={10} className="animate-spin" />
                        ) : (
                          <Check size={10} />
                        )}
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ErrorMonitorPanel;
