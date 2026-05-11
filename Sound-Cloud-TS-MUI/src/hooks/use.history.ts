'use client'

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "axios";

interface IHistory {
    id: number;
    title: string;
    trackUrl: string;
    uploader: string;
    countLikes: number;
    countPlays: number;
    imgUrl: string;
}

interface IHistoryRes {
    statusCode: number;
    error: any;
    message: string;
    data: IHistory[];
}

export const useHistory = () => {
    const { data: session } = useSession();

    const fetchHistory = async ({ pageParam }: { pageParam: number }) => {
        if (!session?.access_token) {
            throw new Error("No authentication token");
        }

        const response = await axios.get<IHistoryRes>(
            "http://localhost:8080/api/v1/histories",
            {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                },
                params: {
                    page: pageParam,
                    size: 5
                }
            }
        );

        return {
            data: response.data.data,
            nextPage: pageParam + 1,
            currentPage: pageParam
        };
    };

    return useInfiniteQuery({
        queryKey: ["history"],
        queryFn: fetchHistory,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: !!session?.access_token
    });
};
