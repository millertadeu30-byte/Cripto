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
    const msg = error?.message || error?.toString() || '';
    
    // Ignore DOM mutation errors caused by Google Translate or browser extensions
    const isDomOrTranslateError = 
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("NotFoundError") ||
      msg.includes("not a child of this node") ||
      msg.includes("Failed to execute") ||
      msg.includes("Loading chunk") ||
      msg.includes("dynamically imported module");

    if (isDomOrTranslateError) {
      console.warn("ErrorBoundary ignorou erro não-crítico do tradutor/DOM:", msg);
      return { hasError: false };
    }

    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Erro capturado pelo ErrorBoundary:", error, errorInfo);
    
    const msg = error?.message || error?.toString() || '';
    const isDomOrTranslateError = 
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("NotFoundError") ||
      msg.includes("not a child of this node") ||
      msg.includes("Failed to execute") ||
      msg.includes("Loading chunk") ||
      msg.includes("dynamically imported module");

    if (isDomOrTranslateError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  private handleDismiss = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleFullReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
    this.setState({ hasError: false, error: undefined });
    window.location.href = window.location.origin + window.location.pathname + '?reset=' + Date.now();
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
              O aplicativo detectou um evento de atualização do navegador. Clique abaixo para carregar o painel diretamente.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={this.handleDismiss}
                className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                🚀 Abrir Painel Binance Agora
              </button>
              <button
                onClick={this.handleReset}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recarregar Página
              </button>
              <button
                onClick={this.handleFullReset}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2 px-4 rounded-xl text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                🧹 Limpar Cache & Unregister SW
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
