import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, RefreshCw, Layers, Search } from 'lucide-react';
import { Trade } from '../types';
import { VERIFIED_BINANCE_COINS, formatCoinDisplayName } from '../utils/verifiedCoins';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'pnlValue' | 'pnlPercent' | 'currentPrice'>) => void;
  prefilledData?: {
    symbol: string;
    coinName: string;
    price: number;
    currency: 'USDT' | 'BRL';
  } | null;
  marketPrices?: { [key: string]: number };
  usdtBrl?: number;
  cashBalance: number;
  cashBalanceCurrency: 'BRL' | 'USDT';
  onUpdateCashBalance: (amount: number, currency: 'BRL' | 'USDT') => void;
}

export default function AddTradeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  prefilledData, 
  marketPrices, 
  usdtBrl,
  cashBalance,
  cashBalanceCurrency,
  onUpdateCashBalance
}: AddTradeModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'paste'>('manual');
  const [simpleMode, setSimpleMode] = useState(true);
  const [symbol, setSymbol] = useState('BTCBRL');
  const [coinName, setCoinName] = useState('Bitcoin');
  const [purchasePrice, setPurchasePrice] = useState<string>('0');
  const [amount, setAmount] = useState<string>('0');
  const [totalInvested, setTotalInvested] = useState<string>('0');
  const [currency, setCurrency] = useState<'USDT' | 'BRL'>('BRL');
  const [inputPriceCurrency, setInputPriceCurrency] = useState<'USDT' | 'BRL'>('BRL');
  const [purchaseTime, setPurchaseTime] = useState('');
  const [isManualPrice, setIsManualPrice] = useState<boolean>(false);
  const [availableBalance, setAvailableBalance] = useState<string>(cashBalance.toString());
  
  // Paste Tab States
  const [pasteText, setPasteText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{
    symbol: string;
    coinName: string;
    amount: number;
    totalInvested: number;
    purchasePrice: number;
    currency: 'USDT' | 'BRL';
  } | null>(null);

  const [pasteNotification, setPasteNotification] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper to resolve live price of current symbol
  const getLivePrice = (baseSymbol: string, curr: 'USDT' | 'BRL'): number => {
    if (!marketPrices) return 0;
    const base = baseSymbol.replace(/USDT$/, '').replace(/BRL$/, '');
    
    // Check direct marketPrices first
    const directSymbol = base + curr;
    if (marketPrices[directSymbol]) {
      return marketPrices[directSymbol];
    }
    
    // Convert USDT price to BRL if needed
    const usdtSymbol = base + 'USDT';
    if (marketPrices[usdtSymbol]) {
      const usdtPrice = marketPrices[usdtSymbol];
      if (curr === 'BRL') {
        return usdtPrice * (usdtBrl || 5.62);
      }
      return usdtPrice;
    }
    
    return 0;
  };

  // Handle prefilled data from recommendations
  useEffect(() => {
    if (prefilledData) {
      const base = prefilledData.symbol.replace(/USDT$/, '').replace(/BRL$/, '');
      setSymbol(base + 'BRL'); // Default to BRL
      setCoinName(prefilledData.coinName);
      setCurrency('BRL');
      
      const liveBrlPrice = prefilledData.price * (usdtBrl || 5.62);
      setPurchasePrice(liveBrlPrice.toFixed(4));
      setActiveTab('manual');
      setSimpleMode(true);
    } else {
      setSymbol('BTCBRL');
      setCoinName('Bitcoin');
      setPurchasePrice('0');
      setCurrency('BRL');
      setSimpleMode(true);
    }
    
    // Set current date/time in local format
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setPurchaseTime(localISOTime);
    setAmount('0');
    setTotalInvested('0');
    setIsManualPrice(false);
    setPasteText('');
    setParsedPreview(null);
    setFormError(null);
    setPasteNotification(null);

    if (isOpen) {
      setAvailableBalance(cashBalance.toString());
      setCurrency(cashBalanceCurrency);
      setInputPriceCurrency(cashBalanceCurrency);
    }
  }, [prefilledData, isOpen, usdtBrl, cashBalance, cashBalanceCurrency]);

  // Real-time calculator effect for simple mode
  useEffect(() => {
    if (simpleMode && symbol && symbol !== 'CUSTOM') {
      const base = symbol.replace(/USDT$/, '').replace(/BRL$/, '');
      const liveP = getLivePrice(base, currency);
      if (liveP > 0) {
        if (!isManualPrice) {
          setPurchasePrice(liveP.toFixed(8));
          const tot = parseFloat(totalInvested) || 0;
          if (tot > 0) {
            setAmount((tot / liveP).toFixed(8));
          } else {
            setAmount('0');
          }
        } else {
          const tot = parseFloat(totalInvested) || 0;
          const currentP = parseFloat(purchasePrice) || 0;
          if (tot > 0 && currentP > 0) {
            setAmount((tot / currentP).toFixed(8));
          } else {
            setAmount('0');
          }
        }
      }
    }
  }, [symbol, currency, totalInvested, simpleMode, marketPrices, usdtBrl, isManualPrice, purchasePrice]);

  // Helper to parse numbers robustly with dot/comma support
  const parseSmartNumber = (str: string): number => {
    // Strip spaces, currency signs and symbols
    let clean = str.replace(/[R$\sBRLUSDT]/gi, '');
    
    // If it has a comma and no dot (e.g., 6,4935 or 36,75), convert comma to dot
    if (clean.includes(',') && !clean.includes('.')) {
      clean = clean.replace(',', '.');
    }
    // If it has both dot and comma (e.g., 1.250,50), handle thousands vs decimal
    else if (clean.includes(',') && clean.includes('.')) {
      if (clean.indexOf('.') < clean.indexOf(',')) {
        // Dot is thousands, comma is decimal
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        // Comma is thousands, dot is decimal (e.g., 1,250.50)
        clean = clean.replace(/,/g, '');
      }
    }
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Client-side parser for pasted Binance wallet text/screen copy
  useEffect(() => {
    if (!pasteText.trim()) {
      setParsedPreview(null);
      return;
    }

    const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParsedPreview(null);
      return;
    }

    let parsedSym = '';
    let parsedAmt = 0;
    let parsedTot = 0;
    let parsedCurr: 'BRL' | 'USDT' = 'BRL'; // Default to BRL since user is Brazilian/BRL-centric

    // Loop over lines to extract info
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Detect Symbol (ignoring common menu keywords)
      if (!parsedSym) {
        const cleaned = line.replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (
          cleaned.length >= 2 && 
          cleaned.length <= 10 && 
          !['PNL', 'EARN', 'TRADE', 'ALPHA', 'SPOT', 'VISAO', 'GERAL', 'BRL', 'USDT', 'FLUTUANTE', 'ADICIONAR', 'ENVIAR', 'TRANSFERE', 'TRANSFERIR', 'HOJE'].includes(cleaned)
        ) {
          parsedSym = cleaned;
        }
      }

      // 2. Detect Amount (avoid lines containing R$, $, %, +, -)
      if (!line.includes('R$') && !line.includes('$') && !line.includes('%') && !line.includes('+') && !line.includes('-')) {
        const num = parseSmartNumber(line);
        if (num > 0) {
          if (parsedAmt === 0) {
            parsedAmt = num;
          } else if (num < parsedAmt && parsedAmt > 10) {
            // If the next number is smaller, it's more likely the amount
            parsedAmt = num;
          }
        }
      }

      // 3. Detect Value / Currency
      if (line.includes('R$') || line.includes('BRL')) {
        parsedCurr = 'BRL';
        const val = parseSmartNumber(line);
        if (val > 0) {
          parsedTot = val;
        }
      } else if (line.includes('$') || line.includes('USDT')) {
        parsedCurr = 'USDT';
        const val = parseSmartNumber(line);
        if (val > 0) {
          parsedTot = val;
        }
      }
    }

    // Calculate purchase price
    let parsedPrice = 0;
    if (parsedAmt > 0 && parsedTot > 0) {
      parsedPrice = Number((parsedTot / parsedAmt).toFixed(8));
    }

    if (parsedSym) {
      let finalSym = parsedSym;
      if (!parsedSym.endsWith('BRL') && !parsedSym.endsWith('USDT')) {
        finalSym = parsedSym + parsedCurr;
      }

      setParsedPreview({
        symbol: finalSym,
        coinName: parsedSym,
        amount: parsedAmt,
        totalInvested: parsedTot,
        purchasePrice: parsedPrice,
        currency: parsedCurr
      });
    } else {
      setParsedPreview(null);
    }
  }, [pasteText]);

  // Sync total invested and amount
  const handlePriceChange = (valStr: string) => {
    setPurchasePrice(valStr);
    const price = parseFloat(valStr.replace(',', '.'));
    let amt = parseFloat(amount.replace(',', '.'));
    const balance = parseFloat(availableBalance.replace(',', '.')) || 0;
    
    if (!isNaN(price) && !isNaN(amt)) {
      let tot = price * amt;
      if (tot > balance) {
        tot = balance;
        amt = balance / price;
        setAmount(amt.toString());
      }
      setTotalInvested(tot.toString());
    }
  };

  const handleAmountChange = (valStr: string) => {
    setAmount(valStr);
    let amt = parseFloat(valStr.replace(',', '.'));
    const price = parseFloat(purchasePrice.replace(',', '.')) || 0;
    const balance = parseFloat(availableBalance.replace(',', '.')) || 0;
    
    if (!isNaN(price) && !isNaN(amt)) {
      let tot = price * amt;
      if (tot > balance) {
        tot = balance;
        amt = balance / price;
        setAmount(amt.toString());
      }
      setTotalInvested(tot.toString());
    }
  };

  const handleTotalChange = (valStr: string) => {
    const cleanValStr = valStr.replace(',', '.');
    let tot = parseFloat(cleanValStr);
    const balance = parseFloat(availableBalance.replace(',', '.')) || 0;
    
    if (!isNaN(tot) && tot > balance) {
      tot = balance;
      valStr = balance.toString();
    }
    
    setTotalInvested(valStr);
    const price = parseFloat(purchasePrice.replace(',', '.'));
    if (!isNaN(tot) && !isNaN(price) && price > 0) {
      setAmount((tot / price).toString());
    } else if (!isNaN(tot)) {
      const amt = parseFloat(amount.replace(',', '.'));
      if (!isNaN(amt) && amt > 0) {
        setPurchasePrice((tot / amt).toString());
      }
    }
  };

  const handleAvailableBalanceChange = (valStr: string) => {
    setAvailableBalance(valStr);
    
    const balance = parseFloat(valStr.replace(',', '.')) || 0;
    onUpdateCashBalance(balance, currency);

    const tot = parseFloat(totalInvested.replace(',', '.')) || 0;
    if (tot > balance) {
      setTotalInvested(valStr);
      const price = parseFloat(purchasePrice.replace(',', '.'));
      if (price > 0) {
        setAmount((balance / price).toString());
      }
    }
  };

  const handleCurrencyChange = (newCurr: 'USDT' | 'BRL') => {
    setCurrency(newCurr);
    const baseSym = symbol.replace(/USDT$/, '').replace(/BRL$/, '');
    if (baseSym && baseSym !== 'CUSTOM') {
      setSymbol(baseSym + newCurr);
    }

    // Convert current balance to new currency for elite, smooth UX!
    const currentNum = parseFloat(availableBalance) || 0;
    let converted = currentNum;
    const rate = usdtBrl || 5.15;
    if (newCurr === 'BRL' && cashBalanceCurrency === 'USDT') {
      converted = currentNum * rate;
    } else if (newCurr === 'USDT' && cashBalanceCurrency === 'BRL') {
      converted = currentNum / rate;
    }
    setAvailableBalance(converted.toFixed(2));
    onUpdateCashBalance(converted, newCurr);
  };

  const handleCoinSelection = (base: string) => {
    if (base === 'CUSTOM') {
      setSymbol('CUSTOM');
      setCoinName('');
      return;
    }
    const coin = VERIFIED_BINANCE_COINS.find(c => c.base === base);
    if (coin) {
      setSymbol(base + currency);
      setCoinName(coin.name);
    } else {
      setSymbol(base + currency);
      setCoinName(formatCoinDisplayName(base));
    }
  };

  const handleClipboardPaste = async () => {
    setPasteNotification(null);
    try {
      if (!navigator.clipboard) {
        setPasteNotification({
          type: 'info',
          text: 'Acesso automático bloqueado pelo navegador. Por favor, segure o campo abaixo para colar manualmente.'
        });
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteText(text);
        setPasteNotification({
          type: 'success',
          text: 'Dados colados e identificados com sucesso!'
        });
      } else {
        setPasteNotification({
          type: 'error',
          text: 'Área de transferência vazia. Copie os dados no app da Binance primeiro.'
        });
      }
    } catch (err) {
      setPasteNotification({
        type: 'info',
        text: 'Acesso restrito pelo navegador. Segure e pressione o campo abaixo para colar manualmente.'
      });
    }
  };

  const handleApplyPastePreview = () => {
    if (parsedPreview) {
      setSymbol(parsedPreview.symbol);
      setCoinName(parsedPreview.coinName);
      setPurchasePrice(parsedPreview.purchasePrice.toString());
      setAmount(parsedPreview.amount.toString());
      setTotalInvested(parsedPreview.totalInvested.toString());
      setCurrency(parsedPreview.currency);
      setInputPriceCurrency(parsedPreview.currency);
      setSimpleMode(false); // Go to advanced form so they can inspect/edit
      setActiveTab('manual');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const pPrice = parseFloat(purchasePrice);
    const amtVal = parseFloat(amount);
    const totInvested = parseFloat(totalInvested);
    const balanceVal = parseFloat(availableBalance) || 0;

    if (!symbol || isNaN(pPrice) || pPrice <= 0 || isNaN(amtVal) || amtVal <= 0) {
      setFormError('Por favor, informe uma criptomoeda, preço de compra e quantidade válidos (maiores que zero).');
      return;
    }

    if (totInvested > balanceVal) {
      setFormError(`O valor total da compra (${totInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${currency}) não pode ser maior do que o seu saldo de dinheiro disponível (${balanceVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}).`);
      return;
    }

    let finalPurchasePrice = pPrice;
    let purchasePriceInBrl = 0;
    let purchasePriceInUsdt = 0;
    const rateBrl = usdtBrl || 5.62;

    if (simpleMode) {
      if (currency === 'BRL') {
        purchasePriceInBrl = pPrice;
        purchasePriceInUsdt = pPrice / rateBrl;
        finalPurchasePrice = pPrice;
      } else {
        purchasePriceInUsdt = pPrice;
        purchasePriceInBrl = pPrice * rateBrl;
        finalPurchasePrice = pPrice;
      }
    } else {
      // Advanced Mode
      if (inputPriceCurrency === 'BRL') {
        purchasePriceInBrl = pPrice;
        purchasePriceInUsdt = pPrice / rateBrl;
        finalPurchasePrice = currency === 'BRL' ? purchasePriceInBrl : purchasePriceInUsdt;
      } else {
        purchasePriceInUsdt = pPrice;
        purchasePriceInBrl = pPrice * rateBrl;
        finalPurchasePrice = currency === 'BRL' ? purchasePriceInBrl : purchasePriceInUsdt;
      }
    }
    
    onSave({
      symbol: symbol.toUpperCase().trim(),
      coinName: coinName.trim(),
      purchasePrice: finalPurchasePrice,
      purchasePriceInBrl,
      purchasePriceInUsdt,
      amount: amtVal,
      totalInvested: finalPurchasePrice * amtVal,
      purchaseTime: new Date(purchaseTime).toISOString(),
      currency,
      isManualPrice
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto flex items-start sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-[#181a20] border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 bg-[#1e2026]">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#f0b90b]" />
            <h3 className="text-lg font-bold text-white font-sans">Registrar Compra</h3>
          </div>
          <button 
            id="close-add-trade-btn"
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Selector inside Modal */}
        <div className="flex border-b border-gray-800 bg-[#1e2026] px-2">
          <button
            id="tab-manual-entry"
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setFormError(null);
              setPasteNotification(null);
            }}
            className={`flex-1 text-center py-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'manual' ? 'text-[#f0b90b] border-[#f0b90b]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            ✍️ Formulário Manual
          </button>
          <button
            id="tab-paste-entry"
            type="button"
            onClick={() => {
              setActiveTab('paste');
              setFormError(null);
              setPasteNotification(null);
            }}
            className={`flex-1 text-center py-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'paste' ? 'text-[#f0b90b] border-[#f0b90b]' : 'text-gray-400 border-transparent hover:text-white'}`}
          >
            📋 Copiar & Colar Binance
          </button>
        </div>

        {activeTab === 'manual' ? (
          /* Manual Entry Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Quick Selection / Coin Symbol */}
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1">Escolha a Criptomoeda (100+ Oficiais Binance)</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  id="select-symbol-dropdown"
                  value={symbol === 'CUSTOM' ? 'CUSTOM' : symbol.replace(/USDT$/, '').replace(/BRL$/, '')}
                  onChange={(e) => handleCoinSelection(e.target.value)}
                  className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full cursor-pointer"
                >
                  <optgroup label="🔥 Trending & Novas Listagens">
                    {VERIFIED_BINANCE_COINS.filter(c => c.category === 'Trending & Novas').map(c => (
                      <option key={c.base} value={c.base}>{c.name} ({c.base})</option>
                    ))}
                  </optgroup>
                  <optgroup label="⚡ Layer 1 / Layer 2">
                    {VERIFIED_BINANCE_COINS.filter(c => c.category === 'Layer 1 / Layer 2').map(c => (
                      <option key={c.base} value={c.base}>{c.name} ({c.base})</option>
                    ))}
                  </optgroup>
                  <optgroup label="🤖 AI & Big Data">
                    {VERIFIED_BINANCE_COINS.filter(c => c.category === 'AI & Big Data').map(c => (
                      <option key={c.base} value={c.base}>{c.name} ({c.base})</option>
                    ))}
                  </optgroup>
                  <optgroup label="🎭 Memecoins">
                    {VERIFIED_BINANCE_COINS.filter(c => c.category === 'Memes').map(c => (
                      <option key={c.base} value={c.base}>{c.name} ({c.base})</option>
                    ))}
                  </optgroup>
                  <optgroup label="🏦 DeFi & RWA">
                    {VERIFIED_BINANCE_COINS.filter(c => c.category === 'DeFi & RWA').map(c => (
                      <option key={c.base} value={c.base}>{c.name} ({c.base})</option>
                    ))}
                  </optgroup>
                  <optgroup label="🎮 Gaming & Infra">
                    {VERIFIED_BINANCE_COINS.filter(c => c.category === 'Gaming & Infra').map(c => (
                      <option key={c.base} value={c.base}>{c.name} ({c.base})</option>
                    ))}
                  </optgroup>
                  <option value="CUSTOM">➕ Outra moeda (digitar manualmente)</option>
                </select>

                <input
                  id="custom-symbol-input"
                  type="text"
                  placeholder="Ex: BTCBRL ou AVNTUSDT"
                  value={symbol === 'CUSTOM' ? '' : symbol}
                  disabled={symbol !== 'CUSTOM' && symbol !== ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setSymbol(val);
                    setCoinName(val.replace('USDT', '').replace('BRL', ''));
                    // Auto-detect currency from symbol!
                    if (val.endsWith('BRL')) {
                      setCurrency('BRL');
                      setInputPriceCurrency('BRL');
                    } else if (val.endsWith('USDT')) {
                      setCurrency('USDT');
                      setInputPriceCurrency('USDT');
                    }
                  }}
                  className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full placeholder-gray-500 disabled:opacity-50"
                />
              </div>

              {/* Quick 1-Click Altcoin & Meme Selector */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                <span className="text-[9px] text-gray-500 font-bold whitespace-nowrap uppercase">Atalhos:</span>
                {[
                  { base: 'BTC', label: '🛡️ BTC (Segura)' },
                  { base: 'ETH', label: '🛡️ ETH (Segura)' },
                  { base: 'SOL', label: '☀️ SOL' },
                  { base: 'BNB', label: '🛡️ BNB' },
                  { base: 'XRP', label: '💧 XRP' },
                  { base: 'ADA', label: '🛡️ ADA' },
                  { base: 'SUI', label: '⚡ SUI' },
                  { base: 'NEAR', label: '🌐 NEAR' },
                  { base: 'PEPE', label: '🐸 PEPE' },
                  { base: 'DOGE', label: '🐕 DOGE' },
                  { base: 'SHIB', label: '🐶 SHIB' },
                  { base: 'BONK', label: '🦴 BONK' },
                  { base: 'NEIRO', label: '🐱 NEIRO' },
                  { base: 'AVNT', label: '🔥 AVNT' },
                  { base: 'HOME', label: '🏠 HOME' },
                  { base: 'FET', label: '🤖 FET' },
                ].map(c => {
                  const currentBase = symbol.replace(/USDT$/, '').replace(/BRL$/, '');
                  const isSelected = currentBase === c.base;
                  return (
                    <button
                      key={c.base}
                      type="button"
                      onClick={() => handleCoinSelection(c.base)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all whitespace-nowrap border cursor-pointer ${
                        isSelected 
                          ? 'bg-[#f0b90b] text-black border-[#f0b90b]' 
                          : 'bg-[#181a20] text-gray-300 border-gray-800 hover:border-[#f0b90b]/50 hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {simpleMode ? (
              /* SIMPLE MODE: Just currency and BRL input with real-time conversion */
              <>
                {/* Currency Switch (Simple Mode) */}
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1">Comprar em Real ou Dólar?</label>
                  <div className="flex bg-[#2b2f36] p-1 rounded-lg border border-gray-800">
                    <button
                      id="currency-brl-btn"
                      type="button"
                      onClick={() => handleCurrencyChange('BRL')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${currency === 'BRL' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      BRL (R$ Real)
                    </button>
                    <button
                      id="currency-usdt-btn"
                      type="button"
                      onClick={() => handleCurrencyChange('USDT')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${currency === 'USDT' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      USDT ($ Dólar)
                    </button>
                  </div>
                </div>

                {/* Dinheiro Disponível no Momento */}
                <div>
                  <label className="block text-xs text-[#f0b90b] font-bold mb-1 flex justify-between">
                    <span>Dinheiro Disponível no Momento (Meu Saldo)</span>
                    <span>{currency}</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#f0b90b] font-extrabold text-xs">
                      {currency === 'BRL' ? 'R$' : '$'}
                    </div>
                    <input
                      id="available-balance-input-simple"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Ex: 500.00"
                      value={availableBalance}
                      onChange={(e) => handleAvailableBalanceChange(e.target.value)}
                      className="bg-[#1e2026] text-[#f0b90b] border-2 border-[#f0b90b]/60 rounded-lg pl-9 pr-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#f0b90b] w-full font-mono placeholder-[#f0b90b]/30"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block leading-tight">O valor investido na compra não poderá ser maior do que este saldo disponível.</span>
                </div>

                {/* Amount to Invest Input */}
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1">
                    Valor total que você está comprando ({currency})
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold text-xs">
                      {currency === 'BRL' ? 'R$' : '$'}
                    </div>
                    <input
                      id="total-invested-simple"
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="Ex: 38"
                      value={totalInvested || ''}
                      onChange={(e) => handleTotalChange(e.target.value)}
                      className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg pl-9 pr-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#f0b90b] w-full"
                      required
                    />
                  </div>
                </div>

                {/* Cotação da moeda agora (Editable in Simple Mode too!) */}
                {symbol !== 'CUSTOM' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs text-gray-400 font-medium">Cotação da moeda agora ({currency})</label>
                        <span className="text-[10px] text-gray-500">Mude se a cotação real estiver diferente</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-xs font-bold font-mono">
                          {currency === 'BRL' ? 'R$' : '$'}
                        </div>
                        <input
                          id="purchase-price-simple-input"
                          type="number"
                          step="any"
                          min="0.00000001"
                          placeholder="Ex: 395.77"
                          value={purchasePrice}
                          onChange={(e) => {
                            handlePriceChange(e.target.value);
                          }}
                          className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-[#1e2026] border border-gray-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-gray-400">
                        <span>Você vai adquirir:</span>
                        <span className="font-extrabold text-[#0ecb81] text-sm font-mono">
                          {parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {symbol.replace(/BRL$/, '').replace(/USDT$/, '')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ADVANCED MODE: Customize purchasePrice and amount manually */
              <>
                {/* Nome da Moeda (Auto-preenchido) */}
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1">Nome de Exibição</label>
                  <input
                    id="coin-name-input"
                    type="text"
                    placeholder="Ex: Bitcoin"
                    value={coinName}
                    onChange={(e) => setCoinName(e.target.value)}
                    className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full"
                  />
                </div>

                {/* Currency Switch */}
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1">Moeda de Cotação</label>
                  <div className="flex bg-[#2b2f36] p-1 rounded-lg border border-gray-800">
                    <button
                      id="currency-usdt-btn"
                      type="button"
                      onClick={() => handleCurrencyChange('USDT')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${currency === 'USDT' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      USDT (Dólar)
                    </button>
                    <button
                      id="currency-brl-btn"
                      type="button"
                      onClick={() => handleCurrencyChange('BRL')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${currency === 'BRL' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      BRL (Real)
                    </button>
                  </div>
                </div>

                {/* Dinheiro Disponível no Momento */}
                <div>
                  <label className="block text-xs text-[#f0b90b] font-bold mb-1 flex justify-between">
                    <span>Dinheiro Disponível no Momento (Meu Saldo)</span>
                    <span>{currency}</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#f0b90b] font-extrabold text-xs">
                      {currency === 'BRL' ? 'R$' : '$'}
                    </div>
                    <input
                      id="available-balance-input-advanced"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Ex: 500.00"
                      value={availableBalance}
                      onChange={(e) => handleAvailableBalanceChange(e.target.value)}
                      className="bg-[#1e2026] text-[#f0b90b] border-2 border-[#f0b90b]/60 rounded-lg pl-9 pr-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[#f0b90b] w-full font-mono placeholder-[#f0b90b]/30"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block leading-tight">O valor investido na compra não poderá ser maior do que este saldo disponível.</span>
                </div>

                {/* Preço de Compra */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-gray-400 font-medium">Preço Pago (por unidade)</label>
                    <div className="flex bg-[#1e2026] p-0.5 rounded border border-gray-800 text-[10px]">
                      <button
                        id="input-currency-brl-btn"
                        type="button"
                        onClick={() => setInputPriceCurrency('BRL')}
                        className={`px-1.5 py-0.5 rounded-sm font-semibold transition-all cursor-pointer ${inputPriceCurrency === 'BRL' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Em R$ (Reais)
                      </button>
                      <button
                        id="input-currency-usdt-btn"
                        type="button"
                        onClick={() => setInputPriceCurrency('USDT')}
                        className={`px-1.5 py-0.5 rounded-sm font-semibold transition-all cursor-pointer ${inputPriceCurrency === 'USDT' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Em $ (USDT)
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-xs font-bold">
                      {inputPriceCurrency === 'BRL' ? 'R$' : '$'}
                    </div>
                    <input
                      id="purchase-price-input"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={purchasePrice || ''}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                      required
                    />
                  </div>
                  {parseFloat(purchasePrice) > 0 && (
                    <div className="text-[10px] text-gray-500 mt-1 pl-1">
                      {inputPriceCurrency === 'BRL' ? (
                        <span>Equivale a: <strong>$ {(parseFloat(purchasePrice) / (usdtBrl || 5.62)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT</strong> (cotação de R$ {usdtBrl || '5.62'})</span>
                      ) : (
                        <span>Equivale a: <strong>R$ {(parseFloat(purchasePrice) * (usdtBrl || 5.62)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BRL</strong> (cotação de R$ {usdtBrl || '5.62'})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantidade Comprada */}
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1">Quantidade Adquirida</label>
                  <input
                    id="amount-input"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full font-mono"
                    required
                  />
                </div>

                {/* Total Investido */}
                <div>
                  <label className="block text-xs text-[#f0b90b] font-bold mb-1 flex justify-between">
                    <span>VALOR TOTAL DA COMPRA (O quanto comprei)</span>
                    <span className="text-[#f0b90b]/80">{currency}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-xs font-bold font-mono">
                      {currency === 'BRL' ? 'R$' : '$'}
                    </span>
                    <input
                      id="total-invested-input"
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={totalInvested || ''}
                      onChange={(e) => handleTotalChange(e.target.value)}
                      className="bg-[#2b2f36] text-[#f0b90b] border border-dashed border-[#f0b90b]/40 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full font-mono font-bold"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Toggle simple / advanced mode */}
            <div className="text-right pt-1">
              <button
                id="toggle-simple-mode-btn"
                type="button"
                onClick={() => setSimpleMode(!simpleMode)}
                className="text-[10px] text-gray-400 hover:text-[#f0b90b] font-medium transition-colors cursor-pointer"
              >
                {simpleMode ? "🔧 Modo Avançado (preço pago personalizado)" : "⚡ Voltar para Preenchimento Inteligente"}
              </button>
            </div>

            {/* Congelar Preço Option */}
            <div className="bg-[#1e2026] p-3 rounded-lg border border-gray-800 flex items-center gap-2.5 font-sans">
              <input
                id="freeze-price-checkbox"
                type="checkbox"
                checked={isManualPrice}
                onChange={(e) => setIsManualPrice(e.target.checked)}
                className="accent-[#f0b90b] h-4 w-4 rounded cursor-pointer"
              />
              <div className="leading-tight">
                <label htmlFor="freeze-price-checkbox" className="text-xs font-bold text-gray-300 cursor-pointer flex items-center gap-1">
                  ❄️ Congelar Preço Atual
                </label>
                <span className="text-[10px] text-gray-500 block">Não atualizar o preço atual pela API (ideal para simular ou fixar valores de fotos)</span>
              </div>
            </div>

            {/* Data/Hora da Operação */}
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1">Data & Hora da Compra</label>
              <input
                id="purchase-time-input"
                type="datetime-local"
                value={purchaseTime}
                onChange={(e) => setPurchaseTime(e.target.value)}
                className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full font-sans"
                required
              />
            </div>

            {formError && (
              <div className="text-xs text-[#f6465d] bg-red-500/10 border border-red-500/20 rounded-xl p-3 font-semibold leading-relaxed">
                ⚠️ {formError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-800">
              <button
                id="cancel-add-trade-btn"
                type="button"
                onClick={onClose}
                className="flex-1 bg-transparent hover:bg-gray-800 border border-gray-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                id="save-trade-btn"
                type="submit"
                className="flex-1 bg-[#f0b90b] hover:bg-[#d4a30a] text-black rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" /> Salvar Operação
              </button>
            </div>

          </form>
        ) : (
          /* Smart Paste Section */
          <div className="p-6 space-y-4">
            <div className="bg-[#f0b90b]/10 text-[#f0b90b] text-[11px] p-3 rounded-lg border border-[#f0b90b]/20 space-y-1.5 leading-relaxed">
              <p className="font-bold">💡 Copie os dados da sua moeda na Binance e cole abaixo!</p>
              <p className="text-gray-400">Pressione e segure o bloco da moeda no app da Binance para copiar o texto ou digite em linhas como no exemplo:</p>
              <pre className="font-mono text-[10px] bg-gray-950/60 p-2 rounded text-gray-300 leading-tight">
                XRP{"\n"}
                6.4935{"\n"}
                R$36,75
              </pre>
            </div>

            {pasteNotification && (
              <div className={`text-xs p-3 rounded-xl border font-bold leading-relaxed animate-in fade-in zoom-in-95 duration-150 ${
                pasteNotification.type === 'error' 
                  ? 'text-[#f6465d] bg-red-500/10 border-red-500/20' 
                  : pasteNotification.type === 'success'
                  ? 'text-[#0ecb81] bg-green-500/10 border-green-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>
                {pasteNotification.type === 'success' ? '⚡' : '⚠️'} {pasteNotification.text}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-gray-400 font-medium">Cole o texto aqui</label>
                <button
                  type="button"
                  onClick={handleClipboardPaste}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-[10px] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer font-bold border border-gray-700/60"
                >
                  📋 Colar do Celular
                </button>
              </div>
              <textarea
                id="binance-paste-textarea"
                rows={5}
                placeholder={`XRP\n6.4935\nR$36,75`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="bg-[#2b2f36] text-white border border-gray-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono placeholder-gray-600 resize-none"
              />
            </div>

            {parsedPreview ? (
              /* Parsed Live Preview Block */
              <div className="bg-[#0ecb81]/10 border border-[#0ecb81]/30 p-4 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#0ecb81] uppercase font-mono font-bold tracking-wider">⚡ Identificado com Sucesso</span>
                  <span className="text-[9px] bg-[#0ecb81]/25 text-[#0ecb81] px-1.5 py-0.5 rounded font-bold uppercase">{parsedPreview.currency}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Ativo / Moeda</span>
                    <strong className="text-white text-sm">{parsedPreview.coinName} ({parsedPreview.symbol})</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Quantidade</span>
                    <strong className="text-white font-mono">{parsedPreview.amount.toLocaleString('pt-BR', { maximumFractionDigits: 8 })}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Total Investido</span>
                    <strong className="text-white font-mono">{parsedPreview.currency === 'BRL' ? 'R$' : '$'} {parsedPreview.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Preço Unitário Médio</span>
                    <strong className="text-white font-mono">{parsedPreview.currency === 'BRL' ? 'R$' : '$'} {parsedPreview.purchasePrice.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}</strong>
                  </div>
                </div>

                <button
                  id="confirm-parsed-data-btn"
                  type="button"
                  onClick={handleApplyPastePreview}
                  className="w-full bg-[#0ecb81] hover:bg-[#0bb371] text-black font-extrabold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  Confirmar e Preencher Formulário 🎯
                </button>
              </div>
            ) : (
              pasteText.trim() && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-400">
                  ⚠️ Não foi possível identificar as informações no texto. Verifique se o texto possui o nome do ativo (ex: XRP) e valores legíveis.
                </div>
              )
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-800">
              <button
                id="cancel-add-trade-btn-paste"
                type="button"
                onClick={onClose}
                className="flex-1 bg-transparent hover:bg-gray-800 border border-gray-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
