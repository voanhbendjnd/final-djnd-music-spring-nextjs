import RoomClient from '@/components/room/RoomClient';
import { redirect } from 'next/navigation';
export default async function Page({ params }: { params: { id: string } }) {
    const roomId = Number(params.id);

    if (isNaN(roomId) || roomId <= 0) {
        redirect('/rooms/create');
    }

    let initialData = null;
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080'}/api/v1/rooms/${roomId}`,
            { cache: 'no-store', headers: { 'Content-Type': 'application/json' } }
        );

        if (res.ok) {
            const json = await res.json();
            initialData = json.data;
        }
    } catch (e) {
        console.error("Failed to fetch room metadata", e);
    }

    // Redirect nếu room không tồn tại thay vì pass null xuống client
    if (!initialData) {
        redirect('/rooms');
    }

    return <RoomClient roomId={roomId} initialData={initialData} />;
}