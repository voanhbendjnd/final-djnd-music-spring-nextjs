'use client';

import { useAutoRefreshToken } from '@/hooks/use.auth';

export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
    useAutoRefreshToken();
    return <>{children}</>;
}
