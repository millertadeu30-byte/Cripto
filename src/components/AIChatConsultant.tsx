import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, RefreshCw, ChevronDown, ChevronUp, Copy, Check, MessageSquare, Shield, Target, Zap } from 'lucide-react';
import { Trade } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface AIChatConsultantProps {
  trades: Trade[];
  marketPrices: Record<string, number>;
  totalBalanceBrl: number;
  totalBalanceUsdt: number;
  cashBalanceBrl: number;
  usdtBrl: number;
  displayCurrency: 'BRL' | 'USDT' | 'BTC';
}

export default function AIChatConsultant({
  trades,
  marketPrices,
  totalBalanceBrl,
  totalBalanceUsdt,
  cashBalanceBrl,
  usdtBrl,
  displayCurrency
}: AIChatConsultantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('binance_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'initial-greeting',
        sender: 'assistant',
        text: 'Olá! Sou sua **IA Consultora Cripto**. Pergunte qualquer dúvida sobre suas moedas ativas, se deve vender/manter, pontos de entrada ou conselhos estratégicos em tempo real!',
        timestamp: Date.now()
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of message list
  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem('binance_ai_chat_history', JSON.stringify(messages.slice(-20)));
    } catch (e) {}
  }, [messages]);

  // Quick preset questions
  const quickPrompts = [
    { label: '🔍 Analisar Minhas Moedas', prompt: 'Faça uma análise rápida e objetiva de todas as minhas moedas em carteira agora. Devo vender ou manter?' },
    { label: '🎯 Devo Vender Agora?', prompt: 'Qual das minhas moedas ativas já atingiu ponto de realizar lucro ou se devo segurar?' },
    { label: '🛡️ Gestão & Alvos', prompt: 'Qual a melhor estratégia e alvos de ganho/stop para meu saldo atual?' },
    { label: '💡 Dica do Mercado Hoje', prompt: 'Qual o melhor conselho de operação para o mercado de cripto na Binance hoje?' }
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);
    setIsExpanded(true);

    // Prepare portfolio context for the AI
    const enrichedTrades = trades.map(t => {
      const rawPrice = marketPrices[t.symbol] || t.purchasePrice;
      const livePrice = t.currency === 'USDT' 
        ? rawPrice 
        : (t.symbol.endsWith('BRL') ? rawPrice : rawPrice * (usdtBrl || 5.62));
      return {
        symbol: t.symbol,
        coinName: t.coinName,
        purchasePrice: t.purchasePrice,
        livePrice,
        currency: t.currency,
        totalInvested: t.totalInvested
      };
    });

    const portfolioContext = {
      trades: enrichedTrades,
      totalBalanceBrl,
      totalBalanceUsdt,
      cashBalance: cashBalanceBrl,
      usdtBrl,
      displayCurrency
    };

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.slice(-6),
          portfolioContext
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.reply || 'Análise concluída com sucesso.';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      // Offline / Local Instant Fallback
      let fallbackText = `📊 **Análise Rápida das Suas Moedas:**\n\n`;
      if (enrichedTrades.length > 0) {
        enrichedTrades.forEach(t => {
          const pnlPct = t.purchasePrice > 0 ? ((t.livePrice - t.purchasePrice) / t.purchasePrice) * 100 : 0;
          fallbackText += `• **${t.symbol}:** PNL ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}% | Posição: ${pnlPct >= 0 ? '🟢 Lucrando (Segurar ou Parcial)' : '🟡 Dentro do suporte'}\n`;
        });
        fallbackText += `\n⚖️ **Veredito Geral:** Mantenha ordens OCO armadas na Binance com alvo de +8% a +10% e Stop de -5%.`;
      } else {
        fallbackText += `Você está 100% líquido em caixa (R$ ${totalBalanceBrl.toFixed(2)}). Aguarde confluências de Fundo Reversão (Loss) com Score >90%.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-fallback-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    const initial: ChatMessage[] = [
      {
        id: 'initial-greeting',
        sender: 'assistant',
        text: 'Histórico limpo! Como posso te orientar agora sobre suas moedas ou estratégias?',
        timestamp: Date.now()
      }
    ];
    setMessages(initial);
    try {
      localStorage.removeItem('binance_ai_chat_history');
    } catch (e) {}
  };

  // Render markdown-like bold text and lists cleanly
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs text-gray-200 leading-relaxed font-sans">
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-1" />;
          
          // Bold replacement **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedParts = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="text-[#f0b90b] font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <div key={i} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#f0b90b] text-[10px] mt-0.5">•</span>
                <span className="flex-1">{formattedParts}</span>
              </div>
            );
          }

          if (line.startsWith('⚖️') || line.startsWith('🎯') || line.startsWith('📊') || line.startsWith('💡') || line.startsWith('🛡️')) {
            return (
              <div key={i} className="bg-black/30 border border-gray-800/80 rounded-lg p-2 my-1 text-xs">
                {formattedParts}
              </div>
            );
          }

          return <p key={i}>{formattedParts}</p>;
        })}
      </div>
    );
  };

  return (
    <div id="ai-chat-consultant-box" className="bg-[#181a20] border border-[#f0b90b]/40 hover:border-[#f0b90b]/70 rounded-xl p-3 shadow-lg transition-all space-y-2.5">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f0b90b]/15 border border-[#f0b90b]/30 flex items-center justify-center text-[#f0b90b]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">IA Consultora de Cripto</span>
              <span className="bg-[#0ecb81]/20 text-[#0ecb81] border border-[#0ecb81]/40 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                Online & Rápida
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Análise de moedas, dúvidas e conselhos instantâneos</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-gray-200 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Limpar conversa"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? "Recolher conversa" : "Expandir conversa"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-[#f0b90b]" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick 1-Click Action Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={isLoading}
            className="shrink-0 bg-[#1e2026] hover:bg-[#252830] active:scale-95 border border-gray-700/60 hover:border-[#f0b90b]/50 text-[10px] text-gray-300 hover:text-white px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      {isExpanded && (
        <div className="bg-[#121318] border border-gray-800/80 rounded-lg p-2.5 max-h-64 overflow-y-auto space-y-2.5 scrollbar-thin">
          {messages.map((m) => {
            const isMe = m.sender === 'user';
            const isCopied = copiedMessageId === m.id;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-0.5`}
              >
                <div className="flex items-center gap-1.5 text-[9px] text-gray-500 px-1">
                  <span>{isMe ? 'Você' : 'IA Consultora'}</span>
                  <span>•</span>
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`rounded-xl p-2.5 max-w-[95%] relative group ${
                    isMe
                      ? 'bg-[#2b313a] text-white border border-gray-700 rounded-br-none text-xs font-sans'
                      : 'bg-[#1a1c23] border border-gray-800/90 rounded-bl-none text-xs'
                  }`}
                >
                  {isMe ? (
                    <p className="text-xs text-white">{m.text}</p>
                  ) : (
                    renderFormattedText(m.text)
                  )}

                  {!isMe && (
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-800/90 hover:bg-gray-700 text-gray-300 p-1 rounded transition-all text-[10px] flex items-center gap-1 cursor-pointer"
                      title="Copiar resposta"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-[#0ecb81]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 bg-[#1a1c23] border border-gray-800 rounded-xl p-2.5 rounded-bl-none max-w-[85%] text-xs text-gray-400 animate-pulse">
              <Sparkles className="w-4 h-4 text-[#f0b90b] animate-spin" />
              <span>Analisando suas moedas e formulando conselho objetivo...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-1.5"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Pergunte sobre suas moedas, vender/manter ou conselhos..."
            disabled={isLoading}
            className="w-full bg-[#121318] border border-gray-700/80 focus:border-[#f0b90b] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors pr-8"
          />
          {inputQuery && (
            <button
              type="button"
              onClick={() => setInputQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="bg-[#f0b90b] hover:bg-[#d4a30a] active:scale-95 disabled:opacity-40 disabled:hover:bg-[#f0b90b] text-black font-extrabold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 shadow-md"
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perguntar</span>
            </>
          )}
        </button>
      </form>

    </div>
  );
}
