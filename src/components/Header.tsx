import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, PlusCircle, RefreshCw, AlertCircle, BookOpen, TrendingUp, HelpCircle, Pencil, Check, X } from 'lucide-react';
import { Trade } from '../types';

interface HeaderProps {
  trades: Trade[];
  usdtBrl: number;
  marketPrices: { [key: string]: number };
  onAddTradeClick: () => void;
  onReanalyzeClick: () => void;
  onGuideClick: () => void;
  isAnalyzing: boolean;
  lastAnalysisTime: Date | null;
  displayCurrency: 'BRL' | 'USDT' | 'BTC';
  onChangeDisplayCurrency: (val: 'BRL' | 'USDT' | 'BTC') => void;
  cashBalance: number;
  cashBalanceCurrency: 'BRL' | 'USDT';
  onUpdateCashBalance?: (amount: number, currency: 'BRL' | 'USDT') => void;
}

export default function Header({
  trades,
  usdtBrl,
  marketPrices,
  onAddTradeClick,
  onReanalyzeClick,
  onGuideClick,
  isAnalyzing,
  lastAnalysisTime,
  displayCurrency,
  onChangeDisplayCurrency,
  cashBalance,
  cashBalanceCurrency,
  onUpdateCashBalance
}: HeaderProps) {
  const [hideBalances, setHideBalances] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'spot' | 'alpha' | 'fundos'>('spot');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // Cash balance inline editor states
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [editCashVal, setEditCashVal] = useState(cashBalance.toString());
  const [editCashCurr, setEditCashCurr] = useState<'BRL' | 'USDT'>(cashBalanceCurrency);

  // Sync editor with state updates
  useEffect(() => {
    setEditCashVal(cashBalance.toString());
    setEditCashCurr(cashBalanceCurrency);
  }, [cashBalance, cashBalanceCurrency]);

  const handleSaveCashEdit = () => {
    const val = parseFloat(editCashVal) || 0;
    if (onUpdateCashBalance) {
      onUpdateCashBalance(val, editCashCurr);
    }
    setIsEditingCash(false);
  };

  // Compute total active balance in BRL
  let totalBrl = 0;
  let totalInvestmentBrl = 0;

  // 1. Add crypto holdings
  trades.forEach(trade => {
    // Determine the live price of the coin in BRL
    let livePriceBrl = 0;
    const rate = usdtBrl || 5.62;
    
    // Get raw live price (it is in BRL for BRL coins, USDT for USDT coins)
    const rawLivePrice = marketPrices[trade.symbol] || trade.currentPrice;
    
    if (trade.currency === 'BRL') {
      livePriceBrl = rawLivePrice;
    } else {
      livePriceBrl = rawLivePrice * rate;
    }

    // Now calculate the current value in BRL
    const currentValueBrl = livePriceBrl * trade.amount;
    
    // Calculate purchase value in BRL using our precise purchasePriceInBrl
    const purchaseValueBrl = (trade.purchasePriceInBrl || (trade.currency === 'BRL' ? trade.purchasePrice : trade.purchasePrice * rate)) * trade.amount;

    totalBrl += currentValueBrl;
    totalInvestmentBrl += purchaseValueBrl;
  });

  // 2. Add available cash/wallet balance
  const rate = usdtBrl || 5.62;
  const cashBalanceBrl = cashBalanceCurrency === 'BRL' ? cashBalance : cashBalance * rate;
  
  // Save crypto-only BRL total for breakdown
  const cryptoOnlyBrl = totalBrl;

  // Add cash to both current and investment totals (cash has 1:1 worth, PNL is 0)
  totalBrl += cashBalanceBrl;
  totalInvestmentBrl += cashBalanceBrl;

  // Calculate current PNL
  const pnlBrl = totalBrl - totalInvestmentBrl;
  // Calculate non-diluted crypto investment to represent actual asset variation
  const cryptoInvestmentBrl = totalInvestmentBrl - cashBalanceBrl;
  const pnlPercent = cryptoInvestmentBrl > 0 ? (pnlBrl / cryptoInvestmentBrl) * 100 : 0;

  // Real-time currency conversions for the header summary
  const btcUsdtPrice = marketPrices['BTCUSDT'] || 91520.40;
  const btcBrlPrice = btcUsdtPrice * (usdtBrl || 5.62);
  const totalUsdt = totalBrl / (usdtBrl || 5.62);
  const totalBtc = totalBrl / btcBrlPrice;

  return (
    <header id="app-header" className="bg-[#181a20] border-b border-gray-800 text-[#eaecef] font-sans">
      
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#1e2026] border-b border-gray-900">
        <div className="flex items-center gap-3">
          <img 
            src="/src/assets/images/crypto_assistant_logo_1784491971886.jpg" 
            alt="Binance Assistant Logo" 
            className="w-10 h-10 rounded-xl border border-gray-800 shadow-md object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
              BINANCE <span className="text-[#f0b90b] font-extrabold text-[10px] bg-[#f0b90b]/10 px-1.5 py-0.5 rounded">ASSISTENTE IA</span>
            </h1>
            <p className="text-[9px] text-gray-400">Consultor Sênior de Sinais Spot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0ecb81] animate-pulse"></span>
          <span className="text-[9px] text-gray-400 font-mono font-semibold">CONEXÃO DIRECTA</span>
        </div>
      </div>

      {/* Top Bar Tabs - Replicating Binance Tab Bar */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-gray-900">
        <div className="flex gap-6 text-sm font-medium">
          <button
            id="tab-geral-btn"
            onClick={() => setActiveTab('geral')}
            className={`pb-1 border-b-2 transition-all ${activeTab === 'geral' ? 'text-white border-[#f0b90b]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            Visão Geral
          </button>
          <button
            id="tab-spot-btn"
            onClick={() => setActiveTab('spot')}
            className={`pb-1 border-b-2 transition-all ${activeTab === 'spot' ? 'text-white border-[#f0b90b]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            Spot (Minha Carteira)
          </button>
          <button
            id="tab-alpha-btn"
            onClick={() => setActiveTab('alpha')}
            className={`pb-1 border-b-2 transition-all ${activeTab === 'alpha' ? 'text-white border-[#f0b90b]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            Alpha
          </button>
          <button
            id="tab-fundos-btn"
            onClick={() => setActiveTab('fundos')}
            className={`pb-1 border-b-2 transition-all ${activeTab === 'fundos' ? 'text-white border-[#f0b90b]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            Fundos
          </button>
        </div>

        {/* Action Shortcut Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="guide-btn"
            onClick={onGuideClick}
            className="bg-gray-800/60 hover:bg-gray-800 text-[#f0b90b] border border-gray-700/60 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" /> Guia Iniciante
          </button>
          
          <button
            id="add-operation-btn"
            onClick={onAddTradeClick}
            className="bg-[#f0b90b] hover:bg-[#d4a30a] text-black rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Adicionar Operação
          </button>
        </div>
      </div>

      {/* Main Stats Panel - High Fidelity mimicking screenshot */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        
        {/* Balance Section */}
        <div className="space-y-1 animate-in fade-in slide-in-from-left-5 duration-300">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Valor total estimado</span>
            <button 
              id="hide-balance-toggle"
              onClick={() => setHideBalances(!hideBalances)} 
              className="text-gray-400 hover:text-white transition-colors"
              title={hideBalances ? "Mostrar saldos" : "Ocultar saldos"}
            >
              {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {isAnalyzing && (
              <span className="text-[10px] text-[#f0b90b] animate-pulse flex items-center gap-1.5 bg-[#f0b90b]/10 px-2 py-0.5 rounded-full border border-[#f0b90b]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] animate-ping"></span>
                Atualizando cotações...
              </span>
            )}
          </div>

          <div className="flex flex-col relative">
            <div className="flex items-baseline gap-2 relative">
              <span id="estimated-balance-value" className={`text-3xl font-extrabold text-white font-sans tracking-tight transition-all ${isAnalyzing ? 'opacity-70 animate-pulse' : ''}`}>
                {hideBalances ? "••••••••" : (
                  displayCurrency === 'BTC' 
                    ? totalBtc.toLocaleString('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 }) 
                    : displayCurrency === 'USDT' 
                      ? totalUsdt.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 8 }) 
                      : `R$ ${totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </span>
              
              {/* Dropdown Selector for Display Currency */}
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  id="display-currency-selector"
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex items-center gap-1 text-[10px] text-gray-300 font-bold hover:text-white bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/60 cursor-pointer transition-colors uppercase font-sans"
                >
                  <span>{displayCurrency}</span>
                  <span className="text-[8px]">▼</span>
                </button>
                
                {showCurrencyDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowCurrencyDropdown(false)} 
                    />
                    <div className="absolute left-0 mt-1 w-24 rounded-md shadow-lg bg-[#1e2026] border border-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                      <div className="py-1">
                        {(['BRL', 'USDT', 'BTC'] as const).map((curr) => (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => {
                              onChangeDisplayCurrency(curr);
                              setShowCurrencyDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold ${displayCurrency === curr ? 'bg-[#f0b90b] text-black font-bold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                          >
                            {curr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Subtext equivalent */}
            <div className="text-xs text-gray-400 font-medium mt-1">
              {hideBalances ? "••••" : (
                displayCurrency === 'BTC' 
                  ? `≈ ${totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} R$` 
                  : displayCurrency === 'USDT' 
                    ? `≈ ${totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} R$` 
                    : `≈ ${totalUsdt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
              )}
            </div>

            {/* Breakdown of Cripto and Cash */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center gap-4 text-xs text-gray-400 font-sans flex-wrap">
                <div>
                  <span className="text-gray-500">Ativos Cripto:</span>{' '}
                  <span className="text-gray-200 font-mono font-bold">
                    {hideBalances ? "••••" : (
                      displayCurrency === 'BTC'
                        ? `${(cryptoOnlyBrl / btcBrlPrice).toFixed(8)} BTC`
                        : displayCurrency === 'USDT'
                          ? `$ ${(cryptoOnlyBrl / (usdtBrl || 5.62)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                          : `R$ ${cryptoOnlyBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Saldo em Caixa:</span>{' '}
                  {isEditingCash ? (
                    <div className="flex items-center gap-1 bg-[#1e2026] border border-[#f0b90b]/40 rounded px-1.5 py-0.5 animate-in fade-in zoom-in-95 duration-150">
                      <input 
                        id="inline-cash-input"
                        type="number"
                        step="any"
                        className="w-16 bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                        value={editCashVal}
                        onChange={(e) => setEditCashVal(e.target.value)}
                        autoFocus
                      />
                      <select 
                        id="inline-cash-currency"
                        className="bg-transparent text-[#f0b90b] font-bold text-[10px] focus:outline-none cursor-pointer pr-1"
                        value={editCashCurr}
                        onChange={(e) => setEditCashCurr(e.target.value as 'BRL' | 'USDT')}
                      >
                        <option value="BRL" className="bg-[#181a20] text-white">BRL</option>
                        <option value="USDT" className="bg-[#181a20] text-white">USDT</option>
                      </select>
                      <button 
                        id="inline-cash-confirm-btn"
                        onClick={handleSaveCashEdit}
                        className="p-0.5 hover:bg-gray-800 rounded text-[#0ecb81]"
                        title="Confirmar alteração"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button 
                        id="inline-cash-cancel-btn"
                        onClick={() => setIsEditingCash(false)}
                        className="p-0.5 hover:bg-gray-800 rounded text-[#f6465d]"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-300 font-mono font-bold">
                        {hideBalances ? "••••" : (
                          displayCurrency === 'BTC'
                            ? `${(cashBalanceBrl / btcBrlPrice).toFixed(8)} BTC`
                            : displayCurrency === 'USDT'
                              ? `$ ${(cashBalanceBrl / (usdtBrl || 5.62)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                              : `R$ ${cashBalanceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        )}
                      </span>
                      {!hideBalances && (
                        <button 
                          id="edit-cash-trigger-btn"
                          onClick={() => {
                            setEditCashVal(cashBalance.toString());
                            setEditCashCurr(cashBalanceCurrency);
                            setIsEditingCash(true);
                          }}
                          className="p-0.5 hover:bg-gray-800 rounded transition-colors"
                          title="Ajustar dinheiro em caixa"
                        >
                          <Pencil className="w-3 h-3 text-[#f0b90b]" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Explanatory helpful tip to avoid double counting confusion */}
              {!hideBalances && (
                <div className="text-xs text-gray-400/90 font-sans mt-2.5 max-w-lg leading-relaxed flex items-start gap-2 bg-[#f0b90b]/5 p-3 rounded-lg border border-[#f0b90b]/20">
                  <AlertCircle className="w-3.5 h-3.5 text-[#f0b90b] shrink-0 mt-0.5" />
                  <span>
                    O <strong>Valor total estimado</strong> soma os seus ativos de cripto (R$ {cryptoOnlyBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) com o seu dinheiro em caixa (R$ {cashBalanceBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Se você já usou todo o dinheiro para comprar os ativos, edite o Saldo em Caixa para <strong>R$ 0,00</strong> clicando no lápis amarelo ao lado.
                  </span>
                </div>
              )}
            </div>

            {/* Discrete Active Investments Breakdown per Asset on Main Panel */}
            {!hideBalances && trades.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2 max-w-2xl">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                  <span className="flex items-center gap-1.5 text-white">
                    <span className="text-[#f0b90b]">💼</span> Investimentos Ativos ({trades.length})
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Desaparece ao vender</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {trades.map(trade => {
                    const rate = usdtBrl || 5.62;
                    const rawLivePrice = marketPrices[trade.symbol] || trade.currentPrice;
                    const livePriceBrl = trade.currency === 'BRL' ? rawLivePrice : rawLivePrice * rate;
                    const currentValueBrl = livePriceBrl * trade.amount;
                    
                    const purchasePriceBrl = trade.purchasePriceInBrl || (trade.currency === 'BRL' ? trade.purchasePrice : trade.purchasePrice * rate);
                    const totalInvestedBrl = purchasePriceBrl * trade.amount;
                    
                    const itemPnlBrl = currentValueBrl - totalInvestedBrl;
                    const itemPnlPercent = totalInvestedBrl > 0 ? (itemPnlBrl / totalInvestedBrl) * 100 : 0;
                    const isProfitable = itemPnlBrl >= 0;

                    const displaySymbol = trade.currency === 'USDT' ? '$' : 'R$';
                    const nativeInvested = trade.totalInvested || (trade.purchasePrice * trade.amount);
                    const nativeCurrent = (marketPrices[trade.symbol] || trade.currentPrice) * trade.amount;

                    return (
                      <div 
                        key={trade.id} 
                        className="bg-[#1e2026] border border-gray-800/80 hover:border-gray-700/80 rounded-xl p-2.5 flex items-center justify-between text-xs transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white font-sans">{trade.symbol}</span>
                            <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{trade.coinName}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            <span>Investido: </span>
                            <span className="text-gray-300 font-bold">{displaySymbol} {nativeInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-0.5 font-mono">
                          <div className="text-white font-bold text-[11px]">
                            {displaySymbol} {nativeCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[10px] font-bold ${isProfitable ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                            {isProfitable ? '+' : ''}{displaySymbol} {Math.abs(nativeCurrent - nativeInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({itemPnlPercent >= 0 ? '+' : ''}{itemPnlPercent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Today's / Total PNL Tracker */}
          <div className="flex items-center gap-2 text-xs flex-wrap mt-3 font-sans">
            <span className="text-gray-400 font-medium">PNL de Hoje:</span>
            <span 
              id="pnl-status-display"
              className={`font-bold flex items-center gap-0.5 ${pnlBrl > 0 ? 'text-[#0ecb81]' : pnlBrl < 0 ? 'text-[#f6465d]' : 'text-gray-400'}`}
            >
              {pnlBrl > 0 ? '+' : ''}
              {hideBalances ? "••••" : `R$ ${pnlBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              <span className="ml-1 font-semibold">({pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
            </span>
            
            {pnlBrl > 0 ? (
              <span className="bg-[#0ecb81]/15 text-[#0ecb81] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 border border-[#0ecb81]/25">
                LUCRANDO 🔥
              </span>
            ) : pnlBrl < 0 ? (
              <span className="bg-[#f6465d]/15 text-[#f6465d] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 border border-[#f6465d]/25">
                PREJUÍZO 📉
              </span>
            ) : (
              <span className="bg-[#2d3139]/50 text-gray-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 border border-gray-700/40">
                SEM ALTERAÇÃO ⚖️
              </span>
            )}
          </div>

          {/* Real-time Exchange Rate & Last Analysis Info */}
          <div className="flex items-center gap-6 text-xs text-gray-400 font-sans mt-2.5 flex-wrap">
            <div>
              <span className="text-gray-500 font-medium">Taxa Câmbio:</span>{' '}
              <span className="text-gray-200 font-mono font-bold">1 USDT = R$ {usdtBrl.toFixed(2)}</span>
            </div>
            {lastAnalysisTime && (
              <div>
                <span className="text-gray-500 font-medium">Última Análise:</span>{' '}
                <span className="text-gray-200 font-mono font-bold">{lastAnalysisTime.toLocaleTimeString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Status / Re-evaluation trigger */}
        <div className="flex flex-col md:items-end gap-2 self-end">
          <button
            id="reanalyze-now-btn"
            onClick={onReanalyzeClick}
            disabled={isAnalyzing}
            className={`w-full md:w-auto bg-[#f0b90b] hover:bg-[#d4a30a] text-black rounded-xl px-5 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#f0b90b]/10 cursor-pointer ${isAnalyzing ? 'opacity-50 cursor-not-allowed animate-pulse' : 'animate-pulse-subtle'}`}
          >
            <RefreshCw className={`w-4 h-4 text-black ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? "Estudando Mercado com IA..." : "🤖 Analisar Agora & Atualizar Sinais"}
          </button>
          
          <div className="text-[10px] text-gray-500 flex items-center gap-1.5 justify-center md:justify-end mt-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#f0b90b] shrink-0" />
            <span>Dados de preços reais importados via API Pública da Binance.</span>
          </div>
        </div>

      </div>

    </header>
  );
}
