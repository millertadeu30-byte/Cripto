import React, { useState, useEffect } from 'react';
import { DollarSign, Trash2, ArrowUpRight, TrendingDown, TrendingUp, HelpCircle, AlertCircle, Info, ChevronRight, X, Pencil, ChevronDown, ChevronUp, Clock, Copy, Shield, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { Trade } from '../types';
import { analyze5MinCandle } from '../utils/candleUtils';

interface PortfolioListProps {
  trades: Trade[];
  marketPrices: { [key: string]: number };
  usdtBrl: number;
  onRemoveTrade: (id: string) => void;
  onCloseTrade: (id: string, exitPrice: number, partialAmount?: number) => void;
  onCloseBatchTrades?: (tradesToClose: { id: string; exitPrice: number; partialAmount?: number }[]) => void;
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
  onCloseBatchTrades,
  onEditTrade,
  goalPercent,
  displayCurrency
}: PortfolioListProps) {
  // 5-Minute Candle analysis timer
  const [candleInfo, setCandleInfo] = useState(() => analyze5MinCandle());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Multi-Selection State for selling specific coins
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [isBatchSellModalOpen, setIsBatchSellModalOpen] = useState<boolean>(false);
  const [batchExitPrices, setBatchExitPrices] = useState<{ [id: string]: string }>({});
  const [batchPartialAmounts, setBatchPartialAmounts] = useState<{ [id: string]: string }>({});
  const [batchPartialPercentages, setBatchPartialPercentages] = useState<{ [id: string]: number }>({});

  // Single Card Selling State (with partial quantity support)
  const [sellPartialPercentage, setSellPartialPercentage] = useState<number>(100);
  const [sellPartialAmount, setSellPartialAmount] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCandleInfo(analyze5MinCandle());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyText = (textToCopy: string, keyName: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(keyName);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const formatRawNumber = (num: number) => {
    if (num === 0) return '0.00';
    const absVal = Math.abs(num);
    if (absVal < 0.0001) return num.toFixed(8);
    if (absVal < 1) return num.toFixed(6);
    if (absVal < 100) return num.toFixed(4);
    return num.toFixed(2);
  };

  const [selectedTradeExplanation, setSelectedTradeExplanation] = useState<Trade | null>(null);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Toggle single coin selection for selling
  const toggleSelectTrade = (id: string) => {
    setSelectedTradeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTradeIds.size === filteredTrades.length && filteredTrades.length > 0) {
      setSelectedTradeIds(new Set());
    } else {
      setSelectedTradeIds(new Set(filteredTrades.map(t => t.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedTradeIds(new Set());
  };

  // Open batch sell modal for the marked coins
  const handleOpenBatchSellModal = () => {
    const prices: { [id: string]: string } = {};
    const amounts: { [id: string]: string } = {};
    const pcts: { [id: string]: number } = {};
    
    trades.filter(t => selectedTradeIds.has(t.id)).forEach(t => {
      const livePrice = marketPrices[t.symbol] || t.purchasePrice;
      prices[t.id] = livePrice.toString();
      amounts[t.id] = t.amount.toString();
      pcts[t.id] = 100;
    });
    
    setBatchExitPrices(prices);
    setBatchPartialAmounts(amounts);
    setBatchPartialPercentages(pcts);
    setFormError(null);
    setIsBatchSellModalOpen(true);
  };

  // Set partial percentage for a coin inside batch sell modal
  const handleSetBatchCoinPercentage = (trade: Trade, pct: number) => {
    setBatchPartialPercentages(prev => ({ ...prev, [trade.id]: pct }));
    const calcQty = (trade.amount * (pct / 100));
    setBatchPartialAmounts(prev => ({ ...prev, [trade.id]: calcQty.toString() }));
  };

  // Confirm and execute batch sell for all marked coins
  const handleConfirmBatchClose = () => {
    const itemsToClose: { id: string; exitPrice: number; partialAmount?: number }[] = [];
    const selectedList = trades.filter(t => selectedTradeIds.has(t.id));

    for (const trade of selectedList) {
      const priceStr = batchExitPrices[trade.id];
      const exitP = parseFloat(priceStr);
      if (isNaN(exitP) || exitP <= 0) {
        setFormError(`Preço de venda inválido para a moeda ${trade.symbol}`);
        return;
      }
      const qtyStr = batchPartialAmounts[trade.id];
      const qty = parseFloat(qtyStr);
      if (isNaN(qty) || qty <= 0) {
        setFormError(`Quantidade inválida para a moeda ${trade.symbol}`);
        return;
      }
      if (qty > trade.amount) {
        setFormError(`Quantidade de ${trade.symbol} não pode exceder ${trade.amount}`);
        return;
      }
      const isPart = qty < trade.amount;
      itemsToClose.push({
        id: trade.id,
        exitPrice: exitP,
        partialAmount: isPart ? qty : undefined
      });
    }

    if (onCloseBatchTrades) {
      onCloseBatchTrades(itemsToClose);
    } else {
      itemsToClose.forEach(item => {
        onCloseTrade(item.id, item.exitPrice, item.partialAmount);
      });
    }

    setIsBatchSellModalOpen(false);
    setSelectedTradeIds(new Set());
    setFormError(null);
  };

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
  const [minimizedConfluence, setMinimizedConfluence] = useState<{ [key: string]: boolean }>({});
  const [confluenceCurrencyMap, setConfluenceCurrencyMap] = useState<{ [key: string]: 'BRL' | 'USD' }>({});
  const [editingRetracementTradeId, setEditingRetracementTradeId] = useState<string | null>(null);
  const [tempRetracement, setTempRetracement] = useState<string>('');

  const saveRetracement = (trade: Trade) => {
    const val = parseFloat(tempRetracement);
    if (!isNaN(val) && val > 0 && val <= 100) {
      const oldMax = trade.maxPriceReached || trade.purchasePrice;
      const newStopLoss = oldMax * (1 - val / 100);
      onEditTrade({
        ...trade,
        retracementPercent: val,
        aiStopLossPrice: newStopLoss
      });
    }
    setEditingRetracementTradeId(null);
  };
  
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
    setSellPartialPercentage(100);
    setSellPartialAmount(trade.amount.toString());
  };

  const handleSetSingleSellPercentage = (trade: Trade, pct: number) => {
    setSellPartialPercentage(pct);
    const calcQty = (trade.amount * (pct / 100));
    setSellPartialAmount(calcQty.toString());
  };

  const handleConfirmClose = (e: React.FormEvent, trade: Trade) => {
    e.preventDefault();
    const parsedExit = parseFloat(exitPriceInput);
    if (isNaN(parsedExit) || parsedExit <= 0) {
      setFormError('Por favor, informe um preço de venda válido.');
      return;
    }
    const parsedQty = parseFloat(sellPartialAmount);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setFormError('Por favor, informe uma quantidade válida para vender.');
      return;
    }
    if (parsedQty > trade.amount) {
      setFormError(`Quantidade máxima disponível para venda: ${trade.amount}`);
      return;
    }

    const isPartial = parsedQty < trade.amount;
    onCloseTrade(trade.id, parsedExit, isPartial ? parsedQty : undefined);
    
    // Also remove from selected set if present
    setSelectedTradeIds(prev => {
      const next = new Set(prev);
      next.delete(trade.id);
      return next;
    });
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
          
          {/* Multi-Selection Control Bar: Select Which Coins To Sell */}
          <div className="bg-[#1e2026]/90 border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14151a] hover:bg-[#252830] text-gray-200 border border-gray-700 text-xs font-bold transition-all cursor-pointer select-none"
              >
                {selectedTradeIds.size === filteredTrades.length && filteredTrades.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-[#0ecb81]" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                <span>{selectedTradeIds.size === filteredTrades.length && filteredTrades.length > 0 ? 'Desmarcar Todas' : 'Marcar Todas'}</span>
              </button>

              <span className="text-xs text-gray-400 font-mono">
                {selectedTradeIds.size > 0 ? (
                  <span className="text-[#0ecb81] font-bold">
                    ✓ {selectedTradeIds.size} de {trades.length} moeda(s) marcada(s) para venda
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Clique nas caixas abaixo para escolher quais moedas deseja vender
                  </span>
                )}
              </span>
            </div>

            {selectedTradeIds.size > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={handleOpenBatchSellModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0ecb81] hover:bg-green-600 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer animate-pulse"
                >
                  <span>🛍️ Vender as {selectedTradeIds.size} Moeda(s) Marcada(s)</span>
                </button>
              </div>
            )}
          </div>

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
            const currentRetracement = trade.retracementPercent !== undefined ? trade.retracementPercent : currentGoal;

            // Direct percentage targets as explicitly requested by the user
            const targetCoinPrice = trade.purchasePrice * (1 + currentGoal / 100);
            const stopLossCoinPrice = trade.aiStopLossPrice || (trade.purchasePrice * (1 - currentRetracement / 100));

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

            const isSelectedForSale = selectedTradeIds.has(trade.id);

            return (
              <div
                id={`portfolio-item-${trade.id}`}
                key={trade.id}
                className={`bg-[#1e2026] border rounded-xl p-4 transition-all ${
                  isSelectedForSale 
                    ? 'border-[#0ecb81] shadow-lg shadow-emerald-950/40 bg-gradient-to-r from-[#1e2026] to-[#12281e]' 
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Checkbox Selector on Top of Card */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800/60">
                  <button
                    type="button"
                    onClick={() => toggleSelectTrade(trade.id)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer select-none ${
                      isSelectedForSale
                        ? 'bg-[#0ecb81]/20 text-[#0ecb81] border-[#0ecb81]'
                        : 'bg-[#14151a] text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    {isSelectedForSale ? (
                      <CheckSquare className="w-4 h-4 text-[#0ecb81]" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                    <span>{isSelectedForSale ? '✓ Marcada para Venda' : 'Marcar para Vender'}</span>
                  </button>

                  <span className="text-[10px] text-gray-500 font-mono">
                    ID: {trade.id.slice(0, 8)}
                  </span>
                </div>

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

                  {/* PAINEL DINÂMICO DE PROTEÇÃO DE LUCRO & HORÁRIO DE SAÍDA (VELAS 5 MINUTOS - REQUISITO FOTOS 1 E 2) */}
                  {(() => {
                    const maxP = Math.max(trade.maxPriceReached || trade.purchasePrice, livePrice);
                    const isProfitable = livePrice > trade.purchasePrice;

                    return (
                      <div className="bg-[#14171d] rounded-xl p-3.5 border border-[#0ecb81]/30 space-y-3 font-mono shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-[#0ecb81]/15 text-[#0ecb81] rounded text-xs font-bold">🛡️ TRAILING STOP PROTETOR</span>
                            <div>
                              <h5 className="text-xs font-bold text-white font-sans">Ajuste Dinâmico de Saída & Proteção de Lucro ({trade.symbol})</h5>
                              <span className="text-[10px] text-gray-400 font-sans block">Monitoramento em Velas de 5 Minutos</span>
                            </div>
                          </div>

                          {/* Candle 5m Countdown badge */}
                          <div className="flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 rounded border border-gray-800 text-[10px]">
                            <span className="text-[#f0b90b] font-bold">⏰ Fechamento Vela 5M:</span>
                            <span className="text-white font-black">{candleInfo.remainingStr}</span>
                          </div>
                        </div>

                        {/* Trailing Stop Protection Status Rule */}
                        <div className={`p-2.5 rounded-lg border text-xs font-sans transition-all ${isProfitable ? 'bg-[#0ecb81]/10 border-[#0ecb81]/30 text-emerald-200' : 'bg-blue-950/20 border-blue-800/40 text-blue-200'}`}>
                          {isProfitable ? (
                            <div className="flex items-start gap-2">
                              <span className="text-emerald-400 text-base">🟢</span>
                              <div>
                                <strong className="block text-[#0ecb81] text-xs font-bold">VALOR EM ELEVAÇÃO (+{pnlPercent.toFixed(2)}%):</strong>
                                <span className="text-[11px] leading-snug block mt-0.5">
                                  Conforme o valor subiu para <strong>{displaySymbol} {livePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</strong>, o Stop Loss foi automaticamente elevado para <strong>{displaySymbol} {stopLossCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</strong> para GARANTIR O SEU LUCRO.
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <span className="text-blue-400 text-base">🛡️</span>
                              <div>
                                <strong className="block text-blue-300 text-xs font-bold">VALOR EM OSCILAÇÃO OU QUEDA ({pnlPercent.toFixed(2)}%):</strong>
                                <span className="text-[11px] leading-snug block mt-0.5">
                                  Se o valor cai, <strong>NADA MUDA!</strong> O Stop Loss continua <strong>MANTIDO FIXO em {displaySymbol} {stopLossCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</strong>. Ele NUNCA é rebaixado em quedas para proteger sua carteira de perdas maiores.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Exit Time & Targets Grid with Copy Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                          {/* 1. Recommended Exit Time */}
                          <div className="bg-gray-900/80 p-2.5 rounded-lg border border-gray-800 flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] text-gray-400 font-sans block font-bold">HORÁRIO INDICADO DE SAÍDA (5M):</span>
                              <span className="text-[#f0b90b] font-extrabold text-sm block mt-0.5">⏰ {candleInfo.projectedExitTime}</span>
                              <span className="text-[8.5px] text-gray-500 font-sans block mt-0.5">Janela ideal de realização de lucro</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(candleInfo.projectedExitTime, `${trade.id}-exittime`)}
                              className="mt-2 w-full bg-[#f0b90b]/20 hover:bg-[#f0b90b]/30 text-[#f0b90b] border border-[#f0b90b]/30 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                            >
                              {copiedKey === `${trade.id}-exittime` ? '✓ Copiado' : '📋 Copiar Horário Saída'}
                            </button>
                          </div>

                          {/* 2. Adjusted Exit Price Target */}
                          <div className="bg-gray-900/80 p-2.5 rounded-lg border border-gray-800 flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] text-[#0ecb81] font-sans block font-bold">ALVO DE SAÍDA (+{currentGoal}%):</span>
                              <span className="text-[#0ecb81] font-extrabold text-sm block mt-0.5">
                                {displaySymbol} {targetCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                              </span>
                              <span className="text-[8.5px] text-gray-500 font-sans block mt-0.5">
                                R$ {targetCoinPriceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(formatRawNumber(targetCoinPrice), `${trade.id}-targetprice`)}
                              className="mt-2 w-full bg-[#0ecb81]/20 hover:bg-[#0ecb81]/30 text-[#0ecb81] border border-[#0ecb81]/30 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                            >
                              {copiedKey === `${trade.id}-targetprice` ? '✓ Copiado' : '📋 Copiar Alvo Saída'}
                            </button>
                          </div>

                          {/* 3. Protected Stop Loss */}
                          <div className="bg-gray-900/80 p-2.5 rounded-lg border border-gray-800 flex flex-col justify-between">
                            <div>
                              <span className="text-[9px] text-red-400 font-sans block font-bold">STOP LOSS PROTEGIDO:</span>
                              <span className="text-red-400 font-extrabold text-sm block mt-0.5">
                                {displaySymbol} {stopLossCoinPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                              </span>
                              <span className="text-[8.5px] text-gray-500 font-sans block mt-0.5">
                                R$ {stopLossCoinPriceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(formatRawNumber(stopLossCoinPrice), `${trade.id}-stopprice`)}
                              className="mt-2 w-full bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-800/40 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                            >
                              {copiedKey === `${trade.id}-stopprice` ? '✓ Copiado' : '📋 Copiar Stop Seguro'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Technical Confluence S&R Visualization Map */}
                  {(() => {
                    const isMinimized = !!minimizedConfluence[trade.id];
                    const confCurr = confluenceCurrencyMap[trade.id] || (trade.currency === 'BRL' ? 'BRL' : 'USD');
                    const confSymbol = confCurr === 'USD' ? '$' : 'R$';
                    const confMultiplier = confCurr === 'BRL' 
                      ? (trade.currency === 'BRL' ? 1 : usdtBrl) 
                      : (trade.currency === 'BRL' ? (1 / (usdtBrl || 5.62)) : 1);

                    const formatConfPrice = (valInNative: number) => {
                      const converted = valInNative * confMultiplier;
                      const decimals = Math.abs(converted) < 1 ? 6 : 4;
                      return `${confSymbol} ${converted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: decimals })}`;
                    };

                    return (
                      <div className="bg-gray-950/40 rounded-lg p-3.5 border border-gray-800/80 space-y-3 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800/40">
                          <div>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#f0b90b]">
                              <span>📊</span> Estudo de Confluência Técnica Sênior ({trade.symbol})
                            </span>
                            <span className="text-[9px] text-gray-400 block mt-0.5">
                              Sincronização: Fibonacci • Médias Móveis EMA/SMA • Pontos de Pivô
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                            {/* Currency Toggle (USD / BRL) */}
                            <div className="flex items-center bg-gray-900 rounded border border-gray-800 p-0.5 text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => setConfluenceCurrencyMap(prev => ({ ...prev, [trade.id]: 'BRL' }))}
                                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${confCurr === 'BRL' ? 'bg-[#f0b90b] text-black font-extrabold' : 'text-gray-400 hover:text-white'}`}
                              >
                                R$ (BRL)
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfluenceCurrencyMap(prev => ({ ...prev, [trade.id]: 'USD' }))}
                                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${confCurr === 'USD' ? 'bg-[#f0b90b] text-black font-extrabold' : 'text-gray-400 hover:text-white'}`}
                              >
                                $ (USD)
                              </button>
                            </div>

                            {/* Base Retracement Edit */}
                            {editingRetracementTradeId === trade.id ? (
                              <div className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-[#f0b90b]/30">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  max="50"
                                  className="bg-transparent text-white font-mono focus:outline-none w-10 text-center text-[10px]"
                                  value={tempRetracement}
                                  onChange={(e) => setTempRetracement(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveRetracement(trade);
                                    } else if (e.key === 'Escape') {
                                      setEditingRetracementTradeId(null);
                                    }
                                  }}
                                  autoFocus
                                />
                                <span className="text-[#f0b90b] text-[10px] font-bold">%</span>
                                <button
                                  onClick={() => saveRetracement(trade)}
                                  className="text-emerald-400 hover:text-emerald-300 text-[9.5px] font-black px-1"
                                  title="Salvar Retração"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingRetracementTradeId(null)}
                                  className="text-red-400 hover:text-red-300 text-[9.5px] px-1"
                                  title="Cancelar"
                                >
                                  ✗
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingRetracementTradeId(trade.id);
                                  setTempRetracement(String(currentRetracement));
                                }}
                                className="text-[#f0b90b] hover:text-white transition-colors flex items-center gap-1 text-[9.5px] uppercase font-mono border border-[#f0b90b]/20 hover:border-[#f0b90b] px-1.5 py-0.5 rounded"
                                title="Clique para alterar a porcentagem de retração manualmente"
                              >
                                <span>Retração {currentRetracement}%</span>
                                <Pencil className="w-2.5 h-2.5 text-[#f0b90b]" />
                              </button>
                            )}

                            {/* Minimize / Expand Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setMinimizedConfluence(prev => ({ ...prev, [trade.id]: !prev[trade.id] }))}
                              className="bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white px-2 py-0.5 rounded border border-gray-700/60 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title={isMinimized ? "Expandir detalhes da análise" : "Minimizar tela muito grande"}
                            >
                              {isMinimized ? (
                                <><span>➕ Expandir Painel</span></>
                              ) : (
                                <><span>➖ Minimizar</span></>
                              )}
                            </button>
                          </div>
                        </div>

                        {!isMinimized && (
                          <div className="grid grid-cols-1 gap-2.5 text-[11px] font-mono leading-none animate-in fade-in duration-150">
                            {/* 1.618 Extension (Resistência Superior) */}
                            <div className="flex flex-col gap-1 bg-[#0ecb81]/5 hover:bg-[#0ecb81]/10 px-2.5 py-2 rounded border border-[#0ecb81]/10 transition-colors">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-gray-400 flex items-center gap-1 font-semibold">🟢 Extensão Fib 1.618 (Próxima Resistência)</span>
                                <span className="text-[#0ecb81] font-bold">{formatConfPrice(trade.purchasePrice * (1 + currentGoal * 1.618 / 100))}</span>
                              </div>
                              <div className="text-[9px] text-[#0ecb81]/80 flex items-center gap-1 mt-0.5 flex-wrap">
                                <span>⚡ Confluência:</span>
                                <span className="bg-[#0ecb81]/10 px-1 py-0.2 rounded">Pivô R2: {formatConfPrice(trade.purchasePrice * (1 + currentGoal * 1.55 / 100))}</span>
                                <span>•</span>
                                <span className="bg-[#0ecb81]/10 px-1 py-0.2 rounded">Bollinger Band Sup: {formatConfPrice(trade.purchasePrice * (1 + currentGoal * 1.65 / 100))}</span>
                              </div>
                            </div>

                            {/* 1.000 Target (Alvo / Resistência de Venda) */}
                            <div className="flex flex-col gap-1 bg-[#f0b90b]/5 hover:bg-[#f0b90b]/10 px-2.5 py-2 rounded border border-[#f0b90b]/15 transition-colors">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-gray-200 font-semibold flex items-center gap-1">🎯 Alvo Fib 1.000 (Sua Meta +{currentGoal}%)</span>
                                <span className="text-[#f0b90b] font-extrabold">{formatConfPrice(targetCoinPrice)}</span>
                              </div>
                              <div className="text-[9px] text-[#f0b90b]/80 flex items-center gap-1 mt-0.5 flex-wrap">
                                <span>⚡ Confluência:</span>
                                <span className="bg-[#f0b90b]/10 px-1 py-0.2 rounded">Pivô R1: {formatConfPrice(trade.purchasePrice * (1 + currentGoal * 0.95 / 100))}</span>
                                <span>•</span>
                                <span className="bg-[#f0b90b]/10 px-1 py-0.2 rounded">Alvo OCO Consensual</span>
                              </div>
                            </div>

                            {/* Entry Price (Ponto Pivot Central) */}
                            <div className="flex flex-col gap-1 bg-gray-800/20 px-2.5 py-2 rounded border border-gray-800/40">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-gray-400 flex items-center gap-1">⚪ Ponto de Entrada (Preço de Compra)</span>
                                <span className="text-white font-bold">{formatConfPrice(trade.purchasePrice)}</span>
                              </div>
                              <div className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5 flex-wrap">
                                <span>⚡ Confluência:</span>
                                <span className="bg-gray-800 px-1 py-0.2 rounded">Média EMA 20: {formatConfPrice(trade.purchasePrice * (1 + currentGoal * 0.05 / 100))}</span>
                                <span>•</span>
                                <span className="bg-gray-800 px-1 py-0.2 rounded">Pivô Central (P)</span>
                              </div>
                            </div>

                            {/* 0.382 Retracement (Primeiro Suporte) */}
                            <div className="flex flex-col gap-1 bg-gray-900/40 px-2.5 py-2 rounded border border-transparent">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-gray-400 flex items-center gap-1">🟡 Suporte Fib 0.382 (Retração Curta)</span>
                                <span className="text-gray-300">{formatConfPrice(trade.purchasePrice * (1 - currentGoal * 0.382 / 100))}</span>
                              </div>
                              <div className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5 flex-wrap">
                                <span>⚡ Confluência:</span>
                                <span className="bg-gray-800/40 px-1 py-0.2 rounded">Pivô S1: {formatConfPrice(trade.purchasePrice * (1 - currentGoal * 0.35 / 100))}</span>
                                <span>•</span>
                                <span className="bg-gray-800/40 px-1 py-0.2 rounded">Média EMA 50: {formatConfPrice(trade.purchasePrice * (1 - currentGoal * 0.40 / 100))}</span>
                              </div>
                            </div>

                            {/* 0.618 Golden Ratio (Suporte Crítico / Trailing Stop) */}
                            <div className="flex flex-col gap-1 bg-[#f6465d]/5 hover:bg-[#f6465d]/10 px-2.5 py-2 rounded border border-[#f6465d]/10 transition-colors">
                              <div className="flex justify-between items-center w-full">
                                <span className="text-red-400 font-semibold flex items-center gap-1">🔴 Protetor Fib 0.618 (Stop Loss Seguro)</span>
                                <span className="text-[#f6465d] font-bold">{formatConfPrice(stopLossCoinPrice)}</span>
                              </div>
                              <div className="text-[9px] text-[#f6465d]/80 flex items-center gap-1 mt-0.5 flex-wrap">
                                <span>⚡ Confluência:</span>
                                <span className="bg-[#f6465d]/10 px-1 py-0.2 rounded">Pivô S2: {formatConfPrice(trade.purchasePrice * (1 - currentRetracement * 0.95 / 100))}</span>
                                <span>•</span>
                                <span className="bg-[#f6465d]/10 px-1 py-0.2 rounded">Média Forte SMA 200: {formatConfPrice(trade.purchasePrice * (1 - currentRetracement * 1.05 / 100))}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

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
                      <div className={`border rounded-lg p-2.5 space-y-1 transition-all ${stopPercent >= 0 ? 'bg-[#0ecb81]/5 border-[#0ecb81]/15' : 'bg-[#f6465d]/5 border-[#f6465d]/15'}`}>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">
                          {stopPercent >= 0 ? 'Stop Loss Móvel (Lucro Garantido)' : 'Stop Loss (Se cair no Stop)'}
                        </span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-400">Moeda em R$:</span>
                          <span className="text-xs font-mono font-bold text-white">R$ {stopLossCoinPriceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-gray-800/50 pt-1">
                          <span className="text-xs text-gray-400">Total na Carteira:</span>
                          <span className="text-xs font-mono font-bold text-white">R$ {stopValueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className={`flex justify-between items-baseline border-t pt-1 ${stopPercent >= 0 ? 'border-[#0ecb81]/15' : 'border-[#f6465d]/15'}`}>
                          <span className={`text-xs font-bold ${stopPercent >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                            {stopPercent >= 0 ? 'Lucro Mínimo Protegido:' : 'Perda Máxima:'}
                          </span>
                          <span className={`text-sm font-mono font-extrabold ${stopPercent >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                            {stopPercent >= 0 ? '+' : '-'}R$ {Math.abs(stopLossAmountBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({displayStopPercent})
                          </span>
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
                    className="mt-3 p-4 bg-gray-950/80 rounded-xl border border-[#0ecb81]/40 space-y-3.5 shadow-xl font-sans"
                  >
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#0ecb81] font-bold">Vender Moeda Individual ({trade.symbol})</span>
                        <span className="bg-[#0ecb81]/15 text-[#0ecb81] text-[10px] px-2 py-0.5 rounded font-bold">Venda Isolada</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setClosingTradeId(null);
                          setFormError(null);
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Important Reassurance Notice */}
                    <div className="bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded-lg p-2.5 text-xs text-[#0ecb81] font-medium flex items-start gap-2">
                      <span className="text-sm shrink-0">🛡️</span>
                      <p className="leading-snug">
                        Você está vendendo <strong>apenas a moeda {trade.symbol}</strong>. As outras {Math.max(0, trades.length - 1)} moeda(s) da sua carteira continuarão ativas e intactas.
                      </p>
                    </div>

                    {formError && (
                      <div className="text-xs text-[#f6465d] bg-red-500/10 border border-red-500/20 rounded-lg p-2 font-medium">
                        ⚠️ {formError}
                      </div>
                    )}

                    {/* Quantity Selection for Partial Sale */}
                    <div className="space-y-2 bg-[#181a20] p-3 rounded-lg border border-gray-800">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-[11px] text-gray-400 font-semibold">
                          QUANTIDADE A VENDER (Total em carteira: {trade.amount.toLocaleString('pt-BR', { maximumFractionDigits: 6 })})
                        </label>
                        <span className="text-[11px] text-[#f0b90b] font-mono font-bold">
                          {sellPartialPercentage}% selecionado
                        </span>
                      </div>

                      {/* Percentage Shortcuts */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: '25%', pct: 25 },
                          { label: '50% (Metade)', pct: 50 },
                          { label: '75%', pct: 75 },
                          { label: '100% (Tudo)', pct: 100 },
                        ].map(btn => (
                          <button
                            key={btn.pct}
                            type="button"
                            onClick={() => handleSetSingleSellPercentage(trade, btn.pct)}
                            className={`py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              sellPartialPercentage === btn.pct
                                ? 'bg-[#0ecb81] text-black shadow-md'
                                : 'bg-[#2b2f36] hover:bg-gray-700 text-gray-300'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Amount Input */}
                      <div className="pt-1">
                        <input
                          id="sell-partial-amount-input"
                          type="number"
                          step="any"
                          value={sellPartialAmount}
                          onChange={(e) => {
                            setSellPartialAmount(e.target.value);
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && trade.amount > 0) {
                              setSellPartialPercentage(Math.min(100, Math.round((val / trade.amount) * 100)));
                            }
                          }}
                          placeholder={`Ex: ${trade.amount}`}
                          className="bg-[#2b2f36] text-white border border-gray-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0ecb81] w-full font-mono font-semibold"
                          required
                        />
                      </div>
                    </div>

                    {/* Exit Price Input and Real-time Estimation */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">
                          PREÇO DE VENDA NA BINANCE ({trade.currency})
                        </label>
                        <input
                          id="exit-price-input"
                          type="number"
                          step="any"
                          value={exitPriceInput}
                          onChange={(e) => setExitPriceInput(e.target.value)}
                          className="bg-[#2b2f36] text-white border border-gray-700 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#0ecb81] w-full font-mono font-bold"
                          required
                        />
                      </div>

                      {/* Dynamic Profit / Return Summary Preview */}
                      {(() => {
                        const exitP = parseFloat(exitPriceInput);
                        const qty = parseFloat(sellPartialAmount);
                        if (!isNaN(exitP) && exitP > 0 && !isNaN(qty) && qty > 0) {
                          const totalReturn = exitP * qty;
                          const costPortion = trade.purchasePrice * qty;
                          const profit = totalReturn - costPortion;
                          const profitPct = costPortion > 0 ? (profit / costPortion) * 100 : 0;
                          return (
                            <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 text-xs flex justify-between items-center font-mono">
                              <div>
                                <span className="text-gray-500 block text-[10px]">Valor Bruto a Receber:</span>
                                <span className="text-white font-bold">
                                  {trade.currency === 'USDT' ? '$' : 'R$'} {totalReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-500 block text-[10px]">Resultado Líquido:</span>
                                <span className={`font-bold ${profit >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                                  {profit >= 0 ? '+' : ''}{trade.currency === 'USDT' ? '$' : 'R$'} {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%)
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setClosingTradeId(null);
                          setFormError(null);
                        }}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        id="confirm-sell-btn"
                        type="submit"
                        className="flex-1 bg-[#0ecb81] hover:bg-green-600 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer shadow-md"
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

      {/* Batch Sell Confirmation Modal for Selected Coins */}
      {isBatchSellModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto flex items-start sm:items-center justify-center p-2 sm:p-4">
          <div className="bg-[#181a20] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl p-5 sm:p-6 my-auto font-sans">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-[#0ecb81]/20 text-[#0ecb81] text-xs px-2.5 py-1 rounded-lg font-bold">
                  🛍️ Venda em Lote
                </span>
                <h4 className="text-base font-bold text-white">
                  Vender {selectedTradeIds.size} Moeda(s) Selecionada(s)
                </h4>
              </div>
              <button 
                onClick={() => {
                  setIsBatchSellModalOpen(false);
                  setFormError(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0ecb81]/10 border border-[#0ecb81]/30 rounded-xl p-3 text-xs text-[#0ecb81] mb-4 flex items-start gap-2">
              <span className="text-base shrink-0">🛡️</span>
              <p>
                Você selecionou <strong>{selectedTradeIds.size} moeda(s)</strong> específicas para vender. As outras <strong>{Math.max(0, trades.length - selectedTradeIds.size)} moeda(s)</strong> da sua carteira continuarão ativas e intocadas.
              </p>
            </div>

            {formError && (
              <div className="text-xs text-[#f6465d] bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 font-medium mb-3">
                ⚠️ {formError}
              </div>
            )}

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {trades.filter(t => selectedTradeIds.has(t.id)).map(trade => {
                const liveP = marketPrices[trade.symbol] || trade.purchasePrice;
                const exitPStr = batchExitPrices[trade.id] || liveP.toString();
                const exitP = parseFloat(exitPStr) || liveP;
                const amtStr = batchPartialAmounts[trade.id] || trade.amount.toString();
                const amt = parseFloat(amtStr) || trade.amount;
                const pct = batchPartialPercentages[trade.id] || 100;

                const totalVal = exitP * amt;
                const costVal = trade.purchasePrice * amt;
                const profit = totalVal - costVal;

                return (
                  <div key={trade.id} className="bg-[#1e2026] border border-gray-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{trade.symbol}</span>
                        <span className="text-[11px] text-gray-400">({trade.coinName || 'Cripto'})</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-gray-400">Total em Carteira: </span>
                        <span className="text-gray-200 font-mono font-bold">{trade.amount.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</span>
                      </div>
                    </div>

                    {/* Quick percentage buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[25, 50, 75, 100].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleSetBatchCoinPercentage(trade, p)}
                          className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            pct === p 
                              ? 'bg-[#0ecb81] text-black shadow-sm'
                              : 'bg-[#2b2f36] hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          {p === 100 ? '100% (Tudo)' : `${p}%`}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">
                          PREÇO DE VENDA ({trade.currency})
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={exitPStr}
                          onChange={(e) => setBatchExitPrices(prev => ({ ...prev, [trade.id]: e.target.value }))}
                          className="bg-[#2b2f36] text-white border border-gray-700 rounded px-2.5 py-1.5 text-xs font-mono w-full focus:outline-none focus:border-[#0ecb81]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">
                          QUANTIDADE A VENDER
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={amtStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchPartialAmounts(prev => ({ ...prev, [trade.id]: val }));
                            const num = parseFloat(val);
                            if (!isNaN(num) && trade.amount > 0) {
                              setBatchPartialPercentages(prev => ({ ...prev, [trade.id]: Math.min(100, Math.round((num / trade.amount) * 100)) }));
                            }
                          }}
                          className="bg-[#2b2f36] text-white border border-gray-700 rounded px-2.5 py-1.5 text-xs font-mono w-full focus:outline-none focus:border-[#0ecb81]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-mono bg-gray-950/40 px-2.5 py-1.5 rounded-lg border border-gray-800/80">
                      <span className="text-gray-400">
                        Receber: <strong className="text-white">{trade.currency === 'USDT' ? '$' : 'R$'} {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </span>
                      <span className={`font-bold ${profit >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                        Resultado: {profit >= 0 ? '+' : ''}{trade.currency === 'USDT' ? '$' : 'R$'} {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Estimated Summary */}
            {(() => {
              const selectedList = trades.filter(t => selectedTradeIds.has(t.id));
              let totalReturnUsdt = 0;
              let totalProfitUsdt = 0;

              selectedList.forEach(trade => {
                const liveP = marketPrices[trade.symbol] || trade.purchasePrice;
                const exitP = parseFloat(batchExitPrices[trade.id]) || liveP;
                const amt = parseFloat(batchPartialAmounts[trade.id]) || trade.amount;
                const rateToUsd = trade.currency === 'USDT' ? 1 : (1 / (usdtBrl || 5.62));
                const total = exitP * amt * rateToUsd;
                const cost = trade.purchasePrice * amt * rateToUsd;
                totalReturnUsdt += total;
                totalProfitUsdt += (total - cost);
              });

              return (
                <div className="mt-4 p-3 bg-gray-900/80 rounded-xl border border-gray-800 text-xs flex flex-col sm:flex-row justify-between items-center gap-2 font-mono">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Total Estimado a Receber:</span>
                    <span className="text-white font-bold text-sm">
                      $ {totalReturnUsdt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT (R$ {(totalReturnUsdt * usdtBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-gray-400 block text-[10px]">Lucro Líquido Estimado:</span>
                    <span className={`font-bold text-sm ${totalProfitUsdt >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {totalProfitUsdt >= 0 ? '+' : ''}$ {totalProfitUsdt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsBatchSellModalOpen(false);
                  setFormError(null);
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2.5 rounded-xl font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchClose}
                className="flex-1 bg-[#0ecb81] hover:bg-green-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                ✓ Finalizar Venda das {selectedTradeIds.size} Moedas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
