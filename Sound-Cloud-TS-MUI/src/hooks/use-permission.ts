import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';

export const permissionKeys = {
    all: ['permissions'] as const,
    lists: () => [...permissionKeys.all, 'list'] as const,
    list: (filters: any) => [...permissionKeys.lists(), filters] as const,
};

export const usePermissions = (params: { current: number; pageSize: number; filter?: string; sort?: string }) => {
    return useQuery({
        queryKey: permissionKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, filter, sort } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', (current - 1).toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);

            return axiosInstance.get<any, IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${queryParams.toString()}`);
        },
    });
};

export const useAllPermissions = () => {
    return useQuery({
        queryKey: [...permissionKeys.all, 'all'],
        queryFn: () => axiosInstance.get<any, IBackendRes<IPermission[]>>('/api/v1/permissions/data'),
    });
};

export const useCreatePermission = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => axiosInstance.post('/api/v1/permissions', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
        },
    });
};

export const useUpdatePermission = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => axiosInstance.put('/api/v1/permissions', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.all });
        },
    });
};

export const useDeletePermission = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => axiosInstance.delete(`/api/v1/permissions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
        },
    });
};
