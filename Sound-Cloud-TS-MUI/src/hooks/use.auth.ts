import { useEffect, useRef } from 'react';
import { getSession } from 'next-auth/react';

const REFRESH_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const TOKEN_EXPIRY_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry

export const useAutoRefreshToken = () => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const checkAndRefreshToken = async () => {
            try {
                const session: any = await getSession();
                
                if (!session || !session.access_token || !session.expires_in) {
                    // No session or token, nothing to refresh
                    return;
                }

                const timeUntilExpiry = (session.expires_in as number) - Date.now();
                
                // If token is expired or about to expire within buffer, refresh it
                if (timeUntilExpiry <= TOKEN_EXPIRY_BUFFER) {
                    console.log('Token expiring soon, refreshing...');
                    await getSession(); // This triggers NextAuth JWT callback which will refresh
                }
            } catch (error) {
                console.error('Error checking token expiration:', error);
            }
        };

        // Check immediately on mount
        checkAndRefreshToken();

        // Set up periodic check
        intervalRef.current = setInterval(checkAndRefreshToken, REFRESH_INTERVAL);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
};
