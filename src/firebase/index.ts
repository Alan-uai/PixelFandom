'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

const FALLBACK_FIREBASE_CONFIG = {
  projectId: "studio-7418937138-8cc95",
  appId: "1:904481424539:web:4180cfbbe003dbcc08b23e",
  apiKey: "demo-api-key",
  authDomain: "studio-7418937138-8cc95.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "904481424539"
};

function hasValidFirebaseConfig(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSyAyqsRuvDyAFnk7I6Wbaaeijg3Hb_2BYro");
}

export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    
    if (!hasValidFirebaseConfig()) {
      console.warn('Firebase not configured - using fallback config for development');
      firebaseApp = initializeApp(FALLBACK_FIREBASE_CONFIG);
      return getSdks(firebaseApp);
    }
    
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
