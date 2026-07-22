export interface Recommendation {
  symbol: string;
  coinName: string;
  action: 'COMPRA' | 'VENDER' | 'MANTER';
  currentPrice: number;
  targetPrice: number;
  stopLossPrice?: number;
  estimatedProfit: number; // Porcentagem (ex: 3.5 para 3.5%)
  timeframe: string;       // ex: "2-4 horas" ou "Curtíssimo prazo"
  reasoning: string;       // Motivação detalhada
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
