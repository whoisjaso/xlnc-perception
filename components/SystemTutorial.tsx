
import React, { useState, useEffect } from 'react';
import { ChevronRight, Target, X, HelpCircle } from 'lucide-react';
import { ViewState } from '../types';

interface Step {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  relatedView?: ViewState;
}

interface Props {
  onComplete: () => void;
  onChangeView?: (view: ViewState) => void;
}

const TUTORIAL_STEPS: Step[] = [
  {
    targetId: 'ROOT', // Special ID for center screen
    title: 'System Initialized',
    content: 'Welcome, Operator. Your Neural Command Console is online. This interface is designed for total control. Let us calibrate your perception.',
    position: 'center',
    relatedView: ViewState.COMMAND_CENTER
  },
  {
    targetId: 'sidebar-nav',
    title: 'Navigation Matrix',
    content: 'This is your primary switchboard. Access your Agent Forge, Call Intelligence, and Workflow settings from here. Mastery of navigation is mastery of the system.',
    position: 'right',
    relatedView: ViewState.COMMAND_CENTER
  },
  {
    targetId: 'cmd-metrics',
    title: 'Vital Signs',
    content: 'Real-time telemetry of your empire. These counters currently read ZERO. Your objective is to increase "Capital Preserved" and "Conversion Rate" through automation.',
    position: 'bottom',
    relatedView: ViewState.COMMAND_CENTER
  },
  {
    targetId: 'cmd-chart',
    title: 'Performance Velocity',
    content: 'This visualizer tracks your dominance over time. As agents process calls, you will see the data curve upwards. Flatlines are unacceptable.',
    position: 'top',
    relatedView: ViewState.COMMAND_CENTER
  },
  {
    targetId: 'cmd-feed',
    title: 'Neural Stream',
    content: 'The heartbeat of the system. Every decision, interaction, and transaction your AI agents perform is logged here in real-time. Trust, but verify.',
    position: 'left',
    relatedView: ViewState.COMMAND_CENTER
  },
  // --- Reality Forge Steps ---
  {
    targetId: 'rf-identity-input',
    title: 'Identity Matrix',
    content: 'We have navigated to the Reality Forge. Begin by defining the identity of your Construct. This name will be the vessel for your automated authority.',
    position: 'bottom',
    relatedView: ViewState.REALITY_FORGE
  },
  {
    targetId: 'rf-generate-btn',
    title: 'Manifestation Protocol',
    content: 'Once your psychological parameters are set, engage the Reality Engine. This button utilizes the LLM to architect a hypnotic script pattern instantly. Click to manifest.',
    position: 'top',
    relatedView: ViewState.REALITY_FORGE
  },
  // --- Call Intelligence Steps ---
  {
    targetId: 'ci-search-bar',
    title: 'Signal Filtering',
    content: 'Welcome to Intelligence. Use this search array to isolate specific interactions by keyword, phone number, or sentiment resonance.',
    position: 'bottom',
    relatedView: ViewState.CALL_INTELLIGENCE
  },
  {
    targetId: 'ci-call-list',
    title: 'Interaction Ledger',
    content: 'This matrix displays every conversation handled by your agents. Click any row to expand the neural transcript and view the AI\'s decision logic.',
    position: 'top',
    relatedView: ViewState.CALL_INTELLIGENCE
  },
  // --- Conclusion ---
  {
    targetId: 'cmd-action',
    title: 'Initiate Protocol',
    content: 'We return to Command. You are now capable. Click "Initialize Protocol" when you are ready to deploy your first agent and begin the harvest.',
    position: 'bottom',
    relatedView: ViewState.COMMAND_CENTER
  }
];

const SystemTutorial: React.FC<Props> = ({ onComplete, onChangeView }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Effect: Handle View Switching and Rect Calculation
  useEffect(() => {
    // 1. Switch View if needed
    if (currentStep.relatedView && onChangeView) {
        onChangeView(currentStep.relatedView);
    }

    // 2. Find Target with Scroll Logic
    const updatePosition = () => {
      if (currentStep.targetId === 'ROOT') {
        setTargetRect(null);
        setIsCalculated(true);
        return;
      }

      // Wait for view transition to render DOM elements
      setTimeout(() => {
        const element = document.getElementById(currentStep.targetId);
        if (element) {
            // Scroll element into view to ensure target is visible
            element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
            
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
            setIsCalculated(true);
        } else {
            // Fallback if element not found
            console.warn(`Tutorial target ${currentStep.targetId} not found`);
            setTargetRect(null);
            setIsCalculated(true);
        }
      }, 600); // Time for route transition animations
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStepIndex, currentStep.targetId, currentStep.relatedView, onChangeView]);

  const handleNext = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setIsCalculated(false);
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const gap = 24;
    const tooltipWidth = 340;
    const tooltipHeight = 220; // Adjusted height approximation

    switch (currentStep.position) {
      case 'right':
        return {
          top: targetRect.top,
          left: targetRect.right + gap,
        };
      case 'left':
        return {
          top: targetRect.top,
          left: targetRect.left - tooltipWidth - gap,
        };
      case 'bottom':
        return {
          top: targetRect.bottom + gap,
          left: targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
        };
      case 'top':
        return {
          top: targetRect.top - tooltipHeight - gap,
          left: targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  if (!isCalculated) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto font-sans">
      
      {/* Spotlight Mask */}
      {targetRect ? (
        <div className="absolute inset-0 transition-all duration-500 ease-out"
             style={{
               background: 'rgba(0,0,0,0.85)',
               clipPath: `polygon(
                 0% 0%, 
                 0% 100%, 
                 100% 100%, 
                 100% 0%, 
                 ${targetRect.left}px 0%, 
                 ${targetRect.left}px ${targetRect.top}px, 
                 ${targetRect.right}px ${targetRect.top}px, 
                 ${targetRect.right}px ${targetRect.bottom}px, 
                 ${targetRect.left}px ${targetRect.bottom}px, 
                 ${targetRect.left}px 0%
               )`
             }}>
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-all duration-500"></div>
      )}

      {/* Target Highlight Border */}
      {targetRect && (
        <div 
          className="absolute border border-xlnc-gold shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-300 ease-out pointer-events-none rounded-sm animate-pulse"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
            {/* Tech Corners */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white bg-xlnc-gold/0"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white bg-xlnc-gold/0"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white bg-xlnc-gold/0"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white bg-xlnc-gold/0"></div>
        </div>
      )}

      {/* Tutorial Card */}
      <div 
        className="absolute w-[340px] bg-xlnc-card border border-white/10 shadow-2xl transition-all duration-500 ease-out flex flex-col z-[101]"
        style={getTooltipPosition() as React.CSSProperties}
      >
        {/* Header */}
        <div className="bg-white/5 p-4 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Target size={14} className="text-xlnc-gold animate-pulse" />
                <span className="text-[10px] font-bold text-xlnc-gold uppercase tracking-[0.2em]">
                    System Guidance
                </span>
            </div>
            <span className="text-[9px] text-gray-500 font-mono">
                {currentStepIndex + 1} / {TUTORIAL_STEPS.length}
            </span>
        </div>

        {/* Content */}
        <div className="p-6 relative overflow-hidden">
            {/* Background Tech Lines */}
            <div className="absolute top-0 right-0 w-20 h-20 border-t border-r border-white/5 rounded-tr-3xl"></div>
            
            <h3 className="text-xl font-serif text-white mb-3 relative z-10">{currentStep.title}</h3>
            <p className="text-sm text-gray-400 font-light leading-relaxed mb-8 relative z-10">
                {currentStep.content}
            </p>

            <div className="flex justify-between items-center relative z-10">
                <button 
                    onClick={onComplete}
                    className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-1"
                >
                    <X size={10} /> Dismiss
                </button>
                <button 
                    onClick={handleNext}
                    className="group flex items-center gap-2 bg-xlnc-gold text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                    {currentStepIndex === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
      </div>

    </div>
  );
};

export default SystemTutorial;
