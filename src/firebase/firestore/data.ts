
// src/firebase/firestore/data.ts
'use server';

import { initializeFirebaseServer } from '@/firebase/server';
import { collection, getDocs, query, where, doc, getDoc, collectionGroup } from 'firebase/firestore';
import { headers } from 'next/headers';
import { User, getAuth } from 'firebase/auth';


// Helper function to get the current logged-in user on the server
// This is a simplified example; a real app would use a more robust auth check (e.g., from headers/cookies)
async function getCurrentUser(): Promise<User | null> {
    const auth = getAuth(initializeFirebaseServer().firebaseApp);
    // In a real server context, you'd get the user from the request headers/session.
    // For this example, we'll assume a way to get the current user exists.
    // This is a placeholder and might need a proper implementation depending on the auth flow.
    if(auth.currentUser) {
        return auth.currentUser;
    }
    
    // A more realistic scenario for Next.js app router server components
    // might involve passing the user ID from the client or using a session management library.
    // As a fallback for this specific setup, we'll return null if no user is directly available.
    return null; 
}


// Helper function to parse multiplier string to a number
function parseMultiplier(multiplier: string): number {
    if (typeof multiplier !== 'string') return 0;
    return parseFloat(multiplier.replace('x', ''));
}

export async function getGameData(worldName: string, category: string, itemName?: string) {
  const { firestore } = initializeFirebaseServer();
  try {
    let worldQuery;
    const lowerCaseWorldName = worldName.toLowerCase();
    
    const worldsRef = collection(firestore, 'worlds');
    worldQuery = query(worldsRef, where('name', '>=', worldName), where('name', '<=', worldName + '\uf8ff'));

    const worldQuerySnapshot = await getDocs(worldQuery);
    
    let targetWorldDoc;

    if (!worldQuerySnapshot.empty) {
        targetWorldDoc = worldQuerySnapshot.docs.find(doc => doc.data().name.toLowerCase().startsWith(lowerCaseWorldName));
        if (!targetWorldDoc) {
             targetWorldDoc = worldQuerySnapshot.docs.find(doc => doc.data().name.toLowerCase().includes(lowerCaseWorldName));
        }
        if (!targetWorldDoc) {
            targetWorldDoc = worldQuerySnapshot.docs[0];
        }
    }

    if (!targetWorldDoc) {
      return { error: `World containing name "${worldName}" not found.` };
    }

    const categoryCollectionRef = collection(targetWorldDoc.ref, category);
    
    let itemQuery;
    if (itemName) {
      const lowerCaseItemName = itemName.toLowerCase();
      const allItemsSnapshot = await getDocs(categoryCollectionRef);
      const matchedDocs = allItemsSnapshot.docs.filter(doc => doc.data().name.toLowerCase().includes(lowerCaseItemName));
      
      if(matchedDocs.length === 0) {
        return { error: `No items found in category "${category}" with name containing "${itemName}" for world "${targetWorldDoc.data().name}".` };
      }
      itemQuery = matchedDocs;

    } else {
      const allItemsSnapshot = await getDocs(categoryCollectionRef);
      itemQuery = allItemsSnapshot.docs;
    }

    if (itemQuery.length === 0) {
        return { error: `No items found in category "${category}" ${itemName ? `with name "${itemName}"` : ''} for world "${targetWorldDoc.data().name}".` };
    }
    
    const results = [];
    for (const itemDoc of itemQuery) {
        const itemData = { id: itemDoc.id, ...itemDoc.data() };
        
        if (category === 'powers' && itemDoc.ref) {
            const statsCollectionRef = collection(itemDoc.ref, 'stats');
            const statsSnapshot = await getDocs(statsCollectionRef);
            if (!statsSnapshot.empty) {
                const statsData = statsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));
                
                statsData.sort((a, b) => parseMultiplier(a.multiplier) - parseMultiplier(b.multiplier));

                (itemData as any)['stats'] = statsData;
            }
        }
        
        results.push(itemData);
    }
    
    return results;

  } catch (error) {
    console.error('Error fetching game data:', error);
    return { error: 'An error occurred while fetching data from Firestore.' };
  }
}

export async function getAllGameData() {
    const { firestore } = initializeFirebaseServer();
    try {
        const worldsSnapshot = await getDocs(collection(firestore, 'worlds'));
        const worldsData = worldsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const subcollectionNames = ['powers', 'npcs', 'pets', 'dungeons', 'shadows', 'stands', 'accessories', 'fighters'];

        const allDataPromises = worldsData.map(async (world) => {
            const worldWithSubcollections: any = { ...world };
            for (const subcollectionName of subcollectionNames) {
                const subcollectionSnapshot = await getDocs(collection(firestore, 'worlds', world.id, subcollectionName));
                if (!subcollectionSnapshot.empty) {
                    const subcollectionData = await Promise.all(subcollectionSnapshot.docs.map(async (doc) => {
                        const docData:any = { id: doc.id, ...doc.data() };
                        if (subcollectionName === 'powers') {
                             const statsSnapshot = await getDocs(collection(doc.ref, 'stats'));
                             if (!statsSnapshot.empty) {
                                docData.stats = statsSnapshot.docs.map(statDoc => ({ id: statDoc.id, ...statDoc.data() }));
                             }
                        }
                        return docData;
                    }));
                    worldWithSubcollections[subcollectionName] = subcollectionData;
                }
            }
            return worldWithSubcollections;
        });

        const allData = await Promise.all(allDataPromises);
        return allData;

    } catch (error) {
        console.error('Error fetching all game data:', error);
        return { error: 'An error occurred while fetching all game data from Firestore.' };
    }
}

export async function getUserProfileJson() {
    const { firestore } = initializeFirebaseServer();
    const user = await getCurrentUser(); // This is a placeholder for getting the user server-side

    if (!user) {
        // This is a critical part. If there's no user, we can't fetch a profile.
        // The AI needs to handle this case gracefully.
        return []; 
    }

    try {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().userProfile) {
            return userSnap.data().userProfile;
        } else {
            // Return an empty array or object if the profile doesn't exist,
            // so the AI knows the profile is empty.
            return [];
        }
    } catch (error) {
        console.error('Error fetching user profile JSON:', error);
        return { error: 'Failed to fetch user profile.' };
    }
}
