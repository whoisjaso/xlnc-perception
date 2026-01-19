// Divine Agentic Intelligence System - Status Widget
// Real-time system status display

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  MessageSquare,
  Mail,
  Calendar,
  Bell,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader
} from 'lucide-react';
import { divineApi, DivineSystemStatus } from '../../src/services/divine';

interface ServiceStatusProps {
  name: string;
  icon: React.ReactNode;
  isActive: boolean;
  description?: string;
}

const ServiceStatus: React.FC<ServiceStatusProps> = ({ name, icon, isActive, description }) => (
  <div className={`flex items-center justify-between p-3 border transition-all ${
    isActive
      ? 'border-emerald-500/20 bg-emerald-500/5'
      : 'border-red-500/20 bg-red-500/5'
  }`}>
    <div className="flex items-center gap-3">
      <div className={isActive ? 'text-emerald-500' : 'text-red-500'}>
        {icon}
      </div>
      <div>
        <div className="text-sm text-white font-medium">{name}</div>
        {description && <div className="text-[10px] text-gray-500">{description}</div>}
      </div>
    </div>
    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
  </div>
);

const DivineStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<DivineSystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await divineApi.getSystemStatus();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // Refresh every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getOverallStatusColor = () => {
    if (!status) return 'text-gray-500';
    switch (status.services.overall) {
      case 'operational': return 'text-emerald-500';
      case 'degraded': return 'text-yellow-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getOverallStatusIcon = () => {
    if (!status) return <Activity size={20} />;
    switch (status.services.overall) {
      case 'operational': return <CheckCircle size={20} />;
      case 'degraded': return <AlertTriangle size={20} />;
      case 'down': return <XCircle size={20} />;
      default: return <Activity size={20} />;
    }
  };

  if (isLoading && !status) {
    return (
      <div className="bg-[#0A0A0A] border border-white/5 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader size={24} className="text-xlnc-gold animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="bg-[#0A0A0A] border border-red-500/20 p-6">
        <div className="text-center py-4">
          <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
          <div className="text-sm text-red-400">{error}</div>
          <button
            onClick={loadStatus}
            className="mt-3 text-xs text-gray-400 hover:text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain size={18} className="text-xlnc-gold" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Divine System Status</h3>
        </div>
        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Overall Status */}
      <div className={`flex items-center gap-3 mb-6 p-4 border ${
        status?.services.overall === 'operational'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : status?.services.overall === 'degraded'
          ? 'border-yellow-500/30 bg-yellow-500/5'
          : 'border-red-500/30 bg-red-500/5'
      }`}>
        <div className={getOverallStatusColor()}>
          {getOverallStatusIcon()}
        </div>
        <div>
          <div className={`text-lg font-bold uppercase ${getOverallStatusColor()}`}>
            {status?.services.overall || 'Unknown'}
          </div>
          <div className="text-[10px] text-gray-500">
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </div>
        </div>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <ServiceStatus
          name="Claude AI"
          icon={<Brain size={16} />}
          isActive={status?.services.claude || false}
          description="Intent Classification"
        />
        <ServiceStatus
          name="SMS"
          icon={<MessageSquare size={16} />}
          isActive={status?.services.sms || false}
          description="TXT180 / Twilio"
        />
        <ServiceStatus
          name="Email"
          icon={<Mail size={16} />}
          isActive={status?.services.email || false}
          description="SendGrid"
        />
        <ServiceStatus
          name="Zoho CRM"
          icon={<Server size={16} />}
          isActive={status?.services.zohoCRM || false}
          description="Lead Sync"
        />
        <ServiceStatus
          name="Calendar"
          icon={<Calendar size={16} />}
          isActive={status?.services.zohoCalendar || false}
          description="Zoho Calendar"
        />
        <ServiceStatus
          name="Slack"
          icon={<Bell size={16} />}
          isActive={status?.services.slack || false}
          description="Alerts"
        />
      </div>

      {/* Queue Stats */}
      {status && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-white">{status.queue.pending}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Pending</div>
          </div>
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-yellow-500">{status.queue.processing}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Processing</div>
          </div>
          <div className="bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-red-500">{status.queue.failed}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Failed</div>
          </div>
        </div>
      )}

      {/* Errors Summary */}
      {status && status.errors.unresolved > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20">
          <AlertTriangle size={14} className="text-red-500" />
          <span className="text-xs text-red-400">
            {status.errors.unresolved} unresolved error{status.errors.unresolved !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default DivineStatusWidget;
