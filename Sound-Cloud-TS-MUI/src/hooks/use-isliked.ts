import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';
import { useSession } from 'next-auth/react';

export const useIsLiked = (trackId: number) => {
    const { data: session } = useSession();

    return useQuery({
        queryKey: ['isLiked', trackId],
        queryFn: async () => {
            const response = await axiosInstance.get<boolean>(
                `/api/v1/tracks/${trackId}/isLiked`
            );
            return response.data;
        },
        
        enabled: !!session && !!trackId, // Only fetch when user is logged in and trackId exists
        staleTime: 30 * 1000, // 30 seconds - refetch more frequently
        gcTime: 2 * 60 * 1000, // 2 minutes - cache shorter
    });
};
