

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // ← điều chỉnh path nếu khác
import RoomClient from '@/components/room/RoomClient';
import { redirect } from 'next/navigation';
import type {Metadata, ResolvingMetadata} from "next";
import {sendRequest} from "@/utils/api";
interface IProps {
    params: {
        slug: string;
    }
}


type Props = {
    params: { slug: string }
}
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {

    const roomId = params.slug.split('-')[0];

    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/rooms/${roomId}`,
            {
                cache: 'no-store'
            }
        );

        if (!res.ok) {
            return {
                title: 'Room not found'
            };
        }

        const json = await res.json();

        const room: IRoomMeta = json.data;

        return {
            title: `Listening to music in room ${room.name} together with everyone`,
            description: `Enjoy music together in ${room.name}`,
            openGraph: {
                title: room.name,
                description: `Join room ${room.name}`,
                type: 'website',
                images: [
                    'https://github.com/voanhbendjnd/sharing-host-files/blob/master/DjndMusic/images/genshin-impact-lumine-5k-8k-1920x1080-5163.jpg?raw=true'
                ],
            }
        };

    } catch (e) {
        return {
            title: 'Room'
        };
    }
}
const RoomDetailPage = async ({ params }: IProps) => {
    const { slug } = params;
    const roomId = parseInt(slug.split('-')[0]);

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

    let initialData: IRoomMeta | null = null;
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
        redirect('/room');
    }

    // Server error nghiêm trọng → redirect
    if (fetchError === 'server_error' && !initialData) {
        redirect('/room');
    }

    // initialData có thể null nếu room private và chưa authed.
    // RoomClient xử lý luôn trường hợp này bằng JoinRoomModal.
    return <RoomClient roomId={roomId} initialData={initialData!} />;
}

// ─── Kiểu dữ liệu trả về từ backend ResRoom ─────────────────────────────────
// Khớp với các field trong ListeningRoom entity + RoomRealtimeState

export  default  RoomDetailPage;

