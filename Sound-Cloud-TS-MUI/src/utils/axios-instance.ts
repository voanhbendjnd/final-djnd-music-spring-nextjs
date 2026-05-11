import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080',
    timeout: 300000,
});

let isRefreshing = false;
let failedQueue: any[] = [];

// Kênh truyền thông giữa các tabs
const refreshChannel = typeof window !== 'undefined' ? new BroadcastChannel('auth_refresh_channel') : null;

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Lắng nghe thông điệp từ các tabs khác
if (refreshChannel) {
    refreshChannel.onmessage = (event) => {
        if (event.data.type === 'REFRESH_SUCCESS') {
            processQueue(null, event.data.token);
        } else if (event.data.type === 'REFRESH_ERROR') {
            processQueue(new Error(event.data.error), null);
        }
    };
}

/**
 * Hàm xử lý refresh tập trung để dùng cho cả Request và Response Interceptor
 * Đảm bảo chỉ có duy nhất 1 yêu cầu refresh được thực thi tại một thời điểm (kể cả giữa các tab)
 */
const getValidToken = async () => {
    const refreshLockKey = 'next_auth_refresh_lock';
    
    // Kiểm tra khóa từ các tab khác qua localStorage (tránh race condition giữa các tab)
    const isLocked = () => {
        if (typeof window === 'undefined') return false;
        const lockTime = localStorage.getItem(refreshLockKey);
        return lockTime && Date.now() - parseInt(lockTime) < 10000; // Khóa trong 10s
    };

    // Nếu đang refresh ở tab này hoặc tab khác, đợi kết quả từ queue
    if (isRefreshing || isLocked()) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    // Đánh dấu đang refresh và đặt khóa
    isRefreshing = true;
    if (typeof window !== 'undefined') {
        localStorage.setItem(refreshLockKey, Date.now().toString());
    }

    try {
        // NextAuth sẽ tự động gọi JWT callback để refresh token khi getSession được gọi
        const updatedSession: any = await getSession();

        if (!updatedSession || !updatedSession.access_token || updatedSession.access_token === "undefined" || updatedSession.error === 'RefreshAccessTokenError') {
            const error = new Error(updatedSession?.error || 'Session refresh failed');
            refreshChannel?.postMessage({ type: 'REFRESH_ERROR', error: error.message });
            processQueue(error, null);
            throw error;
        }

        const newAccessToken = updatedSession.access_token;

        // Báo cho các tab khác biết đã refresh xong
        refreshChannel?.postMessage({ type: 'REFRESH_SUCCESS', token: newAccessToken });

        processQueue(null, newAccessToken);
        return newAccessToken;
    } catch (error: any) {
        refreshChannel?.postMessage({ type: 'REFRESH_ERROR', error: error.message });
        processQueue(error, null);
        throw error;
    } finally {
        isRefreshing = false;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(refreshLockKey);
        }
    }
};

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
    async (config) => {
        const publicEndpoints = [
            { url: '/api/v1/search', method: 'get' },
            { url: '/api/v1/tracks', method: 'get' },
        ];

        const isPublicEndpoint = publicEndpoints.some(endpoint =>
            config.url?.startsWith(endpoint.url) &&
            config.method === endpoint.method
        );

        const session: any = await getSession();

        if (!isPublicEndpoint && session?.access_token && session.access_token !== "undefined") {
            const tokenExpiryBuffer = 2 * 60 * 1000; // 2 phút
            const timeUntilExpiry = session.expires_in
                ? (session.expires_in * 1000 - Date.now())
                : Infinity;

            // Nếu token sắp hết hạn, thực hiện refresh tập trung
            if (timeUntilExpiry <= tokenExpiryBuffer) {
                try {
                    const token = await getValidToken();
                    config.headers.Authorization = `Bearer ${token}`;
                } catch (e) {
                    // Nếu lỗi refresh, dùng token cũ (nó sẽ fail ở response interceptor)
                    config.headers.Authorization = `Bearer ${session.access_token}`;
                }
            } else {
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
        } else {
            delete config.headers.Authorization;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling global errors and token refresh
axiosInstance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest._retry) {
            const res = error.response;
            if (res) {
                console.error(`API Error: ${res.status} - ${res.data?.message || error.message}`);
            }
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // Thực hiện refresh tập trung khi gặp lỗi 401
            const newToken = await getValidToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            console.error('Session refresh error:', refreshError);
            await signOut({ redirect: false });
            window.location.href = '/auth/signin';
            return Promise.reject(refreshError);
        }
    }
);

export default axiosInstance;