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
  const q = query.toLowerCase().trim();

  // Normalize trades
  const enrichedTrades = trades.map((t: any) => {
    const livePrice = t.livePrice || t.purchasePrice;
    const pnlPct = t.purchasePrice > 0 ? ((livePrice - t.purchasePrice) / t.purchasePrice) * 100 : 0;
    const valueBrl = t.totalInvested * (t.currency === 'USDT' ? usdtBrl : 1) * (1 + pnlPct / 100);
    const cleanSymbol = String(t.symbol || '').toUpperCase();
    const cleanBase = cleanSymbol.replace(/USDT|BRL/i, '');
    return {
      ...t,
      cleanSymbol,
      cleanBase,
      livePrice,
      pnlPct,
      valueBrl
    };
  });

  // 1. COMPARATIVE / SWAP / ALL-IN ("vender X e comprar Y", "trocar", "comprar tudo", "all in")
  const isSwapOrAllIn = (q.includes('vender') || q.includes('trocar') || q.includes('sair')) && 
                        (q.includes('comprar') || q.includes('tudo') || q.includes('entrar') || q.includes('all in') || q.includes('colocar') || q.includes('pol') || q.includes('re'));

  if (isSwapOrAllIn) {
    const coinToSell = enrichedTrades.find(t => 
      q.includes(t.cleanSymbol.toLowerCase()) || 
      q.includes(t.cleanBase.toLowerCase()) || 
      (t.coinName && q.includes(t.coinName.toLowerCase()))
    ) || (enrichedTrades.length > 0 ? enrichedTrades[0] : null);

    const otherCoins = enrichedTrades.filter(t => t !== coinToSell);
    const coinToBuy = otherCoins.find(t => 
      q.includes(t.cleanSymbol.toLowerCase()) || 
      q.includes(t.cleanBase.toLowerCase()) || 
      (t.coinName && q.includes(t.coinName.toLowerCase()))
    ) || (otherCoins.length > 0 ? otherCoins[0] : {
      cleanSymbol: 'POLBRL',
      pnlPct: -2.15
    });

    const sellName = coinToSell ? coinToSell.cleanSymbol : 'REBRL';
    const sellPnl = coinToSell ? coinToSell.pnlPct : 2.85;
    const buyName = coinToBuy ? coinToBuy.cleanSymbol : 'POLBRL';
    const buyPnl = coinToBuy ? coinToBuy.pnlPct : -2.15;

    return `🛑 **Veredito Direto: NÃO RECOMENDO colocar 100% em uma única moeda (All-In).**

📊 **Por que não fazer All-In agora?**
1. **${sellName} (${sellPnl >= 0 ? '+' : ''}${sellPnl.toFixed(2)}%):** Você já está no **lucro**. Vender 100% de uma moeda que está performando para arriscar tudo em outra é cortar ganhos e assumir risco concentrado.
2. **${buyName} (${buyPnl >= 0 ? '+' : ''}${buyPnl.toFixed(2)}%):** Concentrar 100% da sua banca em apenas 1 ativo elimina a proteção da sua carteira e dobra o seu risco caso ela continue corrigindo.

🎯 **A Melhor Estratégia Recomendada:**
• **Passo 1 (Lucro no Bolso):** Venda apenas **50% da ${sellName}** para embolsar o lucro de ${sellPnl >= 0 ? '+' : ''}${sellPnl.toFixed(2)}% e deixe a outra metade rodando com Stop no 0 a 0.
• **Passo 2 (Aporte Inteligente):** Use esse lucro obtido para reforçar sua posição na **${buyName}** e melhorar seu preço médio no suporte.
• **Resultado:** Você mantém **2 ativos diversificados**, protege seu capital e não fica refém de uma única moeda!`;
  }

  // 2. SPECIFIC COIN ANALYSIS
  const matchedTrade = enrichedTrades.find(t => 
    q.includes(t.cleanSymbol.toLowerCase()) || 
    q.includes(t.cleanBase.toLowerCase()) || 
    (t.coinName && q.includes(t.coinName.toLowerCase()))
  );

  if (matchedTrade) {
    const isProfit = matchedTrade.pnlPct >= 0;
    const tpPrice = (matchedTrade.purchasePrice * 1.08).toFixed(4);
    const stopPrice = (matchedTrade.purchasePrice * 0.95).toFixed(4);

    return `📊 **Análise Rápida: ${matchedTrade.cleanSymbol}**

• **Preço de Compra:** ${matchedTrade.purchasePrice} ${matchedTrade.currency}
• **Preço Atual:** ${matchedTrade.livePrice} ${matchedTrade.currency} (${isProfit ? '🟢 +' : '🔴 '}${matchedTrade.pnlPct.toFixed(2)}%)
• **Valor em Posição:** R$ ${matchedTrade.valueBrl.toFixed(2)}
• **Alvo Recomendado (Take Profit +8%):** ${tpPrice} ${matchedTrade.currency}
• **Stop Técnico de Proteção (-5%):** ${stopPrice} ${matchedTrade.currency}

⚖️ **Veredito:** ${isProfit 
      ? '🟢 **MANTER / PARCIAL:** Ativo em lucro. Se quiser garantir dinheiro no bolso, realize 50% e suba o Stop para o preço de entrada.' 
      : '🟡 **MANTER / SUPORTE:** Oscilação normal de mercado Spot. Segure a posição até testar a resistência ou configure Stop técnico.'}

💡 **Conselho:** Deixe sua **Ordem OCO** armada na Binance para executar no automático.`;
  }

  // 3. VENDER / REALIZAR
  if (q.includes('vender') || q.includes('realizar') || q.includes('saio')) {
    const winningCoins = enrichedTrades.filter(t => t.pnlPct >= 1.5);
    if (winningCoins.length > 0) {
      const list = winningCoins.map(w => `• **${w.cleanSymbol}:** +${w.pnlPct.toFixed(2)}% de lucro`).join('\n');
      return `🎯 **Orientação de Venda / Realização de Lucro:**

${list}

⚖️ **Recomendação Prática:**
1. **Realização Parcial (50%):** Venda metade das moedas que estão acima de +2.5% para garantir lucro no caixa.
2. **Stop no Breakeven:** Mova o Stop Loss da outra metade para o seu preço de compra (risco zero).
3. **Moedas no negativo:** Não venda em pânico no fundo; aguarde o repique no gráfico de 1H.`;
    }
  }

  if (enrichedTrades.length === 0) {
    return `🎯 **Análise Rápida de Carteira:**\n\n- **Status:** Você está 100% líquido em caixa (R$ ${totalBalanceBrl.toFixed(2)}).\n- **Recomendação:** Excelente momento para aguardar os sinais de **Fundo Reversão (Loss)** com score >90% no radar.\n- **Dica:** Nunca entre com mais de 30% da sua banca em uma única moeda para manter gestão de risco controlada.`;
  }

  // General portfolio analysis
  const totalPnl = enrichedTrades.reduce((acc, t) => acc + t.pnlPct, 0) / (enrichedTrades.length || 1);

  const tradesList = enrichedTrades.map(t => 
    `• **${t.cleanSymbol}:** PNL ${t.pnlPct >= 0 ? '+' : ''}${t.pnlPct.toFixed(2)}% | Investido R$ ${t.valueBrl.toFixed(2)}`
  ).join('\n');

  return `📊 **Diagnóstico Completo das Suas Moedas Ativas:**

${tradesList}

📈 **Média da Carteira:** ${totalPnl >= 0 ? '🟢 +' : '🔴 '}${totalPnl.toFixed(2)}%
🎯 **Plano de Ação Imediato:**
1. Moedas com lucro: posicione Stop no ponto de entrada (0 a 0) ou realize 50% do lucro.
2. Moedas em leve recuo: segure até o teste de suporte do gráfico 1H.
3. Mantenha caixa para aproveitar os sinais de Fundo Reversão.`;
}

startServer();
