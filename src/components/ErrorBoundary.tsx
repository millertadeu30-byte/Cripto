import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    
    // Auto-recover from Google Translate and DOM mutation errors automatically
    const isDomOrTranslateError = 
      error?.message?.includes("removeChild") ||
      error?.message?.includes("insertBefore") ||
      error?.message?.includes("NotFoundError") ||
      error?.message?.includes("not a child of this node");

    if (isDomOrTranslateError) {
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 100);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleFullReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
    this.setState({ hasError: false, error: undefined });
    window.location.href = window.location.pathname + '?reset=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#181a20] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1e2026] border border-gray-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-yellow-500/10 text-[#f0b90b] rounded-full flex items-center justify-center mx-auto border border-[#f0b90b]/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-sans">Ajuste de Exibição do Painel</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Detectamos uma atualização de dados ou ajuste no navegador. Clique abaixo para reiniciar e atualizar o painel instantaneamente.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" /> Recarregar Painel
              </button>
              <button
                onClick={this.handleFullReset}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2 px-4 rounded-xl text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                🧹 Resetar Dados & Limpar Cache
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
