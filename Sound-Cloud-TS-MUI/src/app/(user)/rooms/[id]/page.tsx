import RoomClient from '@/components/room/RoomClient';
import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: { id: string } }) {
    const roomId = Number(params.id);

    // Validate roomId
    if (isNaN(roomId) || roomId <= 0) {
        console.error('Invalid roomId:', params.id);
        redirect('/rooms/create');
    }

    // Initial fetch for room metadata
    let initialData = null;
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080'}/api/v1/rooms/${roomId}`,
            {
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (res.ok) {
            const json = await res.json();
            initialData = json.data;
        } else {
            console.error('Room not found:', roomId);
        }
    } catch (e) {
        console.error("Failed to fetch room metadata", e);
    }

    return (
        <RoomClient
            roomId={roomId}
            initialData={initialData}
        />
    );
}