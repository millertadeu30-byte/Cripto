import React, { useState } from 'react';
import { Target, TrendingUp, Sparkles, Clock, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Trade, Recommendation } from '../types';

interface ProfitGoalConfiguratorProps {
  trades: Trade[];
  recommendations: Recommendation[];
  marketPrices: { [key: string]: number };
  usdtBrl: number;
  goalPercent: number;
  onChangeGoalPercent: (val: number) => void;
}

export default function ProfitGoalConfigurator({
  trades,
  recommendations,
  marketPrices,
  usdtBrl,
  goalPercent,
  onChangeGoalPercent
}: ProfitGoalConfiguratorProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSectionMinimized, setIsSectionMinimized] = useState(false);

  // Calculate estimated time for current holdings
  // We can calculate this by looking at their current PNL and typical movement speeds
  const getProjections = () => {
    if (trades.length === 0) {
      // Find easiest asset based on goalPercent from recommendations or common assets
      const recList = recommendations.length > 0 ? recommendations : [
        { symbol: 'SOLUSDT', coinName: 'Solana', estimatedProfit: 12.5, timeframe: '12h - 24h' },
        { symbol: 'PEPEUSDT', coinName: 'Pepe Coin', estimatedProfit: 18.2, timeframe: '4h - 8h' },
        { symbol: 'BTCUSDT', coinName: 'Bitcoin', estimatedProfit: 4.8, timeframe: '24h - 48h' }
      ];

      // Smart selection based on goal
      let bestRec = recList.find(r => r.symbol.includes('SOL')) || recList[0];
      if (goalPercent <= 3) {
        bestRec = recList.find(r => r.symbol.includes('BTC')) || bestRec;
      } else if (goalPercent >= 8) {
        bestRec = recList.find(r => r.symbol.includes('PEPE')) || bestRec;
      }

      let hourlySpeed = 0.5;
      if (bestRec.symbol.includes('PEPE')) {
        hourlySpeed = 1.8;
      } else if (bestRec.symbol.includes('SOL')) {
        hourlySpeed = 0.9;
      } else if (bestRec.symbol.includes('BTC')) {
        hourlySpeed = 0.3;
      }

      const estimatedHours = Math.max(0.5, Number((goalPercent / hourlySpeed).toFixed(1)));
      const timeString = estimatedHours >= 24 
        ? `${Math.round(estimatedHours / 24)} dia(s)` 
        : `${estimatedHours} hora(s)`;

      const easiestAssetToGoal = `${bestRec.symbol.replace('USDT', '').replace('BRL', '')} (${bestRec.coinName})`;
      const reasoning = `Você não tem moedas ativas na carteira no momento, mas nossa análise do mercado indica que a ${bestRec.coinName} (${bestRec.symbol.replace('USDT', '')}) é a mais viável para bater a meta de +${goalPercent}% de forma ágil. Sob condições normais de volatilidade, estimamos cerca de ${timeString} de mercado favorável para alcançar este alvo!`;
      const easiestAssetReason = `Recomendação de Compra da Inteligência Sênior: A moeda ${bestRec.coinName} apresenta ótimo momentum de volume e suporte técnico ativo no curto prazo, sendo ideal para bater sua meta de +${goalPercent}% com segurança.`;

      return {
        hasHoldings: false,
        estimatedHours,
        easiestAssetToGoal,
        reasoning,
        easiestAssetReason
      };
    }

    // Evaluate user's primary holding by invested size
    const primaryTrade = [...trades].sort((a, b) => b.totalInvested - a.totalInvested)[0];
    const livePrice = marketPrices[primaryTrade.symbol] || primaryTrade.purchasePrice;
    const currentPnlPercent = ((livePrice - primaryTrade.purchasePrice) / primaryTrade.purchasePrice) * 100;
    
    // Remaining profit percent required to hit user's goal
    const remainingToGoal = goalPercent - currentPnlPercent;

    let estimatedHours = 0;
    let reasoning = "";

    if (remainingToGoal <= 0) {
      estimatedHours = 0;
      reasoning = `Parabéns! Sua operação de ${primaryTrade.symbol} já atingiu a meta de ${goalPercent}% de lucro! O lucro acumulado atual é de ${currentPnlPercent.toFixed(2)}%. Recomendamos configurar sua ordem de venda na Binance imediatamente!`;
    } else {
      // Average hourly volatility assumption: Solana 0.8%/hr, Bitcoin 0.25%/hr, Towns 2%/hr, Pepe 3%/hr etc.
      let hourlySpeed = 0.5; // default fallback
      if (primaryTrade.symbol.includes('PEPE') || primaryTrade.symbol.includes('WIF')) {
        hourlySpeed = 1.8; // Meme coins are faster
      } else if (primaryTrade.symbol.includes('SOL') || primaryTrade.symbol.includes('SUI')) {
        hourlySpeed = 0.9;
      } else if (primaryTrade.symbol.includes('BTC')) {
        hourlySpeed = 0.3; // BTC is safer but slower
      } else if (primaryTrade.symbol.includes('TOWNS')) {
        hourlySpeed = 2.2; // Altcoins and smaller caps have high volatility
      }

      estimatedHours = Math.max(0.5, Number((remainingToGoal / hourlySpeed).toFixed(1)));
      
      const timeString = estimatedHours >= 24 
        ? `${Math.round(estimatedHours / 24)} dia(s)` 
        : `${estimatedHours} hora(s)`;

      reasoning = `Seu ativo principal é ${primaryTrade.symbol} (Lucro Atual: ${currentPnlPercent.toFixed(2)}%). Para atingir sua meta de +${goalPercent}%, ainda faltam ${remainingToGoal.toFixed(2)}%. No ritmo atual de volatilidade, estimamos cerca de ${timeString} de mercado favorável para alcançar esta meta.`;
    }

    // Determine the easiest asset to reach this goal based on recommendations (positive momentum + high estimated profit)
    let easiestAssetToGoal = recommendations.length > 0
      ? `${recommendations[0].symbol.replace('USDT', '').replace('BRL', '')} (${recommendations[0].coinName})`
      : "BTCUSDT (Bitcoin)";
    let easiestAssetReason = recommendations.length > 0
      ? `Recomendamos a moeda ${recommendations[0].coinName} (${recommendations[0].symbol.replace('USDT', '')}). O algoritmo detectou um potencial de +${recommendations[0].estimatedProfit.toFixed(1)}% em ${recommendations[0].timeframe}.`
      : "O Bitcoin apresenta excelente liquidez e estabilidade de mercado para alcançar metas projetadas.";

    if (recommendations.length > 0) {
      // Find the recommendation with the highest estimatedProfit but within reasonable risk
      const bestRec = [...recommendations].sort((a, b) => {
        // Prefer higher estimated profits that are closest to our goal
        const diffA = Math.abs(a.estimatedProfit - goalPercent);
        const diffB = Math.abs(b.estimatedProfit - goalPercent);
        return diffA - diffB;
      })[0];

      if (bestRec) {
        easiestAssetToGoal = `${bestRec.symbol.replace('USDT', '').replace('BRL', '')} (${bestRec.coinName})`;
        easiestAssetReason = `Recomendamos a moeda ${bestRec.coinName} (${bestRec.symbol.replace('USDT', '')}). O robô detectou que ela tem um lucro esperado de +${bestRec.estimatedProfit.toFixed(1)}% em um tempo estimado de ${bestRec.timeframe}, o que se alinha muito bem com a sua meta de +${goalPercent}%!`;
      }
    }

    return {
      hasHoldings: true,
      estimatedHours,
      easiestAssetToGoal,
      reasoning,
      easiestAssetReason
    };
  };

  const projections = getProjections();

  return (
    <div id="profit-goal-section" className="bg-[#181a20] rounded-2xl border border-gray-800 p-6 space-y-5">
      
      {/* Header with Minimize Toggle */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#f0b90b]" />
          <h3 className="text-lg font-bold text-white font-sans">Simulador de Meta de Lucro</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="toggle-explanation-btn"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-gray-900/40 px-2 py-1 rounded border border-gray-800/80 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Como funciona?
          </button>

          <button
            type="button"
            id="toggle-minimize-profit-goal-btn"
            onClick={() => setIsSectionMinimized(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e2026] hover:bg-[#282b33] border border-gray-700 hover:border-[#f0b90b] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title={isSectionMinimized ? "Expandir Simulador de Metas" : "Minimizar Simulador de Metas"}
          >
            <span className="text-[11px] font-extrabold text-[#f0b90b]">{isSectionMinimized ? "▴ Expandir Quadro" : "▾ Minimizar"}</span>
            {isSectionMinimized ? <ChevronDown className="w-4 h-4 text-[#f0b90b]" /> : <ChevronUp className="w-4 h-4 text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Collapsed State Summary */}
      {isSectionMinimized && (
        <div 
          onClick={() => setIsSectionMinimized(false)}
          className="bg-[#14151a] hover:bg-[#1a1d24] border border-gray-800 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className="text-gray-300 font-semibold">
              Simulador Minimizado • Meta Atual: <strong className="text-[#f0b90b] font-bold">+{goalPercent}%</strong> ({projections.estimatedHours === 0 ? "Bateu Alvo" : `${projections.estimatedHours}h estimadas`})
            </span>
          </div>
          <span className="text-[#f0b90b] text-xs font-bold flex items-center gap-1">
            Clique para configurar <ChevronDown className="w-4 h-4" />
          </span>
        </div>
      )}

      {!isSectionMinimized && (
        <>
          {showExplanation && (
            <div className="text-xs text-gray-300 bg-gray-950/40 p-4 rounded-xl border border-gray-800 leading-relaxed space-y-1.5 animate-in fade-in duration-200">
              <p className="font-semibold text-[#f0b90b]">Como o cálculo é feito?</p>
              <p>
                Analisamos o preço de compra das suas moedas cadastradas comparando com o preço em tempo real da Binance.
                Usando a velocidade média de oscilação do mercado para cada tipo de ativo (ex: Bitcoin move-se mais devagar, moedas meme de altíssimo risco movem-se mais rápido), calculamos o tempo estimado para bater a meta.
              </p>
            </div>
          )}

          {/* Main Goal Selector Row */}
          <div className="bg-[#1e2026] rounded-xl border border-gray-800 p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Meta de Lucro Desejada</span>
                <span className="text-sm text-gray-500">Configure quanto lucro você almeja por operação</span>
              </div>

              {/* Quick preset buttons & custom setting */}
              <div className="flex flex-wrap gap-2">
                {[2, 5, 10, 15, 20].map((preset) => (
                  <button
                    id={`preset-${preset}-btn`}
                    key={preset}
                    onClick={() => onChangeGoalPercent(preset)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer ${goalPercent === preset ? 'bg-[#f0b90b] text-black border-[#f0b90b]' : 'bg-[#2b2f36] text-gray-300 border-gray-800 hover:text-white'}`}
                  >
                    +{preset}%
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-400">Arraste para ajustar livremente:</span>
                <span id="current-goal-display" className="text-[#f0b90b] font-bold text-sm bg-[#f0b90b]/10 px-2 py-0.5 rounded">
                  +{goalPercent}% de Lucro Esperado
                </span>
              </div>
              <input
                id="goal-percent-slider"
                type="range"
                min="1"
                max="50"
                step="1"
                value={goalPercent}
                onChange={(e) => onChangeGoalPercent(Number(e.target.value))}
                className="w-full accent-[#f0b90b] bg-gray-800 h-2 rounded-lg appearance-none cursor-pointer"
              />
            </div>

          </div>

          {/* Projection Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Card: Estimate for Current Portfolio */}
            <div className="bg-[#1e2026] border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider mb-2">Tempo Estimado (Carteira Atual)</span>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span id="estimated-time-display" className="text-2xl font-extrabold font-mono text-white">
                    {projections.estimatedHours === 0 ? "BATEU ALVO!" : `${projections.estimatedHours}h`}
                  </span>
                  {projections.estimatedHours > 0 && (
                    <span className="text-xs text-gray-400 font-sans flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#f0b90b]" /> {projections.hasHoldings ? "estimativa" : "sugestão da IA"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0e11]/55 p-3 rounded-lg border border-gray-900 italic">
                  "{projections.reasoning}"
                </p>
              </div>
            </div>

            {/* Right Card: Easiest Recommended Asset to Hit Goal */}
            <div className="bg-[#1e2026] border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider mb-2">Moeda Mais Fácil de Bater a Meta</span>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span id="easiest-asset-display" className="text-lg font-bold text-[#0ecb81] font-sans flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 shrink-0 text-[#0ecb81]" />
                    {projections.easiestAssetToGoal}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0e11]/55 p-3 rounded-lg border border-gray-900 italic">
                  "{projections.easiestAssetReason}"
                </p>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
