import React, { useEffect, useState } from 'react';

interface Props {
  active: boolean;
  messages: string[];
  onComplete?: () => void;
  duration?: number;
}

const OperationalLoader: React.FC<Props> = ({ active, messages, onComplete, duration = 3000 }) => {
  const [currentMessage, setCurrentMessage] = useState(messages[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
        setProgress(0);
        return;
    }

    const stepTime = duration / messages.length;
    let msgIndex = 0;
    
    const msgInterval = setInterval(() => {
      msgIndex++;
      if (msgIndex < messages.length) {
        setCurrentMessage(messages[msgIndex]);
      }
    }, stepTime);

    const progInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
                clearInterval(progInterval);
                return 100;
            }
            return prev + (100 / (duration / 50));
        });
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
      if (onComplete) onComplete();
    }, duration + 500);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
      clearTimeout(timeout);
    };
  }, [active, messages, duration, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-500">
      <div className="w-full max-w-md p-12 flex flex-col items-center space-y-8">
        
        {/* Divine Circle Loader */}
        <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-[1px] border-white/10 rounded-full"></div>
            <div className="absolute inset-0 border-t-[1px] border-xlnc-gold rounded-full animate-spin duration-[2s]"></div>
            <div className="absolute inset-4 border-[1px] border-white/5 rounded-full"></div>
            <div className="absolute inset-4 border-b-[1px] border-xlnc-gold/50 rounded-full animate-spin duration-[3s] direction-reverse"></div>
        </div>

        <div className="space-y-3 text-center w-full">
          <p className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.3em] animate-pulse">
            {currentMessage}
          </p>
        </div>

        {/* Minimalist Progress Line */}
        <div className="w-32 h-[1px] bg-gray-800 overflow-hidden">
          <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default OperationalLoader;