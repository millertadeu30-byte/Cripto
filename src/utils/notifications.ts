// Utility for Web Audio, Phone Vibration, and HTML5 Push Notifications for 9% Step Alerts

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Audio Context não suportado ou bloqueado pelo navegador:', e);
    return null;
  }
}

// Play celebratory ascending sound for profit threshold (+9%, +18%, +27%...)
export function playProfitChime(stepPercent: number = 9) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major Arpeggio)
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);
      
      gain.gain.setValueAtTime(0.001, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.15, now + index * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.35);
    });
  } catch (e) {
    console.warn('Erro ao tocar som de lucro:', e);
  }
}

// Play caution warning sound for loss threshold (-9%, -18%, -27%...)
export function playLossChime(stepPercent: number = 9) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [440.0, 349.23]; // A4, F4 (Minor descent)
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * 0.18);
      
      gain.gain.setValueAtTime(0.001, now + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.18 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.18);
      osc.stop(now + index * 0.18 + 0.3);
    });
  } catch (e) {
    console.warn('Erro ao tocar som de perda:', e);
  }
}

// Trigger phone vibration (Android Chrome / Mobile browsers)
export function triggerPhoneVibration(isProfit: boolean) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (isProfit) {
        // Double happy pulse
        navigator.vibrate([150, 80, 250]);
      } else {
        // Long warning pulse
        navigator.vibrate([300, 100, 300]);
      }
    }
  } catch (e) {
    // Vibration not supported or not allowed
  }
}

// Check notification permission state
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission from user
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.warn('Erro ao solicitar permissão de notificação:', e);
    return false;
  }
}

export interface StepAlertPayload {
  symbol: string;
  coinName: string;
  tier: number; // e.g. 1 (+9%), 2 (+18%), -1 (-9%), -2 (-18%)
  stepPercent: number; // e.g. 9
  actualPnlPercent: number;
  currentPrice: number;
  purchasePrice: number;
  currency: 'USDT' | 'BRL';
  pnlValueFormatted: string;
}

// Trigger complete alert (Notification + Sound + Vibration)
export function sendStepAlert(payload: StepAlertPayload) {
  const isProfit = payload.actualPnlPercent >= 0;
  const targetThresholdPct = payload.tier * payload.stepPercent;
  const sign = targetThresholdPct >= 0 ? '+' : '';
  
  // 1. Play synthesized audio
  if (isProfit) {
    playProfitChime(Math.abs(targetThresholdPct));
  } else {
    playLossChime(Math.abs(targetThresholdPct));
  }

  // 2. Trigger vibration
  triggerPhoneVibration(isProfit);

  // 3. System Push / Browser Notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const title = isProfit 
        ? `🎯 META DE ${sign}${targetThresholdPct}% ATINGIDA: ${payload.symbol}!` 
        : `⚠️ ALERTA DE QUEDA DE ${targetThresholdPct}%: ${payload.symbol}!`;
        
      const body = isProfit
        ? `🔥 ${payload.coinName || payload.symbol} atingiu ${sign}${payload.actualPnlPercent.toFixed(2)}% de lucro! Preço atual: ${payload.currentPrice} ${payload.currency} (${payload.pnlValueFormatted}).`
        : `📉 ${payload.coinName || payload.symbol} recuou para ${payload.actualPnlPercent.toFixed(2)}%! Preço atual: ${payload.currentPrice} ${payload.currency} (${payload.pnlValueFormatted}).`;

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `step-alert-${payload.symbol}-${payload.tier}`, // Prevent spamming duplicate notifications
        requireInteraction: true // Keep on screen on supported devices
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Não foi possível exibir notificação nativa:', e);
    }
  }
}
