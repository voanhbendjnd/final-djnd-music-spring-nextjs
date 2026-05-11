'use client'

import { useIsLiked } from '@/hooks/use-isliked';
import { useSession } from 'next-auth/react';

interface TrackLikedProviderProps {
    trackId: number;
    children: (isLiked: boolean | undefined) => React.ReactNode;
}

export default function TrackLikedProvider({ trackId, children }: TrackLikedProviderProps) {
    const { data: session } = useSession();
    const { data: isLiked } = useIsLiked(trackId);

    // For unauthenticated users, pass undefined (will be handled by components)
    // For authenticated users, pass the actual isLiked status
    return <>{children(session ? isLiked : undefined)}</>;
}
