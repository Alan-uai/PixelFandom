'use server';

import { initializeFirebaseServer } from '@/firebase/server';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

// Define a simple interface for the user data we expect
interface UserData {
  id: string;
  email: string | null;
  displayName: string | null;
}

export async function handleUserLogin(userData: UserData) {
  const { firestore } = initializeFirebaseServer();
  const userRef = doc(firestore, 'users', userData.id);

  // Check if the user document already exists
  const docSnap = await getDoc(userRef);

  // Only write the document if it doesn't already exist.
  if (!docSnap.exists()) {
      const dataToSave: any = {
        id: userData.id,
        email: userData.email,
        username: userData.displayName || userData.email?.split('@')[0],
        createdAt: serverTimestamp(),
      };

      try {
        await setDoc(userRef, dataToSave);
        console.log('New user document created for:', userData.id);
      } catch (error) {
        console.error('Error writing new user document:', error);
        throw new Error('Failed to create user profile in Firestore.');
      }
  } else {
    // Optional: You could update fields on every login here if needed,
    // like `lastLoginAt: serverTimestamp()`. For now, we do nothing if they exist.
    console.log('User document already exists for:', userData.id);
  }
}
