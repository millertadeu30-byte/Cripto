import React, { useState } from 'react';
import { DollarSign, Trash2, ArrowUpRight, TrendingDown, TrendingUp, HelpCircle, AlertCircle, Info, ChevronRight, X, Pencil } from 'lucide-react';
import { Trade } from '../types';

interface PortfolioListProps {
  trades: Trade[];
  marketPrices: { [key: string]: number };
  usdtBrl: number;
  onRemoveTrade: (id: string) => void;
  onCloseTrade: (id: string, exitPrice: number) => void;
  onEditTrade: (updatedTrade: Trade) => void;
}

export default function PortfolioList({
  trades,
  marketPrices,
  usdtBrl,
  onRemoveTrade,
  onCloseTrade,
  onEditTrade
}: PortfolioListProps) {
  const [selectedTradeExplanation, setSelectedTradeExplanation] = useState<Trade | null>(null);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // States for editing trade
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editPurchasePrice, setEditPurchasePrice] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCurrentPrice, setEditCurrentPrice] = useState<string>('');
  const [confirmingDeleteTradeId, setConfirmingDeleteTradeId] = useState<string | null>(null);

  const handleStartClose = (trade: Trade) => {
    setClosingTradeId(trade.id);
    setEditingTradeId(null); // Close edit if open
    setConfirmingDeleteTradeId(null);
    setFormError(null);
    const livePrice = marketPrices[trade.symbol] || trade.purchasePrice;
    setExitPriceInput(livePrice.toString());
  };

  const handleConfirmClose = (e: React.FormEvent, trade: Trade) => {
    e.preventDefault();
    const parsedExit = parseFloat(exitPriceInput);
    if (isNaN(parsedExit) || parsedExit <= 0) {
      setFormError('Por favor, informe um preço de venda válido.');
      return;
    }
    onCloseTrade(trade.id, parsedExit);
    setClosingTradeId(null);
    setFormError(null);
  };

  const handleStartEdit = (trade: Trade) => {
    setEditingTradeId(trade.id);
    setClosingTradeId(null); // Close selling if open
    setConfirmingDeleteTradeId(null);
    setFormError(null);
    setEditPurchasePrice(trade.purchasePrice.toString());
    setEditAmount(trade.amount.toString());
    const livePrice = marketPrices[trade.symbol] || trade.currentPrice;
    setEditCurrentPrice(livePrice.toString());
  };

  const handleConfirmEdit = (e: React.FormEvent, trade: Trade) => {
    e.preventDefault();
    const purchase = parseFloat(editPurchasePrice);
    const qty = parseFloat(editAmount);
    const currPrice = parseFloat(editCurrentPrice);

    if (isNaN(purchase) || purchase <= 0) {
      setFormError('Por favor, informe um preço de compra válido.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setFormError('Por favor, informe uma quantidade válida.');
      return;
    }
    if (isNaN(currPrice) || currPrice <= 0) {
      setFormError('Por favor, informe um preço atual válido.');
      return;
    }

    const updatedTrade: Trade = {
      ...trade,
      purchasePrice: purchase,
      amount: qty,
      totalInvested: purchase * qty,
      currentPrice: currPrice
    };

    onEditTrade(updatedTrade);
    setEditingTradeId(null);
    setFormError(null);
  };

  return (
    <div id="portfolio-section" className="bg-[#181a20] rounded-2xl border border-gray-800 p-6 space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
          Minhas Moedas Ativas <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full font-mono">{trades.length}</span>
        </h3>
        <span className="text-xs text-gray-500 font-mono">Spot & Alpha Portfolio</span>
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-[#1e2026]/30">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 mb-4">Você ainda não registrou nenhuma compra na carteira.</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Compre uma moeda na Binance e preencha o formulário clicando em <strong className="text-[#f0b90b]">"Adicionar Operação"</strong> para que eu possa acompanhar e te enviar os alertas de 30 minutos!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {trades.map(trade => {
            const livePrice = marketPrices[trade.symbol] || trade.purchasePrice;
            const currentValue = livePrice * trade.amount;
            const purchaseValue = trade.purchasePrice * trade.amount;
            const pnlValue = currentValue - purchaseValue;
            const pnlPercent = purchaseValue > 0 ? (pnlValue / purchaseValue) * 100 : 0;
            const isProfit = pnlValue >= 0;

            // Formatted PNL in currency
            const displaySymbol = trade.currency === 'USDT' ? '$' : 'R$';
            const formattedPnl = `${isProfit ? '+' : ''}${displaySymbol}${pnlValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;

            // Determine AI Badge styles
            let aiBadgeColor = 'bg-gray-800 text-gray-400';
            if (trade.aiRecommendation === 'MANTER') {
              aiBadgeColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
            } else if (trade.aiRecommendation === 'VENDER') {
              aiBadgeColor = 'bg-[#f6465d]/10 text-[#f6465d] border border-[#f6465d]/30 animate-pulse';
            } else if (trade.aiRecommendation === 'VENDER (STOP)') {
              aiBadgeColor = 'bg-[#f6465d]/20 text-[#f6465d] border border-red-500/50';
            } else if (trade.aiRecommendation === 'COMPRAR MAIS') {
              aiBadgeColor = 'bg-[#0ecb81]/10 text-[#0ecb81] border border-[#0ecb81]/30';
            }

            return (
              <div
                id={`portfolio-item-${trade.id}`}
                key={trade.id}
                className="bg-[#1e2026] border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  
                  {/* Coin Basics & Prices */}
                  <div className="flex items-start gap-3">
                    <div className="bg-[#2b2f36] w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#f0b90b] text-sm font-sans uppercase">
                      {trade.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white font-sans">{trade.symbol}</h4>
                        <span className="text-xs text-gray-500">{trade.coinName}</span>
                      </div>
                      
                      {/* Detailed Purchase Information */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
                        <div>
                          <span>Compra: </span>
                          <span className="text-gray-300 font-mono">{displaySymbol} {trade.purchasePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        </div>
                        <div>
                          <span>Qtd: </span>
                          <span className="text-gray-300 font-mono">{trade.amount.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</span>
                        </div>
                        <div>
                          <span>Investido: </span>
                          <span className="text-gray-300 font-mono">{displaySymbol} {trade.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial PNL exactly mimicking user screenshot */}
                  <div className="sm:text-right flex flex-row sm:flex-col justify-between items-center sm:items-end border-t border-gray-800/50 sm:border-t-0 pt-2 sm:pt-0">
                    <div>
                      <span className="text-xs text-gray-500 block">PNL flutuante</span>
                      <span 
                        className={`text-sm font-bold font-mono ${isProfit ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}
                      >
                        {formattedPnl} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Preço Atual: </span>
                      <span className="text-white font-mono text-sm font-semibold">{displaySymbol} {livePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    </div>
                  </div>

                </div>

                {/* AI Advisor Recommendation & Options Row */}
                <div className="mt-4 pt-3 border-t border-gray-800/60 flex flex-col gap-3">
                  
                  {/* AI Recommendation Alert */}
                  <div className="bg-gray-950/40 rounded-lg p-3 border border-gray-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${aiBadgeColor}`}>
                          Sinal IA: {trade.aiRecommendation || 'REANALISANDO...'}
                        </span>
                        {trade.aiTargetPrice && (
                          <span className="text-[10px] bg-green-500/10 text-[#0ecb81] border border-green-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                            Alvo: {trade.aiTargetPrice}
                          </span>
                        )}
                        {trade.aiStopLossPrice && (
                          <span className="text-[10px] bg-red-500/10 text-[#f6465d] border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                            Stop: {trade.aiStopLossPrice}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase font-sans">Central de Sinais</span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed italic">
                      "{trade.aiReasoning || "Calculando limites ideais de preço... Clique no botão amarelo 'Analisar Agora' no cabeçalho para forçar atualização!"}"
                    </p>
                  </div>

                  {/* Action Triggers */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-800/40 mt-3">
                    <span className="text-[10px] text-gray-500 font-sans font-mono">Cadastrado: {new Date(trade.purchaseTime).toLocaleDateString('pt-BR')}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      
                      {confirmingDeleteTradeId === trade.id ? (
                        <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 p-1 rounded-lg animate-in fade-in zoom-in-95 duration-150">
                          <span className="text-[10px] text-red-400 font-bold px-1">Excluir?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveTrade(trade.id);
                              setConfirmingDeleteTradeId(null);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2.5 py-1 rounded font-bold cursor-pointer transition-all"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteTradeId(null)}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] px-2 py-1 rounded font-semibold cursor-pointer transition-all"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`delete-trade-btn-${trade.id}`}
                          onClick={() => {
                            setConfirmingDeleteTradeId(trade.id);
                            setClosingTradeId(null);
                            setEditingTradeId(null);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-[#f6465d] hover:bg-red-500/10 rounded-lg transition-all cursor-pointer font-medium"
                          title="Apagar operação preenchida incorretamente"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Apagar</span>
                        </button>
                      )}

                      <button
                        id={`edit-trade-btn-${trade.id}`}
                        onClick={() => handleStartEdit(trade)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#f0b90b] hover:bg-[#f0b90b]/10 rounded-lg border border-[#f0b90b]/20 hover:border-[#f0b90b]/40 transition-all cursor-pointer font-medium"
                        title="Editar valores desta operação"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar Ativos & Valores</span>
                      </button>

                      <button
                        id={`trade-close-btn-${trade.id}`}
                        onClick={() => handleStartClose(trade)}
                        className="bg-[#2b2f36] hover:bg-gray-800 text-white border border-gray-700/60 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Vendi (Fechar)
                      </button>
                    </div>
                  </div>

                </div>

                {/* Sell / Close Operation Form overlay inside card */}
                {closingTradeId === trade.id && (
                  <form 
                    onSubmit={(e) => handleConfirmClose(e, trade)}
                    className="mt-3 p-3 bg-gray-950/40 rounded-lg border border-gray-800/80 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-semibold">Registrar venda da moeda</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setClosingTradeId(null);
                          setFormError(null);
                        }}
                        className="text-gray-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {formError && (
                      <div className="text-xs text-[#f6465d] bg-red-500/10 border border-red-500/20 rounded-lg p-2 font-medium">
                        ⚠️ {formError}
                      </div>
                    )}

                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 mb-1">PREÇO DE VENDA NA BINANCE ({trade.currency})</label>
                        <input
                          id="exit-price-input"
                          type="number"
                          step="any"
                          value={exitPriceInput}
                          onChange={(e) => setExitPriceInput(e.target.value)}
                          className="bg-[#2b2f36] text-white border border-gray-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                          required
                        />
                      </div>
                      <button
                        id="confirm-sell-btn"
                        type="submit"
                        className="bg-[#0ecb81] hover:bg-green-600 text-white font-bold text-xs px-3 py-2 rounded transition-colors cursor-pointer"
                      >
                        Confirmar Venda
                      </button>
                    </div>
                  </form>
                )}

                {/* Edit Operation Form overlay inside card */}
                {editingTradeId === trade.id && (
                  <form 
                    onSubmit={(e) => handleConfirmEdit(e, trade)}
                    className="mt-3 p-4 bg-gray-950/60 rounded-xl border border-[#f0b90b]/30 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                      <span className="text-xs text-[#f0b90b] font-bold flex items-center gap-1">
                        <Pencil className="w-3.5 h-3.5" /> Ajustar Operação
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingTradeId(null);
                          setFormError(null);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {formError && (
                      <div className="text-xs text-[#f6465d] bg-red-500/10 border border-red-500/20 rounded-lg p-2 font-medium">
                        ⚠️ {formError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">PREÇO PAGO ({trade.currency})</label>
                        <input
                          type="number"
                          step="any"
                          value={editPurchasePrice}
                          onChange={(e) => setEditPurchasePrice(e.target.value)}
                          className="bg-[#1e2026] text-white border border-gray-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">QUANTIDADE COMPRADA</label>
                        <input
                          type="number"
                          step="any"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="bg-[#1e2026] text-white border border-gray-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">PREÇO ATUAL DE MERCADO ({trade.currency})</label>
                      <input
                        type="number"
                        step="any"
                        value={editCurrentPrice}
                        onChange={(e) => setEditCurrentPrice(e.target.value)}
                        className="bg-[#1e2026] text-white border border-gray-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                        required
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Insira o preço atual correto se a cotação em tempo real estiver atrasada.</p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingTradeId(null)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded font-semibold transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-[#f0b90b] hover:bg-[#d4a30a] text-black text-xs py-2 rounded font-bold transition-all cursor-pointer"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Selected AI Advice Explanation Popup */}
      {selectedTradeExplanation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-[#f0b90b]/15 text-[#f0b90b] text-[10px] px-2 py-0.5 rounded font-bold uppercase">Análise de Canal IA</span>
                <h4 className="text-base font-bold text-white font-sans">{selectedTradeExplanation.symbol}</h4>
              </div>
              <button 
                onClick={() => setSelectedTradeExplanation(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-sm">
                <span className="text-xs text-gray-400 block mb-1">RECOMENDAÇÃO ATUAL DA INTELIGÊNCIA ARTIFICIAL:</span>
                <span className={`text-lg font-black ${selectedTradeExplanation.aiRecommendation === 'VENDER' || selectedTradeExplanation.aiRecommendation === 'VENDER (STOP)' ? 'text-[#f6465d]' : 'text-[#0ecb81]'}`}>
                  {selectedTradeExplanation.aiRecommendation}
                </span>
              </div>

              <div className="text-sm text-gray-300 space-y-2">
                <p className="font-semibold text-white">Justificativa Técnica do Robô:</p>
                <p className="leading-relaxed bg-[#1e2026] p-3 rounded-lg border border-gray-800/80 italic">
                  "{selectedTradeExplanation.aiReasoning || "O robô está reanalisando esta posição no momento. A análise completa estará disponível na próxima rodada de 30 minutos."}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-3 border-t border-gray-800/60">
                <div>
                  <span className="text-gray-500 block">Preço Alvo de Saída:</span>
                  <span className="text-[#0ecb81] font-bold">
                    {selectedTradeExplanation.aiTargetPrice ? `$${selectedTradeExplanation.aiTargetPrice.toLocaleString()}` : "Não definido"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Stop Loss Protetor:</span>
                  <span className="text-[#f6465d] font-bold">
                    {selectedTradeExplanation.aiStopLossPrice ? `$${selectedTradeExplanation.aiStopLossPrice.toLocaleString()}` : "Não definido"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTradeExplanation(null)}
              className="mt-6 w-full bg-[#2b2f36] hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
