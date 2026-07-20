import React from 'react';
import { TrendingUp, ArrowUpRight, DollarSign, Clock, ShieldAlert, BadgeInfo, Play, Check } from 'lucide-react';
import { Recommendation } from '../types';

interface TopRecommendationsProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onBuyClick: (rec: Recommendation) => void;
}

export default function TopRecommendations({ recommendations, isLoading, onBuyClick }: TopRecommendationsProps) {
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
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#f0b90b]" />
          <h3 className="text-lg font-bold text-white font-sans flex flex-wrap items-center gap-2">
            <span>Sinais & Oportunidades do Mercado</span>
            <span className="text-[10px] bg-[#f0b90b]/10 text-[#f0b90b] font-mono border border-[#f0b90b]/20 px-2 py-0.5 rounded uppercase font-extrabold">Sugestões de Compra</span>
          </h3>
        </div>
        <span className="text-xs text-gray-500 font-mono">Dicas Extras da IA</span>
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
            // Pick a color theme depending on order or profit size
            const isFirst = index === 0;
            return (
              <div
                id={`rec-card-${rec.symbol}`}
                key={rec.symbol}
                className={`relative bg-[#1e2026] hover:bg-[#2b2f36]/60 rounded-xl border transition-all duration-300 p-5 overflow-hidden flex flex-col justify-between ${isFirst ? 'border-[#f0b90b] shadow-[0_0_15px_rgba(240,185,11,0.07)]' : 'border-gray-800/80'}`}
              >
                {/* Ranking Tag */}
                <div className="absolute top-0 right-0 bg-[#f0b90b] text-black text-[10px] font-extrabold px-3 py-1 rounded-bl-lg uppercase tracking-wider font-mono">
                  SINAL #{index + 1}
                </div>

                {/* Top Info */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase">
                      {rec.action}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{rec.symbol}</span>
                  </div>

                  <h4 className="text-lg font-bold text-white font-sans mb-1">{rec.coinName}</h4>
                  
                  {/* Prices & Target */}
                  <div className="grid grid-cols-2 gap-2 my-4 bg-gray-900/40 p-3 rounded-lg border border-gray-800/60 text-xs font-mono">
                    <div>
                      <span className="text-gray-500 block text-[10px]">PREÇO ATUAL</span>
                      <span className="text-white font-bold">${rec.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    </div>
                    <div>
                      <span className="text-[#0ecb81] block text-[10px]">ALVO DE LUCRO</span>
                      <span className="text-[#0ecb81] font-bold">${rec.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    </div>
                  </div>

                  {/* Profit Estimation badge */}
                  <div className="flex items-center justify-between text-xs mb-3 text-gray-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      {rec.timeframe}
                    </span>
                    <span className="text-[#0ecb81] font-bold bg-[#0ecb81]/10 px-2 py-0.5 rounded">
                      +{rec.estimatedProfit.toFixed(1)}% Lucro
                    </span>
                  </div>

                  {/* Tech stop loss */}
                  {rec.stopLossPrice && (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-400/90 mb-4 bg-red-950/15 p-2 rounded border border-red-950/30">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>Stop Loss Seguro sugerido: <strong>${rec.stopLossPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</strong></span>
                    </div>
                  )}

                  {/* Technical Reasoning explanation */}
                  <p className="text-xs text-gray-400 leading-relaxed italic mb-4 line-clamp-4 hover:line-clamp-none transition-all duration-200">
                    "{rec.reasoning}"
                  </p>
                </div>

                {/* Buy Trigger */}
                <button
                  id={`buy-rec-btn-${rec.symbol}`}
                  onClick={() => onBuyClick(rec)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
