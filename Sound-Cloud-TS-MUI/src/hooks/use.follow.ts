import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';

interface FollowResponse {
    countFollowers: number;
    isFollowed: boolean;
}

export function useFollowMutation() {
    return useMutation({
        mutationFn: async (followingId: string) => {
            const res = await axiosInstance.post<{ data: FollowResponse }>(
                '/api/v1/follows',
                { followingId }           // backend đọc mapRequest.get("followingId")
            );
            // Unwrap API envelope { statusCode, data: { countFollowers, isFollowed } }
            return res as any;
        },
    });
}