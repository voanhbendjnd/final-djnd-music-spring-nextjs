import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';

export const roleKeys = {
    all: ['roles'] as const,
    lists: () => [...roleKeys.all, 'list'] as const,
    list: (filters: any) => [...roleKeys.lists(), filters] as const,
};

export const useRoles = (params: { current: number; pageSize: number; filter?: string; sort?: string }) => {
    return useQuery({
        queryKey: roleKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, filter, sort } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', (current - 1).toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);

            return axiosInstance.get<any, IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${queryParams.toString()}`);
        },
    });
};

export const useCreateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => axiosInstance.post('/api/v1/roles', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
        },
    });
};

export const useUpdateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => axiosInstance.put('/api/v1/roles', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
        },
    });
};

export const useDeleteRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => axiosInstance.delete(`/api/v1/roles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
        },
    });
};
