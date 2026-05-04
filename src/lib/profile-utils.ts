import { nanoid } from 'nanoid';

export const normalizeString = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric chars, but keep spaces
    .trim();
};

export function findItemInGameData(identifiedName: string, category: string, allGameData: any[]) {
    const normalizedIdentifiedName = normalizeString(identifiedName);

    for (const world of allGameData) {
        const subcollection = world[category];
        if (!Array.isArray(subcollection)) continue;

        for (const cachedItem of subcollection) {
            // Level 1 Search: Direct name match on the main item (for progression, etc.)
            const normalizedCachedName = normalizeString(cachedItem.name);
            if (normalizedCachedName === normalizedIdentifiedName && !cachedItem.stats) {
                const rarity = cachedItem.rarity || 'Common';
                return { ...cachedItem, world: world.name, rarity: rarity, id: cachedItem.id || nanoid() };
            }

            // Level 2 Search: If the item has a 'stats' array, search inside it
            if (cachedItem.stats && Array.isArray(cachedItem.stats)) {
                for (const stat of cachedItem.stats) {
                    if (stat.name) {
                        const normalizedStatName = normalizeString(stat.name);
                         if (normalizedStatName === normalizedIdentifiedName) {
                            // Found a match in the stats array.
                            // Return ONLY the specific stat object with the world name and an id.
                            return { 
                                ...stat,
                                id: stat.id || nanoid(),
                                world: world.name,
                            };
                        }
                    }
                }
            }
        }
    }
    return null; // No match found
}
