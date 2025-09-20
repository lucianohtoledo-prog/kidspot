import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const extra = Constants?.expoConfig?.extra as any;

export const isFirebaseConfigured =
  !!extra?.FIREBASE?.apiKey && !!extra?.FIREBASE?.projectId;

let app: any;
if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(extra.FIREBASE);
}

export const auth = isFirebaseConfigured ? getAuth(app) : null;
export const db = isFirebaseConfigured ? getFirestore(app) : null;
