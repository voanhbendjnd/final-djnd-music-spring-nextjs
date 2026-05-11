'use client'

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "axios";



interface ILikesRes {
    statusCode: number;
    error: any;
    message: string;
    data: {
        meta: {
            page: number;
            pageSize: number;
            pages: number;
            total: number;
        };
        result: ITrack[];
    };
}

export const useLikes = () => {
    const { data: session } = useSession();

    const fetchLikes = async ({ pageParam = 1 }) => {
        const response = await axios.get<ILikesRes>(
            "http://localhost:8080/api/v1/tracks/likes",
            {
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                },
                params: {
                    page: pageParam,
                    size: 5
                }
            }
        );

        return {
            data: response.data.data.result,
            meta: response.data.data.meta,
            currentPage: pageParam
        };
    };

    return useInfiniteQuery({
        queryKey: ["likes"],
        queryFn: fetchLikes,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.currentPage < lastPage.meta.pages) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },
        enabled: !!session?.access_token
    });
};