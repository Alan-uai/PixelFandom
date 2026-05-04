'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdmin(): AdminState {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [adminState, setAdminState] = useState<AdminState>({
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    // If the main user object is still loading, we are also loading.
    if (isUserLoading || !firestore) {
      setAdminState({ isAdmin: false, isLoading: true });
      return;
    }

    // If there's no user, they can't be an admin.
    if (!user) {
      setAdminState({ isAdmin: false, isLoading: false });
      return;
    }

    // User is available, check their document in Firestore.
    const userDocRef = doc(firestore, 'users', user.uid);
    
    getDoc(userDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          // Check for the 'tag' field in the user's document
          const userData = docSnap.data();
          const isAdmin = userData.tag === 'admin';
          setAdminState({ isAdmin, isLoading: false });
        } else {
          // User document doesn't exist, so they are not an admin.
          setAdminState({ isAdmin: false, isLoading: false });
        }
      })
      .catch((error) => {
        console.error("Error getting user admin status from Firestore:", error);
        setAdminState({ isAdmin: false, isLoading: false });
      });

  }, [user, isUserLoading, firestore]);

  return adminState;
}

    