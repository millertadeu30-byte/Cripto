import React, { useState } from 'react';
import { Cloud, Copy, Check, Link, Database, RefreshCw, ExternalLink, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { isQuotaExhausted, resetQuotaExhaustedFlag } from '../lib/firebase';

interface FirebaseSyncProps {
  syncId: string;
  status: 'syncing' | 'synced' | 'error' | 'offline';
  onSyncIdChange: (newSyncId: string) => void;
}

export default function FirebaseSync({ syncId, status, onSyncIdChange }: FirebaseSyncProps) {
  const [copied, setCopied] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(() => isQuotaExhausted());
  const [isSectionMinimized, setIsSectionMinimized] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(syncId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setErrorMessage(`ID de sincronização: ${syncId}`);
    }
  };

  const handleConnect = () => {
    const cleaned = inputVal.trim().toUpperCase();
    setErrorMessage(null);

    if (!cleaned) {
      setErrorMessage('Por favor, digite um ID de Sincronização válido.');
      return;
    }
    if (cleaned === syncId) {
      setErrorMessage('Este já é o seu ID ativo!');
      return;
    }
    
    // Set confirmation phase
    setNeedsConfirmation(true);
  };

  return (
    <div id="firebase-sync-card" className="bg-[#181a20] rounded-2xl border border-gray-800 p-5 shadow-lg space-y-4 font-sans text-[#eaecef]">
      {/* Header with Minimize Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-[#f0b90b]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sincronização & Persistência</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Status Badge */}
          {status === 'synced' && !quotaExceeded && (
            <span className="bg-[#0ecb81]/15 text-[#0ecb81] text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#0ecb81] rounded-full"></span>
              SALVO NA NUVEM
            </span>
          )}
          {(status === 'offline' || quotaExceeded) && (
            <span className="bg-[#0ecb81]/15 text-[#0ecb81] text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1" title="Persistência local segura ativa">
              <ShieldCheck className="w-3 h-3 text-[#0ecb81]" />
              LOCAL ATIVO
            </span>
          )}
          {status === 'syncing' && !quotaExceeded && (
            <span className="bg-[#f0b90b]/15 text-[#f0b90b] text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              SINCRONIZANDO
            </span>
          )}
          {status === 'error' && !quotaExceeded && (
            <span className="bg-[#f6465d]/15 text-[#f6465d] text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#f6465d] rounded-full"></span>
              NUVEM OFFLINE
            </span>
          )}

          {/* Minimize Toggle */}
          <button
            type="button"
            id="toggle-minimize-firebase-sync-btn"
            onClick={() => setIsSectionMinimized(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1e2026] hover:bg-[#282b33] border border-gray-700 hover:border-[#f0b90b] text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title={isSectionMinimized ? "Expandir Sincronização" : "Minimizar Sincronização"}
          >
            <span className="text-[10px] font-extrabold text-[#f0b90b]">{isSectionMinimized ? "▴" : "▾"}</span>
            {isSectionMinimized ? <ChevronDown className="w-3.5 h-3.5 text-[#f0b90b]" /> : <ChevronUp className="w-3.5 h-3.5 text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Collapsed State Summary */}
      {isSectionMinimized && (
        <div 
          onClick={() => setIsSectionMinimized(false)}
          className="bg-[#14151a] hover:bg-[#1a1d24] border border-gray-800 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-400">ID: <strong className="text-white">{syncId}</strong></span>
          </div>
          <span className="text-[#f0b90b] text-xs font-bold flex items-center gap-1">
            Expandir <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {!isSectionMinimized && (
        <>
          {/* Explanatory text */}
          <p className="text-xs text-gray-400 leading-relaxed">
            Suas operações e histórico são salvos automaticamente no armazenamento local. Para acessar no celular ou outro computador, use o seu ID de Sincronização exclusivo.
          </p>

          {/* Quota Limit Info Notice if reached */}
          {quotaExceeded && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[11px] text-gray-300 space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Modo Local Seguro Ativo</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                A cota diária gratuita de escritas do Firebase Firestore foi atingida hoje (renova automaticamente todos os dias). Todos os seus trades, cálculos e configurações continuam 100% gravados com total segurança no seu navegador.
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <a 
                  href="https://console.firebase.google.com/project/gen-lang-client-0844737316/firestore/databases/ai-studio-binancecryptoass-77adeeec-9173-4ced-b664-0c5584274d9b/data?openUpgradeDialog=true" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[#f0b90b] hover:underline flex items-center gap-1 font-bold"
                >
                  <ExternalLink className="w-3 h-3" /> Abrir Console Firebase / Cotas
                </a>
                <button
                  onClick={() => {
                    resetQuotaExhaustedFlag();
                    setQuotaExceeded(false);
                  }}
                  className="text-gray-400 hover:text-white underline cursor-pointer"
                >
                  Testar Nuvem Novamente
                </button>
              </div>
            </div>
          )}

          {/* Sync ID display box */}
          <div className="bg-[#1e2026] border border-gray-800/80 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">SEU ID EXCLUSIVO</span>
              <div className="text-sm font-black text-white font-mono tracking-wider">{syncId}</div>
            </div>
            <button
              onClick={handleCopy}
              className="bg-gray-800 hover:bg-gray-700/80 text-gray-300 p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
              title="Copiar ID"
            >
              {copied ? <Check className="w-4 h-4 text-[#0ecb81]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Connection options */}
          <div className="pt-2 border-t border-gray-800/60">
            {!showInput ? (
              <button
                onClick={() => {
                  setShowInput(true);
                  setErrorMessage(null);
                  setNeedsConfirmation(false);
                }}
                className="w-full bg-gray-800/40 hover:bg-gray-800 text-[#f0b90b] border border-gray-700/40 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Link className="w-3.5 h-3.5" /> Sincronizar outro dispositivo
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {!needsConfirmation ? (
                  <>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-1 uppercase font-mono">Inserir ID de Outro Celular</label>
                      <input
                        type="text"
                        placeholder="Ex: BIA-123456-ABCDEF"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        className="bg-[#1e2026] text-white border border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#f0b90b] w-full font-mono tracking-wider uppercase placeholder-gray-600"
                      />
                    </div>
                    {errorMessage && (
                      <div className="text-xs text-[#f6465d] bg-red-500/10 border border-red-500/20 rounded-lg p-2 font-medium">
                        ⚠️ {errorMessage}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowInput(false);
                          setErrorMessage(null);
                        }}
                        className="flex-1 bg-gray-800/60 hover:bg-gray-800 text-gray-400 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConnect}
                        className="flex-1 bg-[#f0b90b] hover:bg-[#d4a30a] text-black rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer"
                      >
                        Conectar & Carregar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-[#f0b90b]/10 border border-[#f0b90b]/30 rounded-xl p-3 space-y-3 animate-in fade-in duration-200">
                    <p className="text-xs text-amber-400 leading-relaxed font-sans">
                      ⚠️ <strong>Atenção:</strong> Ao conectar ao ID <strong>{inputVal.trim().toUpperCase()}</strong>, seus dados locais atuais serão substituídos pelos dados da nuvem associados ao novo ID.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNeedsConfirmation(false)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => {
                          onSyncIdChange(inputVal.trim().toUpperCase());
                          setShowInput(false);
                          setInputVal('');
                          setNeedsConfirmation(false);
                          setErrorMessage(null);
                        }}
                        className="flex-1 bg-[#f0b90b] hover:bg-[#d4a30a] text-black rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer"
                      >
                        Confirmar Sincronização
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

