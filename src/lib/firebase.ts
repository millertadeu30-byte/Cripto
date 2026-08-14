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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg.includes('Quota limit exceeded') || errMsg.includes('resource-exhausted')) {
    markQuotaExhausted();
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: null,
      email: null
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

// Check if quota was marked exhausted within the last 24 hours
export function isQuotaExhausted(): boolean {
  try {
    const item = localStorage.getItem('firestore_quota_exhausted_ts');
    if (item) {
      const ts = parseInt(item, 10);
      // Quotas in Firebase reset daily. Keep quota pause for 12 hours or until manual reset.
      if (!isNaN(ts) && Date.now() - ts < 12 * 60 * 60 * 1000) {
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

export function resetQuotaExhaustedFlag() {
  try {
    localStorage.removeItem('firestore_quota_exhausted_ts');
  } catch (e) {}
}

export function isCloudAvailable(): boolean {
  return !isQuotaExhausted();
}

// Initialize Firebase safely
let dbInstance: Firestore | null = null;

try {
  if (firebaseConfig && firebaseConfig.projectId) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase Firestore initialization:', e);
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
  // If quota is exhausted or db is unavailable, immediately skip cloud write and use local persistence
  if (!db || isQuotaExhausted()) {
    return false;
  }
  
  // Rate limit saves to cloud to at least 30 seconds apart to conserve write units
  const now = Date.now();
  if (now - lastSaveAttempt < 30000) {
    return false;
  }
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
    handleFirestoreError(err, OperationType.WRITE, `users/${syncId}`);
    return false;
  }
}

// Fetch once from cloud
export async function fetchFromCloud(syncId: string): Promise<CloudData | null> {
  if (!db || isQuotaExhausted()) {
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', syncId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as CloudData;
    }
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, `users/${syncId}`);
  }
  return null;
}

// Listen to real-time changes
export function subscribeToCloud(syncId: string, callback: (data: CloudData | null) => void) {
  if (!db || isQuotaExhausted()) {
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
      handleFirestoreError(err, OperationType.GET, `users/${syncId}`);
      callback(null);
    });
  } catch (e) {
    callback(null);
    return () => {};
  }
}

