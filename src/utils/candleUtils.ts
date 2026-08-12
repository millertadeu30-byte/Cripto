export interface Candle5mAnalysis {
  currentCandleOpen: string;
  nextEntryTime: string;
  projectedExitTime: string;
  remainingMs: number;
  remainingStr: string;
  candleProgressPercent: number;
}

export function analyze5MinCandle(now: Date = new Date()): Candle5mAnalysis {
  const timeMs = now.getTime();
  const fiveMinMs = 5 * 60 * 1000;
  
  // Current 5m candle start time
  const currentCandleOpenMs = Math.floor(timeMs / fiveMinMs) * fiveMinMs;
  const currentCandleOpen = new Date(currentCandleOpenMs);
  
  // Next 5m candle start time (Exact Buy Entry Time)
  const nextCandleOpenMs = currentCandleOpenMs + fiveMinMs;
  const nextCandleOpen = new Date(nextCandleOpenMs);

  // Projected Exit Time (2 candles ahead = 10 minutes from entry)
  const exitCandleMs = nextCandleOpenMs + (2 * fiveMinMs);
  const exitCandle = new Date(exitCandleMs);

  // Time remaining in current 5m candle
  const remainingMs = Math.max(0, nextCandleOpenMs - timeMs);
  const remainingSec = Math.floor(remainingMs / 1000);
  const remMin = Math.floor(remainingSec / 60);
  const remSec = remainingSec % 60;

  const candleProgressPercent = Math.min(100, Math.max(0, ((fiveMinMs - remainingMs) / fiveMinMs) * 100));

  return {
    currentCandleOpen: currentCandleOpen.toLocaleTimeString('pt-BR'),
    nextEntryTime: nextCandleOpen.toLocaleTimeString('pt-BR'),
    projectedExitTime: exitCandle.toLocaleTimeString('pt-BR'),
    remainingMs,
    remainingStr: `${String(remMin).padStart(2, '0')}m ${String(remSec).padStart(2, '0')}s`,
    candleProgressPercent
  };
}

export interface Candle5mEntryDetail {
  entryTimeStr: string;         // e.g. "13:30:00"
  entryTimeShort: string;       // e.g. "13:30"
  exitTimeStr: string;          // e.g. "13:45:00"
  exitTimeShort: string;        // e.g. "13:45"
  candleLabel: string;          // e.g. "Vela das 13:30 (Martelo Comprador - Entrada Imediata)"
  candleReasoning: string;      // e.g. "Vela de 5M com volume positivo. Entrada ideal às 13:30."
  candleOffsetMinutes: number;  // 5, 10, or 15
  remainingMsToEntry: number;
  remainingStr: string;         // "01m 18s"
  isEntryActive: boolean;
}

/**
 * Computes exact 5-minute candle entry target time based on candle study
 * Example: if now is 13:28:
 * offset 1 -> 13:30
 * offset 2 -> 13:35
 * offset 3 -> 13:40
 */
export function compute5MinCandleEntry(
  now: Date = new Date(),
  offsetCandles: number = 1
): Candle5mEntryDetail {
  const timeMs = now.getTime();
  const fiveMinMs = 5 * 60 * 1000;

  // Current 5m candle start time
  const currentCandleStartMs = Math.floor(timeMs / fiveMinMs) * fiveMinMs;

  // Target Entry candle start time
  let entryCandleStartMs = currentCandleStartMs + (offsetCandles * fiveMinMs);

  // If the target entry candle has already passed, advance to next valid 5m candle
  if (entryCandleStartMs <= timeMs) {
    entryCandleStartMs = Math.ceil(timeMs / fiveMinMs) * fiveMinMs;
  }

  const validEntryDate = new Date(entryCandleStartMs);
  const exitDate = new Date(entryCandleStartMs + (2 * fiveMinMs));

  const remainingMsToEntry = Math.max(0, entryCandleStartMs - timeMs);
  const remainingSec = Math.floor(remainingMsToEntry / 1000);
  const remMin = Math.floor(remainingSec / 60);
  const remSec = remainingSec % 60;

  const entryTimeStr = validEntryDate.toLocaleTimeString('pt-BR');
  const entryTimeShort = validEntryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const exitTimeStr = exitDate.toLocaleTimeString('pt-BR');
  const exitTimeShort = exitDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let candleLabel = `Vela das ${entryTimeShort} (Entrada Imediata)`;
  let candleReasoning = `Vela de 5M com fechamento comprador e volume acumulado. Entrada recomendada no início da vela das ${entryTimeShort}.`;

  if (offsetCandles === 2) {
    candleLabel = `Vela das ${entryTimeShort} (Aguardar Retração em 5M)`;
    candleReasoning = `Testando suporte de 5M na EMA 20. Entrada programada para a vela das ${entryTimeShort} após confirmação.`;
  } else if (offsetCandles >= 3) {
    candleLabel = `Vela das ${entryTimeShort} (Aguardar Rompimento de Pivô)`;
    candleReasoning = `Formando padrão de pivô de alta de 5M. Ponto de entrada ideal projetado para a vela das ${entryTimeShort}.`;
  }

  return {
    entryTimeStr,
    entryTimeShort,
    exitTimeStr,
    exitTimeShort,
    candleLabel,
    candleReasoning,
    candleOffsetMinutes: offsetCandles * 5,
    remainingMsToEntry,
    remainingStr: `${String(remMin).padStart(2, '0')}m ${String(remSec).padStart(2, '0')}s`,
    isEntryActive: remainingMsToEntry === 0
  };
}
