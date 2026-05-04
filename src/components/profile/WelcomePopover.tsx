
'use client';

// This component is no longer used and its logic has been moved to the main profile page.
// It can be safely deleted.

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function WelcomePopover() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [hasBeenClosed, setHasBeenClosed] = useState(false);

    useEffect(() => {
        if (searchParams.get('new-user') === 'true' && !hasBeenClosed) {
            // The logic is now handled on the profile page itself.
            // We just remove the query param to clean up the URL.
            router.replace('/profile', { scroll: false });
            setHasBeenClosed(true);
        }
    }, [searchParams, router, hasBeenClosed]);

    return null; // Render nothing
}
