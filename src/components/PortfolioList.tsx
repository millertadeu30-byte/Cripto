import React, { useState } from 'react';
import { DollarSign, Trash2, ArrowUpRight, TrendingDown, TrendingUp, HelpCircle, AlertCircle, Info, ChevronRight, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Trade } from '../types';

interface PortfolioListProps {
  trades: Trade[];
  marketPrices: { [key: string]: number };
  usdtBrl: number;
  onRemoveTrade: (id: string) => void;
  onCloseTrade: (id: string, exitPrice: number) => void;
  onEditTrade: (updatedTrade: Trade) => void;
  goalPercent: number;
  displayCurrency: 'BRL' | 'USDT' | 'BTC';
}

export default function PortfolioList({
  trades,
  marketPrices,
  usdtBrl,
  onRemoveTrade,
  onCloseTrade,
  onEditTrade,
  goalPercent,
  displayCurrency
}: PortfolioListProps) {
  const [selectedTradeExplanation, setSelectedTradeExplanation] = useState<Trade | null>(null);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // States for editing trade
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editPurchasePrice, setEditPurchasePrice] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editTotalInvested, setEditTotalInvested] = useState<string>('');
  const [editCurrentPrice, setEditCurrentPrice] = useState<string>('');
  const [editIsManualPrice, setEditIsManualPrice] = useState<boolean>(false);
  const [editSymbol, setEditSymbol] = useState<string>('');
  const [editCurrency, setEditCurrency] = useState<'USDT' | 'BRL'>('USDT');
  const [editCoinName, setEditCoinName] = useState<string>('');
  const [editInputPriceCurrency, setEditInputPriceCurrency] = useState<'USDT' | 'BRL'>('BRL');
  const [confirmingDeleteTradeId, setConfirmingDeleteTradeId] = useState<string | null>(null);
  const [expandedConfig, setExpandedConfig] = useState<{ [key: string]: boolean }>({});
  
  // Binance assets controls
  const [hideSmallAssets, setHideSmallAssets] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleExpandConfig = (id: string) => {
    setExpandedConfig(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  const handleEditPriceChange = (valStr: string) => {
    setEditPurchasePrice(valStr);
    const price = parseFloat(valStr);
    const amt = parseFloat(editAmount);
    if (!isNaN(price) && !isNaN(amt)) {
      setEditTotalInvested((price * amt).toString());
    }
  };

  const handleEditAmountChange = (valStr: string) => {
    setEditAmount(valStr);
    const amt = parseFloat(valStr);
    const price = parseFloat(editPurchasePrice);
    if (!isNaN(price) && !isNaN(amt)) {
      setEditTotalInvested((price * amt).toString());
    }
  };

  const handleEditTotalChange = (valStr: string) => {
    setEditTotalInvested(valStr);
    const tot = parseFloat(valStr);
    const price = parseFloat(editPurchasePrice);
    if (!isNaN(tot) && !isNaN(price) && price > 0) {
      setEditAmount((tot / price).toString());
    } else if (!isNaN(tot)) {
      const amt = parseFloat(editAmount);
      if (!isNaN(amt) && amt > 0) {
        setEditPurchasePrice((tot / amt).toString());
      }
    }
  };

  const handleStartEdit = (trade: Trade) => {
    setEditingTradeId(trade.id);
    setClosingTradeId(null); // Close selling if open
    setConfirmingDeleteTradeId(null);
    setFormError(null);

    // Intelligently detect if this trade was registered/typed in BRL or USDT
    const initialPriceCurrency = (trade.purchasePriceInBrl && Math.abs(trade.purchasePriceInBrl - trade.purchasePrice) > 0.01) ? 'BRL' : trade.currency;
    setEditInputPriceCurrency(initialPriceCurrency);
    
    // Set editPurchasePrice to the exact price of that chosen currency!
    const editPriceVal = initialPriceCurrency === 'BRL' 
      ? (trade.purchasePriceInBrl || trade.purchasePrice * usdtBrl) 
      : (trade.purchasePriceInUsdt || trade.purchasePrice);

    setEditPurchasePrice(editPriceVal.toString());
    setEditAmount(trade.amount.toString());
    
    const initialTotal = editPriceVal * trade.amount;
    setEditTotalInvested(initialTotal.toString());

    const livePrice = marketPrices[trade.symbol] || trade.currentPrice;
    setEditCurrentPrice(livePrice.toString());
    setEditIsManualPrice(!!trade.isManualPrice);
    setEditSymbol(trade.symbol);
    setEditCurrency(trade.currency);
    setEditCoinName(trade.coinName || '');
  };

  const handleConfirmEdit = (e: React.FormEvent, trade: Trade) => {
    e.preventDefault();
    const purchase = parseFloat(editPurchasePrice);
    const qty = parseFloat(editAmount);
    const currPrice = parseFloat(editCurrentPrice);
    const symb = editSymbol.toUpperCase().trim();
    const coinNm = editCoinName.trim() || symb.replace('USDT', '').replace('BRL', '');

    if (!symb) {
      setFormError('Por favor, informe o símbolo da moeda (ex: SOLUSDT).');
      return;
    }
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

    let purchasePriceInBrl = 0;
    let purchasePriceInUsdt = 0;
    let finalPurchasePrice = purchase;
    const rateBrl = usdtBrl || 5.62;

    if (editInputPriceCurrency === 'BRL') {
      purchasePriceInBrl = purchase;
      purchasePriceInUsdt = purchase / rateBrl;
      finalPurchasePrice = editCurrency === 'BRL' ? purchasePriceInBrl : purchasePriceInUsdt;
    } else {
      purchasePriceInUsdt = purchase;
      purchasePriceInBrl = purchase * rateBrl;
      finalPurchasePrice = editCurrency === 'BRL' ? purchasePriceInBrl : purchasePriceInUsdt;
    }

    const updatedTrade: Trade = {
      ...trade,
      symbol: symb,
      currency: editCurrency,
      coinName: coinNm,
      purchasePrice: finalPurchasePrice,
      purchasePriceInBrl,
      purchasePriceInUsdt,
      amount: qty,
      totalInvested: finalPurchasePrice * qty,
      currentPrice: currPrice,
      isManualPrice: editIsManualPrice
    };

    onEditTrade(updatedTrade);
    setEditingTradeId(null);
    setFormError(null);
  };

  // Helpers for displaying currency conversions in the assets table
  const formatValueByCurrency = (valBrl: number) => {
    if (displayCurrency === 'BTC') {
      const btcPriceBrl = (marketPrices['BTCUSDT'] || 91520.40) * (usdtBrl || 5.62);
      const btcVal = valBrl / btcPriceBrl;
      return `${btcVal.toLocaleString('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`;
    } else if (displayCurrency === 'USDT') {
      const usdtVal = valBrl / (usdtBrl || 5.62);
      return `${usdtVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDT`;
    } else {
      return `${valBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} R$`;
    }
  };

  const formatPriceByCurrency = (priceBrl: number) => {
    if (displayCurrency === 'BTC') {
      const btcPriceBrl = (marketPrices['BTCUSDT'] || 91520.40) * (usdtBrl || 5.62);
      const btcPrice = priceBrl / btcPriceBrl;
      return `${btcPrice.toLocaleString('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`;
    } else if (displayCurrency === 'USDT') {
      const usdtPrice = priceBrl / (usdtBrl || 5.62);
      return `${usdtPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDT`;
    } else {
      return `${priceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} R$`;
    }
  };

  const formatPnlByCurrency = (pnlBrl: number) => {
    const isPositive = pnlBrl >= 0;
    const sign = isPositive ? '+ ' : '- ';
    const absPnl = Math.abs(pnlBrl);
    
    if (displayCurrency === 'BTC') {
      const btcPriceBrl = (marketPrices['BTCUSDT'] || 91520.40) * (usdtBrl || 5.62);
      const btcVal = absPnl / btcPriceBrl;
      return `${sign}${btcVal.toLocaleString('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`;
    } else if (displayCurrency === 'USDT') {
      const usdtVal = absPnl / (usdtBrl || 5.62);
      return `${sign}${usdtVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT`;
    } else {
      return `${sign}R$ ${absPnl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
    }
  };

  // Filter trades based on Binance Ocultar Ativos < 1 USD and Search
  const filteredTrades = trades.filter(trade => {
    if (searchQuery && !trade.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (hideSmallAssets) {
      const livePrice = marketPrices[trade.symbol] || trade.purchasePrice;
      const rateToUsd = trade.currency === 'USDT' ? 1 : (1 / (usdtBrl || 5.62));
      const valueInUsd = livePrice * trade.amount * rateToUsd;
      return valueInUsd >= 1;
    }
    return true;
  });

  return (
    <div id="portfolio-section" className="bg-[#181a20] rounded-2xl border border-gray-800 p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-800 pb-4 gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-white font-sans flex items-center gap-2">
            Minhas Moedas Ativas <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full font-mono">{trades.length}</span>
          </h3>
          <span className="text-[10px] bg-[#f0b90b]/10 text-[#f0b90b] px-1.5 py-0.5 rounded font-bold font-mono">FIBONACCI PRÓ</span>
        </div>
        
        {/* Target Calculation Mode Selection */}
        {trades.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#f0b90b]/10 text-[#f0b90b] px-3.5 py-1.5 rounded-xl border border-[#f0b90b]/25 text-xs font-bold font-sans self-start lg:self-auto shadow-sm">
            <span>🛡️ Fórmula Híbrida: Decisão IA + Fibonacci</span>
            <span className="bg-[#f0b90b] text-black px-1.5 py-0.5 rounded text-[9.5px] uppercase font-black">Meta +{goalPercent}%</span>
          </div>
        )}
      </div>

      {/* Binance Sub-Header for Assets Filter & View Controls */}
      {trades.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1e2026]/40 p-4 rounded-xl border border-gray-800/60">
          <div className="flex gap-4 text-xs font-semibold font-sans">
            <button
              type="button"
              className="pb-1 text-white border-b-2 border-[#f0b90b] font-bold"
            >
              Visão de ativos
            </button>
            <button
              type="button"
              className="pb-1 text-gray-400 hover:text-white transition-all cursor-pointer font-medium"
              onClick={() => alert("As contas secundárias estão sincronizadas no ID global de rede.")}
            >
              Visualizar Conta
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            {/* Real-time search */}
            <div className="flex items-center bg-[#181a20]/80 rounded px-2.5 py-1.5 border border-gray-800 focus-within:border-[#f0b90b] transition-all w-full md:w-auto">
              <span className="text-gray-500 mr-2 text-[11px]">🔍</span>
              <input
                type="text"
                placeholder="Buscar ativo (ex: SOL)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white text-[11px] focus:outline-none w-full md:w-28 font-semibold placeholder-gray-600"
              />
            </div>

            {/* Quick Convert Tiny Balances */}
            <button
              type="button"
              onClick={() => alert("Todas as frações de poeira criptográfica já foram otimizadas pela inteligência artificial.")}
              className="text-gray-400 hover:text-[#f0b90b] transition-all flex items-center gap-1 font-medium cursor-pointer text-[11px]"
            >
              🔄 Conversão de poeira
            </button>

            {/* Hide Small Balance Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium hover:text-white transition-colors text-[11px] text-gray-400 shrink-0">
              <input
                type="checkbox"
                checked={hideSmallAssets}
                onChange={(e) => setHideSmallAssets(e.target.checked)}
                className="accent-[#f0b90b] rounded border-gray-800 focus:ring-0 cursor-pointer w-3.5 h-3.5"
              />
              <span>Ocultar ativos &lt;1 USD</span>
            </label>
          </div>
        </div>
      )}

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
          {trades.length > 0 && filteredTrades.length === 0 && (
            <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl bg-[#1e2026]/30">
              <AlertCircle className="w-6 h-6 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nenhum ativo corresponde aos filtros de busca e saldo.</p>
            </div>
          )}
          {filteredTrades.map(trade => {
            const livePrice = marketPrices[trade.symbol] || trade.purchasePrice;
            const currentValue = livePrice * trade.amount;
            const purchaseValue = trade.purchasePrice * trade.amount;
            const pnlValue = currentValue - purchaseValue;
            const pnlPercent = purchaseValue > 0 ? (pnlValue / purchaseValue) * 100 : 0;
            const isProfit = pnlValue >= 0;

            // Calculate targets dynamically based on user goal percent
            const currentGoal = goalPercent || 5;

            // Direct percentage targets as explicitly requested by the user
            const targetCoinPrice = trade.purchasePrice * (1 + currentGoal / 100);
            const stopLossCoinPrice = trade.purchasePrice * (1 - currentGoal / 100);

            // Compute values in native trade currency (USDT or BRL)
            const nativeTargetValue = targetCoinPrice * trade.amount;
            const nativeStopValue = stopLossCoinPrice * trade.amount;
            
            const nativeTargetProfit = nativeTargetValue - trade.totalInvested;
            const nativeStopLossAmount = trade.totalInvested - nativeStopValue;

            // Convert to BRL (Reais) for absolute display "Stop Win e Loss em Reais"
            const rateToBrl = trade.currency === 'BRL' ? 1 : usdtBrl;
            const rateToUsd = trade.currency === 'USDT' ? 1 : (1 / (usdtBrl || 5.62));

            const targetCoinPriceBrl = targetCoinPrice * rateToBrl;
            const stopLossCoinPriceBrl = stopLossCoinPrice * rateToBrl;

            const targetCoinPriceUsd = targetCoinPrice * rateToUsd;
            const stopLossCoinPriceUsd = stopLossCoinPrice * rateToUsd;

            // Trigger prices with safety margin (+0.2% above the stop loss for selling trigger)
            const stopLossTriggerPriceBrl = stopLossCoinPriceBrl * 1.002;
            const stopLossTriggerPriceUsd = stopLossCoinPriceUsd * 1.002;

            const targetValueBrl = nativeTargetValue * rateToBrl;
            const stopValueBrl = nativeStopValue * rateToBrl;

            const targetProfitBrl = nativeTargetProfit * rateToBrl;
            const stopLossAmountBrl = nativeStopLossAmount * rateToBrl;

            const targetPercent = ((targetCoinPrice - trade.purchasePrice) / trade.purchasePrice) * 100;
            const stopPercent = ((stopLossCoinPrice - trade.purchasePrice) / trade.purchasePrice) * 100;

            const displayTargetPercent = `${targetPercent >= 0 ? '+' : ''}${targetPercent.toFixed(2)}%`;
            const displayStopPercent = `${stopPercent >= 0 ? '+' : ''}${stopPercent.toFixed(2)}%`;

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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-base font-bold text-white font-sans">{trade.symbol}</h4>
                        <span className="text-xs text-gray-500">{trade.coinName}</span>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(trade)}
                          className="p-1 text-[#f0b90b] hover:text-[#d4a30a] hover:bg-[#f0b90b]/10 rounded transition-all cursor-pointer"
                          title="Editar símbolo ou valores deste ativo"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
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
                      <span className="text-white font-mono text-sm font-semibold flex items-center gap-1">
                        {trade.isManualPrice && (
                          <span className="text-blue-400 text-[11px] animate-pulse cursor-help" title="❄️ Preço atual congelado manualmente. Para ativar a oscilação automática de mercado, clique no lápis amarelo e desmarque 'Congelar Preço Atual'">❄️</span>
                        )}
                        {displaySymbol} {livePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </span>
                    </div>
                  </div>

                </div>

                {/* AI Advisor Recommendation & Options Row */}
                <div className="mt-4 pt-3 border-t border-gray-800/60 flex flex-col gap-3">
                  
                  {/* AI Recommendation Alert */}
                  <div className="bg-gray-950/40 rounded-lg p-3 border border-gray-800/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${aiBadgeColor}`}>
                          Sinal IA: {trade.aiRecommendation || 'REANALISANDO...'}
                        </span>
                        <span className="text-[10px] bg-[#0ecb81]/15 text-[#0ecb81] border border-green-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                          Alvo (Win): {trade.currency === 'USDT' ? '$' : 'R$'} {targetCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                        <span className="text-[10px] bg-[#f6465d]/15 text-[#f6465d] border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                          Stop Loss: {trade.currency === 'USDT' ? '$' : 'R$'} {stopLossCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase font-sans">Central de Sinais</span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed italic">
                      "{trade.aiReasoning || "Calculando limites ideais de preço... Clique no botão amarelo 'Analisar Agora' no cabeçalho para forçar atualização!"}"
                    </p>
                  </div>

                  {/* Fibonacci level visualization map */}
                  {true && (
                    <div className="bg-gray-950/40 rounded-lg p-3.5 border border-gray-800/80 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 pb-1.5 border-b border-gray-800/40">
                        <span className="flex items-center gap-1.5 text-[#f0b90b]">
                          <span>📊</span> Estudo de Suportes e Resistências de Fibonacci
                        </span>
                        <span className="text-gray-500 text-[10px] uppercase font-mono">Retração Base {currentGoal}%</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-[11px] font-mono leading-none">
                        {/* 1.618 Extension */}
                        <div className="flex justify-between items-center bg-[#0ecb81]/5 hover:bg-[#0ecb81]/10 px-2.5 py-1.5 rounded border border-[#0ecb81]/10 transition-colors">
                          <span className="text-gray-400 flex items-center gap-1">🟢 Extensão Fib 1.618 (Próxima Resistência)</span>
                          <span className="text-[#0ecb81] font-bold">{displaySymbol} {(trade.purchasePrice * (1 + currentGoal * 1.618 / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        </div>
                        {/* 1.000 Target (Selected Goal) */}
                        <div className="flex justify-between items-center bg-[#f0b90b]/5 hover:bg-[#f0b90b]/10 px-2.5 py-1.5 rounded border border-[#f0b90b]/15 transition-colors">
                          <span className="text-gray-200 font-semibold flex items-center gap-1">🎯 Alvo Fib 1.000 (Sua Meta +{currentGoal}%)</span>
                          <span className="text-[#f0b90b] font-extrabold">{displaySymbol} {targetCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        </div>
                        {/* Entry Price */}
                        <div className="flex justify-between items-center bg-gray-800/20 px-2.5 py-1.5 rounded border border-gray-800/40">
                          <span className="text-gray-400 flex items-center gap-1">⚪ Ponto de Entrada (Preço de Compra)</span>
                          <span className="text-white font-bold">{displaySymbol} {trade.purchasePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        </div>
                        {/* 0.382 Retracement */}
                        <div className="flex justify-between items-center bg-gray-900/40 px-2.5 py-1.5 rounded border border-transparent">
                          <span className="text-gray-400 flex items-center gap-1">🟡 Suporte Fib 0.382 (Retração Curta)</span>
                          <span className="text-gray-300">{displaySymbol} {(trade.purchasePrice * (1 - currentGoal * 0.382 / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        </div>
                        {/* 0.618 Golden Ratio / Stop Loss */}
                        <div className="flex justify-between items-center bg-[#f6465d]/5 hover:bg-[#f6465d]/10 px-2.5 py-1.5 rounded border border-[#f6465d]/10 transition-colors">
                          <span className="text-red-400 font-semibold flex items-center gap-1">🔴 Protetor Fib 0.618 (Stop Loss Seguro)</span>
                          <span className="text-[#f6465d] font-bold">{displaySymbol} {stopLossCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MONETARY STOP WIN & LOSS IN REAIS (R$) - AS EXPLICITLY REQUESTED IN FOTO 1 */}
                  <div className="bg-[#1e2026]/90 rounded-xl p-3.5 border border-gray-800/80 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold border-b border-gray-800 pb-1.5 uppercase tracking-wider">
                      <DollarSign className="w-4 h-4 text-[#f0b90b]" />
                      <span>Limites de Lucro & Perda Estimados em Reais (R$)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Stop Win / Alvo em Reais */}
                      <div className="bg-[#0ecb81]/5 border border-[#0ecb81]/15 rounded-lg p-2.5 space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Stop Win (Se atingir o Alvo)</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-400">Moeda em R$:</span>
                          <span className="text-xs font-mono font-bold text-white">R$ {targetCoinPriceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-gray-800/50 pt-1">
                          <span className="text-xs text-gray-400">Total na Carteira:</span>
                          <span className="text-xs font-mono font-bold text-white">R$ {targetValueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-[#0ecb81]/15 pt-1">
                          <span className="text-xs font-bold text-[#0ecb81]">Ganho Líquido:</span>
                          <span className="text-sm font-mono font-extrabold text-[#0ecb81]">+R$ {targetProfitBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({displayTargetPercent})</span>
                        </div>
                      </div>

                      {/* Stop Loss em Reais */}
                      <div className="bg-[#f6465d]/5 border border-[#f6465d]/15 rounded-lg p-2.5 space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Stop Loss (Se cair no Stop)</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-400">Moeda em R$:</span>
                          <span className="text-xs font-mono font-bold text-white">R$ {stopLossCoinPriceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-gray-800/50 pt-1">
                          <span className="text-xs text-gray-400">Total na Carteira:</span>
                          <span className="text-xs font-mono font-bold text-white">R$ {stopValueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-[#f6465d]/15 pt-1">
                          <span className="text-xs font-bold text-[#f6465d]">Perda Máxima:</span>
                          <span className="text-sm font-mono font-extrabold text-[#f6465d]">-R$ {stopLossAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({displayStopPercent})</span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Guide for Platform Setup */}
                    <div className="border-t border-gray-800 pt-2">
                      <button
                        type="button"
                        onClick={() => toggleExpandConfig(trade.id)}
                        className="w-full flex items-center justify-between text-xs text-[#f0b90b] hover:text-[#d4a30a] font-bold transition-all py-1.5 px-3 bg-[#f0b90b]/10 hover:bg-[#f0b90b]/15 rounded-lg border border-[#f0b90b]/20 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          📋 Como Preencher OCO de acordo com {trade.symbol}? (Ver Campos)
                        </span>
                        {expandedConfig[trade.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {expandedConfig[trade.id] && (
                        <div className="mt-3 bg-[#1e2026] rounded-xl p-4 border border-gray-800 text-xs text-gray-300 space-y-3.5 animate-in slide-in-from-top-1 duration-150">
                          <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                            <span className="p-1 bg-[#f0b90b]/15 text-[#f0b90b] rounded text-sm">📋</span>
                            <div>
                              <p className="font-bold text-white text-[12px] font-sans">Guia Prático de Preenchimento OCO (Binance)</p>
                              <p className="text-[10px] text-gray-500">Abaixo estão os campos EXATOS para você preencher na Binance para a moeda {trade.symbol}:</p>
                            </div>
                          </div>

                          <div className="bg-[#181a20] rounded-xl p-4 border border-gray-800/80 space-y-3.5 max-w-md mx-auto">
                            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/15 px-2 py-0.5 rounded-full font-bold">PAINEL DE VENDA OCO (Binance)</span>
                              <span className="text-[11px] font-mono font-bold text-[#f0b90b]">{trade.symbol}</span>
                            </div>

                            <div className="space-y-2.5 text-xs">
                              {/* Field 1: Price (Stop Win) */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                  <span>PREÇO (Stop Win - Alvo de Lucro)</span>
                                  <span className="text-gray-500">Price</span>
                                </div>
                                <div className="flex items-center bg-[#1e2026] border border-gray-800 rounded-lg overflow-hidden pr-1">
                                  <span className="pl-3 text-gray-500 font-mono font-bold">{trade.currency === 'USDT' ? '$' : 'R$'}</span>
                                  <input
                                    type="text"
                                    readOnly
                                    value={targetCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    className="bg-transparent text-[#0ecb81] font-mono font-bold text-sm px-2 py-2 flex-1 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(targetCoinPrice.toFixed(6));
                                      alert('Preço copiado!');
                                    }}
                                    className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-white font-bold rounded transition-colors cursor-pointer"
                                  >
                                    Copiar
                                  </button>
                                </div>
                              </div>

                              {/* Field 2: Stop (Trigger) */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                  <span>STOP (Preço de Disparo do Gatilho)</span>
                                  <span className="text-gray-500">Stop (Gatilho)</span>
                                </div>
                                <div className="flex items-center bg-[#1e2026] border border-gray-800 rounded-lg overflow-hidden pr-1">
                                  <span className="pl-3 text-gray-500 font-mono font-bold">{trade.currency === 'USDT' ? '$' : 'R$'}</span>
                                  <input
                                    type="text"
                                    readOnly
                                    value={(stopLossCoinPrice * 1.002).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    className="bg-transparent text-white font-mono font-bold text-sm px-2 py-2 flex-1 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText((stopLossCoinPrice * 1.002).toFixed(6));
                                      alert('Gatilho de Stop copiado!');
                                    }}
                                    className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-white font-bold rounded transition-colors cursor-pointer"
                                  >
                                    Copiar
                                  </button>
                                </div>
                              </div>

                              {/* Field 3: Limit (Stop Loss) */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                  <span>LIMITE (Preço Real de Venda do Stop Loss)</span>
                                  <span className="text-gray-500">Limit</span>
                                </div>
                                <div className="flex items-center bg-[#1e2026] border border-gray-800 rounded-lg overflow-hidden pr-1">
                                  <span className="pl-3 text-gray-500 font-mono font-bold">{trade.currency === 'USDT' ? '$' : 'R$'}</span>
                                  <input
                                    type="text"
                                    readOnly
                                    value={stopLossCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                    className="bg-transparent text-[#f6465d] font-mono font-bold text-sm px-2 py-2 flex-1 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(stopLossCoinPrice.toFixed(6));
                                      alert('Limite de Stop copiado!');
                                    }}
                                    className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-white font-bold rounded transition-colors cursor-pointer"
                                  >
                                    Copiar
                                  </button>
                                </div>
                              </div>

                              {/* Field 4: Amount */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                  <span>QUANTIDADE (Total de moedas compradas)</span>
                                  <span className="text-gray-500">Amount</span>
                                </div>
                                <div className="flex items-center bg-[#1e2026] border border-gray-800 rounded-lg overflow-hidden pr-1">
                                  <span className="pl-3 text-gray-500 font-mono font-bold">Qtd</span>
                                  <input
                                    type="text"
                                    readOnly
                                    value={trade.amount.toString()}
                                    className="bg-transparent text-[#f0b90b] font-mono font-bold text-sm px-2 py-2 flex-1 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(trade.amount.toString());
                                      alert('Quantidade copiada!');
                                    }}
                                    className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-white font-bold rounded transition-colors cursor-pointer"
                                  >
                                    Copiar
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>

                          <div className="text-[11px] text-gray-400 leading-relaxed bg-gray-950/40 p-3 rounded-lg border border-gray-800 space-y-1 font-sans">
                            <p className="font-bold text-white">⚠️ Como funciona a Ordem OCO na Binance:</p>
                            <ul className="list-decimal list-inside space-y-1 text-[10px]">
                              <li>Acesse a aba <strong>Vender</strong> na Binance, selecione <strong>OCO</strong>.</li>
                              <li>Copie cada um dos valores acima clicando no botão <strong>Copiar</strong> ao lado dos campos e cole diretamente na corretora.</li>
                              <li>O campo <strong>STOP (Disparo)</strong> possui um pequeno gatilho acima para acionar e colocar a ordem no book de ofertas instantaneamente, prevenindo pulos de stop em quedas bruscas.</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
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
                    className="mt-3 p-4 bg-gray-950/60 rounded-xl border border-[#f0b90b]/30 space-y-3 font-sans"
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

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">SÍMBOLO (EX: SOLUSDT)</label>
                        <input
                          type="text"
                          value={editSymbol}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setEditSymbol(val);
                            // Auto-detect currency from symbol!
                            if (val.endsWith('BRL')) {
                              setEditCurrency('BRL');
                              setEditInputPriceCurrency('BRL');
                            } else if (val.endsWith('USDT')) {
                              setEditCurrency('USDT');
                              setEditInputPriceCurrency('USDT');
                            }
                          }}
                          className="bg-[#1e2026] text-white border border-gray-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono uppercase"
                          required
                          placeholder="SOLUSDT"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">PAR PRINCIPAL</label>
                        <select
                          value={editCurrency}
                          onChange={(e) => {
                            const val = e.target.value as 'USDT' | 'BRL';
                            const oldCurr = editCurrency;
                            if (val === oldCurr) return;

                            setEditCurrency(val);
                            setEditInputPriceCurrency(val);

                            // 1. Auto-update symbol suffix
                            let newSymbol = editSymbol;
                            const baseSym = editSymbol.replace(/USDT$/, '').replace(/BRL$/, '');
                            if (baseSym && baseSym !== 'CUSTOM') {
                              newSymbol = baseSym + val;
                              setEditSymbol(newSymbol);
                            }

                            // 2. Convert prices and total invested based on usdtBrl rate
                            const rate = usdtBrl || 5.15;
                            const oldPrice = parseFloat(editPurchasePrice) || 0;
                            const oldCurrent = parseFloat(editCurrentPrice) || 0;
                            const oldTotal = parseFloat(editTotalInvested) || 0;

                            if (val === 'BRL' && oldCurr === 'USDT') {
                              if (oldPrice > 0) setEditPurchasePrice((oldPrice * rate).toFixed(4));
                              if (oldCurrent > 0) setEditCurrentPrice((oldCurrent * rate).toFixed(4));
                              if (oldTotal > 0) setEditTotalInvested((oldTotal * rate).toFixed(4));
                            } else if (val === 'USDT' && oldCurr === 'BRL') {
                              if (oldPrice > 0) setEditPurchasePrice((oldPrice / rate).toFixed(4));
                              if (oldCurrent > 0) setEditCurrentPrice((oldCurrent / rate).toFixed(4));
                              if (oldTotal > 0) setEditTotalInvested((oldTotal / rate).toFixed(4));
                            }
                          }}
                          className="bg-[#1e2026] text-white border border-gray-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-sans font-semibold cursor-pointer"
                        >
                          <option value="USDT">USDT ($)</option>
                          <option value="BRL">BRL (R$)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">NOME DA MOEDA</label>
                        <input
                          type="text"
                          value={editCoinName}
                          onChange={(e) => setEditCoinName(e.target.value)}
                          className="bg-[#1e2026] text-white border border-gray-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full"
                          placeholder="Ex: Solana"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-gray-400 font-bold">PREÇO PAGO (Por Unidade)</label>
                          <div className="flex bg-[#1e2026] p-0.5 rounded border border-gray-800 text-[9px]">
                            <button
                              id="edit-input-currency-brl-btn"
                              type="button"
                              onClick={() => {
                                const parsed = parseFloat(editPurchasePrice);
                                if (!isNaN(parsed) && editInputPriceCurrency === 'USDT') {
                                  const newPrice = parsed * (usdtBrl || 5.62);
                                  setEditPurchasePrice(newPrice.toFixed(4));
                                  const amt = parseFloat(editAmount) || 0;
                                  setEditTotalInvested((newPrice * amt).toFixed(4));
                                }
                                setEditInputPriceCurrency('BRL');
                              }}
                              className={`px-1.5 py-0.5 rounded-sm font-semibold transition-all cursor-pointer ${editInputPriceCurrency === 'BRL' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                              Em R$
                            </button>
                            <button
                              id="edit-input-currency-usdt-btn"
                              type="button"
                              onClick={() => {
                                const parsed = parseFloat(editPurchasePrice);
                                if (!isNaN(parsed) && editInputPriceCurrency === 'BRL') {
                                  const newPrice = parsed / (usdtBrl || 5.62);
                                  setEditPurchasePrice(newPrice.toFixed(4));
                                  const amt = parseFloat(editAmount) || 0;
                                  setEditTotalInvested((newPrice * amt).toFixed(4));
                                }
                                setEditInputPriceCurrency('USDT');
                              }}
                              className={`px-1.5 py-0.5 rounded-sm font-semibold transition-all cursor-pointer ${editInputPriceCurrency === 'USDT' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                              Em $
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-500 text-[10px] font-bold font-mono">
                            {editInputPriceCurrency === 'BRL' ? 'R$' : '$'}
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={editPurchasePrice}
                            onChange={(e) => handleEditPriceChange(e.target.value)}
                            className="bg-[#1e2026] text-white border border-gray-800 rounded pl-7 pr-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                            required
                          />
                        </div>
                        {parseFloat(editPurchasePrice) > 0 && (
                          <div className="text-[9px] text-gray-500 mt-1 pl-0.5">
                            {editInputPriceCurrency === 'BRL' ? (
                              <span>≈ $ {(parseFloat(editPurchasePrice) / (usdtBrl || 5.62)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDT</span>
                            ) : (
                              <span>≈ R$ {(parseFloat(editPurchasePrice) * (usdtBrl || 5.62)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BRL</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">QUANTIDADE COMPRADA</label>
                        <input
                          type="number"
                          step="any"
                          value={editAmount}
                          onChange={(e) => handleEditAmountChange(e.target.value)}
                          className="bg-[#1e2026] text-white border border-gray-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">PREÇO ATUAL DE MERCADO ({editCurrency})</label>
                        <input
                          type="number"
                          step="any"
                          value={editCurrentPrice}
                          onChange={(e) => setEditCurrentPrice(e.target.value)}
                          className="bg-[#1e2026] text-white border border-gray-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                          required
                        />
                        <p className="text-[9px] text-gray-500 mt-1 leading-tight">Mude se a cotação em tempo real estiver atrasada.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#f0b90b] font-bold mb-1 flex justify-between">
                          <span>VALOR TOTAL DA COMPRA (O quanto comprei)</span>
                          <span>{editInputPriceCurrency}</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-500 text-[10px] font-bold font-mono">
                            {editInputPriceCurrency === 'BRL' ? 'R$' : '$'}
                          </span>
                          <input
                            type="number"
                            step="any"
                            value={editTotalInvested}
                            onChange={(e) => handleEditTotalChange(e.target.value)}
                            className="bg-[#1e2026] text-[#f0b90b] border border-dashed border-[#f0b90b]/40 rounded pl-7 pr-2.5 py-1.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono font-bold"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-[9px] text-gray-500 mt-1 leading-tight">A alteração atualiza a quantidade comprada automaticamente.</p>
                      </div>
                    </div>

                    {/* Freeze Price Checkbox */}
                    <div className="bg-[#1e2026] p-2.5 rounded-lg border border-gray-800 flex items-center gap-2">
                      <input
                        id={`freeze-edit-${trade.id}`}
                        type="checkbox"
                        checked={editIsManualPrice}
                        onChange={(e) => setEditIsManualPrice(e.target.checked)}
                        className="accent-[#f0b90b] h-4 w-4 rounded cursor-pointer"
                      />
                      <div className="leading-tight">
                        <label htmlFor={`freeze-edit-${trade.id}`} className="text-[11px] font-bold text-gray-300 cursor-pointer flex items-center gap-1">
                          ❄️ Congelar Preço Atual (Não atualizar automático)
                        </label>
                        <span className="text-[9px] text-gray-500 block">Marque para fixar o preço atual de mercado que você digitou acima</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTradeId(null);
                          setFormError(null);
                        }}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto flex items-start sm:items-center justify-center p-2 sm:p-4">
          <div className="bg-[#181a20] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 my-auto">
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
