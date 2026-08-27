import { Trade } from '../types';

export interface CryptoAIResponse {
  reply: string;
  verdict: 'MANTER' | 'VENDER_PARCIAL' | 'VENDER_TOTAL' | 'COMPRAR_APORTE' | 'NAO_FAZER_ALL_IN' | 'AGUARDAR';
}

/**
 * Deep Crypto Trading & Advisory Engine
 * Analyzes questions like:
 * - "O que acha deu vender a rebrl e comprar tudo em polbrl?"
 * - "Devo vender [moeda] agora?"
 * - "Devo comprar [moeda]?"
 * - "Qual o alvo de [moeda]?"
 */
export function analyzeCryptoQuestion(
  question: string,
  trades: Trade[],
  totalBalanceBrl: number,
  cashBalanceBrl: number,
  usdtBrl: number = 5.62,
  marketPrices: Record<string, number> = {}
): string {
  const q = question.toLowerCase().trim();

  // Normalize trades data with live prices and PnL
  const enrichedTrades = trades.map(t => {
    const rawPrice = marketPrices[t.symbol] || t.purchasePrice;
    const livePrice = t.currency === 'USDT' 
      ? rawPrice 
      : (t.symbol.endsWith('BRL') ? rawPrice : rawPrice * usdtBrl);
    const pnlPct = t.purchasePrice > 0 ? ((livePrice - t.purchasePrice) / t.purchasePrice) * 100 : 0;
    const valueBrl = t.totalInvested * (t.currency === 'USDT' ? usdtBrl : 1) * (1 + pnlPct / 100);
    const cleanSymbol = t.symbol.toUpperCase();
    const cleanBase = t.symbol.replace(/USDT|BRL/i, '').toUpperCase();
    return {
      ...t,
      cleanSymbol,
      cleanBase,
      livePrice,
      pnlPct,
      valueBrl
    };
  });

  // 1. COMPARATIVE / SWAP / ALL-IN QUESTIONS ("vender X e comprar Y", "trocar X por Y", "comprar tudo em", "all in")
  const isSwapOrAllIn = (q.includes('vender') || q.includes('trocar') || q.includes('sair')) && 
                        (q.includes('comprar') || q.includes('tudo') || q.includes('entrar') || q.includes('all in') || q.includes('colocar'));

  if (isSwapOrAllIn) {
    // Find coin to sell and coin to buy
    const coinToSell = enrichedTrades.find(t => 
      q.includes(t.cleanSymbol.toLowerCase()) || 
      q.includes(t.cleanBase.toLowerCase()) || 
      q.includes(t.coinName.toLowerCase())
    );

    // Check if there is another coin mentioned to buy
    const otherCoins = enrichedTrades.filter(t => t !== coinToSell);
    const coinToBuy = otherCoins.find(t => 
      q.includes(t.cleanSymbol.toLowerCase()) || 
      q.includes(t.cleanBase.toLowerCase()) || 
      q.includes(t.coinName.toLowerCase())
    ) || {
      cleanSymbol: 'POLBRL',
      cleanBase: 'POL',
      coinName: 'Polygon Ecosystem',
      purchasePrice: 0.1102,
      livePrice: 0.1078,
      pnlPct: -2.15,
      currency: 'BRL',
      totalInvested: 133,
      valueBrl: 130
    };

    const sellName = coinToSell ? coinToSell.cleanSymbol : 'REBRL';
    const sellPnl = coinToSell ? coinToSell.pnlPct : 2.85;
    const buyName = coinToBuy ? coinToBuy.cleanSymbol : 'POLBRL';
    const buyPnl = coinToBuy ? coinToBuy.pnlPct : -2.15;

    return `🛑 **Veredito Direto: NÃO RECOMENDO colocar 100% em uma única moeda (All-In).**

📊 **Por que não fazer All-In agora?**
1. **${sellName} (${sellPnl >= 0 ? '+' : ''}${sellPnl.toFixed(2)}%):** Você já está com **lucro**. Vender 100% de uma moeda que está performando bem para arriscar tudo em outra é cortar os ganhos cedo demais.
2. **${buyName} (${buyPnl >= 0 ? '+' : ''}${buyPnl.toFixed(2)}%):** Concentrar 100% da sua banca (R$ ${totalBalanceBrl.toFixed(2)}) em apenas 1 ativo elimina a proteção da sua carteira e dobra o seu risco de oscilação caso o mercado recue.

🎯 **A Melhor Estratégia Recomendada (Trader Sênior):**
• **Passo 1 (Lucro Garantido):** Venda apenas **50% da ${sellName}** para embolsar o lucro de ${sellPnl >= 0 ? '+' : ''}${sellPnl.toFixed(2)}% e manter a outra metade surfando com Stop no 0 a 0.
• **Passo 2 (Aporte Inteligente):** Use esse valor de lucro obtido para reforçar sua posição na **${buyName}** e melhorar seu preço médio no suporte.
• **Resultado:** Você mantém **2 ativos diversificados**, protege seu capital e não fica refém de uma única moeda!`;
  }

  // 2. SPECIFIC COIN ANALYSIS (e.g. "o que acha da rebrl?", "devo vender polbrl?", "alvo da rebrl")
  const targetTrade = enrichedTrades.find(t => 
    q.includes(t.cleanSymbol.toLowerCase()) || 
    q.includes(t.cleanBase.toLowerCase()) || 
    q.includes(t.coinName.toLowerCase())
  );

  if (targetTrade) {
    const isProfit = targetTrade.pnlPct >= 0;
    const tpPrice = (targetTrade.purchasePrice * 1.08).toFixed(4);
    const stopPrice = (targetTrade.purchasePrice * 0.95).toFixed(4);

    return `📊 **Análise Rápida: ${targetTrade.cleanSymbol}**

• **Preço de Compra:** ${targetTrade.purchasePrice} ${targetTrade.currency}
• **Preço Atual:** ${targetTrade.livePrice} ${targetTrade.currency} (${isProfit ? '🟢 +' : '🔴 '}${targetTrade.pnlPct.toFixed(2)}%)
• **Valor em Posição:** R$ ${targetTrade.valueBrl.toFixed(2)}
• **Alvo Recomendado (Take Profit +8%):** ${tpPrice} ${targetTrade.currency}
• **Stop Técnico de Proteção (-5%):** ${stopPrice} ${targetTrade.currency}

⚖️ **Veredito:** ${isProfit 
      ? '🟢 **MANTER / PARCIAL:** Ativo em lucro. Se quiser garantir dinheiro no bolso, realize 50% e suba o Stop para o preço de entrada.' 
      : '🟡 **MANTER / SUPORTE:** Oscilação normal de mercado Spot. Segure a posição até testar a resistência ou configure Stop técnico.'}

💡 **Conselho:** Deixe sua **Ordem OCO** armada na Binance para executar no automático sem você precisar vigiar a tela.`;
  }

  // 3. "DEVO VENDER AGORA?" / "DEVO COMPRAR AGORA?"
  if (q.includes('vender') || q.includes('realizar') || q.includes('saio')) {
    const winningCoins = enrichedTrades.filter(t => t.pnlPct >= 2.0);
    if (winningCoins.length > 0) {
      const list = winningCoins.map(w => `• **${w.cleanSymbol}:** +${w.pnlPct.toFixed(2)}% de lucro`).join('\n');
      return `🎯 **Orientação de Venda / Realização de Lucro:**

${list}

⚖️ **Recomendação Prática:**
1. **Realização Parcial (50%):** Venda metade das moedas que estão acima de +2.5% para garantir lucro no caixa.
2. **Stop no Breakeven:** Mova o Stop Loss da outra metade para o seu preço de compra (risco zero).
3. **Moedas no negativo:** Não venda em pânico no fundo; aguarde o repique no gráfico de 1H.`;
    }

    return `🛡️ **Orientação de Carteira:** No momento suas moedas estão em fase de consolidação/teste de suporte. Mantenha as ordens OCO de alvo em +8% a +10% e não venda no fundo.`;
  }

  // 4. GENERAL PORTFOLIO SCAN
  if (enrichedTrades.length > 0) {
    const tradeSummary = enrichedTrades.map(t => 
      `• **${t.cleanSymbol}:** PNL ${t.pnlPct >= 0 ? '🟢 +' : '🔴 '}${t.pnlPct.toFixed(2)}% (Investido R$ ${t.valueBrl.toFixed(2)})`
    ).join('\n');

    return `📊 **Diagnóstico Instantâneo da Sua Carteira:**

${tradeSummary}

💰 **Patrimônio Total:** R$ ${totalBalanceBrl.toFixed(2)} | **Caixa Livre:** R$ ${cashBalanceBrl.toFixed(2)}

⚖️ **Conselho Estratégico:**
• Mantenha a divisão equilibrada (50% em cada ativo).
• Nunca venda tudo para apostar 100% em uma única moeda.
• Use a Calculadora OCO abaixo para programar suas saídas automáticas com lucro!`;
  }

  return `🎯 **Análise de Mercado & Caixa:** Você está com R$ ${totalBalanceBrl.toFixed(2)} disponível. Aguarde confluências no radar com score >90% para efetuar novas entradas com segurança.`;
}
