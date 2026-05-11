import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: any) => [...userKeys.lists(), filters] as const,
};

export const useUsers = (params: { current: number; pageSize: number; filter?: string; sort?: string }) => {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, filter, sort } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', (current - 1).toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);

            return axiosInstance.get<any, IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${queryParams.toString()}`);
        },
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => axiosInstance.post('/api/v1/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => axiosInstance.patch('/api/v1/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => axiosInstance.delete(`/api/v1/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};

export const useExportUsers = () => {
    return useMutation({
        mutationFn: async () => {
            const response = await axiosInstance.get('/api/v1/users/export', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response as any]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        },
    });
};

export const useImportUsers = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return axiosInstance.post('/api/v1/users/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};
