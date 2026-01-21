import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useErrorStore } from '../src/stores/useErrorStore';

interface Props {
  onClick?: () => void;
}

const ErrorNotificationBadge: React.FC<Props> = ({ onClick }) => {
  const { unreadCount, stats } = useErrorStore();

  // Don't show anything if no errors
  if (unreadCount === 0 && (!stats || stats.unresolved === 0)) {
    return null;
  }

  const hasCritical = stats?.critical && stats.critical > 0;
  const displayCount = unreadCount || stats?.unresolved || 0;

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-1.5 border transition-all hover:bg-white/5 ${
        hasCritical
          ? 'border-red-500/30 bg-red-500/10 text-red-400 animate-pulse'
          : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
      }`}
      title={`${displayCount} system ${displayCount === 1 ? 'issue' : 'issues'}`}
    >
      <AlertTriangle size={14} />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {hasCritical ? 'Critical' : 'Issues'}
      </span>
      {displayCount > 0 && (
        <span
          className={`absolute -top-1 -right-1 min-w-4 h-4 text-[9px] font-bold flex items-center justify-center px-1 ${
            hasCritical ? 'bg-red-500' : 'bg-yellow-500'
          } text-black rounded-full`}
        >
          {displayCount > 99 ? '99+' : displayCount}
        </span>
      )}
    </button>
  );
};

export default ErrorNotificationBadge;
