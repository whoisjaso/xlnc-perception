import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error logging service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-xlnc-bg flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="opulent-card p-12 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-status-alert/20 blur-2xl"></div>
                  <AlertTriangle size={64} className="text-status-alert relative z-10" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-serif text-white mb-4">
                System Disruption Detected
              </h1>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                The sovereignty matrix encountered an unexpected anomaly.
                Our neural engineers have been notified and are investigating the disturbance.
              </p>

              {/* Error Details (Development Mode) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 text-left">
                  <div className="bg-black/50 border border-red-900/30 rounded p-6">
                    <div className="text-xs font-mono text-red-400 mb-2">
                      ERROR: {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <details className="mt-4">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">
                          Stack Trace
                        </summary>
                        <div className="mt-3 text-[10px] text-gray-600 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                          {this.state.errorInfo.componentStack}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReload}
                  className="bg-xlnc-gold/10 hover:bg-xlnc-gold/20 border border-xlnc-gold/30 text-xlnc-gold px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300"
                >
                  Restore System
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300"
                >
                  Return Home
                </button>
              </div>

              {/* Support Info */}
              <div className="mt-12 pt-8 border-t border-white/5">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                  If this persists, contact{' '}
                  <a href="mailto:support@xlnc.com" className="text-xlnc-gold hover:text-xlnc-gold-light transition-colors">
                    sovereign.support@xlnc.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
