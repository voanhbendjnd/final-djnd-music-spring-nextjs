/**
 * app/rooms/[id]/page.tsx
 *
 * Thay đổi so với bản cũ:
 * 1. Fetch có auth header (lấy session server-side qua next-auth getServerSession)
 *    → private room không còn bị 401 redirect trước khi client verify password
 * 2. Truyền `code` từ initialData xuống RoomClient để hiển thị / copy
 * 3. Phân biệt rõ 3 trường hợp: room không tồn tại, lỗi mạng, room private chưa auth
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // ← điều chỉnh path nếu khác
import RoomClient from '@/components/room/RoomClient';
import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: { id: string } }) {
    const roomId = Number(params.id);

    if (isNaN(roomId) || roomId <= 0) {
        redirect('/rooms/create');
    }

    // Lấy session server-side để gắn Authorization header
    const session = await getServerSession(authOptions);
    const token = session?.access_token;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let initialData: RoomMeta | null = null;
    let fetchError: 'not_found' | 'server_error' | null = null;

    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080'}/api/v1/rooms/${roomId}`,
            { cache: 'no-store', headers }
        );

        if (res.status === 404) {
            fetchError = 'not_found';
        } else if (!res.ok) {
            // 401/403 với private room chưa login → vẫn truyền xuống client,
            // RoomClient sẽ show JoinRoomModal để verify password
            // Chỉ redirect nếu thực sự 500/network error
            fetchError = 'server_error';
        } else {
            const json = await res.json();
            initialData = json.data;
        }
    } catch (e) {
        console.error('Failed to fetch room metadata', e);
        fetchError = 'server_error';
    }

    // Room không tồn tại → redirect
    if (fetchError === 'not_found') {
        redirect('/rooms');
    }

    // Server error nghiêm trọng → redirect
    if (fetchError === 'server_error' && !initialData) {
        redirect('/rooms');
    }

    // initialData có thể null nếu room private và chưa authed.
    // RoomClient xử lý luôn trường hợp này bằng JoinRoomModal.
    return <RoomClient roomId={roomId} initialData={initialData} />;
}

// ─── Kiểu dữ liệu trả về từ backend ResRoom ─────────────────────────────────
// Khớp với các field trong ListeningRoom entity + RoomRealtimeState

interface RoomMeta {
    id: number;
    name: string;
    code: string;           // ← mã phòng 6 ký tự, dùng để tìm kiếm / share
    isPublic: boolean;
    isActive: boolean;
    hostUserId: number;
    maxListeners: number;
    createdAt: string;
}