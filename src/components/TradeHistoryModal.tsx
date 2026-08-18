import React, { useState, useMemo } from 'react';
import { 
  X, CheckCircle, AlertOctagon, TrendingUp, TrendingDown, 
  Search, Trash2, Copy, Check, Calendar, Clock, DollarSign,
  ArrowUpRight, ArrowDownRight, Award, ShieldAlert, BarChart3, Filter
} from 'lucide-react';

export interface HistoryItem {
  id?: string;
  symbol: string;
  coinName?: string;
  purchasePrice: number;
  exitPrice: number;
  amount: number;
  totalInvested?: number;
  currency?: 'USDT' | 'BRL';
  purchaseTime?: string;
  exitTime?: string;
  pnlBrl: number;
  finalPnlPercent: number;
  finalPnlValue?: number;
  aiRecommendation?: string;
}

interface TradeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  pnlPerformance: {
    totalWins: number;
    totalLosses: number;
    profitEarnedBrl: number;
  };
  initialFilter?: 'all' | 'wins' | 'losses';
  onDeleteHistoryItem?: (index: number) => void;
  onClearHistory?: () => void;
  usdtBrl?: number;
}

export default function TradeHistoryModal({
  isOpen,
  onClose,
  history = [],
  pnlPerformance,
  initialFilter = 'all',
  onDeleteHistoryItem,
  onClearHistory,
  usdtBrl = 5.62
}: TradeHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'wins' | 'losses'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Sync initial filter when modal is opened from a specific card (Wins vs Losses)
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialFilter);
      setSearchQuery('');
      setConfirmDeleteIndex(null);
      setIsConfirmingClearAll(false);
    }
  }, [isOpen, initialFilter]);

  // Filtered list
  const filteredHistory = useMemo(() => {
    return history
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        const isWin = (item.pnlBrl !== undefined ? item.pnlBrl : ((item.exitPrice - item.purchasePrice) * item.amount)) >= 0;
        
        if (activeTab === 'wins' && !isWin) return false;
        if (activeTab === 'losses' && isWin) return false;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesSymbol = item.symbol.toLowerCase().includes(query);
          const matchesName = item.coinName?.toLowerCase().includes(query);
          return matchesSymbol || matchesName;
        }

        return true;
      });
  }, [history, activeTab, searchQuery]);

  if (!isOpen) return null;

  const totalTrades = history.length;
  const totalWins = pnlPerformance.totalWins;
  const totalLosses = pnlPerformance.totalLosses;
  const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0.0';
  const profitBrl = pnlPerformance.profitEarnedBrl;
  const profitUsd = profitBrl / (usdtBrl || 5.62);

  // Helper date formatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recente';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Helper duration formatter
  const formatDuration = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return null;
    try {
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime();
      if (isNaN(start) || isNaN(end) || end < start) return null;
      const diffMinutes = Math.round((end - start) / (1000 * 60));
      if (diffMinutes < 60) return `${diffMinutes} min`;
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return null;
    }
  };

  // Copy full summary to clipboard
  const handleCopyReport = () => {
    const lines = [
      '📊 RELATÓRIO DE HISTÓRICO DE TRADES',
      `• Total de Operações: ${totalTrades}`,
      `• Vitórias: ${totalWins} | Derrotas: ${totalLosses}`,
      `• Taxa de Acerto (Win Rate): ${winRate}%`,
      `• Lucro Líquido Acumulado: ${profitBrl >= 0 ? '+' : ''}R$ ${profitBrl.toFixed(2)} (${profitUsd >= 0 ? '+' : ''}$${profitUsd.toFixed(2)})`,
      '',
      '--- OPERAÇÕES REALIZADAS ---'
    ];

    history.forEach((h, idx) => {
      const isWin = h.pnlBrl >= 0;
      const curr = h.currency || 'USDT';
      const buyTotal = h.purchasePrice * h.amount;
      const sellTotal = h.exitPrice * h.amount;
      lines.push(
        `#${idx + 1} ${h.symbol} | ${isWin ? '🟢 VITÓRIA' : '🔴 STOP'}`
      );
      lines.push(
        `   Compra: ${h.purchasePrice} ${curr} (Total: ${buyTotal.toFixed(2)} ${curr})`
      );
      lines.push(
        `   Venda: ${h.exitPrice} ${curr} (Total: ${sellTotal.toFixed(2)} ${curr})`
      );
      lines.push(
        `   Resultado: ${isWin ? '+' : ''}R$ ${h.pnlBrl.toFixed(2)} (${isWin ? '+' : ''}${h.finalPnlPercent?.toFixed(2) || '0.00'}%)`
      );
      lines.push('');
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#181a20] border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between bg-[#1e2026]/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f0b90b]/10 rounded-xl text-[#f0b90b] border border-[#f0b90b]/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Histórico Detalhado de Trades & Lucros
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-extrabold border border-emerald-500/30">
                  100% Auditável
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Auditoria completa de compra, venda e resultado obtido em cada operação.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-[#14151a] border-b border-gray-800 shrink-0">
          {/* Card 1: Total Trades */}
          <button
            onClick={() => setActiveTab('all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-gray-800/80 border-[#f0b90b] ring-1 ring-[#f0b90b]' 
                : 'bg-[#1e2026]/60 border-gray-800 hover:bg-[#1e2026]'
            }`}
          >
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Total de Trades</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-white">{totalTrades}</span>
              <span className="text-xs text-gray-500">ordens</span>
            </div>
          </button>

          {/* Card 2: Wins */}
          <button
            onClick={() => setActiveTab('wins')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'wins' 
                ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500' 
                : 'bg-[#1e2026]/60 border-gray-800 hover:bg-[#1e2026]'
            }`}
          >
            <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Vitórias
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-[#0ecb81]">{totalWins}</span>
              <span className="text-xs text-emerald-400/80 font-bold">({winRate}%)</span>
            </div>
          </button>

          {/* Card 3: Losses */}
          <button
            onClick={() => setActiveTab('losses')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'losses' 
                ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500' 
                : 'bg-[#1e2026]/60 border-gray-800 hover:bg-[#1e2026]'
            }`}
          >
            <span className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" /> Derrotas
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-red-400">{totalLosses}</span>
              <span className="text-xs text-gray-500">Stops</span>
            </div>
          </button>

          {/* Card 4: Net Realized Profit */}
          <div className="p-3 rounded-xl border border-gray-800 bg-[#1e2026]/60">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Lucro Realizado</span>
            <div className="mt-0.5">
              <span className={`text-base sm:text-lg font-black font-mono block truncate ${profitBrl >= 0 ? 'text-[#0ecb81]' : 'text-red-400'}`}>
                {profitBrl >= 0 ? '+' : ''}R$ {profitBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 font-mono block">
                ≈ {profitUsd >= 0 ? '+' : ''}${profitUsd.toFixed(2)} USD
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-3 sm:p-4 bg-[#181a20] border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#f0b90b] text-black font-extrabold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Todas ({totalTrades})
            </button>

            <button
              onClick={() => setActiveTab('wins')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'wins'
                  ? 'bg-emerald-500 text-black font-extrabold'
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Vitórias ({totalWins})
            </button>

            <button
              onClick={() => setActiveTab('losses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'losses'
                  ? 'bg-red-500 text-white font-extrabold'
                  : 'bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/40'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Derrotas ({totalLosses})
            </button>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar moeda (ex: SUI, SOL)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121418] border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b]"
              />
            </div>

            <button
              onClick={handleCopyReport}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              title="Copiar relatório completo"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Trade Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-[#1e2026]/30 rounded-xl border border-gray-800/80">
              <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-300">Nenhuma operação encontrada</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery 
                  ? `Nenhum trade encontrado para a busca "${searchQuery}".` 
                  : activeTab === 'wins' 
                    ? 'Nenhuma vitória registrada no momento.' 
                    : activeTab === 'losses' 
                      ? 'Nenhuma derrota registrada no momento.' 
                      : 'Suas operações vendidas serão catalogadas aqui com detalhes de compra e venda.'}
              </p>
            </div>
          ) : (
            filteredHistory.map(({ item, originalIndex }) => {
              const isWin = item.pnlBrl >= 0;
              const currency = item.currency || 'USDT';
              const buyTotal = item.purchasePrice * item.amount;
              const sellTotal = item.exitPrice * item.amount;
              const netProfitCurrency = sellTotal - buyTotal;
              const pnlPercent = item.finalPnlPercent !== undefined 
                ? item.finalPnlPercent 
                : ((item.exitPrice - item.purchasePrice) / item.purchasePrice) * 100;
              
              const duration = formatDuration(item.purchaseTime, item.exitTime);

              return (
                <div 
                  key={item.id || originalIndex}
                  className={`bg-[#1e2026] border rounded-xl p-3.5 sm:p-4 transition-all ${
                    isWin 
                      ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-sm shadow-emerald-950/20' 
                      : 'border-red-500/30 hover:border-red-500/60 shadow-sm shadow-red-950/20'
                  }`}
                >
                  {/* Top Row: Symbol, Tag, and Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white text-sm sm:text-base font-mono">
                          {item.symbol}
                        </span>
                        {item.coinName && (
                          <span className="text-xs text-gray-400">({item.coinName})</span>
                        )}
                      </div>

                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isWin 
                          ? 'bg-emerald-500/20 text-[#0ecb81] border border-emerald-500/40' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}>
                        {isWin ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isWin ? 'VITÓRIA (LUCRO)' : 'STOP LOSS (PROTEÇÃO)'}
                      </span>

                      {duration && (
                        <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-[#f0b90b]" /> {duration}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        {formatDate(item.exitTime || item.purchaseTime)}
                      </span>

                      {onDeleteHistoryItem && (
                        confirmDeleteIndex === originalIndex ? (
                          <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 p-1 rounded">
                            <span className="text-[10px] text-red-400 font-bold">Apagar?</span>
                            <button
                              onClick={() => {
                                onDeleteHistoryItem(originalIndex);
                                setConfirmDeleteIndex(null);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmDeleteIndex(null)}
                              className="bg-gray-800 text-gray-300 text-[10px] px-1.5 py-0.5 rounded font-bold hover:bg-gray-700 cursor-pointer"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteIndex(originalIndex)}
                            className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                            title="Remover este registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Main Grid: Compra x Venda x Quantidade x Lucro */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    
                    {/* 1. Comprado */}
                    <div className="bg-[#14151a] p-2.5 rounded-lg border border-gray-800/80">
                      <span className="text-[10px] text-gray-400 block font-sans font-bold">1. Preço de Compra</span>
                      <span className="text-sm font-bold text-white block mt-0.5">
                        {item.purchasePrice < 1 ? item.purchasePrice.toFixed(6) : item.purchasePrice.toFixed(2)} <span className="text-[10px] text-gray-400">{currency}</span>
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        Total Pago: <strong className="text-gray-300">{buyTotal.toFixed(2)} {currency}</strong>
                      </span>
                    </div>

                    {/* 2. Vendido */}
                    <div className="bg-[#14151a] p-2.5 rounded-lg border border-gray-800/80">
                      <span className="text-[10px] text-gray-400 block font-sans font-bold">2. Preço de Venda</span>
                      <span className="text-sm font-bold text-white block mt-0.5">
                        {item.exitPrice < 1 ? item.exitPrice.toFixed(6) : item.exitPrice.toFixed(2)} <span className="text-[10px] text-gray-400">{currency}</span>
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        Total Resgatado: <strong className="text-gray-300">{sellTotal.toFixed(2)} {currency}</strong>
                      </span>
                    </div>

                    {/* 3. Quantidade */}
                    <div className="bg-[#14151a] p-2.5 rounded-lg border border-gray-800/80">
                      <span className="text-[10px] text-gray-400 block font-sans font-bold">3. Qtd Negociada</span>
                      <span className="text-sm font-bold text-white block mt-0.5 truncate">
                        {item.amount.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        {item.symbol.replace('USDT', '').replace('BRL', '')}
                      </span>
                    </div>

                    {/* 4. Lucro Líquido Realizado */}
                    <div className={`p-2.5 rounded-lg border ${
                      isWin 
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-[#0ecb81]' 
                        : 'bg-red-950/30 border-red-500/40 text-[#f6465d]'
                    }`}>
                      <span className="text-[10px] block font-sans font-bold uppercase">
                        {isWin ? 'Lucro Obtido' : 'Prejuízo / Stop'}
                      </span>
                      <span className="text-sm sm:text-base font-black block mt-0.5 font-mono">
                        {item.pnlBrl >= 0 ? '+' : ''}R$ {item.pnlBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-extrabold block mt-0.5">
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}% ({netProfitCurrency >= 0 ? '+' : ''}${netProfitCurrency.toFixed(2)})
                      </span>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1e2026] border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-400">
            Exibindo <strong className="text-white">{filteredHistory.length}</strong> de <strong className="text-white">{totalTrades}</strong> operações.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onClearHistory && totalTrades > 0 && (
              isConfirmingClearAll ? (
                <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-lg">
                  <span className="text-xs text-red-400 font-bold">Apagar todo o histórico?</span>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setIsConfirmingClearAll(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold cursor-pointer"
                  >
                    Sim, Limpar
                  </button>
                  <button
                    onClick={() => setIsConfirmingClearAll(false)}
                    className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded hover:bg-gray-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClearAll(true)}
                  className="text-xs text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Histórico</span>
                </button>
              )
            )}

            <button
              onClick={onClose}
              className="bg-[#f0b90b] hover:bg-[#e0a800] text-black font-extrabold px-5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
