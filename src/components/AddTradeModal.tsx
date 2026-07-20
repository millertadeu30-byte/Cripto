import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, RefreshCw, Layers } from 'lucide-react';
import { Trade } from '../types';

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
}

const COMMON_COINS = [
  { base: 'BTC', name: 'Bitcoin' },
  { base: 'ETH', name: 'Ethereum' },
  { base: 'SOL', name: 'Solana' },
  { base: 'BNB', name: 'BNB' },
  { base: 'XRP', name: 'Ripple' },
  { base: 'ADA', name: 'Cardano' },
  { base: 'DOGE', name: 'Dogecoin' },
  { base: 'LINK', name: 'Chainlink' },
  { base: 'SUI', name: 'Sui' },
  { base: 'NEAR', name: 'Near Protocol' },
  { base: 'PEPE', name: 'Pepe Coin' },
  { base: 'WIF', name: 'dogwifhat' }
];

export default function AddTradeModal({ isOpen, onClose, onSave, prefilledData }: AddTradeModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'paste'>('manual');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [coinName, setCoinName] = useState('Bitcoin');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [totalInvested, setTotalInvested] = useState<number>(0);
  const [currency, setCurrency] = useState<'USDT' | 'BRL'>('USDT');
  const [purchaseTime, setPurchaseTime] = useState('');
  
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

  // Handle prefilled data from recommendations
  useEffect(() => {
    if (prefilledData) {
      setSymbol(prefilledData.symbol);
      setCoinName(prefilledData.coinName);
      setPurchasePrice(prefilledData.price);
      setCurrency(prefilledData.currency);
      setActiveTab('manual');
    } else {
      setSymbol('BTCUSDT');
      setCoinName('Bitcoin');
      setPurchasePrice(0);
      setCurrency('USDT');
    }
    
    // Set current date/time in local format
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setPurchaseTime(localISOTime);
    setAmount(0);
    setTotalInvested(0);
    setPasteText('');
    setParsedPreview(null);
    setFormError(null);
    setPasteNotification(null);
  }, [prefilledData, isOpen]);

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
  const handlePriceChange = (val: number) => {
    setPurchasePrice(val);
    setTotalInvested(Number((val * amount).toFixed(4)));
  };

  const handleAmountChange = (val: number) => {
    setAmount(val);
    setTotalInvested(Number((purchasePrice * val).toFixed(4)));
  };

  const handleTotalChange = (val: number) => {
    setTotalInvested(val);
    if (purchasePrice > 0) {
      setAmount(Number((val / purchasePrice).toFixed(6)));
    }
  };

  const handleCurrencyChange = (newCurr: 'USDT' | 'BRL') => {
    setCurrency(newCurr);
    const baseSym = symbol.replace(/USDT$/, '').replace(/BRL$/, '');
    if (baseSym && baseSym !== 'CUSTOM') {
      setSymbol(baseSym + newCurr);
    }
  };

  const handleCoinSelection = (base: string) => {
    if (base === 'CUSTOM') {
      setSymbol('CUSTOM');
      setCoinName('');
      return;
    }
    const coin = COMMON_COINS.find(c => c.base === base);
    if (coin) {
      setSymbol(base + currency);
      setCoinName(coin.name);
    } else {
      setSymbol(base);
      setCoinName(base.replace('USDT', '').replace('BRL', ''));
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
      setPurchasePrice(parsedPreview.purchasePrice);
      setAmount(parsedPreview.amount);
      setTotalInvested(parsedPreview.totalInvested);
      setCurrency(parsedPreview.currency);
      setActiveTab('manual');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!symbol || purchasePrice <= 0 || amount <= 0) {
      setFormError('Por favor, informe uma criptomoeda, preço de compra e quantidade válidos (maiores que zero).');
      return;
    }
    
    onSave({
      symbol: symbol.toUpperCase().trim(),
      coinName: coinName.trim(),
      purchasePrice,
      amount,
      totalInvested,
      purchaseTime: new Date(purchaseTime).toISOString(),
      currency
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
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
              <label className="block text-xs text-gray-400 font-medium mb-1">Criptomoeda</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  id="select-symbol-dropdown"
                  value={symbol === 'CUSTOM' ? 'CUSTOM' : symbol.replace(/USDT$/, '').replace(/BRL$/, '')}
                  onChange={(e) => handleCoinSelection(e.target.value)}
                  className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full"
                >
                  {COMMON_COINS.map(c => (
                    <option key={c.base} value={c.base}>{c.name} ({c.base}{currency})</option>
                  ))}
                  <option value="CUSTOM">Outra moeda (digitar)</option>
                </select>

                <input
                  id="custom-symbol-input"
                  type="text"
                  placeholder="Ex: BTCUSDT"
                  value={symbol === 'CUSTOM' ? '' : symbol}
                  disabled={symbol !== 'CUSTOM' && symbol !== ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setSymbol(val);
                    setCoinName(val.replace('USDT', '').replace('BRL', ''));
                  }}
                  className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full placeholder-gray-500 disabled:opacity-50"
                />
              </div>
            </div>

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

            {/* Preço de Compra */}
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1 flex justify-between">
                <span>Preço Pago (por unidade)</span>
                <span className="text-gray-500">{currency}</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  id="purchase-price-input"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={purchasePrice || ''}
                  onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                  className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full"
                  required
                />
              </div>
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
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                className="bg-[#2b2f36] text-white border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full"
                required
              />
            </div>

            {/* Total Investido */}
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1 flex justify-between">
                <span>Total Gasto / Investido</span>
                <span className="text-gray-500">{currency}</span>
              </label>
              <input
                id="total-invested-input"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={totalInvested || ''}
                onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
                className="bg-[#2b2f36] text-white border border-gray-800 border-dashed rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#f0b90b] w-full font-mono text-gray-300"
              />
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
