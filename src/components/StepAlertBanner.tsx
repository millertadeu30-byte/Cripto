import React from 'react';
import { Bell, BellRing, Check, AlertTriangle, ArrowUpRight, ArrowDownRight, X, Volume2, Sparkles } from 'lucide-react';
import { StepAlertPayload } from '../utils/notifications';

interface StepAlertBannerProps {
  activeAlert: StepAlertPayload | null;
  onDismiss: () => void;
  permission: NotificationPermission | 'unsupported';
  onRequestPermission: () => void;
  stepPercent: number;
  onTestAlert: () => void;
}

export default function StepAlertBanner({
  activeAlert,
  onDismiss,
  permission,
  onRequestPermission,
  stepPercent = 9,
  onTestAlert
}: StepAlertBannerProps) {
  return (
    <div className="space-y-2">
      {/* 1. In-App Pop-up Alert when a coin hits multiple of 9% */}
      {activeAlert && (
        <div 
          className={`p-4 rounded-2xl border-2 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top duration-300 ${
            activeAlert.actualPnlPercent >= 0
              ? 'bg-gradient-to-r from-[#0d2818] via-[#143b23] to-[#0d2818] border-[#0ecb81] text-white ring-4 ring-emerald-500/20'
              : 'bg-gradient-to-r from-[#330f14] via-[#4d161e] to-[#330f14] border-[#f6465d] text-white ring-4 ring-red-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl shrink-0 ${
              activeAlert.actualPnlPercent >= 0 ? 'bg-emerald-500/20 text-[#0ecb81]' : 'bg-red-500/20 text-[#f6465d]'
            }`}>
              {activeAlert.actualPnlPercent >= 0 ? (
                <ArrowUpRight className="w-6 h-6 animate-bounce" />
              ) : (
                <ArrowDownRight className="w-6 h-6 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base font-mono">
                  {activeAlert.symbol}
                </span>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                  activeAlert.actualPnlPercent >= 0
                    ? 'bg-emerald-400 text-black border-emerald-300'
                    : 'bg-red-500 text-white border-red-400'
                }`}>
                  {activeAlert.actualPnlPercent >= 0 ? `🎯 Meta de +${activeAlert.tier * activeAlert.stepPercent}% Atingida!` : `⚠️ Queda de ${activeAlert.tier * activeAlert.stepPercent}%!`}
                </span>
              </div>
              <p className="text-xs text-gray-200 mt-1 font-sans">
                {activeAlert.actualPnlPercent >= 0 ? 'Lucro de' : 'Prejuízo de'}{' '}
                <strong className={`font-mono text-sm ${activeAlert.actualPnlPercent >= 0 ? 'text-[#0ecb81]' : 'text-red-300'}`}>
                  {activeAlert.actualPnlPercent >= 0 ? '+' : ''}{activeAlert.actualPnlPercent.toFixed(2)}% ({activeAlert.pnlValueFormatted})
                </strong>{' '}
                • Preço Atual: <strong className="font-mono">{activeAlert.currentPrice} {activeAlert.currency}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={onDismiss}
              className="bg-black/40 hover:bg-black/60 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-white/10"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dispensar</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Push Notification Activation / Status Bar */}
      <div className="bg-[#181a20] border border-gray-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            permission === 'granted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/30'
          }`}>
            {permission === 'granted' ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white">
                Sistema de Notificações no Celular a cada {stepPercent}% (9%, 18%, 27%...)
              </span>
              {permission === 'granted' ? (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ativado & Monitorando
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded font-extrabold border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Requer Permissão
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-sans mt-0.5">
              Notifica com som, vibração e aviso na tela sempre que qualquer investimento atingir múltiplos de 9% (+9%, +18%, +27% / -9%, -18%).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={onTestAlert}
            className="bg-[#1e2026] hover:bg-[#282b33] border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Simular disparo de alerta de 9% para testar som e aviso"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#f0b90b]" />
            <span>Testar Alerta 9%</span>
          </button>

          {permission !== 'granted' && (
            <button
              type="button"
              onClick={onRequestPermission}
              className="bg-[#f0b90b] hover:bg-[#e0a800] text-black px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 animate-pulse"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Ativar no Celular</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
