import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDoc, 
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Check if quota was recently exhausted (within 2 hours) to prevent endless retry spam
function checkIsQuotaExhausted(): boolean {
  try {
    const item = localStorage.getItem('firestore_quota_exhausted_ts');
    if (item) {
      const ts = parseInt(item, 10);
      // If marked within last 2 hours, consider quota exhausted
      if (!isNaN(ts) && Date.now() - ts < 2 * 60 * 60 * 1000) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

export function markQuotaExhausted() {
  try {
    localStorage.setItem('firestore_quota_exhausted_ts', Date.now().toString());
  } catch (e) {}
}

export function isCloudAvailable(): boolean {
  return !checkIsQuotaExhausted();
}

// Initialize Firebase safely without heavy persistent sync loops that crash on quota limits
let dbInstance: Firestore | null = null;

try {
  if (firebaseConfig && firebaseConfig.projectId && !checkIsQuotaExhausted()) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase Firestore desativado temporariamente:', e);
}

export const db = dbInstance;

// Retrieve or generate a unique Device/Sync ID to identify this user's data
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

let lastSaveAttempt = 0;

// Save trades, history, cash balance, and display parameters to Firestore
export async function saveToCloud(
  syncId: string,
  trades: any[],
  history: any[],
  cashBalance: number,
  cashBalanceCurrency: 'BRL' | 'USDT',
  displayCurrency: 'BRL' | 'USDT' | 'BTC',
  goalPercent: number
): Promise<boolean> {
  if (!db || checkIsQuotaExhausted()) return false;
  
  // Rate limit saves to cloud to at least 20 seconds apart to preserve free quota
  const now = Date.now();
  if (now - lastSaveAttempt < 20000) return false;
  lastSaveAttempt = now;

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
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      console.warn('Firestore: Limite de cota diária gratuita atingido. Operando perfeitamente em modo de persistência local.');
      return false;
    }
    console.warn('Aviso sincronização Firebase:', err?.message || err);
    return false;
  }
}

// Fetch once from cloud
export async function fetchFromCloud(syncId: string): Promise<CloudData | null> {
  if (!db || checkIsQuotaExhausted()) return null;
  try {
    const userDocRef = doc(db, 'users', syncId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as CloudData;
    }
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return null;
    }
    console.warn('Aviso consulta Firebase:', err?.message || err);
  }
  return null;
}

// Listen to real-time changes
export function subscribeToCloud(syncId: string, callback: (data: CloudData | null) => void) {
  if (!db || checkIsQuotaExhausted()) {
    callback(null);
    return () => {};
  }
  try {
    const userDocRef = doc(db, 'users', syncId);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as CloudData);
      } else {
        callback(null);
      }
    }, (err: any) => {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        markQuotaExhausted();
        console.warn('Firestore: Cota de escrita do backend gratuita esgotada. Mantendo dados seguros em armazenamento local.');
      } else {
        console.warn('Alerta listener do Firebase:', err?.message || err);
      }
      callback(null);
    });
  } catch (e) {
    callback(null);
    return () => {};
  }
}
