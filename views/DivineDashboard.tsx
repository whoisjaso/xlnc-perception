// Divine Agentic Intelligence System - Main Dashboard
// Unified control center for AI-powered voice automation

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  MessageSquare,
  AlertTriangle,
  Phone,
  Users,
  TrendingUp,
  Activity,
  Settings,
  RefreshCw,
  Loader,
  ChevronRight
} from 'lucide-react';
import {
  DivineStatusWidget,
  MessageQueueViewer,
  ErrorMonitorPanel,
  PRISMAnalytics
} from '../components/divine';
import { divineApi, ErrorStats, Conversation } from '../src/services/divine';

type DashboardTab = 'overview' | 'queue' | 'errors' | 'analytics' | 'clients';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const DivineDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [recentCalls, setRecentCalls] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorData, setErrorData] = useState<{ stats: ErrorStats } | null>(null);

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const [statusData, queueData, errorData, conversationsData] = await Promise.all([
        divineApi.getSystemStatus(),
        divineApi.getQueueStats(),
        divineApi.getErrorStats(24),
        divineApi.getRecentConversations(5).catch(() => ({ conversations: [], total: 0 }))
      ]);

      // Build quick stats from the data
      const stats: QuickStat[] = [
        {
          label: 'Messages Queued',
          value: queueData.stats.pending + queueData.stats.processing,
          icon: <MessageSquare size={18} />,
          color: 'text-blue-500',
          trend: 'neutral'
        },
        {
          label: 'Messages Sent (24h)',
          value: queueData.stats.sent,
          icon: <Zap size={18} />,
          color: 'text-emerald-500',
          trend: 'up',
          trendValue: '+12%'
        },
        {
          label: 'Unresolved Errors',
          value: statusData.errors.unresolved,
          icon: <AlertTriangle size={18} />,
          color: statusData.errors.unresolved > 0 ? 'text-red-500' : 'text-gray-500',
          trend: statusData.errors.unresolved > 0 ? 'up' : 'neutral'
        },
        {
          label: 'Active Services',
          value: `${Object.values(statusData.services).filter(v => v === true).length}/6`,
          icon: <Activity size={18} />,
          color: 'text-xlnc-gold',
          trend: 'neutral'
        }
      ];

      setQuickStats(stats);
      setErrorData(errorData);
      setRecentCalls(conversationsData.conversations);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Brain size={14} /> },
    { id: 'queue', label: 'Message Queue', icon: <MessageSquare size={14} /> },
    { id: 'errors', label: 'Error Monitor', icon: <AlertTriangle size={14} /> },
    { id: 'analytics', label: 'PRISM Analytics', icon: <TrendingUp size={14} /> },
    { id: 'clients', label: 'Client Config', icon: <Users size={14} /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A0A0A] border border-white/5 p-5 relative overflow-hidden group hover:border-white/10 transition-all"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">
                    {stat.label}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-serif text-white">{stat.value}</div>
                    {stat.trendValue && (
                      <span className={`text-[10px] font-bold ${
                        stat.trend === 'up' ? 'text-emerald-500' :
                        stat.trend === 'down' ? 'text-red-500' :
                        'text-gray-500'
                      }`}>
                        {stat.trendValue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status */}
              <DivineStatusWidget />

              {/* Recent Activity */}
              <div className="bg-[#0A0A0A] border border-white/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Phone size={18} className="text-xlnc-gold" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Call Activity</h3>
                </div>

                <div className="space-y-3">
                  {recentCalls.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <Phone size={32} className="mx-auto mb-3 opacity-30" />
                      <div className="text-sm">No recent calls</div>
                      <div className="text-[10px] mt-1">Calls will appear here as they are processed</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentCalls.map((call: Conversation) => (
                        <div key={call.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              call.status === 'completed' ? 'bg-emerald-500' :
                              call.status === 'in_progress' ? 'bg-amber-500 animate-pulse' :
                              'bg-gray-500'
                            }`} />
                            <div>
                              <div className="text-sm text-white">
                                {call.intent || 'Unknown Intent'}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {call.durationMs ? `${Math.round(call.durationMs / 1000)}s` : 'In Progress'}
                                {call.sentiment && ` • ${call.sentiment}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {new Date(call.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full Width Error Summary */}
            <div className="bg-[#0A0A0A] border border-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-red-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Error Summary</h3>
                </div>
                <button
                  onClick={() => setActiveTab('errors')}
                  className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                >
                  View All <ChevronRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/5">
                  <div className="text-2xl font-bold text-red-500">
                    {errorData?.stats?.bySeverity?.critical || 0}
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase mt-1">Critical</div>
                </div>
                <div className="text-center p-4 bg-white/5">
                  <div className="text-2xl font-bold text-orange-500">
                    {errorData?.stats?.bySeverity?.error || 0}
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase mt-1">Errors</div>
                </div>
                <div className="text-center p-4 bg-white/5">
                  <div className="text-2xl font-bold text-yellow-500">
                    {errorData?.stats?.bySeverity?.warning || 0}
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase mt-1">Warnings</div>
                </div>
                <div className="text-center p-4 bg-white/5">
                  <div className="text-2xl font-bold text-emerald-500">
                    {errorData?.stats?.total || 0}
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase mt-1">Total (24h)</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'queue':
        return <MessageQueueViewer />;

      case 'errors':
        return <ErrorMonitorPanel />;

      case 'analytics':
        return <PRISMAnalytics />;

      case 'clients':
        return <ClientConfigPanel />;

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 h-full flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <Loader size={48} className="text-xlnc-gold animate-spin mx-auto mb-4" />
          <div className="text-gray-500 text-sm uppercase tracking-widest">Initializing Divine System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-[#050505]">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b border-xlnc-gold/20 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Brain size={20} className="text-xlnc-gold" />
            <span className="text-xlnc-gold font-mono text-xs uppercase tracking-[0.3em] font-bold">
              Agentic Intelligence
            </span>
          </div>
          <h1 className="text-4xl font-serif text-white">Divine System</h1>
          <p className="text-gray-500 text-sm mt-2">
            AI-powered voice automation and behavioral intelligence
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="bg-white/5 border border-white/10 text-gray-400 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="bg-xlnc-gold/10 border border-xlnc-gold/30 text-xlnc-gold px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-xlnc-gold hover:text-black transition-all flex items-center gap-2">
            <Settings size={12} /> Configure
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-wider border transition-all ${
              activeTab === tab.id
                ? 'border-xlnc-gold bg-xlnc-gold/10 text-xlnc-gold'
                : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

// Client Configuration Panel Component
const ClientConfigPanel: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const data = await divineApi.getAllClients();
      setClients(data.clients);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClient = async () => {
    if (!editingClient) return;
    try {
      setIsSaving(true);
      await divineApi.updateClient(editingClient.client_id, editingClient);
      await loadClients();
      setEditingClient(null);
    } catch (error) {
      console.error('Failed to save client:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateEditingField = (field: string, value: any) => {
    setEditingClient((prev: any) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={24} className="text-xlnc-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={18} className="text-xlnc-gold" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client Configurations</h3>
        </div>
        <button
          onClick={() => loadClients()}
          className="text-[10px] text-gray-400 font-bold uppercase tracking-wider border border-white/10 px-4 py-2 hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10">
          <Users size={32} className="text-gray-700 mx-auto mb-3" />
          <div className="text-sm text-gray-500 mb-2">No Clients Configured</div>
          <div className="text-[10px] text-gray-600">
            Add client JSON files to backend/config/clients/
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <div
              key={client.client_id}
              className={`border bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer ${
                selectedClient === client.client_id ? 'border-xlnc-gold/30' : 'border-white/5'
              }`}
              onClick={() => setSelectedClient(selectedClient === client.client_id ? null : client.client_id)}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-xlnc-gold font-bold text-sm">
                    {(client.business_name || client.client_id).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{client.business_name}</div>
                    <div className="text-[10px] text-gray-500">{client.client_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[9px] font-bold uppercase px-2 py-1 border ${
                    client.retell_agent_id
                      ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                      : 'border-gray-500/30 text-gray-500 bg-gray-500/10'
                  }`}>
                    {client.retell_agent_id ? 'Voice AI Active' : 'No Agent'}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`text-gray-500 transition-transform ${selectedClient === client.client_id ? 'rotate-90' : ''}`}
                  />
                </div>
              </div>

              {selectedClient === client.client_id && (
                <div className="border-t border-white/5 p-4 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Industry</div>
                      <div className="text-sm text-white">{client.industry || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Timezone</div>
                      <div className="text-sm text-white">{client.timezone}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-500 uppercase mb-1">Owner</div>
                      <div className="text-sm text-white">{client.owner_name || 'Not set'}</div>
                    </div>
                  </div>

                  {/* Integration Status */}
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase mb-2">Integrations</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 border border-white/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-gray-400 uppercase">Retell Agent</span>
                          <span className={`w-2 h-2 rounded-full ${client.retell_agent_id ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                        </div>
                        <div className="text-[11px] text-white font-mono truncate">
                          {client.retell_agent_id || 'Not configured'}
                        </div>
                      </div>
                      <div className="bg-black/30 border border-white/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-gray-400 uppercase">Zoho Calendar</span>
                          <span className={`w-2 h-2 rounded-full ${client.zoho_calendar_id && !client.zoho_calendar_id.includes('REPLACE') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </div>
                        <div className="text-[11px] text-white font-mono truncate">
                          {client.zoho_calendar_id && !client.zoho_calendar_id.includes('REPLACE')
                            ? client.zoho_calendar_id
                            : 'Needs configuration'}
                        </div>
                      </div>
                      <div className="bg-black/30 border border-white/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-gray-400 uppercase">Zoho CRM</span>
                          <span className={`w-2 h-2 rounded-full ${client.zoho_crm_enabled ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                        </div>
                        <div className="text-[11px] text-white">
                          {client.zoho_crm_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div className="bg-black/30 border border-white/5 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-gray-400 uppercase">SMS Provider</span>
                          <span className={`w-2 h-2 rounded-full ${client.sms_enabled ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                        </div>
                        <div className="text-[11px] text-white uppercase">
                          {client.sms_provider || 'txt180'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Flags */}
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase mb-2">Features</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'appointment_booking_enabled', label: 'Booking' },
                        { key: 'ai_followup_enabled', label: 'AI Followup' },
                        { key: 'prism_analysis_enabled', label: 'PRISM Analysis' },
                        { key: 'human_transfer_enabled', label: 'Transfer' },
                        { key: 'sms_enabled', label: 'SMS' },
                        { key: 'email_enabled', label: 'Email' },
                      ].map(({ key, label }) => (
                        <span
                          key={key}
                          className={`text-[9px] px-2 py-1 border ${
                            client[key]
                              ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                              : 'border-gray-500/20 text-gray-500 bg-gray-500/5'
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions Preview */}
                  {client.special_instructions && (
                    <div>
                      <div className="text-[9px] text-gray-500 uppercase mb-2">Special Instructions</div>
                      <div className="text-[11px] text-gray-400 bg-black/30 border border-white/5 p-3 line-clamp-2">
                        {client.special_instructions}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingClient(client); }}
                      className="text-[9px] font-bold uppercase px-3 py-1.5 border border-xlnc-gold/30 text-xlnc-gold hover:bg-xlnc-gold/10 transition-all"
                    >
                      Edit Config
                    </button>
                    <button className="text-[9px] font-bold uppercase px-3 py-1.5 border border-white/10 text-gray-400 hover:bg-white/5 transition-all">
                      View Logs
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setEditingClient(null)}>
          <div className="bg-[#0A0A0A] border border-xlnc-gold/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="border-b border-white/10 p-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A] z-10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Client: {editingClient.business_name}</h3>
              <button onClick={() => setEditingClient(null)} className="text-gray-500 hover:text-white">
                <ChevronRight size={18} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info Section */}
              <div>
                <div className="text-[10px] text-xlnc-gold uppercase tracking-wider mb-3">Basic Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase block mb-1">Business Name</label>
                    <input
                      type="text"
                      value={editingClient.business_name || ''}
                      onChange={e => updateEditingField('business_name', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase block mb-1">Owner Name</label>
                    <input
                      type="text"
                      value={editingClient.owner_name || ''}
                      onChange={e => updateEditingField('owner_name', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase block mb-1">Industry</label>
                    <input
                      type="text"
                      value={editingClient.industry || ''}
                      onChange={e => updateEditingField('industry', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase block mb-1">Timezone</label>
                    <input
                      type="text"
                      value={editingClient.timezone || ''}
                      onChange={e => updateEditingField('timezone', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Integrations Section */}
              <div>
                <div className="text-[10px] text-xlnc-gold uppercase tracking-wider mb-3">Integrations</div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase block mb-1">Retell Agent ID</label>
                    <input
                      type="text"
                      value={editingClient.retell_agent_id || ''}
                      onChange={e => updateEditingField('retell_agent_id', e.target.value)}
                      placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white font-mono focus:border-xlnc-gold/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 uppercase block mb-1">Zoho Calendar ID</label>
                    <input
                      type="text"
                      value={editingClient.zoho_calendar_id || ''}
                      onChange={e => updateEditingField('zoho_calendar_id', e.target.value)}
                      placeholder="Enter your Zoho Calendar ID"
                      className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white font-mono focus:border-xlnc-gold/50 outline-none"
                    />
                    <p className="text-[9px] text-gray-600 mt-1">Find this in Zoho Calendar Settings &gt; Calendar Details</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingClient.zoho_crm_enabled || false}
                        onChange={e => updateEditingField('zoho_crm_enabled', e.target.checked)}
                        className="w-4 h-4 accent-xlnc-gold"
                      />
                      <span className="text-sm text-white">Enable Zoho CRM</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div>
                <div className="text-[10px] text-xlnc-gold uppercase tracking-wider mb-3">Features</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'appointment_booking_enabled', label: 'Appointment Booking' },
                    { key: 'ai_followup_enabled', label: 'AI Follow-up Messages' },
                    { key: 'prism_analysis_enabled', label: 'PRISM Analysis' },
                    { key: 'human_transfer_enabled', label: 'Human Transfer' },
                    { key: 'sms_enabled', label: 'SMS Notifications' },
                    { key: 'email_enabled', label: 'Email Notifications' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer bg-black/30 border border-white/5 p-3">
                      <input
                        type="checkbox"
                        checked={editingClient[key] || false}
                        onChange={e => updateEditingField(key, e.target.checked)}
                        className="w-4 h-4 accent-xlnc-gold"
                      />
                      <span className="text-sm text-white">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <div className="text-[10px] text-xlnc-gold uppercase tracking-wider mb-3">Special Instructions</div>
                <textarea
                  value={editingClient.special_instructions || ''}
                  onChange={e => updateEditingField('special_instructions', e.target.value)}
                  rows={4}
                  placeholder="Add any special instructions for the AI agent..."
                  className="w-full bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:border-xlnc-gold/50 outline-none resize-none"
                />
              </div>
            </div>

            <div className="border-t border-white/10 p-4 flex justify-end gap-3 sticky bottom-0 bg-[#0A0A0A]">
              <button
                onClick={() => setEditingClient(null)}
                className="text-[10px] font-bold uppercase px-4 py-2 border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClient}
                disabled={isSaving}
                className="text-[10px] font-bold uppercase px-4 py-2 bg-xlnc-gold text-black hover:bg-xlnc-gold/90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader size={12} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DivineDashboard;
