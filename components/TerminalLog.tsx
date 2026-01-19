
import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';
import { SystemLog } from '../types';

interface Props {
  logs: SystemLog[];
}

const TerminalLog: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef(null as HTMLDivElement | null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-32 bg-xlnc-dark border-t border-xlnc-border pointer-events-none select-none z-40 opacity-80">
      <div className="absolute top-0 left-0 bg-cyan-500/20 px-2 py-1 text-[10px] font-mono text-cyan-500 uppercase border-b border-r border-cyan-500/30 flex items-center gap-2">
        <Terminal size={10} />
        <span>System Kernel Stream</span>
      </div>
      <div className="h-full overflow-hidden p-4 pt-8 font-mono text-xs space-y-1">
        {logs.slice(-5).map((log) => (
          <div key={log.id} className="flex gap-4 opacity-70 hover:opacity-100 transition-opacity">
            <span className="text-gray-500">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'CRITICAL' ? 'text-status-danger' : ''}
              ${log.type === 'SUCCESS' ? 'text-status-success' : ''}
              ${log.type === 'INFO' ? 'text-cyan-500' : ''}
              ${log.type === 'WARN' ? 'text-yellow-500' : ''}
            `}>
              {log.type}
            </span>
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TerminalLog;
