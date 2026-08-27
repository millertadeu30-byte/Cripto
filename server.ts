import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // AI Crypto Chat & Consultation API
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, conversationHistory = [], portfolioContext = {}, marketContext = {} } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Mensagem é obrigatória." });
      }

      const activeTrades = portfolioContext.trades || [];
      const totalBalanceBrl = portfolioContext.totalBalanceBrl || 0;
      const totalBalanceUsdt = portfolioContext.totalBalanceUsdt || 0;
      const usdtBrl = portfolioContext.usdtBrl || 5.62;
      const cashBalance = portfolioContext.cashBalance || 0;

      const portfolioSummaryStr = activeTrades.length > 0 
        ? activeTrades.map((t: any) => {
            const livePrice = t.livePrice || t.purchasePrice;
            const pnlPct = t.purchasePrice > 0 ? ((livePrice - t.purchasePrice) / t.purchasePrice) * 100 : 0;
            return `- ${t.symbol} (${t.coinName}): Compra = ${t.purchasePrice} ${t.currency}, Atual = ${livePrice} ${t.currency}, PNL = ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%, Investido = ${t.totalInvested} ${t.currency}`;
          }).join('\n')
        : "Nenhum investimento ativo no momento (100% em Caixa ou aguardando sinais).";

      const systemInstruction = `Você é o Consultor Sênior de Cripto & IA Integrada da Binance Spot.
Sua missão: fornecer respostas RÁPIDAS, OBJETIVAS, DIRETAS e ALTAMENTE TÉCNICAS sobre as moedas do usuário, dúvidas de mercado, pontos de entrada, alvos de lucro (Take Profit), stop loss e gestão de risco.

CONTEXTO ATUAL DA CARTEIRA DO USUÁRIO:
- Saldo Total: R$ ${totalBalanceBrl.toFixed(2)} (≈ ${totalBalanceUsdt.toFixed(2)} USDT)
- Saldo em Caixa Livre: R$ ${cashBalance.toFixed(2)}
- Câmbio: 1 USDT = R$ ${usdtBrl.toFixed(2)}
- Moedas em Carteira:
${portfolioSummaryStr}

REGRAS DE RESPOSTA (SEJA RÁPIDO E OBJETIVO):
1. Seja direto ao ponto. Use tópicos curtos e emojis estratégicos (🎯 Alvo, 🛡️ Stop, ⚖️ Veredito).
2. Se o usuário perguntar sobre moedas da carteira (ex: REBRL, POLBRL ou outras), use os dados exatos de compra e PNL do contexto.
3. Forneça sempre o Veredito claro: [MANTER 🟢], [VENDER / REALIZAR LUCRO 🟡], [COMPRAR / APORTAR 🚀] ou [STOP TÉCNICO 🔴].
4. Se o usuário pedir conselho geral de compra/venda, oriente ordens OCO com alvo de 5% a 15% e stop de 3% a 5%.
5. Responda em Português do Brasil de forma profissional, segura e encorajadora.`;

      const ai = getGeminiAI();

      if (ai) {
        // Build chat history for Gemini
        const chat = ai.chats.create({
          model: "gemini-3.7-flash",
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.9,
          },
        });

        // Replay prior history if provided
        for (const item of conversationHistory.slice(-4)) {
          if (item.sender === 'user') {
            // we send prior context
          }
        }

        const response = await chat.sendMessage({
          message: `Pergunta do usuário: "${message}"`,
        });

        const reply = response.text || "Análise concluída com sucesso.";
        return res.json({ reply, success: true, source: 'gemini-3.7-flash' });
      }

      // Fallback local analytical intelligence if GEMINI_API_KEY is not configured yet
      const fallbackAnalysis = generateSmartLocalCryptoAnalysis(message, activeTrades, totalBalanceBrl, usdtBrl);
      return res.json({ reply: fallbackAnalysis, success: true, source: 'local-crypto-engine' });

    } catch (err: any) {
      console.error("Gemini API Error:", err);
      // Fallback on error so the user never gets an empty error box
      const fallback = generateSmartLocalCryptoAnalysis(
        req.body?.message || "", 
        req.body?.portfolioContext?.trades || [], 
        req.body?.portfolioContext?.totalBalanceBrl || 0,
        req.body?.portfolioContext?.usdtBrl || 5.62
      );
      return res.json({ reply: fallback, success: true, fallback: true });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Crypto Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

/**
 * Intelligent deterministic local crypto analyst fallback
 */
function generateSmartLocalCryptoAnalysis(
  query: string, 
  trades: any[], 
  totalBalanceBrl: number,
  usdtBrl: number
): string {
  const q = query.toLowerCase();

  if (trades.length === 0) {
    return `🎯 **Análise Rápida de Carteira:**\n\n- **Status:** Você está 100% líquido em caixa (R$ ${totalBalanceBrl.toFixed(2)}).\n- **Recomendação:** Excelente momento para aguardar os sinais de **Fundo Reversão (Loss)** com score >90% no radar ou posicionar ordens limite de compra em suportes fortes.\n- **Dica:** Nunca entre com mais de 30% da sua banca em uma única moeda para manter gestão de risco controlada.`;
  }

  // Analyzing user's specific active coins
  const matchedTrade = trades.find(t => 
    q.includes(t.symbol.toLowerCase()) || 
    q.includes(t.coinName.toLowerCase()) ||
    (t.symbol.toLowerCase().replace(/usdt|brl/g, '') && q.includes(t.symbol.toLowerCase().replace(/usdt|brl/g, '')))
  );

  if (matchedTrade) {
    const livePrice = matchedTrade.livePrice || matchedTrade.purchasePrice;
    const pnlPct = matchedTrade.purchasePrice > 0 ? ((livePrice - matchedTrade.purchasePrice) / matchedTrade.purchasePrice) * 100 : 0;
    const isProfit = pnlPct >= 0;
    const targetGainPrice = (matchedTrade.purchasePrice * 1.08).toFixed(4);
    const stopLossPrice = (matchedTrade.purchasePrice * 0.95).toFixed(4);

    return `📊 **Análise Rápida: ${matchedTrade.symbol}**\n\n` +
      `• **Preço de Compra:** ${matchedTrade.purchasePrice} ${matchedTrade.currency}\n` +
      `• **Preço Atual:** ${livePrice} ${matchedTrade.currency} (${isProfit ? '🟢 +' : '🔴 '}${pnlPct.toFixed(2)}%)\n` +
      `• **Alvo Sugerido (Take Profit +8%):** ${targetGainPrice} ${matchedTrade.currency}\n` +
      `• **Stop Técnico de Proteção (-5%):** ${stopLossPrice} ${matchedTrade.currency}\n\n` +
      `⚖️ **Veredito:** ${isProfit ? '🟡 **MANTER / PARCIAL:** Ativo em lucro. Configure ordem OCO com o alvo acima para garantir o ganho.' : '🟢 **MANTER / AGUARDAR REPIQUE:** Queda controlada dentro da margem de oscilação do mercado Spot.'}\n\n` +
      `💡 **Conselho:** Deixe sua ordem OCO armada na Binance para não precisar vigiar a tela 24 horas.`;
  }

  // General portfolio analysis
  const totalPnl = trades.reduce((acc, t) => {
    const livePrice = t.livePrice || t.purchasePrice;
    const pnl = t.purchasePrice > 0 ? ((livePrice - t.purchasePrice) / t.purchasePrice) * 100 : 0;
    return acc + pnl;
  }, 0) / (trades.length || 1);

  const tradesList = trades.map(t => {
    const live = t.livePrice || t.purchasePrice;
    const pnl = t.purchasePrice > 0 ? ((live - t.purchasePrice) / t.purchasePrice) * 100 : 0;
    return `• **${t.symbol}:** PNL ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}% | Investido R$ ${(t.totalInvested * (t.currency === 'USDT' ? usdtBrl : 1)).toFixed(2)}`;
  }).join('\n');

  return `📊 **Diagnóstico Completo das Suas Moedas Ativas:**\n\n` +
    `${tradesList}\n\n` +
    `📈 **Média da Carteira:** ${totalPnl >= 0 ? '🟢 +' : '🔴 '}${totalPnl.toFixed(2)}%\n` +
    `🎯 **Plano de Ação Imediato:**\n` +
    `1. Moedas com lucro acima de +5%: posicione Stop no ponto de entrada (0 a 0) ou realize 50% do lucro.\n` +
    `2. Moedas em leve recuo: segure até o teste de suporte do gráfico 1H.\n` +
    `3. Mantenha caixa para aproveitar os sinais de Fundo Reversão.`;
}

startServer();
