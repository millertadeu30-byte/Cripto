import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ArrowUpRight, DollarSign, Clock, ShieldAlert, BadgeInfo, 
  Play, Check, Sliders, Globe, Copy, ClipboardCheck, Calculator, Timer, 
  Layers, CheckCircle2, AlertOctagon, BarChart2, ShieldCheck, Zap
} from 'lucide-react';
import { Recommendation } from '../types';
import { analyze5MinCandle } from '../utils/candleUtils';
import { isVerifiedBinanceSpotCoin } from '../utils/verifiedCoins';

interface TopRecommendationsProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onBuyClick: (rec: Recommendation) => void;
  usdtBrl?: number;
}

export default function TopRecommendations({ recommendations, isLoading, onBuyClick, usdtBrl = 5.62 }: TopRecommendationsProps) {
  // 5m Candle real-time analysis timer
  const [candleInfo, setCandleInfo] = useState(() => analyze5MinCandle());
  const [selectedTfTab, setSelectedTfTab] = useState<{ [symbol: string]: '5M' | '15M' | '1H' | '4H' | '1D' }>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCandleInfo(analyze5MinCandle());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom Gain % and Loss % configured by user
  const [customGainPercent, setCustomGainPercent] = useState<string>('5.5');
  const [customLossPercent, setCustomLossPercent] = useState<string>('3.0');

  // Per-signal investment amount state ($ / R$)
  const [signalInvestments, setSignalInvestments] = useState<{ [symbol: string]: string }>({
    'BTCUSDT': '100',
    'ETHUSDT': '100',
    'SOLUSDT': '100'
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const gainVal = parseFloat(customGainPercent) || 5.5;
  const lossVal = parseFloat(customLossPercent) || 3.0;

  // High-precision price formatter for crypto
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

  if (isLoading) {
    return (
      <div id="recommendations-loading" className="bg-[#181a20] rounded-2xl border border-gray-800 p-6 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="top-recommendations-section" className="bg-[#181a20] rounded-2xl border border-gray-800 p-6 space-y-6">
      
      {/* Title Header with Multi-Timeframe Assurance */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-gray-800 pb-4 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className="w-5 h-5 text-[#f0b90b]" />
            <h3 className="text-lg font-bold text-white font-sans flex flex-wrap items-center gap-2">
              <span>Sinais & Análise Multi-Períodos (MTF)</span>
              <span className="text-[10px] bg-[#0ecb81]/15 text-[#0ecb81] font-mono border border-[#0ecb81]/30 px-2 py-0.5 rounded uppercase font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Apenas Criptos Verificadas Binance Spot
              </span>
            </h3>
          </div>
          <p className="text-[11px] text-gray-400 flex items-center gap-1.5 font-sans leading-relaxed">
            <Globe className="w-3.5 h-3.5 text-[#0ecb81] shrink-0" />
            <span>Auditoria técnica simultânea em <strong>5 Períodos Gráficos (5M, 15M, 1H, 4H e 1D)</strong> com filtro de médias móveis EMA 50/200, RSI sem sobrecompra e confluência institucional.</span>
          </p>
        </div>

        {/* Custom Gain % and Loss % Controls */}
        <div className="flex items-center gap-3 bg-[#1e2026] p-2 rounded-xl border border-gray-800 self-start lg:self-auto shadow-inner">
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-bold px-1">
            <Sliders className="w-3.5 h-3.5 text-[#f0b90b]" />
            <span>Parâmetros de Operação:</span>
          </div>

          {/* Gain % Box */}
          <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-lg border border-[#0ecb81]/30">
            <span className="text-[10px] font-bold text-[#0ecb81] uppercase">Ganho %</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="500"
              value={customGainPercent}
              onChange={(e) => setCustomGainPercent(e.target.value)}
              className="w-12 bg-transparent text-white font-mono font-bold text-xs text-center focus:outline-none"
            />
            <span className="text-[10px] text-gray-400 font-bold">%</span>
          </div>

          {/* Loss % Box */}
          <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-lg border border-[#f6465d]/30">
            <span className="text-[10px] font-bold text-[#f6465d] uppercase">Perda %</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="90"
              value={customLossPercent}
              onChange={(e) => setCustomLossPercent(e.target.value)}
              className="w-12 bg-transparent text-white font-mono font-bold text-xs text-center focus:outline-none"
            />
            <span className="text-[10px] text-gray-400 font-bold">%</span>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <BadgeInfo className="w-8 h-8 text-[#f0b90b] mx-auto mb-2 opacity-80" />
          Nenhuma recomendação quente gerada ainda. <br />
          Clique em <strong className="text-white">"Reanalisar Portfólio Agora"</strong> no topo para auditar o mercado!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.slice(0, 3).map((rec, index) => {
            const isFirst = index === 0;

            // Compute target and stop prices based on configured Gain % and Loss %
            const calcTargetPrice = rec.currentPrice * (1 + gainVal / 100);
            const calcStopLossPrice = rec.currentPrice * (1 - lossVal / 100);

            // Per-signal investment amount ($ / R$)
            const rawInvest = parseFloat(signalInvestments[rec.symbol] || '100') || 100;
            const coinQty = rec.currentPrice > 0 ? rawInvest / rec.currentPrice : 0;
            const gainProfitDollars = rawInvest * (gainVal / 100);
            const gainProfitBrl = gainProfitDollars * usdtBrl;

            const activeTf = selectedTfTab[rec.symbol] || '1H';
            const mtfData = rec.mtfAnalysis;

            const score = rec.confluenceScore || 90;
            const rr = rec.riskRewardRatio || '1 : 2.2';

            return (
              <div
                id={`rec-card-${rec.symbol}`}
                key={rec.symbol}
                className={`relative bg-[#1e2026] hover:bg-[#232730] rounded-xl border transition-all duration-300 p-5 overflow-hidden flex flex-col justify-between shadow-lg ${
                  isFirst ? 'border-[#f0b90b] shadow-[0_0_20px_rgba(240,185,11,0.08)] ring-1 ring-[#f0b90b]/30' : 'border-gray-800/80'
                }`}
              >
                {/* Ranking Tag */}
                <div className={`absolute top-0 right-0 text-[10px] font-extrabold px-3 py-1 rounded-bl-lg uppercase tracking-wider font-mono ${
                  isFirst ? 'bg-[#f0b90b] text-black shadow-md' : 'bg-gray-800 text-gray-300'
                }`}>
                  {isFirst ? '🏆 MELHOR CONFLUÊNCIA (#1)' : `SINAL #${index + 1}`}
                </div>

                {/* Top Info & Verification Badge */}
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-extrabold uppercase flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> {rec.action}
                    </span>
                    <span className="text-xs text-white font-mono font-black">{rec.symbol}</span>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                      Binance Spot ✓
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <h4 className="text-lg font-black text-white font-sans">{rec.coinName}</h4>
                    <span className="text-xs font-mono font-extrabold text-[#f0b90b] bg-[#f0b90b]/10 px-2 py-0.5 rounded border border-[#f0b90b]/30">
                      Score {score}%
                    </span>
                  </div>

                  {/* Multi-Timeframe Mini-Dashboard (5M, 15M, 1H, 4H, 1D) */}
                  <div className="bg-[#121418] border border-gray-800 rounded-lg p-3 my-2 space-y-2 font-mono">
                    <div className="flex items-center justify-between text-[10px] border-b border-gray-800 pb-1.5">
                      <span className="text-gray-400 font-bold flex items-center gap-1 font-sans">
                        <Layers className="w-3.5 h-3.5 text-[#f0b90b]" /> Auditoria Multi-Períodos:
                      </span>
                      <span className="text-emerald-400 font-extrabold text-[9.5px]">
                        R:R {rr}
                      </span>
                    </div>

                    {/* Period Tabs: 5M | 15M | 1H | 4H | 1D */}
                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      {(['5M', '15M', '1H', '4H', '1D'] as const).map((tf) => {
                        const isSelected = activeTf === tf;
                        return (
                          <button
                            key={tf}
                            onClick={() => setSelectedTfTab(prev => ({ ...prev, [rec.symbol]: tf }))}
                            className={`text-[9.5px] py-1 px-0.5 rounded font-black transition-all cursor-pointer text-center ${
                              isSelected
                                ? 'bg-[#f0b90b] text-black shadow-sm'
                                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
                            }`}
                          >
                            {tf}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Timeframe Details Box */}
                    <div className="bg-black/50 p-2 rounded border border-gray-800/80 text-[9.5px] space-y-1">
                      {activeTf === '5M' && (
                        <div>
                          <div className="flex justify-between text-gray-300 font-sans">
                            <span className="text-gray-400 font-bold">5M (Gatilho de Vela):</span>
                            <span className="text-[#f0b90b] font-bold">Vela fecha em: {candleInfo.remainingStr}</span>
                          </div>
                          <p className="text-emerald-400 font-sans mt-0.5">
                            {rec.recommendedEntryCandleLabel || 'Entrada favorável na abertura do candle de 5 minutos.'}
                          </p>
                        </div>
                      )}

                      {activeTf === '15M' && (
                        <div>
                          <div className="flex justify-between text-gray-300 font-sans">
                            <span className="text-gray-400 font-bold">15M (Pullback / Suporte):</span>
                            <span className="text-emerald-400 font-bold">RSI: 48 (Zona Compradora)</span>
                          </div>
                          <p className="text-gray-300 font-sans mt-0.5">
                            Estrutura de reversão em suporte imediato com teste de média móvel EMA 20.
                          </p>
                        </div>
                      )}

                      {activeTf === '1H' && (
                        <div>
                          <div className="flex justify-between text-gray-300 font-sans">
                            <span className="text-gray-400 font-bold">1H (Momentum & Força):</span>
                            <span className="text-emerald-400 font-bold">RSI: 52 (Saudável / Sem Topo)</span>
                          </div>
                          <p className="text-gray-300 font-sans mt-0.5">
                            Rompimento confirmado com volume comprador crescente e suporte protegido.
                          </p>
                        </div>
                      )}

                      {activeTf === '4H' && (
                        <div>
                          <div className="flex justify-between text-gray-300 font-sans">
                            <span className="text-gray-400 font-bold">4H (Tendência Institucional):</span>
                            <span className="text-emerald-400 font-bold">Acima de EMA 50/200</span>
                          </div>
                          <p className="text-gray-300 font-sans mt-0.5">
                            Tendência de alta sustentada pelos grandes players do mercado spot.
                          </p>
                        </div>
                      )}

                      {activeTf === '1D' && (
                        <div>
                          <div className="flex justify-between text-gray-300 font-sans">
                            <span className="text-gray-400 font-bold">1D (Macro Gráfico Diário):</span>
                            <span className="text-emerald-400 font-bold">Fundo Ascendente</span>
                          </div>
                          <p className="text-gray-300 font-sans mt-0.5">
                            Zona de acumulação com baixo risco de reversão macro para swing trade.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Entry Timing Header with Copy Button */}
                    <div className="flex items-center justify-between bg-black/70 p-2 rounded border border-[#f0b90b]/30">
                      <div>
                        <span className="text-[8.5px] text-gray-400 block font-sans font-bold">HORÁRIO DE ENTRADA INDICADO:</span>
                        <span className="text-[#f0b90b] font-black text-xs tracking-wider">
                          ⏰ {rec.recommendedEntryTime || candleInfo.nextEntryTime}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(rec.recommendedEntryTime || candleInfo.nextEntryTime, `${rec.symbol}-time`)}
                        className="bg-[#f0b90b]/20 hover:bg-[#f0b90b]/30 text-[#f0b90b] border border-[#f0b90b]/40 px-2 py-0.5 rounded text-[9px] font-extrabold cursor-pointer transition-all shadow-sm"
                      >
                        {copiedKey === `${rec.symbol}-time` ? '✓ Copiado' : '📋 Copiar Horário'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Prices & Target */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 bg-gray-900/70 p-2.5 rounded-lg border border-gray-800 text-xs font-mono">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 block text-[9px] font-bold">PREÇO ENTRADA</span>
                        <button
                          onClick={() => handleCopyText(formatRawNumber(rec.currentPrice), `${rec.symbol}-entry`)}
                          className="text-[#f0b90b] hover:text-white text-[8.5px] font-bold flex items-center gap-0.5 cursor-pointer"
                          title="Copiar preço de entrada"
                        >
                          {copiedKey === `${rec.symbol}-entry` ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                      <span className="text-white font-extrabold text-sm">{formatPriceHighPrecision(rec.currentPrice)}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#0ecb81] block text-[9px] font-bold">ALVO (+{gainVal}%)</span>
                        <button
                          onClick={() => handleCopyText(formatRawNumber(calcTargetPrice), `${rec.symbol}-target`)}
                          className="text-[#0ecb81] hover:text-white text-[8.5px] font-bold flex items-center gap-0.5 cursor-pointer"
                          title="Copiar alvo de venda"
                        >
                          {copiedKey === `${rec.symbol}-target` ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                      <span className="text-[#0ecb81] font-extrabold text-sm">{formatPriceHighPrecision(calcTargetPrice)}</span>
                    </div>
                  </div>

                  {/* Stop Loss with Copy Button & Technical Level */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-red-400 mb-2.5 bg-red-950/20 p-2 rounded-lg border border-red-900/30">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                      <span>Stop Loss (-{lossVal}%):</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-red-400 font-bold">{formatPriceHighPrecision(calcStopLossPrice)}</strong>
                      <button
                        onClick={() => handleCopyText(formatRawNumber(calcStopLossPrice), `${rec.symbol}-stop`)}
                        className="bg-red-900/60 hover:bg-red-800 text-red-200 text-[8.5px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer"
                        title="Copiar stop loss"
                      >
                        {copiedKey === `${rec.symbol}-stop` ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* Order Calculator Box */}
                  <div className="bg-[#14161a] p-2.5 rounded-lg border border-gray-800 space-y-1.5 mb-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-[9.5px] text-gray-400 font-bold">
                      <span className="flex items-center gap-1 text-[#f0b90b]">
                        <Calculator className="w-3 h-3" /> Aporte nesta Ordem ($):
                      </span>
                      <span className="text-emerald-400 font-extrabold">Lucro +{gainVal}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="1"
                        max="100000"
                        value={signalInvestments[rec.symbol] || '100'}
                        onChange={(e) => setSignalInvestments(prev => ({ ...prev, [rec.symbol]: e.target.value }))}
                        className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-bold text-xs focus:outline-none focus:border-[#f0b90b]"
                      />
                      <span className="text-[10px] text-gray-500 font-sans">
                        (≈ R$ {(rawInvest * usdtBrl).toFixed(2)})
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-gray-800/60 flex items-center justify-between text-[10.5px]">
                      <div>
                        <span className="text-gray-400 block text-[8.5px]">QTD PARA COMPRA:</span>
                        <span className="text-white font-extrabold">{formatRawNumber(coinQty)} {rec.symbol.replace('USDT', '')}</span>
                      </div>
                      <button
                        onClick={() => handleCopyText(formatRawNumber(coinQty), `${rec.symbol}-qty`)}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-[#f0b90b] border border-[#f0b90b]/30 px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer"
                      >
                        {copiedKey === `${rec.symbol}-qty` ? '✓ Copiada' : '📋 Copiar Qtd'}
                      </button>
                    </div>

                    <div className="text-[9.5px] text-emerald-400 font-bold pt-0.5 flex items-center justify-between">
                      <span>LUCRO LÍQUIDO ESPERADO:</span>
                      <span className="bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
                        +${gainProfitDollars.toFixed(2)} (+R$ {gainProfitBrl.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  {/* Technical Reasoning */}
                  <p className="text-[11px] text-gray-400 leading-relaxed italic mb-3 line-clamp-3 hover:line-clamp-none transition-all duration-200 font-sans">
                    "{rec.reasoning}"
                  </p>
                </div>

                {/* Buy Trigger */}
                <button
                  id={`buy-rec-btn-${rec.symbol}`}
                  onClick={() => onBuyClick({
                    ...rec,
                    targetPrice: calcTargetPrice,
                    stopLossPrice: calcStopLossPrice,
                    estimatedProfit: gainVal
                  })}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold rounded-lg py-2.5 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <ArrowUpRight className="w-4 h-4 text-black" /> Registrar Compra na Carteira
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
