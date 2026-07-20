import React, { useState } from 'react';
import { BookOpen, HelpCircle, ArrowRight, CornerDownRight, ShieldCheck, DollarSign, Percent, TrendingUp, Info } from 'lucide-react';

interface BeginnerGuideProps {
  onClose?: () => void;
}

export default function BeginnerGuide({ onClose }: BeginnerGuideProps) {
  const [activeTab, setActiveTab] = useState<'compra' | 'stop_loss' | 'venda_imediata' | 'tempo_ideal'>('compra');

  return (
    <div id="beginner-guide-illustrated" className="bg-[#181a20] text-[#eaecef] rounded-2xl border border-gray-800 p-6 shadow-2xl max-w-5xl mx-auto my-6 space-y-6">
      
      {/* Header section with closing option */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-800 pb-4 gap-4">
        <div className="flex items-start gap-4">
          <img 
            src="/src/assets/images/crypto_assistant_logo_1784491971886.jpg" 
            alt="Assistant Core Logo" 
            className="w-12 h-12 rounded-xl object-cover border border-gray-800 shrink-0 shadow-lg hidden sm:block"
            referrerPolicy="no-referrer"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#f0b90b]/10 text-[#f0b90b] px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider font-mono">
                Para Leigos / Iniciantes
              </span>
              <BookOpen className="w-5 h-5 text-[#f0b90b]" />
              <h2 className="text-xl font-bold font-sans tracking-tight text-white">Guia Ilustrado de Operações na Binance</h2>
            </div>
            <p className="text-xs text-gray-400">
              Aprenda a comprar, proteger seu dinheiro com Stop Loss e colocar alvos de lucro automático no aplicativo oficial da Binance.
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            id="close-guide-btn"
            onClick={onClose} 
            className="text-gray-300 hover:text-white text-xs bg-gray-800 border border-gray-700 hover:border-gray-600 px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer self-stretch sm:self-auto text-center"
          >
            Fechar Guia Prático
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-gray-800/60 pb-3">
        <button
          id="tab-compra-btn"
          onClick={() => setActiveTab('compra')}
          className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${activeTab === 'compra' ? 'bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]' : 'bg-gray-900/40 text-gray-400 border-gray-800/80 hover:text-white'}`}
        >
          🟢 1. Como Comprar (Mercado)
        </button>
        <button
          id="tab-stop-loss-btn"
          onClick={() => setActiveTab('stop_loss')}
          className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${activeTab === 'stop_loss' ? 'bg-[#f0b90b]/10 text-[#f0b90b] border-[#f0b90b]' : 'bg-gray-900/40 text-gray-400 border-gray-800/80 hover:text-white'}`}
        >
          🛡️ 2. Stop Loss & Alvo Juntos (OCO)
        </button>
        <button
          id="tab-venda-imediata-btn"
          onClick={() => setActiveTab('venda_imediata')}
          className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${activeTab === 'venda_imediata' ? 'bg-[#f6465d]/10 text-[#f6465d] border-[#f6465d]' : 'bg-gray-900/40 text-gray-400 border-gray-800/80 hover:text-white'}`}
        >
          🔴 3. Vender Imediatamente
        </button>
        <button
          id="tab-tempo-ideal-btn"
          onClick={() => setActiveTab('tempo_ideal')}
          className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${activeTab === 'tempo_ideal' ? 'bg-blue-500/10 text-blue-400 border-blue-500' : 'bg-gray-900/40 text-gray-400 border-gray-800/80 hover:text-white'}`}
        >
          ⏱️ 4. Por que 30 min é ideal?
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Explanations and Steps (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {activeTab === 'compra' && (
            <div className="space-y-4">
              <div className="bg-[#0ecb81]/10 text-[#0ecb81] border border-[#0ecb81]/20 p-4 rounded-xl flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <p className="text-xs font-semibold leading-relaxed">
                  Para iniciantes, a maneira mais rápida e garantida de entrar em uma moeda recomendada pelo app é usar a ordem do tipo <span className="font-bold">Mercado</span> na Binance. A compra é realizada na mesma hora!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-[#0ecb81]" /> Passo a Passo Ilustrado:
                </h4>
                
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">1</span>
                    <p>No app da Binance, procure pela moeda do sinal (ex: <strong className="text-white">SOL/BRL</strong> ou <strong className="text-white">SOL/USDT</strong>) na barra de pesquisas.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">2</span>
                    <p>Selecione a aba verde <strong className="text-green-400 uppercase">Comprar</strong>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">3</span>
                    <p>Mude o tipo de ordem de "Limite" para <strong className="text-white bg-gray-800 px-1 py-0.5 rounded">Mercado</strong> (veja no simulador ao lado).</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">4</span>
                    <p>Digite o valor em reais (ou dólares) que deseja investir na moeda.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">5</span>
                    <p>Toque no grande botão verde <strong className="text-green-400">Comprar SOL</strong>. Pronto! Moeda comprada com sucesso.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stop_loss' && (
            <div className="space-y-4">
              <div className="bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/20 p-4 rounded-xl flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <p className="text-xs font-semibold leading-relaxed">
                  A ordem <span className="font-bold uppercase text-white">OCO</span> (One-Cancels-the-Other) é o recurso mais poderoso do mercado. Ela permite programar o seu Alvo de Lucro E o seu Stop Loss <span className="underline">ao mesmo tempo</span>. Se um bater, a Binance cancela o outro automaticamente!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-[#f0b90b]" /> Como preencher a Ordem OCO na Binance:
                </h4>
                
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">1</span>
                    <p>Selecione a aba vermelha de <strong className="text-red-400 uppercase">Vender</strong> na Binance e escolha a opção de ordem do tipo <strong className="text-white bg-gray-800 px-1 py-0.5 rounded">OCO</strong>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">2</span>
                    <p>No campo <strong className="text-white">Preço (Price)</strong>: Digite o <span className="text-green-400 font-bold">Preço Alvo (Target)</span> sugerido pelo nosso assistente. Esse é o preço em que a moeda será vendida com lucro caso suba.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">3</span>
                    <p>No campo <strong className="text-white">Stop</strong>: Digite o valor de gatilho do <span className="text-red-400 font-bold">Stop Loss</span>. Esse é o gatilho que avisa a Binance que o mercado caiu demais.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">4</span>
                    <p>No campo <strong className="text-white">Limite (Limit)</strong>: Digite o mesmo valor do Stop ou um pouco abaixo (ex: se o stop é 178.00, coloque 177.90 para garantir que a ordem execute mesmo em quedas rápidas).</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">5</span>
                    <p>Selecione <strong className="text-white">100%</strong> de moedas para vender tudo e aperte o botão vermelho <strong className="text-red-400">Vender</strong>. Pronto, você pode dormir em paz que seu dinheiro está 100% protegido!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'venda_imediata' && (
            <div className="space-y-4">
              <div className="bg-[#f6465d]/10 text-[#f6465d] border border-[#f6465d]/20 p-4 rounded-xl flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-xs font-semibold leading-relaxed">
                  Bateu o desespero ou o assistente IA emitiu um aviso crítico de <span className="font-bold text-red-400">Sinal de VENDA imediata</span>? Não tente adivinhar preços. Saia da operação imediatamente usando ordem de Mercado para salvar seu capital!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-[#f6465d]" /> Como Sair da Operação Rápido:
                </h4>
                
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">1</span>
                    <p>Entre no menu de negociação da moeda que você tem comprada (ex: <strong className="text-white">SOL/BRL</strong>).</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">2</span>
                    <p>Mude o interruptor de ordens para <strong className="text-white bg-gray-800 px-1 py-0.5 rounded">Mercado (Market Order)</strong>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">3</span>
                    <p>Clique na opção de porcentagem de quantidade e selecione <strong className="text-white">100%</strong> para vender a totalidade das moedas que comprou.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-800 text-white font-mono font-bold w-5 h-5 flex items-center justify-center rounded shrink-0">4</span>
                    <p>Aperte o botão vermelho grande <strong className="text-red-400 font-bold uppercase">Vender SOL</strong>. Os reais caem instantaneamente na sua conta Binance!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tempo_ideal' && (
            <div className="space-y-4">
              <div className="bg-blue-950/20 text-blue-400 border border-blue-900/40 p-4 rounded-xl flex items-center gap-3">
                <span className="text-2xl">⏱️</span>
                <p className="text-xs font-semibold leading-relaxed">
                  Uma varredura e reanálise a cada <span className="font-bold underline text-white">30 minutos</span> é cientificamente o melhor equilíbrio do mercado. Entenda abaixo por quê:
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400" /> Vantagens e Por que não usar prazos menores:
                </h4>
                
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">🛡️</span>
                    <p><strong className="text-white">Evita Ruídos e Falsos Sinais:</strong> Em prazos de 1 ou 5 minutos, o preço oscila caoticamente "para cima e para baixo" sem direção real. Isso geraria dezenas de alertas falsos que fariam você vender por desespero e perder dinheiro com taxas desnecessárias.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">📈</span>
                    <p><strong className="text-white">Formação de Velas Sólidas:</strong> Velas de 30 minutos na Binance indicam movimentos de tendência muito mais confiáveis e saudáveis de alta ou baixa.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-400 font-bold shrink-0">⚡</span>
                    <p><strong className="text-white">Análise On-Demand:</strong> Precisa de uma resposta agora? Não precisa esperar 30 minutos! Nosso aplicativo conta com o grande botão amarelo <strong className="text-[#f0b90b]">🤖 Analisar Agora & Atualizar Sinais</strong> no cabeçalho. Toque nele sempre que quiser forçar uma reanálise instantânea de mercado!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Mock Binance Screen Simulator (Span 5) */}
        <div className="lg:col-span-5 bg-[#0b0e11] rounded-2xl border border-gray-800 p-4 shadow-inner space-y-4">
          <div className="flex items-center justify-between border-b border-gray-900 pb-2">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">Simulador de Celular Binance</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0ecb81]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            </div>
          </div>

          {/* Simulated Binance Screen content changes according to tabs */}
          {activeTab === 'compra' && (
            <div className="space-y-3 bg-[#181a20] p-4 rounded-xl border border-gray-800 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-xs font-bold text-white">
                <span>SOL / BRL</span>
                <span className="text-[#0ecb81] font-mono text-xs">R$ 1.038,85</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#0ecb81] text-black text-xs font-extrabold text-center py-2 rounded-lg">COMPRAR</div>
                <div className="bg-gray-800 text-gray-400 text-xs font-bold text-center py-2 rounded-lg">VENDER</div>
              </div>

              <div className="space-y-2 pt-2">
                <div>
                  <span className="text-[10px] text-gray-500 block font-bold uppercase">Tipo de Ordem</span>
                  <div className="bg-gray-900 text-xs text-white p-2 rounded border border-gray-800 flex justify-between items-center">
                    <span>Ordem de Mercado (Market)</span>
                    <span className="text-[9px] bg-gray-800 px-1 text-[#f0b90b] rounded font-bold">Instantânea</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 block font-bold uppercase">Valor a Comprar (BRL)</span>
                  <div className="bg-gray-900 text-xs text-white p-2 rounded border border-gray-800 flex justify-between items-center font-mono">
                    <span className="text-gray-400">R$</span>
                    <span className="text-white font-bold">100,00</span>
                  </div>
                </div>

                <div className="bg-[#0ecb81] text-black text-xs font-black text-center py-3 rounded-xl shadow-lg hover:brightness-110 cursor-pointer transition-all uppercase tracking-wider">
                  Comprar SOL (Sem Taxas)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stop_loss' && (
            <div className="space-y-3 bg-[#181a20] p-4 rounded-xl border border-gray-800 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-xs font-bold text-white">
                <span>SOL / USDT</span>
                <span className="text-red-400 font-mono text-xs">$ 184.85</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800 text-gray-400 text-xs font-bold text-center py-2 rounded-lg">COMPRAR</div>
                <div className="bg-[#f6465d] text-white text-xs font-extrabold text-center py-2 rounded-lg">VENDER</div>
              </div>

              <div className="space-y-2 pt-1">
                <div>
                  <span className="text-[10px] text-gray-500 block font-bold uppercase">Tipo de Ordem</span>
                  <div className="bg-gray-900 text-xs text-[#f0b90b] p-1.5 rounded border border-gray-800 flex justify-between items-center font-bold">
                    <span>OCO (Ordem Cancela Ordem)</span>
                    <span className="text-[8px] bg-yellow-500/10 text-[#f0b90b] px-1 rounded">Preço Duplo</span>
                  </div>
                </div>

                {/* Price (Target) */}
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-green-400 block font-bold uppercase">Preço Alvo (Limit/Target)</span>
                    <span className="text-[8px] text-gray-500 font-mono">Vende se subir</span>
                  </div>
                  <div className="bg-gray-900 text-xs text-white p-2 rounded border border-gray-800 flex justify-between items-center font-mono">
                    <span className="text-gray-500">$</span>
                    <span className="text-[#0ecb81] font-bold">195.00</span>
                  </div>
                </div>

                {/* Stop */}
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-red-400 block font-bold uppercase">Preço de Disparo (Stop)</span>
                    <span className="text-[8px] text-gray-500 font-mono">Preço de alerta</span>
                  </div>
                  <div className="bg-gray-900 text-xs text-white p-2 rounded border border-gray-800 flex justify-between items-center font-mono">
                    <span className="text-gray-500">$</span>
                    <span className="text-red-400 font-bold">178.00</span>
                  </div>
                </div>

                {/* Limit */}
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Preço Limite de Saída (Limit)</span>
                  <div className="bg-gray-900 text-xs text-white p-2 rounded border border-gray-800 flex justify-between items-center font-mono">
                    <span className="text-gray-500">$</span>
                    <span className="text-white font-bold">177.90</span>
                  </div>
                </div>

                {/* Amount percentage bar */}
                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] font-bold text-gray-400 pt-1">
                  <div className="bg-gray-900 py-1 rounded">25%</div>
                  <div className="bg-gray-900 py-1 rounded">50%</div>
                  <div className="bg-gray-900 py-1 rounded">75%</div>
                  <div className="bg-gray-800 py-1 rounded text-white border border-[#f0b90b]">100%</div>
                </div>

                <div className="bg-[#f6465d] text-white text-xs font-black text-center py-3 rounded-xl shadow-lg hover:brightness-110 cursor-pointer transition-all uppercase tracking-wider">
                  Vender SOL (Com Alvo + Stop)
                </div>
              </div>
            </div>
          )}

          {activeTab === 'venda_imediata' && (
            <div className="space-y-3 bg-[#181a20] p-4 rounded-xl border border-gray-800 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-xs font-bold text-white">
                <span>SOL / BRL</span>
                <span className="text-[#0ecb81] font-mono text-xs">R$ 1.038,85</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800 text-gray-400 text-xs font-bold text-center py-2 rounded-lg">COMPRAR</div>
                <div className="bg-[#f6465d] text-white text-xs font-extrabold text-center py-2 rounded-lg">VENDER</div>
              </div>

              <div className="space-y-2 pt-2">
                <div>
                  <span className="text-[10px] text-gray-500 block font-bold uppercase">Tipo de Ordem</span>
                  <div className="bg-gray-900 text-xs text-white p-2 rounded border border-gray-800 flex justify-between items-center">
                    <span>Ordem de Mercado (Market)</span>
                    <span className="text-[9px] bg-red-950 text-red-400 px-1 rounded font-bold">Saída Rápida</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] font-bold text-gray-400 pt-1">
                  <div className="bg-gray-900 py-1 rounded">25%</div>
                  <div className="bg-gray-900 py-1 rounded">50%</div>
                  <div className="bg-gray-900 py-1 rounded">75%</div>
                  <div className="bg-gray-800 py-1 rounded text-white border border-red-500">100%</div>
                </div>

                <div className="bg-[#f6465d] text-white text-xs font-black text-center py-3 rounded-xl shadow-lg hover:brightness-110 cursor-pointer transition-all uppercase tracking-wider">
                  Vender SOL Imediatamente
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tempo_ideal' && (
            <div className="space-y-4 bg-[#181a20] p-4 rounded-xl border border-gray-800 animate-in fade-in duration-200 flex flex-col justify-between h-56 text-center">
              <div className="space-y-1">
                <span className="text-[10px] text-[#f0b90b] font-bold uppercase tracking-widest block font-mono">Métrica Protegida</span>
                <span className="text-3xl font-extrabold text-white block">30:00</span>
                <p className="text-[11px] text-gray-400">Tempo de reavaliação de riscos e varredura do robô</p>
              </div>

              <div className="bg-[#0b0e11] p-3 rounded-lg border border-gray-900">
                <p className="text-[10px] text-gray-400">Dica Sênior:</p>
                <p className="text-xs text-green-400 font-bold">"Mais estabilidade nos sinais = Menor estresse e maiores taxas de vitória!"</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
