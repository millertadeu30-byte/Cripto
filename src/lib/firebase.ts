import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Retrieve or generate a unique Device/Sync ID to identify this user's data in the cloud
export function getDeviceSyncId(): string {
  let syncId = localStorage.getItem('binance_assistant_sync_id');
  if (!syncId) {
    // Generate a unique, short, human-readable-ish sync code
    const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    syncId = `BIA-${Date.now().toString().slice(-6)}-${randPart}`;
    localStorage.setItem('binance_assistant_sync_id', syncId);
  }
  return syncId;
}

// Interfaces to match App.tsx types
export interface CloudData {
  trades: any[];
  history: any[];
  lastUpdated: string;
}

// Save trades and history to Firestore
export async function saveToCloud(syncId: string, trades: any[], history: any[]) {
  try {
    const userDocRef = doc(db, 'users', syncId);
    await setDoc(userDocRef, {
      trades,
      history,
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
