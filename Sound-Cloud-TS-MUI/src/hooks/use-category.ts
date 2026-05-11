import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';

export const categoryKeys = {
    all: ['categories'] as const,
    lists: () => [...categoryKeys.all, 'list'] as const,
    list: (filters: any) => [...categoryKeys.lists(), filters] as const,
};

export const useCategories = (params: { current: number; pageSize: number; filter?: string; sort?: string }) => {
    return useQuery({
        queryKey: categoryKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, filter, sort } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', current.toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);

            return axiosInstance.get<any, IBackendRes<IModelPaginate<ICategory>>>(`/api/v1/categories?${queryParams.toString()}`);
        },
    });
};

export const useAllCategories = () => {
    return useQuery({
        queryKey: [...categoryKeys.all, 'data'],
        queryFn: () => axiosInstance.get<any, IBackendRes<ICategory[]>>('/api/v1/categories/data'),
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description: string }) => 
            axiosInstance.post('/api/v1/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: number; name: string; description: string }) => 
            axiosInstance.patch(`/api/v1/categories`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/api/v1/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
        },
    });
};
