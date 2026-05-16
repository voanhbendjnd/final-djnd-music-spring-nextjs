import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface RoomState {
    roomId: number;
    currentTrackId: number | null;
    currentTime: number;
    isPlaying: boolean;
    hostUserId: number;
    version: number;
    updatedAt: number;
    connectedUserIds: number[];
    queue: number[]; // ✅ Thêm queue vào interface
}

export const useRoomSocket = (roomId: number, userId: number, token: string, options?: { onRoomDeleted?: () => void }) => {
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);

    // ✅ Stabilize callback để không gây re-render khi options object thay đổi
    const onRoomDeletedRef = useRef(options?.onRoomDeleted);
    useEffect(() => {
        onRoomDeletedRef.current = options?.onRoomDeleted;
    }, [options?.onRoomDeleted]);
    const requestSnapshot = useCallback((payload?: any) => {
        if (!stompClientRef.current?.connected) return;

        stompClientRef.current.publish({
            destination: `/app/room/${roomId}/snapshot`,
            body: JSON.stringify(payload ?? {}),
        });
    }, [roomId]);
    useEffect(() => {
        if (!token || token === 'undefined' || !roomId || roomId <= 0 || !userId || userId <= 0) {
            return;
        }
        if (stompClientRef.current?.connected) {
            return;
        }

        const client = new Client({
            webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080'}/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
        });

        client.onConnect = () => {
            setIsConnected(true);
// Subscribe personal queue để nhận snapshot riêng
            client.subscribe(`/user/queue/room-snapshot`, (message: IMessage) => {
                try {
                    const event = JSON.parse(message.body);
                    if (event.type === 'FULL_SNAPSHOT') {
                        setRoomState(event.payload);
                    }
                } catch (error) {
                    console.error('❌ Parse error:', error);
                }
            });

            client.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
                try {
                    const event = JSON.parse(message.body);

                    if (event.type === 'STATE_UPDATE' || event.type === 'FULL_SNAPSHOT') {
                        // ✅ Chỉ 2 loại này mới trigger full state update (và sync audio)
                        setRoomState(event.payload);

                    } else if (event.type === 'USER_JOIN') {
                        setRoomState(prev => {
                            if (!prev) return prev;
                            // event.payload là Set<Long> từ backend → deserialize thành array
                            return { ...prev, connectedUserIds: event.payload as number[] };
                        });
                    } else if (event.type === 'USER_LEAVE') {
                        // ✅ Tương tự — chỉ update connectedUserIds
                        setRoomState(prev => {
                            if (!prev) return prev;
                            const updatedState = event.payload; // full state từ backend
                            return {
                                ...prev,
                                connectedUserIds: updatedState.connectedUserIds,
                            };
                        });

                    } else if (event.type === 'ROOM_DELETED') {
                        onRoomDeletedRef.current?.();
                    }
                } catch (error) {
                    console.error('❌ Parse error:', error);
                }
            });

            // Request snapshot sau khi subscribe cả 2
            // client.publish({
            //     destination: `/app/room/${roomId}/snapshot`,
            //     body: JSON.stringify({})
            // });
            requestSnapshot();
        };

        client.onDisconnect = () => setIsConnected(false);
        client.onStompError = (frame) => console.error('❌ STOMP error:', frame.headers['message']);
        client.activate();
        stompClientRef.current = client;

        return () => {
            stompClientRef.current?.deactivate();
            stompClientRef.current = null;
        };
    }, [roomId, token, userId]); // ✅ options không còn trong deps

    const sendAction = useCallback((action: string, payload?: any) => {
        if (!stompClientRef.current?.connected) return;
        stompClientRef.current.publish({
            destination: `/app/room/${roomId}/${action}`,
            body: JSON.stringify(payload ?? {}),
        });
    }, [roomId]);

    const guardHostOnly = useCallback((action: string) => {
        const state = roomState; // read từ closure hiện tại
        if (state?.hostUserId !== userId) {
            console.warn(`🚫 Host-only action blocked:`, action);
            return false;
        }
        return true;
    }, [roomState, userId]);

    // ✅ Tất cả actions đều stable với useCallback
    const play = useCallback((trackId: number, time: number) => {
        if (!guardHostOnly('play')) return;
        sendAction('play', { currentTrackId: trackId, currentTime: time });
    }, [guardHostOnly, sendAction]);

    const pause = useCallback(() => {
        if (!guardHostOnly('pause')) return;
        sendAction('pause');
    }, [guardHostOnly, sendAction]);

    const seek = useCallback((time: number) => {
        if (!guardHostOnly('seek')) return;
        sendAction('seek', time);
    }, [guardHostOnly, sendAction]);

    const addToQueue = useCallback((trackId: number) => {
        // Gửi raw number, KHÔNG dùng sendAction vì sendAction có fallback về {}
        if (!stompClientRef.current?.connected) return;
        stompClientRef.current.publish({
            destination: `/app/room/${roomId}/queue/add`,
            body: String(trackId), // ← raw string của số, Jackson parse được thành Long
        });
    }, [roomId]);

    const removeFromQueue = useCallback((index: number) => {
        if (!guardHostOnly('queue/remove')) return;
        if (!stompClientRef.current?.connected) return;
        stompClientRef.current.publish({
            destination: `/app/room/${roomId}/queue/remove`,
            body: String(index), // ← raw "0", "1", etc.
        });
    }, [guardHostOnly, roomId]);

    const clearQueue = useCallback(() => {
        if (!guardHostOnly('queue/clear')) return;
        sendAction('queue/clear');
    }, [guardHostOnly, sendAction]);

    const leaveRoom = useCallback(() => {
        if (!stompClientRef.current?.connected) return;

        stompClientRef.current.publish({
            destination: `/app/room/${roomId}/leave`,
            body: '',
        });
    }, [roomId]);

    return { roomState, isConnected, play, pause, seek, addToQueue, removeFromQueue, clearQueue, leaveRoom };
};