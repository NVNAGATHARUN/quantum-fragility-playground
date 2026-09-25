import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Quantum Lens Uncaught Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[500px] flex items-center justify-center p-24">
          <div className="max-w-xl w-full p-32 rounded-2xl bg-slate-900/90 border border-rose-500/30 shadow-2xl shadow-rose-950/40 text-center flex flex-col items-center gap-20 backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-2xl text-rose-400 font-mono">
              ⚠️
            </div>

            <div>
              <h2 className="text-xl font-orbitron font-bold text-white tracking-wide">
                Quantum Decoherence Detected
              </h2>
              <p className="text-xs text-slate-400 mt-6 font-mono">
                An unexpected component anomaly occurred. Quantum state isolation has contained the fault.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full text-left bg-black/60 border border-slate-800 rounded-lg p-12 overflow-x-auto text-[11px] font-mono text-rose-300 max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-12 mt-8">
              <button
                onClick={this.handleReset}
                className="px-20 py-10 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20"
              >
                Reset to Safe State
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-20 py-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
              >
                Reload Simulation
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
