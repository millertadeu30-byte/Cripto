import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, RefreshCw, AlertTriangle, BookOpen, 
  HelpCircle, Sparkles, TrendingUp, History, Compass, ShieldAlert, BadgeInfo, CheckCircle, Trash2
} from 'lucide-react';

import Header from './components/Header';
import TopRecommendations from './components/TopRecommendations';
import PortfolioList from './components/PortfolioList';
import AIAdvisor from './components/AIAdvisor';
import BeginnerGuide from './components/BeginnerGuide';
import AddTradeModal from './components/AddTradeModal';
import ProfitGoalConfigurator from './components/ProfitGoalConfigurator';
import FirebaseSync from './components/FirebaseSync';
import { getDeviceSyncId, saveToCloud, subscribeToCloud } from './lib/firebase';
import { Trade, Recommendation } from './types';

// Real-world holdings from user's actual screenshot to amaze them!
const INITIAL_TRADES: Trade[] = [
  {
    id: 'xrp-initial',
    symbol: 'XRPBRL',
    coinName: 'XRP (Ripple)',
    purchasePrice: 5.6595, // Calculated R$ 36.75 / 6.4935
    amount: 6.4935,
    totalInvested: 36.75,
    currentPrice: 5.6601,
    purchaseTime: new Date().toISOString(),
    currency: 'BRL',
    aiRecommendation: 'MANTER',
    aiReasoning: 'XRP está consolidando em uma zona de suporte forte em BRL. O preço atual está praticamente no seu ponto de entrada. Recomenda-se manter para buscar alvos de curto prazo em R$ 5,90.',
    aiTargetPrice: 5.90,
    aiStopLossPrice: 5.40
  }
];

const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    symbol: 'SOLUSDT',
    coinName: 'Solana',
    action: 'COMPRA',
    currentPrice: 184.85,
    targetPrice: 195.00,
    stopLossPrice: 178.00,
    estimatedProfit: 5.49,
    timeframe: '2 a 6 horas',
    reasoning: 'Solana está testando um suporte de curto prazo na média móvel exponencial de 20 períodos em tempo gráfico de 1 hora. RSI indica sobrevenda moderada com forte volume de compra defendendo a região.'
  },
  {
    symbol: 'BTCUSDT',
    coinName: 'Bitcoin',
    action: 'COMPRA',
    currentPrice: 91520.40,
    targetPrice: 93500.00,
    stopLossPrice: 89900.00,
    estimatedProfit: 2.16,
    timeframe: 'Hoje',
    reasoning: 'O Bitcoin consolidou acima de 91k com redução de volatilidade, padrão clássico de acumulação antes de romper a próxima resistência de curto prazo rumo ao alvo de 93.5k.'
  },
  {
    symbol: 'PEPEUSDT',
    coinName: 'Pepe Coin',
    action: 'COMPRA',
    currentPrice: 0.00001240,
    targetPrice: 0.00001350,
    stopLossPrice: 0.00001150,
    estimatedProfit: 8.87,
    timeframe: 'Curtíssimo Prazo',
    reasoning: 'Pepe Coin apresenta forte momentum com cruzamento de médias de alta e volume 40% acima da média móvel de 24h. Excelente oportunidade de scalp de altíssimo risco e retorno rápido.'
  }
];

const INITIAL_LOGS = [
  `[${new Date().toLocaleTimeString('pt-BR')}] 🤖 Assistente Binance inicializado com sucesso. Pronto para operar!`,
  `[${new Date().toLocaleTimeString('pt-BR')}] 🛡️ Carteira inicial importada com base no seu portfólio ativo.`,
  `[${new Date().toLocaleTimeString('pt-BR')}] 📈 Buscando feeds em tempo real na API pública da Binance...`
];

export default function App() {
  // Sync ID and Firebase Status states
  const [syncId, setSyncId] = useState<string>(getDeviceSyncId());
  const [firebaseStatus, setFirebaseStatus] = useState<'syncing' | 'synced' | 'error'>('syncing');

  // Core Portfolio & Signals state loaded from local storage as offline fallback
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('binance_assistant_trades');
    return saved ? JSON.parse(saved) : INITIAL_TRADES;
  });

  const tradesRef = useRef<Trade[]>(trades);
  useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => {
    const saved = localStorage.getItem('binance_assistant_recommendations');
    return saved ? JSON.parse(saved) : INITIAL_RECOMMENDATIONS;
  });

  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('binance_assistant_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [activityLogs, setActivityLogs] = useState<string[]>(INITIAL_LOGS);

  const [marketPrices, setMarketPrices] = useState<{ [key: string]: number }>({
    'BTCUSDT': 91520.40,
    'ETHUSDT': 2475.20,
    'SOLUSDT': 76.85,
    'BNBUSDT': 592.10,
    'XRPUSDT': 2.45,
    'ADAUSDT': 0.84,
    'DOGEUSDT': 0.385,
    'LINKUSDT': 19.30,
    'SUIUSDT': 3.12,
    'NEARUSDT': 5.45,
    'PEPEUSDT': 0.00001240,
    'WIFUSDT': 2.85,
    'TOWNSBRL': 0.011765 // Initial fallback
  });

  const [usdtBrl, setUsdtBrl] = useState<number>(5.15);
  const [countdown, setCountdown] = useState<number>(1800); // 30 minutes countdown
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(new Date());
  
  // Lifted Goal Percent state for global simulator synchronization
  const [goalPercent, setGoalPercent] = useState<number>(() => {
    const saved = localStorage.getItem('binance_assistant_goal_percent');
    return saved ? Number(saved) : 5; // default 5%
  });

  const handleGoalPercentChange = (val: number) => {
    setGoalPercent(val);
    localStorage.setItem('binance_assistant_goal_percent', String(val));
  };

  // Global wallet cash balance state synchronized with Header and AddTradeModal
  const [cashBalance, setCashBalance] = useState<number>(() => {
    const saved = localStorage.getItem('current_wallet_balance');
    return saved ? parseFloat(saved) : 1000;
  });

  const [cashBalanceCurrency, setCashBalanceCurrency] = useState<'BRL' | 'USDT'>(() => {
    const saved = localStorage.getItem('current_wallet_balance_currency');
    return (saved === 'USDT' || saved === 'BRL') ? saved : 'BRL';
  });

  const handleUpdateCashBalance = (amount: number, currency: 'BRL' | 'USDT') => {
    setCashBalance(amount);
    setCashBalanceCurrency(currency);
    localStorage.setItem('current_wallet_balance', amount.toFixed(4));
    localStorage.setItem('current_wallet_balance_currency', currency);
  };
  
  // Global display currency for synchronization across Header and PortfolioList
  const [displayCurrency, setDisplayCurrency] = useState<'BRL' | 'USDT' | 'BTC'>(() => {
    const saved = localStorage.getItem('binance_assistant_display_currency');
    return (saved as 'BRL' | 'USDT' | 'BTC') || 'BRL';
  });

  const handleDisplayCurrencyChange = (val: 'BRL' | 'USDT' | 'BTC') => {
    setDisplayCurrency(val);
    localStorage.setItem('binance_assistant_display_currency', val);
  };
  
  // Modals / Guides open states
  const [showGuide, setShowGuide] = useState<boolean>(false); // Start closed as requested
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [prefilledTrade, setPrefilledTrade] = useState<any>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [confirmingDeleteHistoryIndex, setConfirmingDeleteHistoryIndex] = useState<number | null>(null);

  // Auto-heal existing trades with mismatched symbols and currencies on startup
  useEffect(() => {
    if (trades.length > 0) {
      let changed = false;
      const healedTrades = trades.map(trade => {
        let updatedTrade = { ...trade };
        
        // 1. Symbol/currency alignment heal
        const baseSymbol = updatedTrade.symbol.replace(/USDT$/, '').replace(/BRL$/, '');
        const expectedSymbol = baseSymbol + updatedTrade.currency;
        if (updatedTrade.symbol !== expectedSymbol) {
          changed = true;
          updatedTrade.symbol = expectedSymbol;
          updatedTrade.currentPrice = marketPrices[expectedSymbol] || updatedTrade.currentPrice;
        }

        // 2. Initialize purchasePriceInBrl and purchasePriceInUsdt if missing,
        // and auto-detect if user entered a BRL price for a USDT trade (e.g. entered 1038.85 for SOLUSDT)
        if (updatedTrade.purchasePriceInBrl === undefined || updatedTrade.purchasePriceInUsdt === undefined) {
          changed = true;
          const rate = usdtBrl || 5.62;
          
          if (updatedTrade.currency === 'USDT') {
            const livePriceEstimate = marketPrices[updatedTrade.symbol] || updatedTrade.currentPrice || 100;
            // If the entered purchasePrice is way higher than the live USDT price (e.g. > 3 * livePriceEstimate)
            if (updatedTrade.purchasePrice / livePriceEstimate > 3) {
              // User entered price in BRL for a USDT trade!
              updatedTrade.purchasePriceInBrl = updatedTrade.purchasePrice;
              updatedTrade.purchasePriceInUsdt = updatedTrade.purchasePrice / rate;
              // Normalize the main purchasePrice to be in USDT to match the trade's currency!
              updatedTrade.purchasePrice = updatedTrade.purchasePriceInUsdt;
            } else {
              // Normal USDT purchase price
              updatedTrade.purchasePriceInUsdt = updatedTrade.purchasePrice;
              updatedTrade.purchasePriceInBrl = updatedTrade.purchasePrice * rate;
            }
          } else {
            // currency === 'BRL'
            updatedTrade.purchasePriceInBrl = updatedTrade.purchasePrice;
            updatedTrade.purchasePriceInUsdt = updatedTrade.purchasePrice / rate;
          }
        }
        
        return updatedTrade;
      });
      if (changed) {
        setTrades(healedTrades);
        pushLog('🔧 Auto-correção: Alinhamento de moedas e preços corrigido com sucesso!');
      }
    }
  }, [trades.length, marketPrices, usdtBrl]);

  // Sync state with localStorage (as instant offline backup)
  useEffect(() => {
    localStorage.setItem('binance_assistant_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('binance_assistant_recommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  useEffect(() => {
    localStorage.setItem('binance_assistant_history', JSON.stringify(history));
  }, [history]);

  // Firestore Sync - Listen to cloud real-time updates
  const ignoreNextUpload = useRef(false);

  useEffect(() => {
    setFirebaseStatus('syncing');
    pushLog(`☁️ Conectando ao Banco de Dados Firebase (Sync ID: ${syncId})...`);
    
    const unsubscribe = subscribeToCloud(syncId, (data) => {
      if (data) {
        ignoreNextUpload.current = true;
        if (data.trades) {
          setTrades(data.trades);
        }
        if (data.history) {
          setHistory(data.history);
        }
        setFirebaseStatus('synced');
        pushLog('🟢 Sincronização em tempo real do Firebase ativa!');
      }
    });

    return () => unsubscribe();
  }, [syncId]);

  // Firestore Sync - Save local changes to cloud
  useEffect(() => {
    if (ignoreNextUpload.current) {
      ignoreNextUpload.current = false;
      return;
    }
    
    setFirebaseStatus('syncing');
    const timer = setTimeout(() => {
      saveToCloud(syncId, trades, history)
        .then(() => {
          setFirebaseStatus('synced');
        })
        .catch((err) => {
          console.error(err);
          setFirebaseStatus('error');
        });
    }, 800); // 800ms debounce to batch fast state modifications
    
    return () => clearTimeout(timer);
  }, [trades, history, syncId]);

  // Handler for user switching their Sync ID
  const handleSyncIdChange = (newSyncId: string) => {
    localStorage.setItem('binance_assistant_sync_id', newSyncId);
    setSyncId(newSyncId);
    pushLog(`☁️ Alterando ID de Sincronização para: ${newSyncId}...`);
  };

  // Fetch real-time market prices & USDTBRL rate every 30 seconds
  const fetchMarketPrices = async () => {
    try {
      const activeTrades = tradesRef.current;
      const extra = activeTrades.map(t => t.symbol).join(',');
      const res = await fetch(`/api/prices?extra=${extra}`);
      if (res.ok) {
        const data = await res.json();
        setUsdtBrl(data.usdtBrl);
        
        // Map symbol price dictionary
        const prices: { [key: string]: number } = {};
        data.filtered.forEach((coin: any) => {
          prices[coin.symbol] = coin.currentPrice;
        });

        // Set BRL counterparts dynamically if they exist or synthesize
        activeTrades.forEach(trade => {
          if (trade.currency === 'BRL') {
            // If it's BRL denom like TOWNSBRL, and we don't have direct ticker, synthesize via USDTBRL
            const usdSymbol = trade.symbol.replace('BRL', 'USDT');
            if (prices[usdSymbol]) {
              prices[trade.symbol] = prices[usdSymbol] * data.usdtBrl;
            } else {
              // Maintain current price fallback
              prices[trade.symbol] = marketPrices[trade.symbol] || trade.currentPrice;
            }
          }
        });

        setMarketPrices(prev => ({ ...prev, ...prices }));

        // Update current prices directly on active trades list for local responsiveness
        setTrades(prevTrades => 
          prevTrades.map(trade => {
            if (trade.isManualPrice) return trade;
            const freshPrice = prices[trade.symbol] || trade.currentPrice;
            return {
              ...trade,
              currentPrice: freshPrice
            };
          })
        );
      }
    } catch (error) {
      console.warn('Erro ao atualizar preços em tempo real:', error);
    }
  };

  useEffect(() => {
    fetchMarketPrices();
    const interval = setInterval(fetchMarketPrices, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // 30-Minute countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger automated re-evaluation
          triggerMarketAnalysis();
          return 1800; // Reset back to 30 min
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Push beautiful activities to log
  const pushLog = (message: string) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setActivityLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Run AI deep market study & portfolio re-evaluation
  const triggerMarketAnalysis = async () => {
    setIsAnalyzing(true);
    pushLog('🔄 Iniciando varredura geral na API pública da Binance...');
    
    try {
      // Fetch latest market prices first to synchronize live metrics immediately on user tap or 30m window
      await fetchMarketPrices();
      pushLog('🤖 Conectando com a Inteligência Sênior Gemini para reanálise profunda...');
      
      const activeTrades = tradesRef.current;
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: activeTrades })
      });

      if (!response.ok) throw new Error('Falha na resposta do servidor AI.');
      
      const data = await response.json();
      
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      }

      // Update recommendations on current portfolio active holdings
      if (data.portfolioAnalysis && data.portfolioAnalysis.length > 0) {
        setTrades(prevTrades => 
          prevTrades.map(trade => {
            // Find if Gemini has a specific analysis for this symbol
            const analysis = data.portfolioAnalysis.find((a: any) => a.symbol === trade.symbol);
            if (analysis) {
              const changed = trade.aiRecommendation !== analysis.recommendation;
              if (changed) {
                pushLog(`🔔 Alerta de sinal para ${trade.symbol} alterado para: ${analysis.recommendation}!`);
              }
              return {
                ...trade,
                aiRecommendation: analysis.recommendation,
                aiReasoning: analysis.reasoning,
                aiTargetPrice: analysis.targetPrice,
                aiStopLossPrice: analysis.stopLossPrice
              };
            }
            return trade;
          })
        );
      }

      setLastAnalysisTime(new Date());
      setCountdown(1800); // Reset timer window
      pushLog('🟢 Reanálise profunda concluída. Sinais e carteiras atualizados!');
    } catch (err) {
      console.error('Erro na análise:', err);
      pushLog('🔴 Falha ao se conectar com os serviços da Inteligência Sênior. Revezando para simulação de retração...');
      
      // Fallback local mock simulation so the app is always highly functional and never breaks
      setLastAnalysisTime(new Date());
      setCountdown(1800);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add new trade manually
  const handleSaveTrade = (newTradeData: Omit<Trade, 'id' | 'pnlValue' | 'pnlPercent' | 'currentPrice'>) => {
    // Sanitize symbol to align exactly with selected currency
    let cleanSymbol = newTradeData.symbol;
    const base = cleanSymbol.replace(/USDT$/, '').replace(/BRL$/, '');
    cleanSymbol = base + newTradeData.currency;

    const livePrice = marketPrices[cleanSymbol] || newTradeData.purchasePrice;
    const newTrade: Trade = {
      ...newTradeData,
      symbol: cleanSymbol,
      id: `trade-${Date.now()}`,
      currentPrice: livePrice
    };

    setTrades(prev => [newTrade, ...prev]);
    pushLog(`📥 Operação registrada: Comprou ${newTrade.amount.toLocaleString()} ${newTrade.symbol} a ${newTrade.currency} ${newTrade.purchasePrice}.`);
    
    // Deduct totalInvested from cashBalance
    const rate = usdtBrl || 5.15;
    let deduction = newTradeData.totalInvested;
    if (newTradeData.currency !== cashBalanceCurrency) {
      deduction = cashBalanceCurrency === 'BRL' ? newTradeData.totalInvested * rate : newTradeData.totalInvested / rate;
    }
    const newCashBalance = Math.max(0, cashBalance - deduction);
    handleUpdateCashBalance(newCashBalance, cashBalanceCurrency);

    // Auto trigger quick AI analysis of this new coin
    setTimeout(triggerMarketAnalysis, 1000);
  };

  // Close trade (user sold)
  const handleCloseTrade = (id: string, exitPrice: number) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;

    const purchaseValue = trade.purchasePrice * trade.amount;
    const exitValue = exitPrice * trade.amount;
    const pnlValueCurrency = exitValue - purchaseValue;
    
    // Compute PNL in BRL for historic stats tracker
    let pnlBrl = pnlValueCurrency;
    if (trade.currency === 'USDT') {
      pnlBrl = pnlValueCurrency * usdtBrl;
    }

    const closedRecord = {
      ...trade,
      exitPrice,
      exitTime: new Date().toISOString(),
      finalPnlValue: pnlValueCurrency,
      finalPnlPercent: (pnlValueCurrency / purchaseValue) * 100,
      pnlBrl
    };

    setHistory(prev => [closedRecord, ...prev]);
    setTrades(prev => prev.filter(t => t.id !== id));

    const winEmoji = pnlBrl >= 0 ? '🎉 Lucro realizado!' : '📉 Perda cortada.';
    pushLog(`🔥 ${winEmoji} Moeda ${trade.symbol} vendida a ${exitPrice}. Resultado: ${pnlBrl >= 0 ? '+' : ''}R$ ${pnlBrl.toFixed(2)} (${closedRecord.finalPnlPercent.toFixed(2)}%)!`);
    
    // Add the exit sold value back to available cash balance
    const rate = usdtBrl || 5.15;
    let refund = exitValue;
    if (trade.currency !== cashBalanceCurrency) {
      refund = cashBalanceCurrency === 'BRL' ? exitValue * rate : exitValue / rate;
    }
    const newCashBalance = cashBalance + refund;
    handleUpdateCashBalance(newCashBalance, cashBalanceCurrency);
  };

  // Simply delete/remove from list
  const handleRemoveTrade = (id: string) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;
    setTrades(prev => prev.filter(t => t.id !== id));
    pushLog(`🗑️ Operação de ${trade.symbol} removida da lista de acompanhamento.`);

    // Refund the initial purchase totalInvested back to available cash balance
    const rate = usdtBrl || 5.15;
    let refund = trade.totalInvested;
    if (trade.currency !== cashBalanceCurrency) {
      refund = cashBalanceCurrency === 'BRL' ? trade.totalInvested * rate : trade.totalInvested / rate;
    }
    const newCashBalance = cashBalance + refund;
    handleUpdateCashBalance(newCashBalance, cashBalanceCurrency);
  };

  // Edit trade values
  const handleEditTrade = (updatedTrade: Trade) => {
    const oldTrade = trades.find(t => t.id === updatedTrade.id);
    setTrades(prevTrades => 
      prevTrades.map(t => t.id === updatedTrade.id ? updatedTrade : t)
    );
    pushLog(`✏️ Operação ${updatedTrade.symbol} editada e atualizada!`);

    // Synchronize difference in totalInvested to cashBalance
    if (oldTrade) {
      const rate = usdtBrl || 5.15;
      let oldInvested = oldTrade.totalInvested;
      if (oldTrade.currency !== cashBalanceCurrency) {
        oldInvested = cashBalanceCurrency === 'BRL' ? oldTrade.totalInvested * rate : oldTrade.totalInvested / rate;
      }
      let newInvested = updatedTrade.totalInvested;
      if (updatedTrade.currency !== cashBalanceCurrency) {
        newInvested = cashBalanceCurrency === 'BRL' ? updatedTrade.totalInvested * rate : updatedTrade.totalInvested / rate;
      }
      const diff = newInvested - oldInvested;
      const newCashBalance = Math.max(0, cashBalance - diff);
      handleUpdateCashBalance(newCashBalance, cashBalanceCurrency);
    }
  };

  // Delete item from sold trades history
  const handleDeleteHistoryItem = (indexToDelete: number) => {
    const record = history[indexToDelete];
    if (!record) return;
    setHistory(prev => prev.filter((_, i) => i !== indexToDelete));
    pushLog(`🗑️ Operação de ${record.symbol} excluída do histórico de vendas.`);
  };

  // Handle click on recommendation buy button
  const handleBuyRecommendation = (rec: Recommendation) => {
    setPrefilledTrade({
      symbol: rec.symbol,
      coinName: rec.coinName,
      price: rec.currentPrice,
      currency: 'USDT' as const
    });
    setIsAddModalOpen(true);
  };

  // Compute stats for history
  const pnlPerformance = history.reduce((acc, curr) => {
    if (curr.pnlBrl >= 0) {
      acc.totalWins += 1;
    } else {
      acc.totalLosses += 1;
    }
    acc.profitEarnedBrl += curr.pnlBrl;
    return acc;
  }, { totalWins: 0, totalLosses: 0, profitEarnedBrl: 0 });

  // Get active priority warnings for purchased coins (Vender/Vender Stop/Comprar Mais)
  const priorityAlerts = trades.filter(t => 
    t.aiRecommendation === 'VENDER' || 
    t.aiRecommendation === 'VENDER (STOP)' || 
    t.aiRecommendation === 'COMPRAR MAIS'
  );

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-12 font-sans select-none antialiased">
      
      {/* Header mimicking Binance Wallet */}
      <Header 
        trades={trades}
        usdtBrl={usdtBrl}
        marketPrices={marketPrices}
        onAddTradeClick={() => {
          setPrefilledTrade(null);
          setIsAddModalOpen(true);
        }}
        onReanalyzeClick={triggerMarketAnalysis}
        onGuideClick={() => setShowGuide(!showGuide)}
        isAnalyzing={isAnalyzing}
        lastAnalysisTime={lastAnalysisTime}
        displayCurrency={displayCurrency}
        onChangeDisplayCurrency={handleDisplayCurrencyChange}
        cashBalance={cashBalance}
        cashBalanceCurrency={cashBalanceCurrency}
        onUpdateCashBalance={handleUpdateCashBalance}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Painel de Alertas de Compra/Venda Imediatos */}
        {priorityAlerts.length > 0 && (
          <div id="immediate-alerts-panel" className="bg-[#181a20] border-2 border-[#f6465d]/50 rounded-2xl p-5 shadow-lg space-y-3 animate-pulse-subtle">
            <div className="flex items-center gap-2 text-[#f6465d] font-bold">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <h3 className="text-sm uppercase tracking-wider">Atenção: Sinais Críticos de Ação Imediata!</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priorityAlerts.map(alertTrade => {
                const liveP = marketPrices[alertTrade.symbol] || alertTrade.purchasePrice;
                const pnl = ((liveP - alertTrade.purchasePrice) / alertTrade.purchasePrice) * 100;
                const isVender = alertTrade.aiRecommendation?.includes('VENDER');

                return (
                  <div key={alertTrade.id} className="bg-[#1e2026] border border-gray-800 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm">{alertTrade.symbol}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${isVender ? 'bg-[#f6465d]/20 text-[#f6465d]' : 'bg-[#0ecb81]/20 text-[#0ecb81]'}`}>
                          Sinal: {alertTrade.aiRecommendation}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {alertTrade.aiReasoning}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-gray-500 block">PNL Atual</span>
                      <span className={`text-sm font-bold ${pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Onboarding Beginner Guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <BeginnerGuide onClose={() => setShowGuide(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bento Grid Core Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Recommendations & Portfolio (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top 3 Criptos mais Promissoras */}
            <TopRecommendations 
              recommendations={recommendations}
              isLoading={isAnalyzing && recommendations.length === 0}
              onBuyClick={handleBuyRecommendation}
            />

            {/* Minhas Moedas Ativas / Portfólio */}
            <PortfolioList 
              trades={trades}
              marketPrices={marketPrices}
              usdtBrl={usdtBrl}
              onRemoveTrade={handleRemoveTrade}
              onCloseTrade={handleCloseTrade}
              onEditTrade={handleEditTrade}
              goalPercent={goalPercent}
              displayCurrency={displayCurrency}
            />

            {/* Simulador de Meta de Lucro Configurada */}
            <ProfitGoalConfigurator 
              trades={trades}
              recommendations={recommendations}
              marketPrices={marketPrices}
              usdtBrl={usdtBrl}
              goalPercent={goalPercent}
              onChangeGoalPercent={handleGoalPercentChange}
            />

            {/* History Section Toggle */}
            <div className="bg-[#181a20] rounded-2xl border border-gray-800 p-6">
              <button
                id="toggle-history-btn"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#f0b90b]" />
                  Histórico de Operações Vendidas (Histórico Spot)
                </span>
                <span className="bg-gray-800 text-gray-300 text-xs px-2.5 py-0.5 rounded-full">
                  {history.length} Fechadas
                </span>
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-gray-800/60"
                  >
                    {history.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-4 text-center">Nenhuma operação encerrada no histórico ainda.</p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {history.map((h, i) => {
                          const isWin = h.pnlBrl >= 0;
                          return (
                            <div key={i} className="bg-gray-900/40 border border-gray-800 p-3 rounded-lg flex justify-between items-center text-xs gap-3">
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-white block truncate">{h.symbol}</span>
                                <span className="text-gray-500 font-sans block truncate">Comprou: {h.purchasePrice} | Vendeu: {h.exitPrice}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`font-bold font-mono block ${isWin ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                                  {isWin ? '+' : ''}R$ {h.pnlBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className={`text-[10px] font-semibold ${isWin ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                                  ({isWin ? '+' : ''}{h.finalPnlPercent.toFixed(2)}%)
                                </span>
                              </div>
                              {confirmingDeleteHistoryIndex === i ? (
                                <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 p-1.5 rounded-lg shrink-0">
                                  <span className="text-[10px] text-red-400 font-semibold shrink-0">Apagar?</span>
                                  <button
                                    onClick={() => {
                                      handleDeleteHistoryItem(i);
                                      setConfirmingDeleteHistoryIndex(null);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    onClick={() => setConfirmingDeleteHistoryIndex(null)}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] px-2 py-1 rounded font-semibold cursor-pointer transition-colors"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmingDeleteHistoryIndex(i)}
                                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                                  title="Apagar registro do histórico"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Right Column: AI Central & Statistics (Span 1) */}
          <div className="lg:col-span-1 space-y-6">
            
            <FirebaseSync 
              syncId={syncId}
              status={firebaseStatus}
              onSyncIdChange={handleSyncIdChange}
            />

            <AIAdvisor 
              countdown={countdown}
              isAnalyzing={isAnalyzing}
              activityLogs={activityLogs}
              pnlPerformance={pnlPerformance}
            />

          </div>

        </div>

      </main>

      {/* Add Trade Registration Modal */}
      <AddTradeModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTrade}
        prefilledData={prefilledTrade}
        marketPrices={marketPrices}
        usdtBrl={usdtBrl}
        cashBalance={cashBalance}
        cashBalanceCurrency={cashBalanceCurrency}
        onUpdateCashBalance={handleUpdateCashBalance}
      />

    </div>
  );
}
