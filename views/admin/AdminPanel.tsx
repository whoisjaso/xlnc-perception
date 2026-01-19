
import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Server, ShieldAlert, Activity, Search, Lock, UserCheck, Trash2, Key, RefreshCw, Copy, Loader } from 'lucide-react';
import { adminApi, type User, type Stats } from '../../src/services/admin';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemStatus, setSystemStatus] = useState('NORMAL' as 'NORMAL' | 'LOCKDOWN');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Key Generator State
  const [generatedKey, setGeneratedKey] = useState(null as string | null);
  const [keyType, setKeyType] = useState('ADMIN' as 'STANDARD' | 'ADMIN');

  // Load users and stats on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [usersData, statsData] = await Promise.all([
        adminApi.getUsers({ limit: 100 }),
        adminApi.getStats(),
      ]);
      setUsers(usersData.users);
      setStats(statsData.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
      console.error('Admin panel error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handlePurgeUser = async (id: string) => {
    if (window.confirm("CONFIRM PURGE: This will permanently delete the user's neural profile from the matrix.")) {
      try {
        await adminApi.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
      } catch (err) {
        alert(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  const handleRoleToggle = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const newIsAdmin = !user.isAdmin;
    const newPlan = newIsAdmin ? 'EMPIRE' : user.plan; // Upgrade to EMPIRE if promoting to admin

    try {
      await adminApi.updateUser(id, { isAdmin: newIsAdmin, plan: newPlan });
      setUsers(prev => prev.map(u => {
        if (u.id === id) {
          return { ...u, isAdmin: newIsAdmin, plan: newPlan };
        }
        return u;
      }));
    } catch (err) {
      alert(`Failed to update user role: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const generateAccessKey = () => {
      const prefix = keyType === 'ADMIN' ? 'XLNC-ROOT-' : 'XLNC-STD-';
      // Generate cryptographically looking segments
      const seg1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const seg2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const seg3 = Math.floor(1000 + Math.random() * 9000); // 4 digit number
      
      const newKey = `${prefix}${seg1}-${seg2}-${seg3}`;
      setGeneratedKey(newKey);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Visual feedback could be added here, but simplicity is preferred for admin tools
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-12 h-full flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <Loader size={48} className="text-xlnc-gold animate-spin mx-auto mb-4" />
          <div className="text-gray-500 text-sm uppercase tracking-widest">Loading Overwatch Console...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-12 h-full flex items-center justify-center bg-[#050505]">
        <div className="text-center max-w-md">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <div className="text-white text-lg mb-2">Access Denied</div>
          <div className="text-gray-500 text-sm mb-4">{error}</div>
          <button
            onClick={loadData}
            className="bg-xlnc-gold/10 hover:bg-xlnc-gold/20 border border-xlnc-gold/30 text-xlnc-gold px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 h-full overflow-y-auto custom-scrollbar bg-[#050505]">
        {/* Header */}
        <div className="flex justify-between items-end mb-12 border-b border-red-900/30 pb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert size={20} className="text-red-500" />
                    <span className="text-red-500 font-mono text-xs uppercase tracking-[0.3em] font-bold">Restricted Environment</span>
                </div>
                <h1 className="text-4xl font-serif text-white">Overwatch Console</h1>
            </div>
            <div className="flex gap-4">
                 <button
                    onClick={loadData}
                    className="bg-blue-900/20 border border-blue-900/50 text-blue-500 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-blue-900/50 transition-all flex items-center gap-2"
                 >
                     <RefreshCw size={12} /> Refresh Data
                 </button>
                 {systemStatus === 'NORMAL' ? (
                     <button
                        onClick={() => setSystemStatus('LOCKDOWN')}
                        className="bg-red-900/20 border border-red-900/50 text-red-500 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-900/50 transition-all flex items-center gap-2"
                     >
                         <Lock size={12} /> Initiate Lockdown
                     </button>
                 ) : (
                    <button
                        onClick={() => setSystemStatus('NORMAL')}
                        className="bg-emerald-900/20 border border-emerald-900/50 text-emerald-500 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-emerald-900/50 transition-all flex items-center gap-2"
                    >
                        <UserCheck size={12} /> Restore Access
                    </button>
                 )}
            </div>
        </div>

        {/* God Mode Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden group hover:border-red-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={48} className="text-xlnc-gold" />
                </div>
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Global MRR</div>
                <div className="text-3xl font-serif text-white">${stats?.mrr.toLocaleString() || 0}</div>
                <div className="text-[10px] text-gray-500 mt-2">Monthly Recurring Revenue</div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden group hover:border-red-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={48} className="text-blue-500" />
                </div>
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Total Users</div>
                <div className="text-3xl font-serif text-white">{stats?.totalUsers || 0}</div>
                <div className="text-[10px] text-gray-500 mt-2">Admins: {stats?.adminCount || 0}</div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden group hover:border-red-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Server size={48} className="text-purple-500" />
                </div>
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Total Calls</div>
                <div className="text-3xl font-serif text-white">{stats?.totalCalls.toLocaleString() || 0}</div>
                <div className="text-[10px] text-gray-500 mt-2">Across all users</div>
            </div>

             <div className="bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden group hover:border-red-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={48} className="text-emerald-500" />
                </div>
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Retell Users</div>
                <div className="text-3xl font-serif text-white">{stats?.retellUsers || 0}</div>
                <div className="text-[10px] text-gray-500 mt-2">Users with Retell AI configured</div>
            </div>
        </div>

        {/* User Manifest */}
        <div className="bg-[#0A0A0A] border border-white/5 p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-serif text-white flex items-center gap-3">
                    <Users size={16} className="text-gray-500" /> User Manifest
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="SEARCH DATABASE" 
                        className="bg-black border border-white/10 pl-10 pr-4 py-2 text-[10px] font-bold tracking-widest text-white focus:border-red-500/50 focus:outline-none w-64 transition-all"
                    />
                </div>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-[9px] font-bold text-gray-600 uppercase border-b border-white/5">
                        <th className="pb-4 pl-4 tracking-[0.2em]">Identity</th>
                        <th className="pb-4 tracking-[0.2em]">Clearance</th>
                        <th className="pb-4 tracking-[0.2em]">Status</th>
                        <th className="pb-4 tracking-[0.2em] text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <td className="py-4 pl-4">
                                <div className="text-sm text-white font-bold">{u.name}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                            </td>
                            <td className="py-4">
                                <button
                                    onClick={() => handleRoleToggle(u.id)}
                                    className={`text-[9px] font-bold px-2 py-1 border cursor-pointer hover:bg-white/10 transition-all ${
                                        u.isAdmin ? 'border-red-500/30 text-red-500 bg-red-500/5' :
                                        u.plan === 'EMPIRE' ? 'border-xlnc-gold/30 text-xlnc-gold bg-xlnc-gold/5' :
                                        'border-gray-700 text-gray-500'
                                    }`}
                                    title="Click to Toggle Authority Level"
                                >
                                    {u.plan} {u.isAdmin ? '// ROOT' : '// USER'} <RefreshCw size={8} className="inline ml-1 opacity-50" />
                                </button>
                            </td>
                            <td className="py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-mono uppercase text-gray-400">
                                        {u.hasRetellConfig ? 'RETELL ACTIVE' : 'ACTIVE'}
                                    </span>
                                </div>
                            </td>
                            <td className="py-4 text-right pr-4">
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handlePurgeUser(u.id)}
                                        className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border border-red-900/30 px-2 py-1 hover:bg-red-900/20"
                                        title="Purge Database Record"
                                    >
                                        <Trash2 size={12} /> PURGE
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* System Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0A0A0A] border border-white/5 p-6">
                 <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Mark's Corner (Tech)</h3>
                 <div className="space-y-3">
                     <div className="flex justify-between items-center p-3 bg-white/5 border border-white/5">
                         <span className="text-xs text-gray-300">Redis Cache</span>
                         <button className="text-[9px] text-red-500 font-bold uppercase hover:text-white border border-transparent hover:border-red-500 px-2 py-1">Purge</button>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-white/5 border border-white/5">
                         <span className="text-xs text-gray-300">Node Clusters</span>
                         <button className="text-[9px] text-neon-cyan font-bold uppercase hover:text-white border border-transparent hover:border-neon-cyan px-2 py-1">Rebalance</button>
                     </div>
                 </div>
            </div>

            <div className="bg-[#0A0A0A] border border-xlnc-gold/20 p-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-xlnc-gold/50"></div>
                 <h3 className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Key size={14} /> Access Key Forge
                 </h3>
                 
                 <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={() => setKeyType('ADMIN')}
                            className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest border transition-colors ${keyType === 'ADMIN' ? 'border-xlnc-gold bg-xlnc-gold text-black' : 'border-white/10 text-gray-500 hover:text-white'}`}
                        >
                            Admin Root
                        </button>
                        <button 
                            onClick={() => setKeyType('STANDARD')}
                            className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest border transition-colors ${keyType === 'STANDARD' ? 'border-xlnc-gold bg-xlnc-gold text-black' : 'border-white/10 text-gray-500 hover:text-white'}`}
                        >
                            Standard User
                        </button>
                    </div>

                     <div className="p-4 bg-black border border-white/10 min-h-[60px] flex items-center justify-between relative group">
                         {generatedKey ? (
                             <>
                                <span className="font-mono text-white text-sm tracking-wider">{generatedKey}</span>
                                <button 
                                    onClick={() => copyToClipboard(generatedKey)} 
                                    className="text-gray-500 hover:text-xlnc-gold transition-colors p-2"
                                    title="Copy to Clipboard"
                                >
                                    <Copy size={14} />
                                </button>
                             </>
                         ) : (
                             <span className="text-xs text-gray-600 font-mono">AWAITING GENERATION PROTOCOL...</span>
                         )}
                     </div>
                     <button 
                        onClick={generateAccessKey}
                        className="w-full py-3 bg-white/5 text-white border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-all shadow-lg"
                     >
                        Generate {keyType} Key
                     </button>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default AdminPanel;
