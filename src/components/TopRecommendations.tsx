import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, DollarSign, Clock, ShieldAlert, BadgeInfo, Play, Check, Sliders, Globe, Copy, ClipboardCheck, Calculator, Timer } from 'lucide-react';
import { Recommendation } from '../types';
import { analyze5MinCandle } from '../utils/candleUtils';

interface TopRecommendationsProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onBuyClick: (rec: Recommendation) => void;
  usdtBrl?: number;
}

export default function TopRecommendations({ recommendations, isLoading, onBuyClick, usdtBrl = 5.62 }: TopRecommendationsProps) {
  // 5m Candle real-time analysis timer
  const [candleInfo, setCandleInfo] = useState(() => analyze5MinCandle());

  useEffect(() => {
    const timer = setInterval(() => {
      setCandleInfo(analyze5MinCandle());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom Gain % and Loss % configured by user (Foto 3 requirement)
  const [customGainPercent, setCustomGainPercent] = useState<string>('5.5');
  const [customLossPercent, setCustomLossPercent] = useState<string>('3.0');

  // Per-signal investment amount state ($ / R$)
  const [signalInvestments, setSignalInvestments] = useState<{ [symbol: string]: string }>({
    'PROM': '100',
    'UTK': '100',
    'LUNA': '100'
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const gainVal = parseFloat(customGainPercent) || 5.5;
  const lossVal = parseFloat(customLossPercent) || 3.0;

  // High-precision price formatter for micro-coins (Foto 4 requirement, e.g. 0.0467)
  const formatPriceHighPrecision = (price: number) => {
    if (price === 0) return '$0.00';
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
    if (num === 0) return '0.00';
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
            <div key={i} className="h-48 bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="top-recommendations-section" className="bg-[#181a20] rounded-2xl border border-gray-800 p-6 space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-gray-800 pb-4 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className="w-5 h-5 text-[#f0b90b]" />
            <h3 className="text-lg font-bold text-white font-sans flex flex-wrap items-center gap-2">
              <span>Sinais & Oportunidades de Mercado</span>
              <span className="text-[10px] bg-[#f0b90b]/10 text-[#f0b90b] font-mono border border-[#f0b90b]/20 px-2 py-0.5 rounded uppercase font-extrabold">Ranking de Oportunidades</span>
            </h3>
          </div>
          <p className="text-[10.5px] text-gray-400 flex items-center gap-1.5 font-sans">
            <Globe className="w-3.5 h-3.5 text-[#0ecb81] shrink-0" />
            <span>Sinais apurados com auditoria confluente em <strong>5+ portais cripto</strong> (Binance, TradingView, CoinMarketCap, CoinGecko e CryptoCompare).</span>
          </p>
        </div>

        {/* Custom Gain % and Loss % Controls (Foto 3 Requirement) */}
        <div className="flex items-center gap-3 bg-[#1e2026] p-2 rounded-xl border border-gray-800 self-start lg:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-bold px-1">
            <Sliders className="w-3.5 h-3.5 text-[#f0b90b]" />
            <span>Parâmetros do Sinal:</span>
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
          Clique em <strong className="text-white">"Reanalisar Portfólio Agora"</strong> no topo para estudar o mercado!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.slice(0, 3).map((rec, index) => {
            const isFirst = index === 0;

            // Compute target and stop prices strictly based on configured Gain % and Loss %
            const calcTargetPrice = rec.currentPrice * (1 + gainVal / 100);
            const calcStopLossPrice = rec.currentPrice * (1 - lossVal / 100);

            // Per-signal investment amount ($ / R$)
            const rawInvest = parseFloat(signalInvestments[rec.symbol] || '100') || 100;
            const coinQty = rec.currentPrice > 0 ? rawInvest / rec.currentPrice : 0;
            const gainProfitDollars = rawInvest * (gainVal / 100);
            const gainProfitBrl = gainProfitDollars * usdtBrl;

            return (
              <div
                id={`rec-card-${rec.symbol}`}
                key={rec.symbol}
                className={`relative bg-[#1e2026] hover:bg-[#2b2f36]/60 rounded-xl border transition-all duration-300 p-5 overflow-hidden flex flex-col justify-between ${isFirst ? 'border-[#f0b90b] shadow-[0_0_15px_rgba(240,185,11,0.07)]' : 'border-gray-800/80'}`}
              >
                {/* Ranking Tag */}
                <div className={`absolute top-0 right-0 text-[10px] font-extrabold px-3 py-1 rounded-bl-lg uppercase tracking-wider font-mono ${isFirst ? 'bg-[#f0b90b] text-black shadow-md' : 'bg-gray-800 text-gray-300'}`}>
                  {isFirst ? '🏆 MELHOR DA IA (#1)' : `SINAL #${index + 1}`}
                </div>

                {/* Top Info */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase">
                      {rec.action}
                    </span>
                    <span className="text-xs text-gray-400 font-mono font-bold">{rec.symbol}</span>
                  </div>

                  <h4 className="text-lg font-bold text-white font-sans mb-1">{rec.coinName}</h4>

                  {/* 5-Minute Candle Buy Entry Time Box (Estudo de Velas de 5 em 5 minutos) */}
                  <div className="bg-[#121418] border border-[#f0b90b]/40 p-2.5 rounded-lg my-2 font-mono shadow-inner">
                    <div className="flex items-center justify-between text-[10px] text-[#f0b90b] font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#f0b90b]" /> Estudo de Velas 5M (Horário de Entrada)
                      </span>
                      <span className="bg-[#f0b90b]/10 px-1.5 py-0.5 rounded border border-[#f0b90b]/20 text-[9px]">
                        Vela fecha em: {candleInfo.remainingStr}
                      </span>
                    </div>

                    <div className="bg-black/60 p-2 rounded border border-gray-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-gray-400 block font-sans font-semibold">ENTRADA RECOMENDADA DE COMPRA:</span>
                          <span className="text-[#f0b90b] font-black text-sm tracking-wider">
                            ⏰ {rec.recommendedEntryTime || candleInfo.nextEntryTime}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyText(rec.recommendedEntryTime || candleInfo.nextEntryTime, `${rec.symbol}-time`)}
                          className="bg-[#f0b90b]/20 hover:bg-[#f0b90b]/30 text-[#f0b90b] border border-[#f0b90b]/40 px-2.5 py-1 rounded text-[9.5px] font-extrabold cursor-pointer transition-all shadow-sm"
                        >
                          {copiedKey === `${rec.symbol}-time` ? '✓ Copiado' : '📋 Copiar Horário'}
                        </button>
                      </div>

                      {rec.recommendedEntryCandleLabel && (
                        <div className="text-[9px] text-emerald-400 font-sans font-medium pt-1 border-t border-gray-800/80 flex items-center gap-1">
                          <span className="text-[#f0b90b]">💡</span>
                          <span>{rec.recommendedEntryCandleLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Prices & Target (Calculated with High Precision, e.g. 0,0467 -> 0,049268 / 0,045299) */}
                  <div className="grid grid-cols-2 gap-2 my-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800/80 text-xs font-mono">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 block text-[9.5px] font-bold">PREÇO ENTRADA</span>
                        <button
                          onClick={() => handleCopyText(formatRawNumber(rec.currentPrice), `${rec.symbol}-entry`)}
                          className="text-[#f0b90b] hover:text-white text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                          title="Copiar preço de entrada"
                        >
                          {copiedKey === `${rec.symbol}-entry` ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                      <span className="text-white font-extrabold">{formatPriceHighPrecision(rec.currentPrice)}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#0ecb81] block text-[9.5px] font-bold">ALVO (+{gainVal}%)</span>
                        <button
                          onClick={() => handleCopyText(formatRawNumber(calcTargetPrice), `${rec.symbol}-target`)}
                          className="text-[#0ecb81] hover:text-white text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                          title="Copiar alvo de venda"
                        >
                          {copiedKey === `${rec.symbol}-target` ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                      <span className="text-[#0ecb81] font-extrabold">{formatPriceHighPrecision(calcTargetPrice)}</span>
                    </div>
                  </div>

                  {/* Tech stop loss with Copy Button */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-red-400/90 mb-3 bg-red-950/20 p-2.5 rounded-lg border border-red-900/30">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                      <span>Stop Loss (-{lossVal}%):</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-red-400 font-bold">{formatPriceHighPrecision(calcStopLossPrice)}</strong>
                      <button
                        onClick={() => handleCopyText(formatRawNumber(calcStopLossPrice), `${rec.symbol}-stop`)}
                        className="bg-red-900/60 hover:bg-red-800 text-red-200 text-[9px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer"
                        title="Copiar stop loss"
                      >
                        {copiedKey === `${rec.symbol}-stop` ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* Calculator Box per Signal (Foto 2 Requirement: "com qual valor devo entrar pra obter o lucro desejado") */}
                  <div className="bg-[#14161a] p-3 rounded-lg border border-gray-800 space-y-2 mb-4 font-mono text-xs">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
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

                    <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-gray-400 block text-[9px]">COMPRAR (QTD):</span>
                        <span className="text-white font-extrabold">{formatRawNumber(coinQty)} {rec.symbol.replace('USDT', '')}</span>
                      </div>
                      <button
                        onClick={() => handleCopyText(formatRawNumber(coinQty), `${rec.symbol}-qty`)}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-[#f0b90b] border border-[#f0b90b]/30 px-2 py-0.5 rounded text-[9.5px] font-bold transition-all cursor-pointer"
                      >
                        {copiedKey === `${rec.symbol}-qty` ? '✓ Copiada' : '📋 Copiar Qtd'}
                      </button>
                    </div>

                    <div className="text-[10px] text-emerald-400 font-bold pt-1 flex items-center justify-between">
                      <span>LUCRO LÍQUIDO ESPERADO:</span>
                      <span className="bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
                        +${gainProfitDollars.toFixed(2)} (+R$ {gainProfitBrl.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  {/* Technical Reasoning explanation referencing 5 sites research */}
                  <p className="text-xs text-gray-400 leading-relaxed italic mb-4 line-clamp-3 hover:line-clamp-none transition-all duration-200">
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
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <ArrowUpRight className="w-4 h-4" /> Registrar Compra na Carteira
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

