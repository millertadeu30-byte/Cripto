import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Bell, Volume2, VolumeX, ShieldAlert, ArrowUpRight, Zap, Play, CheckCircle, ChevronDown, ChevronUp, History, Eye, BarChart3, AlertOctagon } from 'lucide-react';
import TradeHistoryModal, { HistoryItem } from './TradeHistoryModal';

interface AIAdvisorProps {
  countdown: number; // seconds left
  isAnalyzing: boolean;
  activityLogs: string[];
  pnlPerformance: {
    totalWins: number;
    totalLosses: number;
    profitEarnedBrl: number;
  };
  history?: HistoryItem[];
  onDeleteHistoryItem?: (index: number) => void;
  onClearHistory?: () => void;
  usdtBrl?: number;
}

export default function AIAdvisor({
  countdown,
  isAnalyzing,
  activityLogs,
  pnlPerformance,
  history = [],
  onDeleteHistoryItem,
  onClearHistory,
  usdtBrl = 5.62
}: AIAdvisorProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSectionMinimized, setIsSectionMinimized] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const previousCountdown = useRef(countdown);

  // Format countdown seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Open history modal with specific preselected filter
  const handleOpenHistory = (filter: 'all' | 'wins' | 'losses' = 'all') => {
    setHistoryFilter(filter);
    setIsHistoryModalOpen(true);
  };

  // Synthesize a beautiful double alert beep using Web Audio API when sound is enabled
  const triggerAudioAlert = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // First high chime note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      // Second even higher chime note right after
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
        gain2.gain.setValueAtTime(0.12, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      }, 150);

    } catch (err) {
      console.warn("Audio Context blocked by browser auto-play policy until user interaction.", err);
    }
  };

  // Trigger sound when analysis completes or when certain logs appear
  useEffect(() => {
    if (activityLogs.length > 0) {
      const latestLog = activityLogs[0];
      // Play audio chime on critical events (e.g. venda signals, target triggers, or analysis finished)
      if (
        latestLog.includes('🔥') || 
        latestLog.includes('Sinal de VENDA') || 
        latestLog.includes('Reanálise profunda concluída')
      ) {
        triggerAudioAlert();
      }
    }
  }, [activityLogs]);

  // Calculate percentage progress of the 30-min window (1800s total)
  const totalWindow = 1800;
  const percentage = Math.min(100, Math.max(0, (countdown / totalWindow) * 100));

  return (
    <div id="ai-advisor-section" className="bg-[#181a20] rounded-2xl border border-gray-800 p-6 space-y-6 flex flex-col justify-between h-full">
      
      {/* Header with Minimize Toggle */}
      <div>
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#f0b90b]" />
            <h3 className="text-lg font-bold text-white font-sans">Central de Inteligência IA</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                // Trigger a sample beep so the browser registers the user interaction
                if (!soundEnabled) setTimeout(triggerAudioAlert, 50);
              }}
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-all flex items-center gap-1 text-[10px] uppercase font-mono cursor-pointer"
              title={soundEnabled ? "Desativar alertas sonoros" : "Ativar alertas sonoros"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Som Ligado</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Som Mudo</span>
                </>
              )}
            </button>

            {/* Minimize Toggle */}
            <button
              type="button"
              id="toggle-minimize-ai-advisor-btn"
              onClick={() => setIsSectionMinimized(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e2026] hover:bg-[#282b33] border border-gray-700 hover:border-[#f0b90b] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              title={isSectionMinimized ? "Expandir Central de Inteligência" : "Minimizar Central de Inteligência"}
            >
              <span className="text-[11px] font-extrabold text-[#f0b90b]">{isSectionMinimized ? "▴ Expandir Quadro" : "▾ Minimizar"}</span>
              {isSectionMinimized ? <ChevronDown className="w-4 h-4 text-[#f0b90b]" /> : <ChevronUp className="w-4 h-4 text-gray-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsed State Summary */}
      {isSectionMinimized && (
        <div 
          onClick={() => setIsSectionMinimized(false)}
          className="bg-[#14151a] hover:bg-[#1a1d24] border border-gray-800 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <span className="text-gray-300 font-semibold">
              Central IA Minimizada • Próxima varredura em <strong className="text-[#f0b90b] font-mono">{formatTime(countdown)}</strong> ({pnlPerformance.totalWins} acertos)
            </span>
          </div>
          <span className="text-[#f0b90b] text-xs font-bold flex items-center gap-1">
            Clique para ver telemetria <ChevronDown className="w-4 h-4" />
          </span>
        </div>
      )}

      {!isSectionMinimized && (
        <>
          {/* Block 1: Real-time Re-evaluation Clock */}
          <div className="space-y-4">
            {/* Timer UI Card */}
            <div className="bg-[#1e2026] border border-gray-800 rounded-xl p-5 flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block uppercase tracking-wider font-semibold font-sans">Próxima Varredura Geral</span>
                <div className="flex items-baseline gap-2">
                  <span id="countdown-timer-display" className="text-4xl font-extrabold font-mono text-white tracking-tight">
                    {formatTime(countdown)}
                  </span>
                  <span className="text-xs text-[#f0b90b] font-bold animate-pulse">Monitorando 24h</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Estudando livros de ordens e oscilações na Binance de 30 em 30 minutos.
                </p>
              </div>

              {/* Graphical circular progress simulation or simple indicator */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-gray-800"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="stroke-[#f0b90b] transition-all duration-1000"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray="175.92"
                    strokeDashoffset={175.92 - (175.92 * percentage) / 100}
                  />
                </svg>
                <div className="absolute text-[10px] font-bold text-gray-400 font-mono">
                  {Math.round(percentage)}%
                </div>
              </div>
            </div>
          </div>

          {/* Block 2: Profit Realized History Summary (Clickable Cards) */}
          <div className="space-y-3 bg-[#1e2026]/70 p-4 rounded-xl border border-gray-800/80 hover:border-[#f0b90b]/40 transition-all shadow-sm">
            <div className="flex justify-between items-center text-xs">
              <div 
                onClick={() => handleOpenHistory('all')}
                className="flex items-center gap-1.5 text-gray-300 font-bold hover:text-[#f0b90b] cursor-pointer transition-colors"
                title="Clique para ver o relatório completo de operações"
              >
                <History className="w-3.5 h-3.5 text-[#f0b90b]" />
                <span>HISTÓRICO DE ACERTOS DO APP</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenHistory('all')}
                className="text-[11px] text-[#0ecb81] hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 transition-all"
              >
                <Eye className="w-3 h-3" />
                <span>100% Transparente (Ver)</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Wins Card */}
              <button
                type="button"
                id="wins-history-btn"
                onClick={() => handleOpenHistory('wins')}
                className="bg-gray-900/60 hover:bg-emerald-950/40 p-2.5 rounded-xl border border-gray-800/80 hover:border-emerald-500/60 transition-all text-center cursor-pointer group active:scale-95 flex flex-col justify-between"
                title="Clique para ver todas as Vitórias (Lucros)"
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] text-gray-400 group-hover:text-emerald-400 font-bold block transition-colors">VITÓRIAS</span>
                </div>
                <span id="wins-count" className="text-sm sm:text-base font-extrabold text-[#0ecb81] block mt-0.5">
                  {pnlPerformance.totalWins} Trades
                </span>
                <span className="text-[9px] text-emerald-400/70 font-semibold block mt-0.5 group-hover:underline">
                  Ver detalhes ↗
                </span>
              </button>

              {/* Losses Card */}
              <button
                type="button"
                id="losses-history-btn"
                onClick={() => handleOpenHistory('losses')}
                className="bg-gray-900/60 hover:bg-red-950/40 p-2.5 rounded-xl border border-gray-800/80 hover:border-red-500/60 transition-all text-center cursor-pointer group active:scale-95 flex flex-col justify-between"
                title="Clique para ver todas as Derrotas (Stops)"
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] text-gray-400 group-hover:text-red-400 font-bold block transition-colors">DERROTAS</span>
                </div>
                <span id="losses-count" className="text-sm sm:text-base font-extrabold text-gray-300 group-hover:text-red-400 block mt-0.5">
                  {pnlPerformance.totalLosses} Trades
                </span>
                <span className="text-[9px] text-gray-500 group-hover:text-red-400/80 font-semibold block mt-0.5 group-hover:underline">
                  Ver detalhes ↗
                </span>
              </button>

              {/* Profit Realized Card */}
              <button
                type="button"
                id="profit-history-btn"
                onClick={() => handleOpenHistory('all')}
                className="bg-gray-900/60 hover:bg-[#f0b90b]/10 p-2.5 rounded-xl border border-gray-800/80 hover:border-[#f0b90b]/60 transition-all text-center cursor-pointer group active:scale-95 col-span-1 flex flex-col justify-between"
                title="Clique para ver o histórico financeiro e preços"
              >
                <span className="text-[10px] text-gray-400 group-hover:text-[#f0b90b] font-bold block transition-colors">LUCRO REALIZADO</span>
                <span id="profit-earned" className={`text-xs sm:text-sm font-black font-mono block mt-0.5 truncate ${pnlPerformance.profitEarnedBrl >= 0 ? 'text-[#0ecb81]' : 'text-red-400'}`}>
                  {pnlPerformance.profitEarnedBrl >= 0 ? '+' : ''}R$ {pnlPerformance.profitEarnedBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-gray-400 group-hover:text-[#f0b90b] font-semibold block mt-0.5 group-hover:underline">
                  Auditar ↗
                </span>
              </button>
            </div>
          </div>

          {/* Block 3: Scrolling AI Activity Logs */}
          <div className="space-y-3">
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1.5 uppercase font-sans">
              <Zap className="w-3.5 h-3.5 text-[#f0b90b]" /> Telemetria de Ações da IA
            </span>
            <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-900 h-44 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 scrollbar-thin scrollbar-thumb-gray-800">
              {isAnalyzing && (
                <div className="text-yellow-400 animate-pulse flex items-center gap-1">
                  <span>⏳</span>
                  <span>[Processando] Gemini está estudando novos dados da Binance...</span>
                </div>
              )}
              {activityLogs.map((log, i) => {
                // Style differently based on content
                let textColor = 'text-gray-300';
                if (log.includes('🔴') || log.includes('Sinal de VENDA')) textColor = 'text-red-400';
                if (log.includes('🟢') || log.includes('Lucro realizável')) textColor = 'text-green-400';
                if (log.includes('🔄') || log.includes('Reanálise profunda')) textColor = 'text-yellow-400';
                if (log.includes('🛡️')) textColor = 'text-blue-400';
                
                return (
                  <div key={i} className={`border-b border-gray-900 pb-1.5 last:border-b-0 ${textColor}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Detailed Trade History Modal */}
      <TradeHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        pnlPerformance={pnlPerformance}
        initialFilter={historyFilter}
        onDeleteHistoryItem={onDeleteHistoryItem}
        onClearHistory={onClearHistory}
        usdtBrl={usdtBrl}
      />

    </div>
  );
}
