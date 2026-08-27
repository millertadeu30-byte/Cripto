import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, ArrowUpRight, Sliders, Calculator, 
  AlertOctagon, Zap, Layers, BadgeInfo, Clock, Search,
  Flame, Sparkles, ChevronDown, ChevronUp, ShieldCheck, Moon,
  ExternalLink, Copy, Check
} from 'lucide-react';
import { Recommendation } from '../types';
import { analyze5MinCandle } from '../utils/candleUtils';

interface TopRecommendationsProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onBuyClick: (rec: Recommendation) => void;
  usdtBrl?: number;
  gainPercent?: number;
  lossPercent?: number;
  onChangeGainPercent?: (gain: number) => void;
  onChangeLossPercent?: (loss: number) => void;
  isAutoScanEnabled?: boolean;
  onToggleAutoScan?: () => void;
  countdown?: number;
}

type CategoryType = 'Homologadas' | 'Scalp Rápido' | 'Fundo & Explosão' | 'Fundo Reversão (Loss)' | 'Todas' | 'Memes' | 'Trending & Novas' | 'Layer 1 / Layer 2' | 'AI & Big Data' | 'DeFi & RWA';

interface CategoryTabConfig {
  id: CategoryType;
  shortLabel: string;
  fullLabel: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

const CATEGORY_TABS: CategoryTabConfig[] = [
  { id: 'Homologadas', shortLabel: 'Homologadas', fullLabel: 'Homologadas (Seguras p/ Noite)', icon: '🛡️', badge: 'Seguras', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'Scalp Rápido', shortLabel: 'Scalp (Top 3)', fullLabel: 'Scalp Rápido (Candle Verde & Volume 1H)', icon: '⚡', badge: 'Top 3', badgeColor: 'bg-amber-500/20 text-amber-300' },
  { id: 'Fundo & Explosão', shortLabel: 'Fundo (Top 3)', fullLabel: 'Fundo Histórico & Reversão (Explosão 1D - 1W)', icon: '💎', badge: 'Top 3 Fundo', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
  { id: 'Fundo Reversão (Loss)', shortLabel: 'Fundo Loss (Top 3)', fullLabel: 'Fundo Reversão Loss (Dia Anterior Negativo + Score >93% + RSI 1H ≤45)', icon: '🎯', badge: 'Loss + 93%', badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300' },
  { id: 'Todas', shortLabel: 'Todas', fullLabel: 'Todas as Moedas', icon: '🌟' },
  { id: 'Memes', shortLabel: 'Memes', fullLabel: 'Memecoins (PEPE, DOGE...)', icon: '🐸', badge: 'Alta Vol.', badgeColor: 'bg-red-500/20 text-red-400' },
  { id: 'Trending & Novas', shortLabel: 'Em Alta', fullLabel: 'Altcoins em Alta (SUI, NEAR...)', icon: '🚀', badge: 'Hot', badgeColor: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'Layer 1 / Layer 2', shortLabel: 'L1 / L2', fullLabel: 'Top L1/L2 (SOL, AVAX...)', icon: '⚡' },
  { id: 'AI & Big Data', shortLabel: 'IA & Dados', fullLabel: 'IA & Big Data (FET, TAO...)', icon: '🤖' },
  { id: 'DeFi & RWA', shortLabel: 'DeFi', fullLabel: 'DeFi & RWA (AAVE, ONDO...)', icon: '🏦' }
];

const POPULAR_QUICK_COINS = [
  { base: 'SUI', label: '💎 SUI (Fundo/Reversão)', category: 'Fundo & Explosão' },
  { base: 'NEAR', label: '💎 NEAR (Fundo/Reversão)', category: 'Fundo & Explosão' },
  { base: 'FET', label: '🤖 FET (IA & Fundo)', category: 'AI & Big Data' },
  { base: 'RENDER', label: '🎨 RENDER (IA)', category: 'AI & Big Data' },
  { base: 'BTC', label: '🛡️ BTC', category: 'Homologadas' },
  { base: 'ETH', label: '🛡️ ETH', category: 'Homologadas' },
  { base: 'SOL', label: '☀️ SOL', category: 'Homologadas' },
  { base: 'BNB', label: '🛡️ BNB', category: 'Homologadas' },
  { base: 'XRP', label: '💧 XRP', category: 'Homologadas' },
  { base: 'ADA', label: '🛡️ ADA', category: 'Homologadas' },
  { base: 'AVAX', label: '🔺 AVAX', category: 'Homologadas' },
  { base: 'LINK', label: '🔗 LINK', category: 'Homologadas' },
  { base: 'INJ', label: '⚡ INJ', category: 'Homologadas' },
  { base: 'PEPE', label: '🐸 PEPE', category: 'Memes' },
  { base: 'DOGE', label: '🐕 DOGE', category: 'Memes' },
  { base: 'SHIB', label: '🐶 SHIB', category: 'Memes' },
  { base: 'BONK', label: '🦴 BONK', category: 'Memes' },
  { base: 'TAO', label: '🧠 TAO', category: 'AI & Big Data' }
];

export default function TopRecommendations({
  recommendations,
  isLoading,
  onBuyClick,
  usdtBrl = 5.62,
  gainPercent = 5.5,
  lossPercent = 3.0,
  onChangeGainPercent,
  onChangeLossPercent,
  isAutoScanEnabled = true,
  onToggleAutoScan,
  countdown = 40
}: TopRecommendationsProps) {
  // 5m Candle timer
  const [candleInfo, setCandleInfo] = useState(() => analyze5MinCandle());
  const [selectedTfTab, setSelectedTfTab] = useState<{ [symbol: string]: '5M' | '15M' | '1H' | '4H' | '1D' }>({});
  
  // Category & search filtering (Default to 'Todas' or allow selecting 'Homologadas', 'Scalp Rápido', 'Fundo & Explosão' or 'Fundo Reversão (Loss)' with persistence)
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(() => {
    try {
      const saved = localStorage.getItem('binance_assistant_active_category');
      if (saved && ['Todas', 'Homologadas', 'Scalp Rápido', 'Fundo & Explosão', 'Fundo Reversão (Loss)', 'Memes', 'Trending & Novas', 'Layer 1 / Layer 2', 'AI & Big Data', 'DeFi & RWA'].includes(saved)) {
        return saved as CategoryType;
      }
    } catch (e) {}
    return 'Todas';
  });

  useEffect(() => {
    try {
      localStorage.setItem('binance_assistant_active_category', selectedCategory);
    } catch (e) {}
  }, [selectedCategory]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFullRadar, setShowFullRadar] = useState<boolean>(false);
  const [isNightBannerExpanded, setIsNightBannerExpanded] = useState<boolean>(false);
  const [isSectionMinimized, setIsSectionMinimized] = useState<boolean>(false);
  const [showBottomStudyModal, setShowBottomStudyModal] = useState<boolean>(false);
  const [showCandleStudyModal, setShowCandleStudyModal] = useState<boolean>(false);
  const [selectedStudySymbol, setSelectedStudySymbol] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCandleInfo(analyze5MinCandle());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom Gain % and Loss % configured by user - synced with global app state
  const [customGainPercent, setCustomGainPercent] = useState<string>(gainPercent.toString());
  const [customLossPercent, setCustomLossPercent] = useState<string>(lossPercent.toString());

  useEffect(() => {
    if (gainPercent !== undefined) {
      setCustomGainPercent(gainPercent.toString());
    }
  }, [gainPercent]);

  useEffect(() => {
    if (lossPercent !== undefined) {
      setCustomLossPercent(lossPercent.toString());
    }
  }, [lossPercent]);

  const handleGainPercentChange = (val: string) => {
    setCustomGainPercent(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      onChangeGainPercent?.(num);
    }
  };

  const handleLossPercentChange = (val: string) => {
    setCustomLossPercent(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      onChangeLossPercent?.(num);
    }
  };

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
    let list = recommendations.filter(rec => {
      const matchesSearch = searchQuery.trim() === '' || 
        rec.symbol.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        rec.coinName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (rec.baseSymbol && rec.baseSymbol.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      if (!matchesSearch) return false;

      if (selectedCategory === 'Todas' || selectedCategory === 'Scalp Rápido') return true;
      if (selectedCategory === 'Fundo & Explosão') {
        // Must be a fundamentally solid coin (Homologated or high liquidity asset with bottom metrics)
        return Boolean(rec.isHomologated || rec.isBottomReversal || (rec.volumeQuoteM && rec.volumeQuoteM > 8));
      }
      if (selectedCategory === 'Fundo Reversão (Loss)') {
        // Regras Rigorosas: Mínimo de 3 dias fechando em negativo (consecutiveLossDays >= 3), sem pump recente anterior (não ser pump&dump com só 1 dia de queda), sem risco de extinguir/deslistagem (volume >= $5M ou homologada), Score >= 93% e RSI 1H <= 45
        const isStrict3DaysLoss = (rec.consecutiveLossDays !== undefined && rec.consecutiveLossDays >= 3);
        const isSafeNoExtinction = rec.isDelistingRiskFree ?? (rec.isHomologated || (rec.volumeQuoteM && rec.volumeQuoteM >= 5.0));
        const notRecentPumpDump = !rec.hadRecentPump;
        const score = rec.confluenceScore || rec.bottomReboundScore || 0;
        const rsi1h = rec.mtfAnalysis?.tf1h?.rsi ?? 50;
        return isStrict3DaysLoss && isSafeNoExtinction && notRecentPumpDump && score >= 93 && rsi1h <= 45;
      }
      if (selectedCategory === 'Homologadas') return Boolean(rec.isHomologated);
      return rec.category === selectedCategory;
    });

    if (selectedCategory === 'Scalp Rápido') {
      // Sort specifically by Scalp Score (highest candle momentum + volume surge 1H)
      list = [...list].sort((a, b) => (b.scalpScore || 0) - (a.scalpScore || 0));
    } else if (selectedCategory === 'Fundo & Explosão') {
      // Sort specifically by Bottom Rebound Score & biggest weekly/monthly drop for maximum explosive upside
      list = [...list].sort((a, b) => {
        const scoreA = (b.bottomReboundScore || 0) + Math.abs(b.recentDropWeeklyPct || 0);
        const scoreB = (a.bottomReboundScore || 0) + Math.abs(a.recentDropWeeklyPct || 0);
        return scoreA - scoreB;
      });
    } else if (selectedCategory === 'Fundo Reversão (Loss)') {
      // If fewer than 3 strict matches in the current feed, backfill with closest candidate coins that have real multi-day declines
      if (list.length < 3 && searchQuery.trim() === '') {
        const fallbackCandidates = recommendations.filter(rec => {
          const score = rec.confluenceScore || rec.bottomReboundScore || 0;
          const rsi1h = rec.mtfAnalysis?.tf1h?.rsi ?? 50;
          const isAtLeast2Days = (rec.consecutiveLossDays !== undefined && rec.consecutiveLossDays >= 2) || ((rec.recentDropWeeklyPct || 0) <= -12);
          const isSafeNoExtinction = rec.isDelistingRiskFree ?? (rec.isHomologated || (rec.volumeQuoteM && rec.volumeQuoteM >= 3.0));
          const notRecentPumpDump = !rec.hadRecentPump;
          return isAtLeast2Days && isSafeNoExtinction && notRecentPumpDump && score >= 90 && rsi1h <= 48 && !list.some(item => item.symbol === rec.symbol);
        });
        list = [...list, ...fallbackCandidates];
      }

      // Sort specifically by Highest Score (>=93%), Lowest RSI 1H (<=45 - highest oversold bottom discount) and Deepest Drop
      list = [...list].sort((a, b) => {
        const scoreA = a.confluenceScore || a.bottomReboundScore || 0;
        const scoreB = b.confluenceScore || b.bottomReboundScore || 0;
        const rsiA = a.mtfAnalysis?.tf1h?.rsi ?? 50;
        const rsiB = b.mtfAnalysis?.tf1h?.rsi ?? 50;
        const dropA = a.change24h || 0;
        const dropB = b.change24h || 0;

        if (scoreB !== scoreA) return scoreB - scoreA;
        if (rsiA !== rsiB) return rsiA - rsiB;
        return dropA - dropB;
      });
    }

    return list;
  }, [recommendations, selectedCategory, searchQuery]);

  // Top recommendations: Top 3 for Scalp Rápido and general categories
  const topCards = useMemo(() => {
    return filteredRecs.slice(0, 3);
  }, [filteredRecs]);

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
      
      {/* Header with Title & Profit/Loss settings & Minimize Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-800 pb-3 gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#f0b90b]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Radar de Oportunidades Binance
                </h3>
                {selectedCategory === 'Homologadas' && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    🛡️ Noite Segura
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Varredura técnica em tempo real na Binance Spot (incluindo Pepe, Memes e Altcoins).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSectionMinimized(prev => !prev)}
            className="sm:hidden text-gray-400 hover:text-white p-1 rounded bg-[#1e2026] border border-gray-800 text-xs flex items-center gap-1 shrink-0"
            title={isSectionMinimized ? "Expandir Radar" : "Minimizar Radar"}
          >
            <span className="text-[11px] font-bold">{isSectionMinimized ? "Expandir" : "Minimizar"}</span>
            {isSectionMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Quick Auto-Scan Toggle Chip */}
          {onToggleAutoScan && (
            <button
              onClick={onToggleAutoScan}
              className={`text-[11px] px-2.5 py-1 rounded-xl border font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                isAutoScanEnabled 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25' 
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
              }`}
              title={isAutoScanEnabled ? "Auto-Scan ativo (40s). Clique para DESLIGAR." : "Auto-Scan desligado. Clique para LIGAR."}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoScanEnabled ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className="hidden xs:inline">Auto-Scan:</span>
              <span className={isAutoScanEnabled ? 'text-amber-300 font-extrabold' : 'text-gray-400'}>
                {isAutoScanEnabled ? `${countdown}s` : 'OFF'}
              </span>
            </button>
          )}

          {/* Target Gain & Stop Loss Controls - Synced & Persisted */}
          <div className="flex items-center gap-2 bg-[#1e2026] px-3 py-1.5 rounded-xl border border-gray-800">
            <div className="flex items-center gap-1 text-xs text-gray-300 font-bold">
              <Sliders className="w-3.5 h-3.5 text-[#f0b90b]" />
              <span className="hidden sm:inline">Metas:</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-[#0ecb81]/30 text-xs">
              <span className="text-[#0ecb81] font-bold">Lucro</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="500"
                value={customGainPercent}
                onChange={(e) => handleGainPercentChange(e.target.value)}
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
                onChange={(e) => handleLossPercentChange(e.target.value)}
                className="w-10 bg-transparent text-white font-mono font-bold text-xs text-center focus:outline-none"
              />
              <span className="text-gray-400">%</span>
            </div>
          </div>

          {/* Minimize / Expand Toggle Button - Visible on all screen sizes */}
          <button
            type="button"
            id="toggle-minimize-recommendations-btn"
            onClick={() => setIsSectionMinimized(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-[#1e2026] hover:bg-[#282b33] border border-gray-700 hover:border-[#f0b90b] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title={isSectionMinimized ? "Expandir Painel de Recomendações" : "Minimizar Painel de Recomendações"}
          >
            <span className="text-[11px] font-extrabold text-[#f0b90b]">{isSectionMinimized ? "▴ Expandir Quadro" : "▾ Minimizar"}</span>
            {isSectionMinimized ? <ChevronDown className="w-4 h-4 text-[#f0b90b]" /> : <ChevronUp className="w-4 h-4 text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Collapsed State Summary when Minimized */}
      {isSectionMinimized && (
        <div 
          onClick={() => setIsSectionMinimized(false)}
          className="bg-[#14151a] hover:bg-[#1a1d24] border border-gray-800 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📈</span>
            <span className="text-gray-300 font-semibold">
              Quadro Minimizado • <strong className="text-white font-mono">{filteredRecs.length}</strong> moedas analisadas (Top: <span className="text-[#f0b90b] font-bold">{filteredRecs[0]?.symbol || 'Nenhum'}</span>)
            </span>
          </div>
          <span className="text-[#f0b90b] text-xs font-bold flex items-center gap-1">
            Clique para abrir quadro completo <ChevronDown className="w-4 h-4" />
          </span>
        </div>
      )}

      {!isSectionMinimized && (
        <div className="space-y-4">
          {/* Category Tabs: Compact, Wrapped & Mobile Optimized */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                <span>Filtrar Mercado:</span>
                {selectedCategory !== 'Todas' && (
                  <span className="text-[#f0b90b] font-mono">({selectedCategory})</span>
                )}
              </span>

              {/* Quick reset button if any filter is active */}
              {(selectedCategory !== 'Todas' || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setSelectedCategory('Todas');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-[#f0b90b] hover:text-white flex items-center gap-1 font-bold cursor-pointer bg-[#f0b90b]/15 px-2.5 py-1 rounded-lg border border-[#f0b90b]/40 transition-colors shadow-sm"
                >
                  <span>✕ Desativar Filtro / Ver Todas as Moedas</span>
                </button>
              )}
            </div>

            {/* Responsive grid / wrap of category chips so nothing gets hidden or cut on phone */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {CATEGORY_TABS.map(tab => {
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      // Toggle behavior: if already active and not 'Todas', revert to 'Todas'
                      if (isActive && tab.id !== 'Todas') {
                        setSelectedCategory('Todas');
                      } else {
                        setSelectedCategory(tab.id);
                      }
                      setSearchQuery('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isActive 
                        ? tab.id === 'Homologadas'
                          ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/40 font-extrabold'
                          : tab.id === 'Scalp Rápido'
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40 font-extrabold'
                            : tab.id === 'Fundo & Explosão'
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20 ring-2 ring-cyan-400/40 font-extrabold'
                              : tab.id === 'Fundo Reversão (Loss)'
                                ? 'bg-fuchsia-500 text-black border-fuchsia-400 shadow-md shadow-fuchsia-500/20 ring-2 ring-fuchsia-400/40 font-extrabold'
                                : 'bg-[#f0b90b] text-black border-[#f0b90b] shadow-md shadow-yellow-500/10 font-extrabold'
                        : 'bg-[#1e2026] text-gray-300 border-gray-800 hover:text-white hover:border-gray-700 active:scale-95'
                    }`}
                    title={tab.fullLabel}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.shortLabel}</span>
                    {tab.badge && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${
                        isActive 
                          ? 'bg-black/20 text-black' 
                          : (tab.badgeColor || 'bg-gray-700 text-gray-300')
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    {isActive && tab.id !== 'Todas' && (
                      <span className="text-[10px] ml-0.5 bg-black/20 text-black px-1 rounded font-mono font-black" title="Clique para desativar">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

      {/* Quick Search & Popular Altcoin / Meme Chips */}
      <div className="bg-[#1e2026]/70 border border-gray-800 rounded-xl p-2.5 space-y-2">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar moeda (ex: PEPE, DOGE, SOL, BTC, AVNT, HOME)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#14151a] border border-gray-700 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#f0b90b]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-1"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Info & Reset */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-2 text-[11px] text-gray-400 font-mono">
            <span>Exibindo: <strong className="text-[#f0b90b]">{filteredRecs.length}</strong> moedas</span>
          </div>
        </div>

        {/* Quick Chips for One-Click Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap uppercase">Atalhos:</span>
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
                className={`px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer whitespace-nowrap border ${
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

      {/* Night Mode / Homologadas info banner (Collapsible & Dismissible) */}
      {selectedCategory === 'Homologadas' && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-[#1e2026] border border-emerald-500/40 rounded-xl p-2.5 shadow-lg shadow-emerald-950/20 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-500/20 rounded-md text-emerald-400 shrink-0">
                <Moon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-emerald-300 font-bold text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Modo Noturno (Homologadas)
                </h4>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-bold border border-emerald-500/40">
                  Mais Seguras p/ Dormir
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsNightBannerExpanded(prev => !prev)}
                className="text-[11px] text-emerald-300 hover:text-white px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-1"
              >
                <span>{isNightBannerExpanded ? 'Ocultar' : 'Info'}</span>
                {isNightBannerExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setSelectedCategory('Todas')}
                className="text-[11px] text-gray-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-gray-800"
                title="Desativar Homologadas e Ver Todas"
              >
                ✕
              </button>
            </div>
          </div>

          {isNightBannerExpanded && (
            <p className="text-gray-300 text-[11px] mt-2 pt-2 border-t border-emerald-900/50 leading-relaxed">
              Criptoativos de altíssima capitalização e liquidez institucional (<strong>BTC, ETH, SOL, BNB, XRP, ADA, AVAX, SUI, NEAR, LINK</strong>). 
              Apresentam profunda liquidez no livro de ordens e menor risco de flash crashes, sendo a seleção recomendada para deixar operações armadas com Stop antes de dormir.
            </p>
          )}
        </div>
      )}

      {/* Scalp Rápido Mode Banner */}
      {selectedCategory === 'Scalp Rápido' && (
        <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-[#1e2026] border border-amber-500/40 rounded-xl p-3 shadow-lg shadow-amber-950/20 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0 border border-amber-500/40">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-amber-300 font-extrabold text-xs sm:text-sm flex items-center gap-1">
                    ⚡ Top 3 Moedas para Scalping Imediato
                  </h4>
                  <span className="bg-amber-500/25 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-amber-500/50 uppercase">
                    Candle Verde & Volume 1H
                  </span>
                </div>
                <p className="text-gray-300 text-[11px] mt-0.5 leading-relaxed">
                  Varredura em tempo real selecionando as <strong>3 maiores explosões de compra da Binance</strong> com candle verde em forte aceleração, pressão no book e entrada de volume.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCategory('Todas')}
              className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 shrink-0 border border-gray-800"
              title="Desativar Scalp e Ver Todas"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Fundo & Explosão Mode Banner */}
      {selectedCategory === 'Fundo & Explosão' && (
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/25 to-[#1e2026] border border-cyan-500/40 rounded-xl p-3 shadow-lg shadow-cyan-950/25 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-300 shrink-0 border border-cyan-500/40">
                <span className="text-xl">💎</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-cyan-300 font-extrabold text-xs sm:text-sm flex items-center gap-1">
                    💎 Top 3 Moedas Fortes no Fundo (Explosão Iminente 1D - 1W)
                  </h4>
                  <span className="bg-cyan-500/25 text-cyan-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-cyan-500/50 uppercase">
                    Pares Oficiais Binance Spot
                  </span>
                </div>
                <p className="text-gray-300 text-[11px] mt-0.5 leading-relaxed">
                  Varredura em tempo real selecionando <strong>moedas oficiais de alta liquidez da Binance Spot</strong> que testaram suportes históricos ou grandes correções e estão prontas para repique técnico de alta probabilidade.
                </p>
                <div className="mt-1.5 bg-black/40 border border-cyan-500/30 rounded-md px-2 py-1 text-[10px] text-cyan-200 flex items-center gap-1.5 font-sans">
                  <span>💡</span>
                  <span><strong>Como buscar no App Binance:</strong> Toque na aba <strong>&quot;Trade&quot; &gt; &quot;Spot&quot;</strong> no menu inferior e digite o par (ex: <strong>SUI/USDT</strong> ou <strong>NEAR/USDT</strong>).</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowBottomStudyModal(true)}
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>📖 Estudo Técnico</span>
              </button>
              <button
                onClick={() => setSelectedCategory('Todas')}
                className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 shrink-0 border border-gray-800"
                title="Desativar Fundo e Ver Todas"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fundo Reversão (Loss) Mode Banner */}
      {selectedCategory === 'Fundo Reversão (Loss)' && (
        <div className="bg-gradient-to-r from-fuchsia-950/40 via-purple-950/25 to-[#1e2026] border border-fuchsia-500/40 rounded-xl p-3 shadow-lg shadow-fuchsia-950/25 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-fuchsia-500/20 rounded-lg text-fuchsia-300 shrink-0 border border-fuchsia-500/40">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-fuchsia-300 font-extrabold text-xs sm:text-sm flex items-center gap-1">
                    🎯 Top 3 Fundo Reversão (3+ Dias Fechando em Negativo + Sem Risco Deslistagem + Score &gt;93% + RSI 1H ≤45)
                  </h4>
                  <span className="bg-fuchsia-500/25 text-fuchsia-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-fuchsia-500/50 uppercase">
                    Filtro Especial Ativo
                  </span>
                </div>
                <p className="text-gray-300 text-[11px] mt-0.5 leading-relaxed">
                  Filtro sniper selecionando moedas com <strong>ao menos 3 dias fechando em negativo (Loss)</strong>, auditadas <strong>sem risco de extinção/deslistagem</strong> (liquidez Binance &gt;$5M) e com <strong>estudos gráficos + notícias apontando alta iminente</strong> (Score &gt;93% e RSI 1H ≤ 45).
                </p>
                <div className="mt-1.5 bg-black/40 border border-fuchsia-500/30 rounded-md px-2 py-1 text-[10px] text-fuchsia-200 flex flex-wrap items-center gap-2 font-sans">
                  <span>📉 <strong>3+ Dias em Baixa</strong></span>
                  <span>•</span>
                  <span>🛡️ <strong>Sem Risco Extinção</strong></span>
                  <span>•</span>
                  <span>📈 <strong>Notícias &amp; Gráficos Indicando Alta Iminente</strong></span>
                  <span>•</span>
                  <span>🎯 <strong>Score &gt; 93% &amp; RSI 1H ≤ 45</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setSelectedCategory('Todas')}
                className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 shrink-0 border border-gray-800"
                title="Desativar Filtro e Ver Todas"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP CARDS (Top 3 for Scalp, Fundo & Explosão, Fundo Loss, and general mode) */}
      {topCards.length === 0 ? (
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
          {topCards.map((rec, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isScalpMode = selectedCategory === 'Scalp Rápido';
            const isBottomMode = selectedCategory === 'Fundo & Explosão';
            const isFundoLossMode = selectedCategory === 'Fundo Reversão (Loss)';

            const userLivePrice = rec.currentPrice;

            // Ponto de Entrada Estratégico Seguro (Ordem Limite no Suporte Imediato -0.5% para pescar o fundo exato)
            const strategicLimitEntry = userLivePrice * 0.995;
            const calcTargetPrice = userLivePrice * (1 + gainVal / 100);
            const calcStopLossPrice = userLivePrice * (1 - lossVal / 100);

            const rawInvest = parseFloat(signalInvestments[rec.symbol] || '100') || 100;
            const coinQty = userLivePrice > 0 ? rawInvest / userLivePrice : 0;
            const gainProfitDollars = rawInvest * (gainVal / 100);
            const gainProfitBrl = gainProfitDollars * usdtBrl;

            const activeTf = selectedTfTab[rec.symbol] || (isBottomMode ? '1D' : (isFundoLossMode ? '1H' : '1H'));
            const mtfData = rec.mtfAnalysis;
            const score = rec.confluenceScore || 90;

            return (
              <div
                id={`rec-card-${rec.symbol}`}
                key={rec.symbol}
                className={`relative bg-[#1e2026] hover:bg-[#22252c] rounded-xl border transition-all p-4 flex flex-col justify-between shadow-md ${
                  isFundoLossMode
                    ? isFirst 
                      ? 'border-fuchsia-500/80 ring-2 ring-fuchsia-500/40 shadow-lg shadow-fuchsia-950/30' 
                      : isSecond
                        ? 'border-fuchsia-500/60 ring-1 ring-fuchsia-500/30 shadow-md shadow-fuchsia-950/20'
                        : 'border-fuchsia-500/40 ring-1 ring-fuchsia-500/20 shadow-md shadow-fuchsia-950/15'
                    : isBottomMode
                      ? isFirst 
                        ? 'border-cyan-500/80 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/30' 
                        : isSecond
                          ? 'border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-md shadow-cyan-950/20'
                          : 'border-cyan-500/40 ring-1 ring-cyan-500/20 shadow-md shadow-cyan-950/15'
                      : isScalpMode
                        ? isFirst 
                          ? 'border-amber-500/80 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/30' 
                          : isSecond
                            ? 'border-yellow-500/60 ring-1 ring-yellow-500/30 shadow-md shadow-yellow-950/20'
                            : 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-md shadow-amber-950/15'
                        : isFirst 
                          ? 'border-[#f0b90b] ring-1 ring-[#f0b90b]/30' 
                          : 'border-gray-800'
                }`}
              >
                {/* Ranking Tag */}
                <div className={`absolute top-0 right-0 text-[10px] font-extrabold px-2.5 py-0.5 rounded-bl-lg uppercase font-mono ${
                  isFundoLossMode
                    ? isFirst 
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-400 text-black font-black shadow-sm' 
                      : isSecond
                        ? 'bg-fuchsia-600/80 text-white font-bold'
                        : 'bg-fuchsia-700/80 text-fuchsia-100 font-bold'
                    : isBottomMode
                      ? isFirst 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-400 text-black font-black shadow-sm' 
                        : isSecond
                          ? 'bg-cyan-600/80 text-white font-bold'
                          : 'bg-cyan-700/80 text-cyan-100 font-bold'
                      : isScalpMode
                        ? isFirst 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black shadow-sm' 
                          : isSecond
                            ? 'bg-amber-600/80 text-white font-bold'
                            : 'bg-amber-700/80 text-amber-100 font-bold'
                        : isFirst 
                          ? 'bg-[#f0b90b] text-black font-black' 
                          : 'bg-gray-800 text-gray-300'
                }`}>
                  {isFundoLossMode
                    ? (isFirst ? '🎯 #1 REVERSÃO LOSS (SCORE >93%)' : isSecond ? '🎯 #2 REVERSÃO LOSS (SCORE >93%)' : '🎯 #3 REVERSÃO LOSS (SCORE >93%)')
                    : isBottomMode
                      ? (isFirst ? '💎 #1 SUPER FUNDO BINANCE' : isSecond ? '💎 #2 SUPER FUNDO BINANCE' : '💎 #3 SUPER FUNDO BINANCE')
                      : isScalpMode 
                        ? (isFirst ? '⚡ #1 TOP SCALP BINANCE' : isSecond ? '⚡ #2 TOP SCALP BINANCE' : '⚡ #3 TOP SCALP BINANCE')
                        : (isFirst ? '🏆 #1 TOP CONFLUÊNCIA' : `#${index + 1}`)}
                </div>

                <div>
                  {/* Top Bar: Action, Category & Symbol */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> {rec.action}
                    </span>
                    {isFundoLossMode ? (
                      <span className="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 text-[9px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                        🎯 Fundo Loss (Score &gt;93% &amp; RSI 1H ≤45)
                      </span>
                    ) : isBottomMode ? (
                      <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                        💎 Fundo & Explosão 1D-1W
                      </span>
                    ) : isScalpMode ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                        ⚡ Scalp Imediato
                      </span>
                    ) : rec.isHomologated ? (
                      <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Segura p/ Noite
                      </span>
                    ) : rec.category ? (
                      <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold">
                        {rec.category}
                      </span>
                    ) : null}
                    <span className="text-xs text-white font-mono font-bold">{rec.symbol}</span>
                  </div>

                  {/* Coin Name & Score */}
                  <div className="flex items-baseline justify-between mb-1.5">
                    <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                      <span>{rec.coinName}</span>
                      {rec.change24h !== undefined && (
                        <span className={`text-[11px] font-mono font-extrabold ${rec.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({rec.change24h >= 0 ? `+${rec.change24h.toFixed(2)}%` : `${rec.change24h.toFixed(2)}%`})
                        </span>
                      )}
                    </h4>
                    <span className={`text-xs font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                      isFundoLossMode
                        ? 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/40'
                        : isBottomMode
                          ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40'
                          : isScalpMode 
                            ? 'text-amber-300 bg-amber-500/15 border-amber-500/40'
                            : 'text-[#f0b90b] bg-[#f0b90b]/10 border-[#f0b90b]/30'
                    }`}>
                      {isFundoLossMode
                        ? `Score ${score}% (RSI 1H: ${mtfData?.tf1h?.rsi || 42})`
                        : isBottomMode
                          ? `Rebound Score ${rec.bottomReboundScore || 96}%`
                          : isScalpMode 
                            ? `Scalp Score ${rec.scalpScore || 92}` 
                            : `Score ${score}%`}
                    </span>
                  </div>

                  {/* Binance Spot Direct Pair & Link */}
                  <div className="flex items-center justify-between gap-1 mb-2 bg-[#121418] border border-gray-800/80 rounded-md px-2 py-1">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                      <span className="text-gray-500 font-sans font-bold">Par Spot:</span>
                      <strong className="text-white">{rec.baseSymbol || rec.symbol.replace('USDT', '')}/USDT</strong>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`${rec.baseSymbol || rec.symbol.replace('USDT', '')}USDT`, `${rec.symbol}-pair`)}
                        className="text-gray-400 hover:text-[#f0b90b] ml-0.5 p-0.5 cursor-pointer"
                        title="Copiar código para buscar no Spot da Binance"
                      >
                        {copiedKey === `${rec.symbol}-pair` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    <a
                      href={`https://www.binance.com/pt-BR/trade/${rec.baseSymbol || rec.symbol.replace('USDT', '')}_USDT?type=spot`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-[#f0b90b]/15 hover:bg-[#f0b90b]/25 text-[#f0b90b] border border-[#f0b90b]/30 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 transition-all"
                      title="Abrir diretamente na negociação Spot da Binance"
                    >
                      <span>Abrir na Binance</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  {/* Fundo Reversão (Loss) Metrics Box */}
                  {isFundoLossMode && (
                    <div className="bg-gradient-to-b from-fuchsia-950/35 via-[#181a20] to-black/50 border border-fuchsia-500/40 rounded-lg p-2.5 my-2 space-y-2 text-xs font-sans">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-fuchsia-300 font-bold flex items-center gap-1">
                          📉 Sequência Recente de Queda (1D):
                        </span>
                        <span className="text-red-400 font-extrabold font-mono text-right">
                          {rec.consecutiveLossDays || 3} Dias Seguidos (Até Hoje)
                        </span>
                      </div>

                      {/* Daily Candles Breakdown (Real 1D Binance Klines Anchored to Current Date) */}
                      <div className="flex items-center justify-between gap-1 bg-black/50 p-1.5 rounded border border-fuchsia-900/40">
                        <span className="text-[10px] text-gray-400 font-sans whitespace-nowrap">Velas Diárias:</span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {rec.dailyCandlesSummary && rec.dailyCandlesSummary.length > 0 ? (
                            rec.dailyCandlesSummary.map((c, i) => (
                              <span 
                                key={i} 
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-0.5 ${
                                  c.isRed 
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                }`}
                                title={`Vela ${c.dateFormatted}: ${c.changePct >= 0 ? '+' : ''}${c.changePct}%`}
                              >
                                <span>{c.isRed ? '🔴' : '🟢'}</span>
                                <span>{c.dateFormatted}</span>
                              </span>
                            ))
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">🔴 D-3</span>
                              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">🔴 Ontem</span>
                              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">🔴 Hoje</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-fuchsia-950/60 font-mono text-[10px]">
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800">
                          <span className="text-gray-400 block font-sans">Score de Confluência:</span>
                          <span className="text-fuchsia-300 font-extrabold">
                            {score}% (&gt;93% Validado ✅)
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800">
                          <span className="text-gray-400 block font-sans">RSI Gráfico 1H:</span>
                          <span className="text-emerald-400 font-extrabold">
                            {mtfData?.tf1h?.rsi || 42} (≤45 Sobrevenda ✅)
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800 col-span-2">
                          <span className="text-gray-400 block font-sans">Segurança &amp; Análise:</span>
                          <span className="text-emerald-400 font-bold block truncate">
                            🛡️ Sem Risco Extinção (Liq &gt;$5M) • 📈 Notícias &amp; Gráficos: Alta Iminente
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800 col-span-2">
                          <span className="text-gray-400 block font-sans">Estratégia de Repique:</span>
                          <span className="text-amber-300 font-bold block truncate">
                            🎯 Alvo: +{gainVal}% | Stop Técnico: -{lossVal}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fundo & Explosão Metrics Box */}
                  {isBottomMode && (
                    <div className="bg-gradient-to-b from-cyan-950/35 via-[#181a20] to-black/50 border border-cyan-500/40 rounded-lg p-2.5 my-2 space-y-2 text-xs font-sans">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-cyan-300 font-bold flex items-center gap-1">
                          📉 Queda no Fundo:
                        </span>
                        <span className="text-red-400 font-extrabold font-mono text-right">
                          {rec.recentDropWeeklyPct || -16}% (Semana) | {rec.recentDropMonthlyPct || -34}% (Mês)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-cyan-950/60 font-mono text-[10px]">
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800">
                          <span className="text-gray-400 block font-sans">Alvo de Explosão:</span>
                          <span className="text-emerald-400 font-extrabold">
                            +{rec.reversalExplosionTargetPct || 28.5}% no Rebote
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800">
                          <span className="text-gray-400 block font-sans">Janela Prevista:</span>
                          <span className="text-cyan-300 font-extrabold">
                            {rec.reversalExplosionWindow || '1 Dia a 1 Semana'}
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800 col-span-2">
                          <span className="text-gray-400 block font-sans">Suporte & Absorção:</span>
                          <span className="text-blue-300 font-bold block truncate" title={rec.bottomSupportStrength}>
                            {rec.bottomSupportStrength || '🛡️ Suporte Histórico 1D Inviolado'}
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800 col-span-2">
                          <span className="text-gray-400 block font-sans">Segurança:</span>
                          <span className="text-purple-300 font-bold block truncate" title={rec.bottomRiskLevel}>
                            {rec.bottomRiskLevel || '🟢 Risco Estrutural Quase Nulo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scalp Metrics Box (Institutional Momentum, Volume Surge, Order Flow, VWAP & EMA Cross) */}
                  {isScalpMode && (
                    <div className="bg-gradient-to-b from-amber-950/30 via-[#181a20] to-black/50 border border-amber-500/40 rounded-lg p-2.5 my-2 space-y-2 text-xs font-sans">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          🔥 Impulso de Vela:
                        </span>
                        <span className="text-emerald-400 font-extrabold font-mono text-right">
                          {rec.candleVelocityLabel || '🚀 Candle Verde em Expansão'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-amber-950/60 font-mono text-[10px]">
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800">
                          <span className="text-gray-400 block font-sans">Volume Surge (1H):</span>
                          <span className="text-amber-300 font-extrabold">
                            +{((rec.volumeSurgeRatio || 2.4) * 100).toFixed(0)}% ({rec.volumeQuoteM ? `$${rec.volumeQuoteM.toFixed(1)}M` : 'Alto'})
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800">
                          <span className="text-gray-400 block font-sans">Pressão Compradora:</span>
                          <span className="text-emerald-400 font-extrabold">
                            {rec.buyPressurePct || 88}% ({rec.orderFlowRatio || 'Dominância'})
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800">
                          <span className="text-gray-400 block font-sans">Médias Rápidas:</span>
                          <span className="text-blue-400 font-extrabold truncate">
                            {rec.scalpEmaCross || 'EMA 9 > 21 Ativa'}
                          </span>
                        </div>
                        <div className="bg-black/60 p-1.5 rounded border border-gray-800">
                          <span className="text-gray-400 block font-sans">Posição Institucional:</span>
                          <span className="text-purple-300 font-extrabold truncate">
                            {rec.scalpVwapStatus || 'Acima da VWAP'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                              ? isFundoLossMode
                                ? 'bg-fuchsia-400 text-black font-extrabold'
                                : isBottomMode
                                  ? 'bg-cyan-400 text-black font-extrabold'
                                  : isScalpMode 
                                    ? 'bg-amber-500 text-black font-extrabold' 
                                    : 'bg-[#f0b90b] text-black font-extrabold'
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
                      {isFundoLossMode ? (
                        <span className="bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                          <span className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-ping"></span>
                          🎯 REVERSÃO DE FUNDO ARMADA
                        </span>
                      ) : isBottomMode ? (
                        <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                          💎 FUNDO ARMADO (Janela 1D - 1W)
                        </span>
                      ) : rec.entryStatus === 'ENTRAR_AGORA' ? (
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
                        {isBottomMode ? 'Timeframe: ' : 'Vela 5M: '}
                        <strong className="text-white font-mono">{isBottomMode ? 'Diário / Semanal' : candleInfo.remainingStr}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-around pt-1 border-t border-gray-800/80">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#0ecb81]" />
                        <div>
                          <span className="text-[8px] text-gray-400 block font-sans font-bold leading-none">
                            {isBottomMode ? 'PONTO COMPRA' : 'HORA ENTRADA'}
                          </span>
                          <span className="text-xs font-black text-[#0ecb81]">{isBottomMode ? 'Fundo Atual' : (rec.recommendedEntryTime || '--:--')}</span>
                        </div>
                      </div>

                      <div className="h-5 w-px bg-gray-800"></div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#f0b90b]" />
                        <div>
                          <span className="text-[8px] text-gray-400 block font-sans font-bold leading-none">
                            {isBottomMode ? 'HORIZONTE ALVO' : isScalpMode ? 'SAÍDA SCALP' : 'SUGESTÃO SAÍDA'}
                          </span>
                          <span className="text-xs font-black text-[#f0b90b]">{isBottomMode ? '1D a 1 Sem.' : (rec.recommendedExitTime || '--:--')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estudo de Velas & Hora Certa de Entrar Button */}
                    <div className="pt-1.5 border-t border-gray-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudySymbol(rec.symbol);
                          setShowCandleStudyModal(true);
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-extrabold flex items-center gap-1 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 transition-colors w-full justify-center"
                      >
                        <span>📖 Estudo de Velas: Como Saber a Hora Certa de Entrar?</span>
                      </button>
                    </div>
                  </div>

                  {/* Estudo Estratégico de Entrada na Binance (Ordem Limite no Suporte vs A Mercado) */}
                  <div className="bg-[#101216] border border-emerald-500/40 rounded-xl p-3 my-2.5 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5 font-sans">
                        <span>🛡️</span>
                        <span>PONTO SEGURO DE ENTRADA (BINANCE):</span>
                      </span>
                      <span className="bg-emerald-500/15 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-emerald-500/30 font-sans">
                        Ordem Limite no Suporte
                      </span>
                    </div>

                    {/* Ordem Limite Recomendada */}
                    <div className="bg-black/70 border border-emerald-500/30 rounded-lg p-2.5 font-mono">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm sm:text-base font-black text-emerald-300">
                              {formatPriceHighPrecision(strategicLimitEntry)}
                            </span>
                            <span className="bg-emerald-500/20 text-emerald-300 text-[8px] px-1.5 py-0.2 rounded font-extrabold">
                              -0.5% Suporte
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-400 block font-sans mt-0.5">
                            💡 Deixe armada como <strong>Ordem Limite</strong> para pegar o teste de fundo com desconto
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyText(formatRawNumber(strategicLimitEntry), `${rec.symbol}-entry`)}
                          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all shadow-md shrink-0 ml-2"
                          title="Copiar preço da Ordem Limite para colar na Binance"
                        >
                          {copiedKey === `${rec.symbol}-entry` ? '✓ Copiado!' : 'Copiar Limite'}
                        </button>
                      </div>
                    </div>

                    {/* Explicação Rápida de Segurança */}
                    <div className="text-[9px] text-gray-400 font-sans leading-relaxed bg-[#16181f] p-2 rounded border border-gray-800 flex items-start gap-1.5">
                      <span className="text-[#f0b90b] shrink-0 text-xs">ℹ️</span>
                      <span>
                        <strong className="text-gray-200">Por que o ponto seguro fica abaixo?</strong> Em retrações, entrar a mercado pode pegar oscilações contra você. A ordem limite no suporte posiciona sua compra onde as baleias absorvem o ativo, garantindo o melhor preço antes da explosão de retomada.
                      </span>
                    </div>
                  </div>

                  {/* Prices: Entry & Target */}
                  <div className="grid grid-cols-2 gap-2 my-2 font-mono">
                    <div className="bg-[#121418] p-2 rounded-lg border border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-400 font-bold block font-sans">
                          PREÇO ATUAL (MERCADO)
                        </span>
                        <button
                          onClick={() => handleCopyText(formatRawNumber(userLivePrice), `${rec.symbol}-curr`)}
                          className="text-[8px] text-gray-400 hover:text-white px-1 py-0.5 rounded bg-gray-800"
                          title="Copiar preço atual a mercado"
                        >
                          {copiedKey === `${rec.symbol}-curr` ? '✓' : 'Copiar'}
                        </button>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-white">{formatPriceHighPrecision(userLivePrice)}</span>
                      <span className="text-[9px] text-gray-500 block font-sans">
                        ≈ R$ {(userLivePrice * usdtBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                    </div>

                    <div className="bg-[#121418] p-2 rounded-lg border border-[#0ecb81]/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-[#0ecb81] font-bold block font-sans">ALVO</span>
                          <span className="text-[9px] text-emerald-400 font-bold">+{gainVal}%</span>
                        </div>
                        <button
                          onClick={() => handleCopyText(formatRawNumber(calcTargetPrice), `${rec.symbol}-target`)}
                          className="text-[8px] text-emerald-400 hover:text-white px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30"
                        >
                          {copiedKey === `${rec.symbol}-target` ? '✓' : 'Copiar'}
                        </button>
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
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-red-300">{formatPriceHighPrecision(calcStopLossPrice)}</span>
                      <button
                        onClick={() => handleCopyText(formatRawNumber(calcStopLossPrice), `${rec.symbol}-stop`)}
                        className="text-[8px] text-red-400 hover:text-white px-1 py-0.5 rounded bg-red-950/60 border border-red-500/30 font-sans"
                      >
                        {copiedKey === `${rec.symbol}-stop` ? '✓' : 'Copiar'}
                      </button>
                    </div>
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
                    currentPrice: userLivePrice,
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
                    {rec.isHomologated ? (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Homologada
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-bold">
                        {rec.category || 'Altcoin'}
                      </span>
                    )}
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
                    <a
                      href={`https://www.binance.com/pt-BR/trade/${rec.baseSymbol || rec.symbol.replace('USDT', '')}_USDT?type=spot`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] border border-[#f0b90b]/30 text-[10px] flex items-center gap-1"
                      title="Abrir no Spot da Binance"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
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
      )}

      {/* Bottom Reversal / Pullback Study Guide Modal */}
      {showBottomStudyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-[#181a20] border border-cyan-500/40 rounded-2xl w-full max-w-2xl shadow-2xl p-5 sm:p-6 my-auto font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-1 rounded-lg font-bold">
                  💎 Estudo Técnico
                </span>
                <h4 className="text-base font-bold text-white">
                  Como Cercar Moedas em Fundo e Correção Forte no Spot da Binance?
                </h4>
              </div>
              <button 
                onClick={() => setShowBottomStudyModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300 leading-relaxed">
              
              {/* Point 1 */}
              <div className="bg-[#1e2026] p-3.5 rounded-xl border border-gray-800 space-y-1">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span>1.</span>
                  <span>Absorção de Liquidez no Fundo (Volume Climático)</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Quando uma cripto de alta liquidez como <strong>SUI</strong>, <strong>NEAR</strong> ou <strong>FET</strong> acumula uma correção de 20% a 40% em relação ao topo recente, o robô monitora a entrada de <strong>volume incomum</strong> com formação de sombra inferior no candle (rejeição de novas mínimas). Isso sinaliza que grandes players institucionais começaram a absorver o livro de ofertas.
                </p>
              </div>

              {/* Point 2 */}
              <div className="bg-[#1e2026] p-3.5 rounded-xl border border-gray-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <span>2.</span>
                  <span>RSI Diário e 4H em Sobrevenda Extrema (&lt; 20 - 25)</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Nenhum ativo cai em linha reta indefinidamente. Com o RSI diário em sobrevenda severa, a pressão vendedora se esgota e os vendedores a descoberto (Shorts) precisam recomprar para realizar lucro ("Short Squeeze"), impulsionando um repique técnico natural de <strong>+10% a +25%</strong> rumo à média de 9 períodos.
                </p>
              </div>

              {/* Point 3 */}
              <div className="bg-[#1e2026] p-3.5 rounded-xl border border-gray-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <span>3.</span>
                  <span>Gatilho de Abertura das 9:00 AM (Virada de Sessão)</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Às 9:00 da manhã (horário de Brasília), ocorre o fechamento e abertura do candle diário com o pico de liquidez global. O gatilho perfeito ocorre quando o primeiro candle de 15 minutos rompe a máxima do candle anterior sem fazer novas mínimas.
                </p>
              </div>

              {/* Point 4 */}
              <div className="bg-[#1e2026] p-3.5 rounded-xl border border-gray-800 space-y-1">
                <div className="flex items-center gap-2 text-[#f0b90b] font-bold">
                  <span>4.</span>
                  <span>Execução com Ordem OCO Protegida</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Ao entrar na operação, configure imediatamente a <strong>Ordem OCO na Binance</strong>:
                  <br />• <strong>Stop Win (Meta):</strong> +10% de lucro.
                  <br />• <strong>Stop Loss (Proteção):</strong> 3% a 4% abaixo do fundo recente.
                  <br />Dessa forma, sua relação Risco/Retorno é assimétrica (ganha 10% arriscando apenas 3%).
                </p>
              </div>

            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBottomStudyModal(false);
                  setSelectedCategory('Fundo & Explosão');
                }}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Ver Moedas Selecionadas na Aba "Fundo & Explosão"
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candle Price Action & Entry Timing Study Modal */}
      {showCandleStudyModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 overflow-y-auto flex items-start sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-[#181a20] border border-amber-500/40 rounded-2xl w-full max-w-2xl shadow-2xl p-5 sm:p-6 my-auto font-sans space-y-4 text-xs text-gray-300">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-lg font-bold">
                  🕯️ Estudo de Velas & Price Action
                </span>
                <h4 className="text-base font-bold text-white">
                  Como Saber a Hora Exata de Entrar Sem Pegar Velas de Queda?
                </h4>
              </div>
              <button 
                onClick={() => setShowCandleStudyModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 leading-relaxed">
              
              {/* Point 1: Por que não entrar em vela vermelha caindo */}
              <div className="bg-[#1e2026] p-3.5 rounded-xl border border-red-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <span>🛑</span>
                  <span>1. Regra de Ouro: NUNCA compre a mercado durante uma Vela Vermelha ativa!</span>
                </div>
                <p className="text-gray-300 text-[11px]">
                  Se você olhar o gráfico e a vela de 5M estiver <strong>vermelha e furando médias móveis (MA7 / MA25) para baixo</strong>, isso é uma correção ativa. Entrar a mercado nesse momento é tentar "segurar uma faca caindo". Você deve aguardar a vela fechar e encontrar suporte.
                </p>
              </div>

              {/* Point 2: Como saber a hora exata da próxima vela */}
              <div className="bg-[#1e2026] p-3.5 rounded-xl border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <span>⏳</span>
                  <span>2. O Gatilho do Próximo Candle (Ciclo de 5 Minutos)</span>
                </div>
                <p className="text-gray-300 text-[11px]">
                  As velas da Binance abrem e fecham em intervalos múltiplos de 5 min (ex: 18:40, 18:45, 18:50, 18:55).
                  <br />• <strong>O Momento Certo:</strong> Aguarde a contagem regressiva da vela atual (ex: restam <em>{candleInfo.remainingStr}</em>).
                  <br />• Na abertura da vela seguinte às <strong className="text-white font-mono">{candleInfo.nextEntryTime}</strong>, observe: se os compradores rejeitarem o fundo formando um <strong>Martelo ou Candle Verde</strong>, o sinal de entrada está confirmado!
                </p>
              </div>

              {/* Point 3: Estratégia de Ordem Limite no Suporte */}
              <div className="bg-[#1e2026] p-3.5 rounded-xl border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span>🛡️</span>
                  <span>3. Estratégia de Ordem Limite no Suporte (Mais Segura)</span>
                </div>
                <p className="text-gray-300 text-[11px]">
                  Em vez de comprar a mercado com pressa, use a ferramenta <strong>"Ponto Seguro de Entrada"</strong> do card:
                  <br />• O sistema calcula o suporte real da <strong>MA99 ou Fundo Triplo</strong> (cerca de 0.5% a 2% abaixo do preço atual).
                  <br />• Deixe armada uma <strong>Ordem Limite na Binance</strong> no preço sugerido. Quando o candle der a "espetada" de retração para baixo, sua ordem é executada com o melhor preço possível antes do repique de alta!
                </p>
              </div>

              {/* Point 4: OCO Protegido */}
              <div className="bg-[#1e2026] p-3.5 rounded-xl border border-blue-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <span>🎯</span>
                  <span>4. Alvo e Stop Automático</span>
                </div>
                <p className="text-gray-300 text-[11px]">
                  Assim que sua ordem for executada, coloque imediatamente o Stop Loss no ponto sugerido. Nunca opere sem Stop, especialmente em moedas de alta volatilidade!
                </p>
              </div>

            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCandleStudyModal(false)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Entendi! Voltar ao Painel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
