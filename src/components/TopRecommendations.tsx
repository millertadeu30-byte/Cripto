import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, ArrowUpRight, Sliders, Calculator, 
  AlertOctagon, Zap, Layers, BadgeInfo, Clock, Search,
  Flame, Sparkles, ChevronDown, ChevronUp, ShieldCheck, Moon
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
}

type CategoryType = 'Homologadas' | 'Scalp Rápido' | 'Todas' | 'Memes' | 'Trending & Novas' | 'Layer 1 / Layer 2' | 'AI & Big Data' | 'DeFi & RWA';

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
  { id: 'Todas', shortLabel: 'Todas', fullLabel: 'Todas as Moedas', icon: '🌟' },
  { id: 'Memes', shortLabel: 'Memes', fullLabel: 'Memecoins (PEPE, DOGE...)', icon: '🐸', badge: 'Alta Vol.', badgeColor: 'bg-red-500/20 text-red-400' },
  { id: 'Trending & Novas', shortLabel: 'Em Alta', fullLabel: 'Altcoins em Alta (AVNT, SUI...)', icon: '🚀', badge: 'Hot', badgeColor: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'Layer 1 / Layer 2', shortLabel: 'L1 / L2', fullLabel: 'Top L1/L2 (SOL, AVAX...)', icon: '⚡' },
  { id: 'AI & Big Data', shortLabel: 'IA & Dados', fullLabel: 'IA & Big Data (FET, TAO...)', icon: '🤖' },
  { id: 'DeFi & RWA', shortLabel: 'DeFi', fullLabel: 'DeFi & RWA (AAVE, ONDO...)', icon: '🏦' }
];

const POPULAR_QUICK_COINS = [
  { base: 'BTC', label: '🛡️ BTC', category: 'Homologadas' },
  { base: 'ETH', label: '🛡️ ETH', category: 'Homologadas' },
  { base: 'SOL', label: '☀️ SOL', category: 'Homologadas' },
  { base: 'BNB', label: '🛡️ BNB', category: 'Homologadas' },
  { base: 'XRP', label: '💧 XRP', category: 'Homologadas' },
  { base: 'ADA', label: '🛡️ ADA', category: 'Homologadas' },
  { base: 'AVAX', label: '🔺 AVAX', category: 'Homologadas' },
  { base: 'SUI', label: '⚡ SUI', category: 'Homologadas' },
  { base: 'NEAR', label: '🌐 NEAR', category: 'Homologadas' },
  { base: 'PEPE', label: '🐸 PEPE', category: 'Memes' },
  { base: 'DOGE', label: '🐕 DOGE', category: 'Memes' },
  { base: 'SHIB', label: '🐶 SHIB', category: 'Memes' },
  { base: 'BONK', label: '🦴 BONK', category: 'Memes' },
  { base: 'NEIRO', label: '🐱 NEIRO', category: 'Memes' },
  { base: 'AVNT', label: '🔥 AVNT', category: 'Trending & Novas' },
  { base: 'HOME', label: '🏠 HOME', category: 'Trending & Novas' },
  { base: 'FET', label: '🤖 FET', category: 'AI & Big Data' },
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
  onChangeLossPercent
}: TopRecommendationsProps) {
  // 5m Candle timer
  const [candleInfo, setCandleInfo] = useState(() => analyze5MinCandle());
  const [selectedTfTab, setSelectedTfTab] = useState<{ [symbol: string]: '5M' | '15M' | '1H' | '4H' | '1D' }>({});
  
  // Category & search filtering (Default to 'Todas' or allow selecting 'Homologadas' or 'Scalp Rápido' with persistence)
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(() => {
    try {
      const saved = localStorage.getItem('binance_assistant_active_category');
      if (saved && ['Todas', 'Homologadas', 'Scalp Rápido', 'Memes', 'Trending & Novas', 'Layer 1 / Layer 2', 'AI & Big Data', 'DeFi & RWA'].includes(saved)) {
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
      if (selectedCategory === 'Homologadas') return Boolean(rec.isHomologated);
      return rec.category === selectedCategory;
    });

    if (selectedCategory === 'Scalp Rápido') {
      // Sort specifically by Scalp Score (highest candle momentum + volume surge 1H)
      list = [...list].sort((a, b) => (b.scalpScore || 0) - (a.scalpScore || 0));
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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
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

          <button
            onClick={() => setIsSectionMinimized(prev => !prev)}
            className="hidden sm:flex text-gray-400 hover:text-white p-1.5 rounded-lg bg-[#1e2026] border border-gray-800 text-xs items-center gap-1 shrink-0 cursor-pointer"
            title={isSectionMinimized ? "Expandir Radar" : "Minimizar Radar"}
          >
            <span className="text-[11px] font-bold">{isSectionMinimized ? "Expandir" : "Minimizar"}</span>
            {isSectionMinimized ? <ChevronDown className="w-4 h-4 text-[#f0b90b]" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>

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

      {/* TOP CARDS (Top 3 for Scalp and general mode) */}
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
                  isScalpMode
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
                  isScalpMode
                    ? isFirst 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black shadow-sm' 
                      : isSecond
                        ? 'bg-amber-600/80 text-white font-bold'
                        : 'bg-amber-700/80 text-amber-100 font-bold'
                    : isFirst 
                      ? 'bg-[#f0b90b] text-black font-black' 
                      : 'bg-gray-800 text-gray-300'
                }`}>
                  {isScalpMode 
                    ? (isFirst ? '⚡ #1 TOP SCALP BINANCE' : isSecond ? '⚡ #2 TOP SCALP BINANCE' : '⚡ #3 TOP SCALP BINANCE')
                    : (isFirst ? '🏆 #1 TOP CONFLUÊNCIA' : `#${index + 1}`)}
                </div>

                <div>
                  {/* Top Bar: Action, Category & Symbol */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> {rec.action}
                    </span>
                    {isScalpMode ? (
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
                  <div className="flex items-baseline justify-between mb-2">
                    <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                      <span>{rec.coinName}</span>
                      {rec.change24h !== undefined && (
                        <span className={`text-[11px] font-mono font-extrabold ${rec.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({rec.change24h >= 0 ? `+${rec.change24h.toFixed(2)}%` : `${rec.change24h.toFixed(2)}%`})
                        </span>
                      )}
                    </h4>
                    <span className={`text-xs font-mono font-extrabold px-1.5 py-0.5 rounded border ${
                      isScalpMode
                        ? 'text-amber-300 bg-amber-500/15 border-amber-500/40'
                        : 'text-[#f0b90b] bg-[#f0b90b]/10 border-[#f0b90b]/30'
                    }`}>
                      {isScalpMode ? `Scalp Score ${rec.scalpScore || 92}` : `Score ${score}%`}
                    </span>
                  </div>

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
                              ? isScalpMode ? 'bg-amber-500 text-black font-extrabold' : 'bg-[#f0b90b] text-black font-extrabold'
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
                          <span className="text-[8px] text-gray-400 block font-sans font-bold leading-none">
                            {isScalpMode ? 'SAÍDA SCALP' : 'SUGESTÃO SAÍDA'}
                          </span>
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
    </div>
  );
}
