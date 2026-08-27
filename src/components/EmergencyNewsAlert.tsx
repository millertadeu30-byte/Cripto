import React from 'react';
import { AlertTriangle, ExternalLink, ShieldAlert, X, Zap } from 'lucide-react';

export interface EmergencyAlertData {
  id: string;
  symbol: string;
  coinName: string;
  headline: string;
  summary: string;
  timestamp: string;
  severity: 'URGENT_SELL' | 'HIGH_RISK';
}

interface EmergencyNewsAlertProps {
  alert: EmergencyAlertData | null;
  onDismiss: () => void;
  onOpenTradeModal?: (symbol: string) => void;
}

export default function EmergencyNewsAlert({
  alert,
  onDismiss,
  onOpenTradeModal
}: EmergencyNewsAlertProps) {
  if (!alert) return null;

  const binanceSpotUrl = `https://www.binance.com/pt-BR/trade/${alert.symbol}?type=spot`;

  return (
    <div className="fixed top-2 left-2 right-2 sm:left-auto sm:right-4 sm:top-4 z-50 max-w-xl w-full animate-bounce-once shadow-2xl">
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-[#1e1014] border-2 border-red-500 rounded-2xl p-4 sm:p-5 text-white shadow-red-950/80 ring-4 ring-red-500/30">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-red-500/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600 rounded-xl text-white animate-pulse shrink-0 shadow-lg shadow-red-600/50">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                  🚨 ALERTA URGENTE DE ÚLTIMA HORA
                </span>
                <span className="text-red-300 text-xs font-mono font-bold">
                  {alert.timestamp}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 leading-tight">
                Notícia de Queda Confirmada: {alert.coinName} ({alert.symbol})
              </h3>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-red-900/50 transition-colors shrink-0"
            title="Fechar Alerta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-3 space-y-2">
          <p className="text-xs sm:text-sm text-red-100 font-bold leading-relaxed bg-black/40 p-2.5 rounded-xl border border-red-500/30">
            "{alert.headline}"
          </p>
          <p className="text-[11px] sm:text-xs text-red-200/90 leading-relaxed">
            {alert.summary}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-red-500/30">
          <button
            onClick={onDismiss}
            className="px-3 py-2 text-xs font-bold text-red-200 hover:text-white bg-red-950/80 hover:bg-red-900 rounded-xl border border-red-500/40 transition-all text-center cursor-pointer"
          >
            Ignorar por enquanto
          </button>

          {onOpenTradeModal && (
            <button
              onClick={() => {
                onOpenTradeModal(alert.symbol);
                onDismiss();
              }}
              className="px-3.5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 rounded-xl shadow-lg shadow-red-600/40 border border-red-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current text-yellow-300" />
              <span>REGISTRAR VENDA NO APP</span>
            </button>
          )}

          <a
            href={binanceSpotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-black text-black bg-yellow-400 hover:bg-yellow-300 rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>⚡ VENDER AGORA NA BINANCE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
