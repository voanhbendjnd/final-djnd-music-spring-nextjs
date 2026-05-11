
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import axiosInstance from "@/utils/axios-instance";

export const commentKeys ={
    all:['comments'] as const,
    lists:()=> [...commentKeys.all, 'comments'] as const,
    list:(filters: any)=> [...commentKeys.lists(), filters] as const,

};

export const useComments = (params: { current: number; pageSize: number; filter?: string; sort?: string }) => {
    return useQuery<IModelPaginate<IComment>>({
        queryKey: commentKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, filter, sort } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', current.toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);

            const res = await axiosInstance.get<any, IBackendRes<IModelPaginate<IComment>>>(`/api/v1/comments?${queryParams.toString()}`);
            return res.data!;
        },
    });
};
export const useFetchComments = (params: { current: number; pageSize: number; trackId: number; sort?: string }) => {
    return useQuery<IModelPaginate<IComment>>({
        queryKey: commentKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, trackId, sort } = params;
            const res = await axiosInstance.get<any, IBackendRes<IModelPaginate<IComment>>>(
                `/api/v1/tracks/comments`, {
                    params: {
                        page: current,
                        size: pageSize,
                        trackId: trackId,
                        sort: sort || "updatedAt,desc"
                    }
                }
            );
            return res.data!;
        },
    });
};
export const useFetchCommentsAxios = (
    params: { current: number; pageSize: number; trackId: number; sort?: string },
    options?: { enabled?: boolean }
) => {
    return useQuery<IModelPaginate<IComment>>({
        queryKey: commentKeys.list(params),
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const { current, pageSize, trackId, sort } = params;
            const res = await axiosInstance.get<any, IBackendRes<IModelPaginate<IComment>>>(
                `/api/v1/tracks/comments`, {
                    params: {
                        page: current,
                        size: pageSize,
                        trackId: trackId,
                        sort: sort || "updatedAt,desc"
                    }
                }
            );
            return res.data!;
        },
    });
};
export const useCreateComment = (currentParams: any) => {
    const queryClient = useQueryClient();

    // Build both cache keys so optimistic update hits WaveTrack (pageSize:100) AND CommentSection (pageSize:10)
    const trackId = currentParams.trackId;
    const waveParams  = { current: 1, pageSize: 100, trackId, sort: "updatedAt,desc" };
    const listParams  = { current: 1, pageSize: 10,  trackId, sort: "updatedAt,desc" };

    const applyOptimistic = (old: any, optimisticComment: any) => {
        if (!old) return old;
        // The query now directly returns the IModelPaginate object (which has the .result array)
        if (old.result) {
            return { ...old, result: [optimisticComment, ...old.result] };
        }
        return old;
    };

    return useMutation({
        mutationFn: (data: { track_id: number; content: string; moment: number }) =>
            axiosInstance.post('/api/v1/comments', data),

        onMutate: async (newComment) => {
            // Cancel running fetches to avoid overwriting optimistic data
            await queryClient.cancelQueries({ queryKey: commentKeys.lists() });

            // Snapshot both caches for rollback
            const prevWave = queryClient.getQueryData(commentKeys.list(waveParams));
            const prevList = queryClient.getQueryData(commentKeys.list(listParams));

            const optimisticComment = {
                id: Date.now(),
                content: newComment.content,
                moment: newComment.moment,
                createdAt: new Date().toISOString(),
                user: {
                    name: "You",
                    avatar: null
                },
                track: { id: newComment.track_id }
            };

            // Update BOTH caches
            queryClient.setQueryData(commentKeys.list(waveParams), (old: any) => applyOptimistic(old, optimisticComment));
            queryClient.setQueryData(commentKeys.list(listParams), (old: any) => applyOptimistic(old, optimisticComment));

            return { prevWave, prevList, optimisticComment };
        },

        onError: (_err, _newComment, context) => {
            if (context?.prevWave) queryClient.setQueryData(commentKeys.list(waveParams), context.prevWave);
            if (context?.prevList) queryClient.setQueryData(commentKeys.list(listParams), context.prevList);
        },

        onSettled: () => {
            // Invalidate ALL comment queries so every component re-fetches
            queryClient.invalidateQueries({ queryKey: commentKeys.all });
        },
    });
};

export const useDeleteComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/api/v1/comments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
        },
    });
};
