import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';
import {useSession} from "next-auth/react";

// Fetch all playlists with track info
export const usePlaylists = () => {
    const{data:session}= useSession();
    return useQuery({
        enabled: !!session?.access_token && session.access_token !== "undefined",
        queryKey: ['playlists'],
        queryFn: async () => {
            const response = await axiosInstance.get<IPlaylistWithTracks[]>(
                `/api/v1/playlists/exists`
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - increased to reduce refetches
        gcTime: 10 * 60 * 1000, // 10 minutes - increased cache time
        refetchOnWindowFocus: false, // Prevent refetch on window focus
        refetchOnMount: false, // Prevent refetch on component mount if data exists
        refetchOnReconnect: false, // Prevent refetch on reconnect
    });
};

// Create new playlist
export const useCreatePlaylist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ICreatePlaylistDTO) => {
            const response = await axiosInstance.post<IBackendRes<IPlaylist>>(
                `/api/v1/playlists`,
                data
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
        },
    });
};

// Add/remove track to playlist
export const useToggleTrackInPlaylist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ playlistId, trackId, isAdded }: {
            playlistId: number;
            trackId: number;
            isAdded: boolean
        }) => {
            const response = await axiosInstance.patch<IBackendRes<{
                id: number;
                isAdded: boolean;
                totalTracks: number
            }>>(
                `/api/v1/playlists?trackId=${trackId}`,
                {
                    playlistId,
                    isAdded
                }
            );
            return response.data;
        },
        onSuccess: (res, variables) => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            if (variables.playlistId) {
                queryClient.invalidateQueries({ queryKey: ['playlist', variables.playlistId] });
            }
        },
    });
};

// Fetch playlists with pagination and filter
export const usePlaylistsPaginated = (params: {
    title?: string;
    page: number;
    size: number
}) => {
    return useQuery({
        queryKey: ['playlists-paginated', params],
        queryFn: async () => {
            const response = await axiosInstance.get<IBackendRes<IModelPaginate<IPlaylist>>>(
                `/api/v1/playlists/users`,
                { params }
            );
            return response;
        },
    });
};

// Fetch playlist by ID
export const usePlaylistById = (id: number) => {
    return useQuery({
        queryKey: ['playlist', id],
        queryFn: async () => {
            const response = await axiosInstance.get<IBackendRes<IPlaylist>>(
                `/api/v1/playlists/${id}`
            );
            return response;
        },
        enabled: !!id,
    });
};
export const useUpdatePlaylist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ formData }: { formData: FormData }) => {
            const response = await axiosInstance.put<IBackendRes<IPlaylist>>(
                `/api/v1/playlists`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response;
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            //@ts-ignore
            if (res?.data?.id) {
                //@ts-ignore
                queryClient.invalidateQueries({ queryKey: ['playlist', res.data.id] });
            }
        },
    });
};
