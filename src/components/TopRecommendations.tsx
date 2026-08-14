import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, ArrowUpRight, Sliders, Calculator, 
  AlertOctagon, Zap, Layers, BadgeInfo, Clock, Search,
  Flame, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { Recommendation } from '../types';
import { analyze5MinCandle } from '../utils/candleUtils';

interface TopRecommendationsProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onBuyClick: (rec: Recommendation) => void;
  usdtBrl?: number;
}

type CategoryType = 'Todas' | 'Memes' | 'Trending & Novas' | 'Layer 1 / Layer 2' | 'AI & Big Data' | 'DeFi & RWA';

const CATEGORY_TABS: { id: CategoryType; label: string; icon: string; badge?: string }[] = [
  { id: 'Todas', label: 'Todas as Criptos', icon: '🌟' },
  { id: 'Memes', label: 'Memecoins (PEPE, SHIB, DOGE...)', icon: '🐸', badge: 'Alta Volatilidade' },
  { id: 'Trending & Novas', label: 'Altcoins em Alta (AVNT, SUI...)', icon: '🚀', badge: 'Hot' },
  { id: 'AI & Big Data', label: 'IA & Big Data (FET, TAO...)', icon: '🤖' },
  { id: 'Layer 1 / Layer 2', label: 'Top Altcoins L1/L2 (SOL, AVAX...)', icon: '⚡' },
  { id: 'DeFi & RWA', label: 'DeFi & RWA (AAVE, ONDO...)', icon: '🏦' }
];

const POPULAR_QUICK_COINS = [
  { base: 'PEPE', label: '🐸 PEPE', category: 'Memes' },
  { base: 'DOGE', label: '🐕 DOGE', category: 'Memes' },
  { base: 'SHIB', label: '🐶 SHIB', category: 'Memes' },
  { base: 'BONK', label: '🦴 BONK', category: 'Memes' },
  { base: 'WIF', label: '🎩 WIF', category: 'Memes' },
  { base: 'NEIRO', label: '🐱 NEIRO', category: 'Memes' },
  { base: 'FLOKI', label: '🛡️ FLOKI', category: 'Memes' },
  { base: 'SOL', label: '☀️ SOL', category: 'Layer 1 / Layer 2' },
  { base: 'AVNT', label: '🔥 AVNT', category: 'Trending & Novas' },
  { base: 'HOME', label: '🏠 HOME', category: 'Trending & Novas' },
  { base: 'SUI', label: '⚡ SUI', category: 'Trending & Novas' },
  { base: 'NEAR', label: '🌐 NEAR', category: 'Layer 1 / Layer 2' },
  { base: 'BANANA', label: '🍌 BANANA', category: 'Trending & Novas' },
  { base: 'FET', label: '🤖 FET', category: 'AI & Big Data' },
  { base: 'TAO', label: '🧠 TAO', category: 'AI & Big Data' },
  { base: 'BTC', label: '🪙 BTC', category: 'Layer 1 / Layer 2' },
  { base: 'ETH', label: '💎 ETH', category: 'Layer 1 / Layer 2' },
  { base: 'XRP', label: '💧 XRP', category: 'Layer 1 / Layer 2' }
];

export default function TopRecommendations({ recommendations, isLoading, onBuyClick, usdtBrl = 5.62 }: TopRecommendationsProps) {
  // 5m Candle timer
  const [candleInfo, setCandleInfo] = useState(() => analyze5MinCandle());
  const [selectedTfTab, setSelectedTfTab] = useState<{ [symbol: string]: '5M' | '15M' | '1H' | '4H' | '1D' }>({});
  
  // Category & search filtering
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFullRadar, setShowFullRadar] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCandleInfo(analyze5MinCandle());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom Gain % and Loss % configured by user
  const [customGainPercent, setCustomGainPercent] = useState<string>('5.5');
  const [customLossPercent, setCustomLossPercent] = useState<string>('3.0');

  // Per-signal investment simulation
  const [signalInvestments, setSignalInvestments] = useState<{ [symbol: string]: string }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const gainVal = parseFloat(customGainPercent) || 5.5;
  const lossVal = parseFloat(customLossPercent) || 3.0;

  // High-precision price formatter for crypto (handles tiny meme coin decimals like PEPE/SHIB and large like BTC)
  const formatPriceHighPrecision = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    const absVal = Math.abs(price);
    if (absVal < 0.0001) {
      return `$${price.toFixed(8)}`;
    } else if (absVal < 1) {
      return `$${price.toFixed(6)}`;
    } else if (absVal < 100) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    } else {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const formatRawNumber = (num: number) => {
    if (!num || isNaN(num)) return '0.00';
    const absVal = Math.abs(num);
    if (absVal < 0.0001) return num.toFixed(8);
    if (absVal < 1) return num.toFixed(6);
    if (absVal < 100) return num.toFixed(4);
    return num.toFixed(2);
  };

  const handleCopyText = (textToCopy: string, keyName: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(keyName);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Filter recommendations based on selected category & search query
  const filteredRecs = useMemo(() => {
    return recommendations.filter(rec => {
      const matchesSearch = searchQuery.trim() === '' || 
        rec.symbol.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        rec.coinName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (rec.baseSymbol && rec.baseSymbol.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      if (!matchesSearch) return false;

      if (selectedCategory === 'Todas') return true;
      return rec.category === selectedCategory;
    });
  }, [recommendations, selectedCategory, searchQuery]);

  // Top 3 best analyzed coins of the active filter
  const top3 = useMemo(() => filteredRecs.slice(0, 3), [filteredRecs]);

  if (isLoading) {
    return (
      <div id="recommendations-loading" className="bg-[#181a20] rounded-2xl border border-gray-800 p-5 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="top-recommendations-section" className="bg-[#181a20] rounded-2xl border border-gray-800 p-4 sm:p-5 space-y-4">
      
      {/* Header with Title & Profit/Loss settings */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-800 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#f0b90b]" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Recomendações e Radar de Altcoins & Memes
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Varredura técnica em tempo real na Binance Spot (incluindo Pepe, Memecoins, L1/L2 e Novas Altcoins).
          </p>
        </div>

        {/* Target Gain & Stop Loss Controls */}
        <div className="flex items-center gap-2 bg-[#1e2026] px-3 py-1.5 rounded-xl border border-gray-800 self-start sm:self-auto">
          <div className="flex items-center gap-1 text-xs text-gray-300 font-bold">
            <Sliders className="w-3.5 h-3.5 text-[#f0b90b]" />
            <span className="hidden sm:inline">Alvos:</span>
          </div>

          <div className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-[#0ecb81]/30 text-xs">
            <span className="text-[#0ecb81] font-bold">Lucro</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="500"
              value={customGainPercent}
              onChange={(e) => setCustomGainPercent(e.target.value)}
              className="w-10 bg-transparent text-white font-mono font-bold text-xs text-center focus:outline-none"
            />
            <span className="text-gray-400">%</span>
          </div>

          <div className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-[#f6465d]/30 text-xs">
            <span className="text-[#f6465d] font-bold">Stop</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="90"
              value={customLossPercent}
              onChange={(e) => setCustomLossPercent(e.target.value)}
              className="w-10 bg-transparent text-white font-mono font-bold text-xs text-center focus:outline-none"
            />
            <span className="text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Category Tabs: Memes, Trending Altcoins, AI, L1/L2, DeFi */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORY_TABS.map(tab => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedCategory(tab.id);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActive 
                  ? 'bg-[#f0b90b] text-black border-[#f0b90b] shadow-md shadow-yellow-500/10' 
                  : 'bg-[#1e2026] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${isActive ? 'bg-black/20 text-black' : 'bg-red-500/20 text-red-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Search & Popular Altcoin / Meme Chips */}
      <div className="bg-[#1e2026]/70 border border-gray-800 rounded-xl p-2.5 space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar moeda (ex: PEPE, DOGE, SOL, AVNT, HOME, NEAR, SHIB)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#14151a] border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Info */}
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5 self-end sm:self-auto font-mono">
            <span>Mostrando:</span>
            <span className="text-[#f0b90b] font-bold">{filteredRecs.length} moedas</span>
          </div>
        </div>

        {/* Quick Chips for One-Click Filter (Memes & Altcoins) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap uppercase">Acesso Rápido:</span>
          {POPULAR_QUICK_COINS.map(coin => {
            const isMatch = searchQuery.toUpperCase() === coin.base;
            return (
              <button
                key={coin.base}
                onClick={() => {
                  if (isMatch) {
                    setSearchQuery('');
                  } else {
                    setSearchQuery(coin.base);
                  }
                }}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono transition-all cursor-pointer whitespace-nowrap border ${
                  isMatch 
                    ? 'bg-[#f0b90b] text-black border-[#f0b90b]' 
                    : 'bg-[#14151a] text-gray-300 border-gray-800 hover:border-[#f0b90b]/50 hover:text-white'
                }`}
              >
                {coin.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP 3 CARDS */}
      {top3.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm bg-[#1e2026]/40 rounded-xl border border-gray-800">
          <BadgeInfo className="w-6 h-6 text-[#f0b90b] mx-auto mb-1 opacity-80" />
          Nenhuma recomendação encontrada para o filtro atual (<strong className="text-white">{searchQuery || selectedCategory}</strong>).
          <div className="mt-2">
            <button
              onClick={() => {
                setSelectedCategory('Todas');
                setSearchQuery('');
              }}
              className="text-xs bg-[#f0b90b] text-black px-3 py-1 rounded-lg font-bold"
            >
              Ver Todas as Criptomoedas
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((rec, index) => {
            const isFirst = index === 0;

            const calcTargetPrice = rec.currentPrice * (1 + gainVal / 100);
            const calcStopLossPrice = rec.currentPrice * (1 - lossVal / 100);

            const rawInvest = parseFloat(signalInvestments[rec.symbol] || '100') || 100;
            const coinQty = rec.currentPrice > 0 ? rawInvest / rec.currentPrice : 0;
            const gainProfitDollars = rawInvest * (gainVal / 100);
            const gainProfitBrl = gainProfitDollars * usdtBrl;

            const activeTf = selectedTfTab[rec.symbol] || '1H';
            const mtfData = rec.mtfAnalysis;
            const score = rec.confluenceScore || 90;

            return (
              <div
                id={`rec-card-${rec.symbol}`}
                key={rec.symbol}
                className={`relative bg-[#1e2026] hover:bg-[#22252c] rounded-xl border transition-all p-4 flex flex-col justify-between shadow-md ${
                  isFirst ? 'border-[#f0b90b] ring-1 ring-[#f0b90b]/30' : 'border-gray-800'
                }`}
              >
                {/* Ranking Tag */}
                <div className={`absolute top-0 right-0 text-[10px] font-extrabold px-2.5 py-0.5 rounded-bl-lg uppercase font-mono ${
                  isFirst ? 'bg-[#f0b90b] text-black font-black' : 'bg-gray-800 text-gray-300'
                }`}>
                  {isFirst ? '🏆 #1 TOP CONFLUÊNCIA' : `#${index + 1}`}
                </div>

                <div>
                  {/* Top Bar: Action, Category & Symbol */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> {rec.action}
                    </span>
                    {rec.category && (
                      <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold">
                        {rec.category}
                      </span>
                    )}
                    <span className="text-xs text-white font-mono font-bold">{rec.symbol}</span>
                  </div>

                  {/* Coin Name & Score */}
                  <div className="flex items-baseline justify-between mb-2">
                    <h4 className="text-base font-bold text-white">{rec.coinName}</h4>
                    <span className="text-xs font-mono font-extrabold text-[#f0b90b] bg-[#f0b90b]/10 px-1.5 py-0.5 rounded border border-[#f0b90b]/30">
                      Score {score}%
                    </span>
                  </div>

                  {/* Clean Timeframe Audit Tabs */}
                  <div className="bg-[#121418] border border-gray-800 rounded-lg p-2.5 my-2 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 font-bold flex items-center gap-1 font-sans">
                        <Layers className="w-3 h-3 text-[#f0b90b]" /> Gráficos:
                      </span>
                      <span className="text-emerald-400 font-extrabold">
                        R:R {rec.riskRewardRatio || '1 : 2.2'}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {(['5M', '15M', '1H', '4H', '1D'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setSelectedTfTab(prev => ({ ...prev, [rec.symbol]: tf }))}
                          className={`text-[9px] py-0.5 rounded font-bold transition-all cursor-pointer text-center ${
                            activeTf === tf
                              ? 'bg-[#f0b90b] text-black'
                              : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    <div className="bg-black/40 p-1.5 rounded text-[10px] text-gray-300 font-sans">
                      {activeTf === '5M' && <span>5M: Vela fecha em {candleInfo.remainingStr} • {mtfData?.tf5m?.summary || 'Fundo confirmado'}</span>}
                      {activeTf === '15M' && <span>15M: RSI {mtfData?.tf15m?.rsi || 52} • {mtfData?.tf15m?.summary || 'Alinhado com médias'}</span>}
                      {activeTf === '1H' && <span>1H: RSI {mtfData?.tf1h?.rsi || 48} • {mtfData?.tf1h?.summary || 'Pullback em suporte'}</span>}
                      {activeTf === '4H' && <span>4H: EMA 50 &gt; 200 • {mtfData?.tf4h?.summary || 'Tendência de alta'}</span>}
                      {activeTf === '1D' && <span>1D: {mtfData?.tf1d?.summary || 'Estrutura macro favorável'}</span>}
                    </div>
                  </div>

                  {/* Timing: Sugestão de Entrada e Saída Ancorada no Ciclo de Velas */}
                  <div className="bg-[#121418] border border-gray-800 rounded-lg p-2.5 my-2 space-y-1.5 font-mono text-xs">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      {rec.entryStatus === 'ENTRAR_AGORA' ? (
                        <span className="bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                          <span className="w-1.5 h-1.5 bg-[#0ecb81] rounded-full animate-ping"></span>
                          🟢 ENTRADA IMEDIATA (Janela Ativa)
                        </span>
                      ) : rec.entryStatus === 'AGUARDAR_VELA' ? (
                        <span className="bg-[#f0b90b]/15 text-[#f0b90b] border border-[#f0b90b]/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                          <span className="w-1.5 h-1.5 bg-[#f0b90b] rounded-full animate-pulse"></span>
                          ⏳ AGUARDAR FECHAMENTO (às {rec.recommendedEntryTime})
                        </span>
                      ) : (
                        <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                          🎯 AGUARDAR RETRAÇÃO/SUPORTE ({rec.recommendedEntryTime})
                        </span>
                      )}

                      <span className="text-[9px] text-gray-400 font-sans font-medium">
                        Vela 5M: <strong className="text-white font-mono">{candleInfo.remainingStr}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-around pt-1 border-t border-gray-800/80">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0ecb81]" />
                        <div>
                          <span className="text-[8px] text-gray-400 block font-sans font-bold leading-none">HORA ENTRADA</span>
                          <span className="text-xs font-black text-[#0ecb81]">{rec.recommendedEntryTime || '--:--'}</span>
                        </div>
                      </div>

                      <div className="h-5 w-px bg-gray-800"></div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#f0b90b]" />
                        <div>
                          <span className="text-[8px] text-gray-400 block font-sans font-bold leading-none">SUGESTÃO SAÍDA</span>
                          <span className="text-xs font-black text-[#f0b90b]">{rec.recommendedExitTime || '--:--'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prices: Entry & Target */}
                  <div className="grid grid-cols-2 gap-2 my-2 font-mono">
                    <div className="bg-[#121418] p-2 rounded-lg border border-gray-800">
                      <span className="text-[9px] text-gray-400 font-bold block font-sans">PREÇO ATUAL</span>
                      <span className="text-xs sm:text-sm font-extrabold text-white">{formatPriceHighPrecision(rec.currentPrice)}</span>
                      <span className="text-[9px] text-gray-500 block font-sans">
                        ≈ R$ {(rec.currentPrice * usdtBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </div>

                    <div className="bg-[#121418] p-2 rounded-lg border border-[#0ecb81]/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#0ecb81] font-bold block font-sans">ALVO</span>
                        <span className="text-[9px] text-emerald-400 font-bold">+{gainVal}%</span>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-[#0ecb81]">{formatPriceHighPrecision(calcTargetPrice)}</span>
                      <span className="text-[9px] text-emerald-500/70 block font-sans">
                        ≈ R$ {(calcTargetPrice * usdtBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </div>
                  </div>

                  {/* Stop Loss */}
                  <div className="bg-red-950/20 border border-red-900/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between font-mono text-[10px] mb-2.5">
                    <div className="flex items-center gap-1 text-red-400 font-sans">
                      <AlertOctagon className="w-3 h-3" />
                      <span>Stop Loss ({lossVal}%):</span>
                    </div>
                    <span className="font-bold text-red-300">{formatPriceHighPrecision(calcStopLossPrice)}</span>
                  </div>

                  {/* Quick Calculator */}
                  <div className="bg-[#121418] p-2.5 rounded-lg border border-gray-800 space-y-1.5 font-mono text-[10px] mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-sans font-bold flex items-center gap-1">
                        <Calculator className="w-3 h-3 text-[#f0b90b]" /> Simulação:
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          min="1"
                          max="100000"
                          value={signalInvestments[rec.symbol] || '100'}
                          onChange={(e) => setSignalInvestments(prev => ({ ...prev, [rec.symbol]: e.target.value }))}
                          className="w-14 bg-gray-900 border border-gray-700 rounded px-1 text-white font-bold text-center focus:outline-none focus:border-[#f0b90b]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-800 text-[10px]">
                      <span className="text-gray-400">Qtd: <strong className="text-white">{formatRawNumber(coinQty)} {rec.symbol.replace('USDT', '')}</strong></span>
                      <button
                        onClick={() => handleCopyText(formatRawNumber(coinQty), `${rec.symbol}-qty`)}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-[#f0b90b] border border-[#f0b90b]/30 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer"
                      >
                        {copiedKey === `${rec.symbol}-qty` ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>

                    <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-between pt-0.5">
                      <span>Lucro Estimado:</span>
                      <span>+${gainProfitDollars.toFixed(2)} (+R$ {gainProfitBrl.toFixed(2)})</span>
                    </div>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  id={`buy-rec-btn-${rec.symbol}`}
                  onClick={() => onBuyClick({
                    ...rec,
                    targetPrice: calcTargetPrice,
                    stopLossPrice: calcStopLossPrice,
                    estimatedProfit: gainVal
                  })}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-lg py-2 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <ArrowUpRight className="w-4 h-4 text-black" /> Registrar Compra na Carteira
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Expandable Altcoin & Meme Radar Table */}
      <div className="border-t border-gray-800 pt-3">
        <button
          onClick={() => setShowFullRadar(prev => !prev)}
          className="w-full bg-[#1e2026] hover:bg-[#252830] border border-gray-800 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#f0b90b]" />
            <span>Radar Expandido de Altcoins & Memes da Binance ({filteredRecs.length} moedas analisadas)</span>
          </div>
          <div className="flex items-center gap-1 text-[#f0b90b]">
            <span>{showFullRadar ? 'Recolher Radar' : 'Ver Todas'}</span>
            {showFullRadar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showFullRadar && (
          <div className="mt-3 bg-[#14151a] border border-gray-800 rounded-xl overflow-hidden animate-in fade-in duration-200">
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/60 font-mono text-xs">
              {filteredRecs.map((rec) => (
                <div 
                  key={rec.symbol}
                  className="p-2.5 flex items-center justify-between hover:bg-[#1e2026] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-bold">
                      {rec.category || 'Altcoin'}
                    </span>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{rec.coinName}</span>
                        <span className="text-gray-400 text-[10px] font-mono">({rec.symbol})</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-sans">
                        {formatPriceHighPrecision(rec.currentPrice)} • RSI 1H: <strong className="text-emerald-400">{rec.mtfAnalysis?.tf1h?.rsi || 48}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#f0b90b] bg-[#f0b90b]/10 px-2 py-0.5 rounded border border-[#f0b90b]/30">
                      Score {rec.confluenceScore || 85}%
                    </span>
                    <button
                      onClick={() => onBuyClick(rec)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-extrabold px-2.5 py-1 rounded transition-colors cursor-pointer"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
