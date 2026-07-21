import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Retrieve or generate a unique Device/Sync ID to identify this user's data in the cloud
export function getDeviceSyncId(): string {
  try {
    let syncId = localStorage.getItem('binance_assistant_sync_id');
    if (!syncId) {
      syncId = 'BIA-PORTFOLIO-MASTER';
      localStorage.setItem('binance_assistant_sync_id', syncId);
    }
    return syncId;
  } catch (err) {
    return 'BIA-PORTFOLIO-MASTER';
  }
}

// Interfaces to match App.tsx types
export interface CloudData {
  trades: any[];
  history: any[];
  cashBalance?: number;
  cashBalanceCurrency?: 'BRL' | 'USDT';
  displayCurrency?: 'BRL' | 'USDT' | 'BTC';
  goalPercent?: number;
  lastUpdated: string;
}

// Save trades, history, cash balance, and display parameters to Firestore
export async function saveToCloud(
  syncId: string,
  trades: any[],
  history: any[],
  cashBalance: number,
  cashBalanceCurrency: 'BRL' | 'USDT',
  displayCurrency: 'BRL' | 'USDT' | 'BTC',
  goalPercent: number
) {
  try {
    const userDocRef = doc(db, 'users', syncId);
    await setDoc(userDocRef, {
      trades,
      history,
      cashBalance,
      cashBalanceCurrency,
      displayCurrency,
      goalPercent,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log('Dados salvos na nuvem com sucesso!');
  } catch (err) {
    console.error('Erro ao salvar dados no Firebase:', err);
  }
}

// Fetch once from cloud
export async function fetchFromCloud(syncId: string): Promise<CloudData | null> {
  try {
    const userDocRef = doc(db, 'users', syncId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as CloudData;
    }
  } catch (err) {
    console.error('Erro ao buscar dados do Firebase:', err);
  }
  return null;
}

// Listen to real-time changes
export function subscribeToCloud(syncId: string, callback: (data: CloudData) => void) {
  const userDocRef = doc(db, 'users', syncId);
  return onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as CloudData);
    }
  }, (err) => {
    console.error('Erro na escuta em tempo real do Firebase:', err);
  });
}
