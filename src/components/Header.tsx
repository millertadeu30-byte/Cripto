import React, { useState } from 'react';
import { Eye, EyeOff, PlusCircle, RefreshCw, AlertCircle, BookOpen, TrendingUp, HelpCircle } from 'lucide-react';
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
}

export default function Header({
  trades,
  usdtBrl,
  marketPrices,
  onAddTradeClick,
  onReanalyzeClick,
  onGuideClick,
  isAnalyzing,
  lastAnalysisTime
}: HeaderProps) {
  const [hideBalances, setHideBalances] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'spot' | 'alpha' | 'fundos'>('spot');

  // Compute total active balance in BRL
  let totalBrl = 0;
  let totalInvestmentBrl = 0;

  trades.forEach(trade => {
    // Get live price in USDT or default to purchasePrice if not loaded yet
    const livePriceUsd = marketPrices[trade.symbol] || trade.purchasePrice;
    
    // Calculate current value in its respective currency
    const currentValue = livePriceUsd * trade.amount;
    const purchaseValue = trade.purchasePrice * trade.amount;

    if (trade.currency === 'BRL') {
      totalBrl += currentValue;
      totalInvestmentBrl += purchaseValue;
    } else {
      // Convert USD/USDT to BRL
      totalBrl += currentValue * usdtBrl;
      totalInvestmentBrl += purchaseValue * usdtBrl;
    }
  });

  // Calculate current PNL
  const pnlBrl = totalBrl - totalInvestmentBrl;
  const pnlPercent = totalInvestmentBrl > 0 ? (pnlBrl / totalInvestmentBrl) * 100 : 0;

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
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Valor total estimado</span>
            <button 
              id="hide-balance-toggle"
              onClick={() => setHideBalances(!hideBalances)} 
              className="text-gray-400 hover:text-white transition-colors"
              title={hideBalances ? "Mostrar saldos" : "Ocultar saldos"}
            >
              {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <span id="estimated-balance-value" className="text-3xl font-extrabold text-white font-sans tracking-tight">
              {hideBalances ? "••••••" : `R$ ${totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span className="text-xs text-gray-400 font-mono">BRL</span>
          </div>

          {/* Today's / Total PNL Tracker */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">PNL Acumulado:</span>
            <span 
              id="pnl-status-display"
              className={`font-semibold flex items-center gap-0.5 ${pnlBrl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}
            >
              {pnlBrl >= 0 ? '+' : ''}
              {hideBalances ? "••••" : `R$ ${pnlBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              <span>({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</span>
            </span>
            {trades.length > 0 && pnlBrl >= 0 && (
              <span className="bg-[#0ecb81]/15 text-[#0ecb81] text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                Lucrando 🔥
              </span>
            )}
          </div>
        </div>

        {/* Real-time Status / Re-evaluation trigger */}
        <div className="flex flex-col md:items-end gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
            <div>
              <span className="text-gray-500">Taxa Câmbio:</span> <span className="text-white">1 USDT = R$ {usdtBrl.toFixed(2)}</span>
            </div>
            {lastAnalysisTime && (
              <div>
                <span className="text-gray-500">Última Análise:</span> <span className="text-white">{lastAnalysisTime.toLocaleTimeString('pt-BR')}</span>
              </div>
            )}
          </div>

          <button
            id="reanalyze-now-btn"
            onClick={onReanalyzeClick}
            disabled={isAnalyzing}
            className={`bg-[#f0b90b] hover:bg-[#d4a30a] text-black rounded-xl px-5 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#f0b90b]/10 cursor-pointer ${isAnalyzing ? 'opacity-50 cursor-not-allowed animate-pulse' : 'animate-pulse-subtle'}`}
          >
            <RefreshCw className={`w-4 h-4 text-black ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? "Estudando Mercado com IA..." : "🤖 Analisar Agora & Atualizar Sinais"}
          </button>
          
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-[#f0b90b]" />
            <span>Dados de preços reais importados via API Pública da Binance.</span>
          </div>
        </div>

      </div>

    </header>
  );
}
