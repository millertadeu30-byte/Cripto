import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// List of top cryptocurrencies we track for analysis
const TRACKED_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", 
  "ADAUSDT", "DOGEUSDT", "LINKUSDT", "SUIUSDT", "NEARUSDT",
  "PEPEUSDT", "WIFUSDT"
];

const TRACKED_NAMES: { [key: string]: string } = {
  "BTCUSDT": "Bitcoin",
  "ETHUSDT": "Ethereum",
  "SOLUSDT": "Solana",
  "BNBUSDT": "BNB",
  "XRPUSDT": "Ripple",
  "ADAUSDT": "Cardano",
  "DOGEUSDT": "Dogecoin",
  "LINKUSDT": "Chainlink",
  "SUIUSDT": "Sui",
  "NEARUSDT": "Near Protocol",
  "PEPEUSDT": "Pepe Coin",
  "WIFUSDT": "dogwifhat"
};

// Fetch real-time market prices & 24h stats from Binance public API
async function getBinanceMarketData() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    if (!res.ok) throw new Error("Erro ao buscar dados de mercado da Binance");
    
    const allData = await res.json() as any[];
    
    // Filter and format only our tracked symbols
    const filtered = allData
      .filter(item => TRACKED_SYMBOLS.includes(item.symbol))
      .map(item => ({
        symbol: item.symbol,
        coinName: TRACKED_NAMES[item.symbol] || item.symbol,
        currentPrice: parseFloat(item.lastPrice),
        priceChangePercent: parseFloat(item.priceChangePercent),
        highPrice: parseFloat(item.highPrice),
        lowPrice: parseFloat(item.lowPrice),
        volume: parseFloat(item.volume)
      }));

    // Also get USD to BRL rate to assist BRL calculations
    const usdtBrlRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL");
    let usdtBrl = 5.60;
    if (usdtBrlRes.ok) {
      const bData = await usdtBrlRes.json() as { price: string };
      usdtBrl = parseFloat(bData.price);
    }

    return { filtered, usdtBrl };
  } catch (error) {
    console.error("Erro ao buscar dados da Binance:", error);
    // Fallback static data
    return {
      filtered: [
        { symbol: "BTCUSDT", coinName: "Bitcoin", currentPrice: 91520.40, priceChangePercent: 2.1, highPrice: 92400.00, lowPrice: 89900.00, volume: 22000 },
        { symbol: "ETHUSDT", coinName: "Ethereum", currentPrice: 2475.20, priceChangePercent: -0.5, highPrice: 2510.00, lowPrice: 2440.00, volume: 150000 },
        { symbol: "SOLUSDT", coinName: "Solana", currentPrice: 184.85, priceChangePercent: 5.4, highPrice: 187.50, lowPrice: 174.20, volume: 2100000 },
        { symbol: "BNBUSDT", coinName: "BNB", currentPrice: 592.10, priceChangePercent: 0.8, highPrice: 597.00, lowPrice: 585.00, volume: 45000 },
        { symbol: "XRPUSDT", coinName: "Ripple", currentPrice: 2.45, priceChangePercent: 12.3, highPrice: 2.55, lowPrice: 2.10, volume: 45000000 },
        { symbol: "ADAUSDT", coinName: "Cardano", currentPrice: 0.84, priceChangePercent: -1.2, highPrice: 0.87, lowPrice: 0.82, volume: 12000000 },
        { symbol: "DOGEUSDT", coinName: "Dogecoin", currentPrice: 0.385, priceChangePercent: 4.2, highPrice: 0.398, lowPrice: 0.365, volume: 110000000 },
        { symbol: "LINKUSDT", coinName: "Chainlink", currentPrice: 19.30, priceChangePercent: 1.5, highPrice: 19.60, lowPrice: 18.90, volume: 800000 },
        { symbol: "SUIUSDT", coinName: "Sui", currentPrice: 3.12, priceChangePercent: 8.7, highPrice: 3.25, lowPrice: 2.85, volume: 4000000 },
        { symbol: "NEARUSDT", coinName: "Near Protocol", currentPrice: 5.45, priceChangePercent: 3.1, highPrice: 5.60, lowPrice: 5.20, volume: 1800000 },
        { symbol: "PEPEUSDT", coinName: "Pepe Coin", currentPrice: 0.00001240, priceChangePercent: 15.6, highPrice: 0.00001300, lowPrice: 0.00001050, volume: 85000000 },
        { symbol: "WIFUSDT", coinName: "dogwifhat", currentPrice: 2.85, priceChangePercent: -3.4, highPrice: 3.02, lowPrice: 2.75, volume: 1400000 }
      ],
      usdtBrl: 5.62
    };
  }
}

// Endpoint to fetch public prices and BRL conversion easily
app.get("/api/prices", async (req, res) => {
  const data = await getBinanceMarketData();
  res.json(data);
});

// Endpoint to execute Deep AI Analysis and Portfolio Re-evaluation
app.post("/api/analyze", async (req, res) => {
  try {
    const { trades = [] } = req.body;
    
    // Get latest prices & market stats
    const { filtered: marketData, usdtBrl } = await getBinanceMarketData();
    
    // Build user holdings context for prompt
    let userHoldingsText = "O usuário atualmente não possui nenhuma operação registrada (carteira vazia).";
    if (trades.length > 0) {
      userHoldingsText = "O usuário possui as seguintes operações ativas que comprou e estão registradas em seu app:\n";
      trades.forEach((trade: any, index: number) => {
        userHoldingsText += `${index + 1}. Moeda: ${trade.symbol} (${trade.coinName}) | Preço de Compra: ${trade.purchasePrice} ${trade.currency} | Preço Atual de Mercado: ${trade.currentPrice} ${trade.currency} | Quantidade: ${trade.amount} | Total Investido: ${trade.totalInvested} ${trade.currency}\n`;
      });
    }

    // Build Binance market data summary
    let marketDataText = "";
    marketData.forEach(item => {
      marketDataText += `- ${item.symbol} (${item.coinName}): Preço Atual: $${item.currentPrice} | Variação 24h: ${item.priceChangePercent}% | Máxima 24h: $${item.highPrice} | Mínima 24h: $${item.lowPrice} | Volume: ${item.volume}\n`;
    });

    const systemPrompt = `Você é um Analista de Criptoativos Sênior e Assistente Pessoal da Binance extremamente competente.
Seu objetivo é ajudar um usuário que declarou ser "bem leigo" (iniciante total) a entender o mercado e gerenciar suas operações para obter lucro consistente em curtíssimo prazo (day trade de minutos/horas ou swing trade curtíssimo).

Regras de Análise:
1. Analise os dados reais de mercado fornecidos e selecione as TRÊS (3) moedas mais promissoras no curtíssimo prazo. Justifique com conceitos de análise técnica simples (suporte, resistência, volume alto, momentum, RSI) explicados de forma amigável e acolhedora.
2. Defina ações claras de COMPRA, com um preço de entrada ideal baseado no preço atual, um preço alvo de lucro (Preço Alvo) e um Stop Loss para segurança do usuário. Projete o lucro esperado em porcentagem (ex: 2.5% a 7%).
3. Reavalie rigorosamente o portfólio de operações do usuário (se houver alguma). Compare o preço de compra dele com o preço atual. Diga claramente se ele deve:
   - "MANTER" (segurar pois a tendência é boa. IMPORTANTE: Explique explicitamente ATÉ QUANDO manter, ex: 'Manter até bater R$ 0.015', 'Manter por no máximo 24h aguardando reversão', ou 'Manter enquanto o suporte X não for quebrado'),
   - "VENDER" (realizar lucro imediato porque bateu o alvo ou está perdendo força de alta),
   - "VENDER (STOP)" (cortar a perda pois a moeda rompeu suporte para baixo),
   - "COMPRAR MAIS" (fazer preço médio pois está em zona de suporte forte).
4. Explique cada recomendação em português simples, sem jargões indecifráveis, com tom motivador, profissional e cauteloso, lembrando sempre de gerenciar o risco e nunca investir o que não pode perder.

IMPORTANTE: Você deve responder estritamente no formato JSON estruturado definido no esquema de resposta.`;

    const userPrompt = `
DADOS DO MERCADO ATUAL DA BINANCE (Símbolos cotados em USD/USDT):
${marketDataText}
Taxa de Câmbio USDT/BRL: R$ ${usdtBrl}

CARTEIRA DE OPERAÇÕES ATIVAS DO USUÁRIO:
${userHoldingsText}

Por favor, faça a análise profunda de mercado: selecione as 3 melhores oportunidades do momento e reavalie detalhadamente cada uma das operações ativas do usuário.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              description: "As 3 recomendações mais quentes do momento para curtíssimo prazo",
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING, description: "Símbolo da moeda, ex: SOLUSDT" },
                  coinName: { type: Type.STRING, description: "Nome legível da moeda, ex: Solana" },
                  action: { type: Type.STRING, description: "Ação imediata: COMPRA" },
                  currentPrice: { type: Type.NUMBER, description: "Preço atual de mercado em USDT" },
                  targetPrice: { type: Type.NUMBER, description: "Preço alvo recomendado para vender e lucrar" },
                  stopLossPrice: { type: Type.NUMBER, description: "Preço de Stop Loss sugerido para se proteger" },
                  estimatedProfit: { type: Type.NUMBER, description: "Lucro percentual projetado estimado, ex: 4.8" },
                  timeframe: { type: Type.STRING, description: "Tempo previsto da operação, ex: '1 a 3 horas' ou 'Hoje'" },
                  reasoning: { type: Type.STRING, description: "Explicação em português simples de por que esta moeda é uma excelente oportunidade agora" }
                },
                required: ["symbol", "coinName", "action", "currentPrice", "targetPrice", "stopLossPrice", "estimatedProfit", "timeframe", "reasoning"]
              }
            },
            portfolioAnalysis: {
              type: Type.ARRAY,
              description: "Análise individual para cada moeda que o usuário declarou ter na carteira",
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING, description: "Símbolo da moeda correspondente na carteira, ex: SOLUSDT" },
                  recommendation: { type: Type.STRING, description: "Ação sugerida: MANTER, VENDER, VENDER (STOP), COMPRAR MAIS" },
                  reasoning: { type: Type.STRING, description: "Recomendação com análise simplificada e passos do que fazer em português" },
                  targetPrice: { type: Type.NUMBER, description: "Preço alvo de saída atualizado em USDT ou BRL" },
                  stopLossPrice: { type: Type.NUMBER, description: "Preço de stop loss atualizado em USDT ou BRL" }
                },
                required: ["symbol", "recommendation", "reasoning"]
              }
            }
          },
          required: ["recommendations", "portfolioAnalysis"]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text.trim());
    res.json(parsedResponse);
  } catch (error) {
    console.error("Erro na análise profunda:", error);
    res.status(500).json({ error: "Erro ao gerar análise profunda do mercado." });
  }
});

// Setup Vite Dev Server / Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
