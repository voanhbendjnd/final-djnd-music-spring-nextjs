import {useQuery, useMutation, useQueryClient, keepPreviousData} from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';
import {useSession} from "next-auth/react";

export const trackKeys = {
    all: ['tracks'] as const,
    lists: () => [...trackKeys.all, 'list'] as const,
    list: (filters: any) => [...trackKeys.lists(), filters] as const,
    userLists: (userId: string | number) => [...trackKeys.all, 'user', userId] as const,
    userList: (userId: string | number, filters: any) => [...trackKeys.userLists(userId), filters] as const,
    details: () => [...trackKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...trackKeys.details(), id] as const,
};

export const useTracks = (params: {
    current: number;
    pageSize: number;
    filter?: string;
    sort?: string;
    // undefined = "All" (không lọc), string = lọc theo category
    category?: string;
}) => {
    return useQuery({
        queryKey: trackKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, filter, sort, category } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', current.toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);
            if (category) queryParams.append('category', category);

            return axiosInstance.get<any, IBackendRes<IModelPaginate<ITrack>>>(
                `/api/v1/tracks?${queryParams.toString()}`
            );
        },
        placeholderData: params.category === undefined ? keepPreviousData : undefined,
    });
};


export const useTrack = (id: string | number | null) => {
    return useQuery({
        queryKey: trackKeys.detail(id!),
        queryFn: () => axiosInstance.get<any, IBackendRes<ITrack>>(`/api/v1/tracks/${id}`),
        enabled: !!id,
    });
};

export const useUserTracks = (userId: string | number, params: { current: number; pageSize: number; filter?: string; sort?: string }) => {
    return useQuery({
        queryKey: trackKeys.userList(userId, params),
        queryFn: async () => {
            const { current, pageSize, filter, sort } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', current.toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);

            return axiosInstance.get<any, IBackendRes<IModelPaginate<ITrack>>>(`/api/v1/tracks/users/${userId}?${queryParams.toString()}`);
        },
        enabled: !!userId,
    });
};

export const useCreateTrack = () => {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) =>
            axiosInstance.post('/api/v1/tracks', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${session?.access_token}`
                },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};

export const useCreateTrackByAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) =>
            axiosInstance.post('/api/v1/tracks/admin', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};

export const useUploadTempTrack = (onUploadProgress?: (progressEvent: any) => void) => {
    return useMutation({
        mutationFn: (formData: FormData) =>
            axiosInstance.post<any, string>('/api/v1/tracks/upload-temp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress
            }),
    });
};

export const useUpdateTrack = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) =>
            axiosInstance.put(`/api/v1/tracks`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackKeys.all });
        },
    });
};

export const useDeleteTrack = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => axiosInstance.delete(`/api/v1/tracks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};

export interface IResTrackLike {
    countLikes: number;
    isLiked: boolean;
    countPlays: number;
}
export interface IResFollow{
    countFollowers: number;
    isFollowed: boolean;
}
export const useFollowMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (followingId: number) =>
            axiosInstance.post<any, IBackendRes<IResFollow>>(`/api/v1/follows`, { followingId }),
        onSuccess: (res, followingId) => {
            queryClient.invalidateQueries({ queryKey: trackKeys.detail(followingId) });
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};

export const useLikeTrackMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (trackId: number) =>
            axiosInstance.post<any, IBackendRes<IResTrackLike>>(`/api/v1/tracks/likes`, { trackId }),
        onSuccess: (res, trackId) => {
            queryClient.invalidateQueries({ queryKey: trackKeys.detail(trackId) });
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};

export const useCountTrackMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (trackId: number) =>
            axiosInstance.patch<any, IBackendRes<IResTrackLike>>(`/api/v1/tracks/view/increase`, { trackId }),
        onSuccess: (res, trackId) => {
            queryClient.invalidateQueries({ queryKey: trackKeys.detail(trackId) });
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};