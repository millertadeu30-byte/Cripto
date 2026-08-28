export interface MultiTimeframeStatus {
  timeframe: string; // '5M' | '15M' | '1H' | '4H' | '1D'
  trend: string;
  rsi: number;
  rsiStatus: string;
  emaSignal: string;
  volumeFlow: string;
  summary: string;
}

export interface Recommendation {
  symbol: string;
  coinName: string;
  baseSymbol?: string;
  category?: 'Todas' | 'Homologadas' | 'Scalp Rápido' | 'Fundo & Explosão' | 'Memes' | 'Trending & Novas' | 'Layer 1 / Layer 2' | 'AI & Big Data' | 'DeFi & RWA' | 'Gaming & Infra';
  isHomologated?: boolean;
  action: 'COMPRA' | 'VENDER' | 'MANTER';
  currentPrice: number;
  targetPrice: number;
  stopLossPrice?: number;
  estimatedProfit: number; // Porcentagem (ex: 3.5 para 3.5%)
  timeframe: string;       // ex: "Multi-Período (5M a 4H)"
  reasoning: string;       // Motivação detalhada
  confluenceScore?: number;// 0 a 100% de pontuação técnica
  macroTrend?: string;     // Resumo da tendência 1D / 4H
  riskRewardRatio?: string;// Ex: "1 : 2.4"
  technicalSupport?: number;
  technicalResistance?: number;
  // Fundo & Reversão Explosiva (Moedas Fortes no Fundo Histórico com Explosão 1D - 1W)
  isBottomReversal?: boolean;
  recentDropWeeklyPct?: number;       // Ex: -16.4 (% queda na semana)
  recentDropMonthlyPct?: number;      // Ex: -28.5 (% queda no mês)
  reversalExplosionTargetPct?: number;// Ex: +28.0 (% ganho projetado em 1D-1W)
  bottomSupportStrength?: string;     // Ex: "🛡️ Suporte Histórico 1D Inviolado (Fundo Triplo)"
  reversalExplosionWindow?: string;   // Ex: "Disparo Previsto: 1 Dia a 1 Semana"
  bottomReboundScore?: number;        // Ex: 97
  bottomWhaleAbsorption?: string;     // Ex: "Baleias Acumulando no Fundo (Absorção Institucional)"
  bottomRiskLevel?: string;           // Ex: "Risco de Queda Mínimo / Fundo de Rocha"
  // Fundo Reversão (Loss 3 a 6 Dias) Extended Fields
  consecutiveLossDays?: number;       // De 3 a 6 dias fechando em negativo (Loss)
  isDelistingRiskFree?: boolean;      // Sem risco de extinção / deslistagem (Volume >$5M USD)
  bullishNewsStatus?: string;         // Notícias e Análises apontando Alta Iminente
  hadRecentPump?: boolean;            // Identifica se vinha de alta forte e teve apenas 1 vela vermelha (como ONT)
  dailyCandlesSummary?: { dateFormatted: string; isRed: boolean; changePct: number }[];
  // Scalping specific metrics (Foto / Solicitação de Scalp)
  scalpScore?: number;        // Pontuação de Scalp (Velocidade do Candle Verde + Volume Surge)
  scalpRank?: number;         // 1 = Top 1 Scalp, 2 = Top 2 Scalp
  volumeSurgeRatio?: number;  // Ex: 2.8 (280% acima do volume médio 1h)
  buyPressurePct?: number;    // Ex: 88 (% de compradores dominando o book)
  candleVelocityLabel?: string; // Ex: "🚀 Candle Verde Explosivo (Forte Impulso 1H)"
  scalpWindowMinutes?: number;  // Ex: 10 a 25 min
  scalpEmaCross?: string;       // Ex: "EMA 9 > 21 (Cruzamento de Alta Confirmado)"
  scalpVwapStatus?: string;     // Ex: "+1.2% Acima da VWAP Institucional"
  orderFlowRatio?: string;      // Ex: "4.2x Mais Compradores que Vendedores"
  microTrend15m?: string;       // Ex: "Tops e Fundos Ascendentes no 15M"
  change24h?: number;
  volumeQuoteM?: number;
  mtfAnalysis?: {
    tf5m: MultiTimeframeStatus;
    tf15m: MultiTimeframeStatus;
    tf1h: MultiTimeframeStatus;
    tf4h: MultiTimeframeStatus;
    tf1d: MultiTimeframeStatus;
  };
  recommendedEntryTime?: string;       // Ex: "19:25"
  recommendedEntryCandleLabel?: string;// Ex: "Vela das 19:25 (Martelo Comprador - Entrada Imediata)"
  recommendedExitTime?: string;        // Ex: "19:55"
  entryStatus?: 'ENTRAR_AGORA' | 'AGUARDAR_VELA' | 'PULLBACK_SUPORTE';
  targetCandleMs?: number;
  candleOffsetMinutes?: number;        // 5, 10 ou 15
  candlePatternName?: string;          // Ex: "Martelo Comprador no Suporte (5M)"
  priceActionStructure?: string;       // Ex: "Topo Alto: $0.0495 | Fundo Protegido: $0.0450"
  candleTechnicalDetail?: string;      // Ex: "Volume +180% | RSI 5M em 45 (Zona Compradora)"
}

export interface Trade {
  id: string;
  symbol: string;
  coinName: string;
  purchasePrice: number;    // Preço que o usuário pagou (em USDT ou BRL)
  purchasePriceInBrl?: number; // Preço pago convertido para BRL
  purchasePriceInUsdt?: number; // Preço pago convertido para USDT
  currentPrice: number;     // Preço atual de mercado
  amount: number;           // Quantidade da moeda
  totalInvested: number;    // Preço de compra * Quantidade
  purchaseTime: string;     // Data/hora da compra
  currency: 'USDT' | 'BRL'; // Moeda de cotação
  aiRecommendation?: 'COMPRA' | 'VENDER' | 'MANTER' | 'VENDER (STOP)' | 'COMPRAR MAIS';
  aiReasoning?: string;
  aiTargetPrice?: number;
  aiStopLossPrice?: number;
  isManualPrice?: boolean;  // Se true, o preço atual foi fixado manualmente e não será sobrescrito pela API
  retracementPercent?: number; // Porcentagem de retração customizada para stop loss
  maxPriceReached?: number;    // Preço máximo atingido pela moeda desde a compra
  lastNotifiedTier?: number;   // Último nível de alerta de 9% notificado (ex: 1 para +9%, 2 para +18%, -1 para -9%)
}

export interface MarketPrice {
  symbol: string;
  price: string;
}

export interface AnalysisResponse {
  recommendations: Recommendation[];
  portfolioAnalysis: {
    symbol: string;
    recommendation: 'COMPRA' | 'VENDER' | 'MANTER';
    reasoning: string;
    targetPrice?: number;
    stopLossPrice?: number;
  }[];
}
