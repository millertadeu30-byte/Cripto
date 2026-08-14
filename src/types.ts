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
  mtfAnalysis?: {
    tf5m: MultiTimeframeStatus;
    tf15m: MultiTimeframeStatus;
    tf1h: MultiTimeframeStatus;
    tf4h: MultiTimeframeStatus;
    tf1d: MultiTimeframeStatus;
  };
  recommendedEntryTime?: string;       // Ex: "13:30:00" ou "13:35:00"
  recommendedEntryCandleLabel?: string;// Ex: "Vela das 13:30 (Martelo Comprador - Entrada Imediata)"
  recommendedExitTime?: string;        // Ex: "13:45:00"
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
