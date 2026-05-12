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

    useEffect(() => {
        if (!token || token === 'undefined' || !roomId || roomId <= 0 || !userId || userId <= 0) {
            console.warn('❌ Skipping WebSocket - invalid params');
            return;
        }

        if (stompClientRef.current?.connected) {
            console.log('✅ Already connected, skipping reconnect');
            return;
        }

        console.log('🔌 Connecting to room:', roomId);

        const client = new Client({
            webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080'}/ws`),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                // console.log('STOMP:', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
        });

        client.onConnect = () => {
            console.log('✅ Connected to room', roomId);
            setIsConnected(true);

            // Automatically request current room state upon joining
            client.publish({
                destination: `/app/room/${roomId}/snapshot`
            });

            // Subscribe to room state updates
            client.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
                console.log('📨 Received message:', message.body);
                try {
                    const event = JSON.parse(message.body);

                    if (event.type === 'STATE_UPDATE' || event.type === 'FULL_SNAPSHOT') {
                        console.log('📡 Updating room state:', event.payload);
                        setRoomState(event.payload);
                    } else if (event.type === 'USER_JOIN') {
                        console.log('👤 User joined:', event.payload);
                    } else if (event.type === 'USER_LEAVE') {
                        console.log('👋 User left:', event.payload);
                    } else if (event.type === 'ROOM_DELETED') {
                        console.warn('⚠️ Room deleted by host');
                        if (options?.onRoomDeleted) options.onRoomDeleted();
                    }
                } catch (error) {
                    console.error('❌ Parse error:', error);
                }
            });

            // Request initial state
            console.log('📸 Requesting initial snapshot...');
            client.publish({
                destination: `/app/room/${roomId}/snapshot`,
                body: JSON.stringify({})
            });
        };

        client.onDisconnect = () => {
            console.log('🔌 Disconnected');
            setIsConnected(false);
        };

        client.onStompError = (frame) => {
            console.error('❌ STOMP error:', frame.headers['message']);
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            console.log('🔌 Cleaning up WebSocket');
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [roomId, token, userId]);

    const sendAction = useCallback((action: string, payload?: any) => {
        if (!stompClientRef.current?.connected) {
            console.warn('❌ WebSocket not connected');
            return;
        }

        const destination = `/app/room/${roomId}/${action}`;
        console.log('📤 Sending:', { destination, payload });

        stompClientRef.current.publish({
            destination,
            body: JSON.stringify(payload || {}),
        });
    }, [roomId]);

    const isHost = roomState?.hostUserId === userId;
    const canControl = isHost;

    const guardHostOnly = useCallback((action: string) => {
        if (!canControl) {
            console.warn(`🚫 Host-only action blocked for user ${userId}:`, action);
            return false;
        }
        return true;
    }, [canControl, userId]);

    return {
        roomState,
        isConnected,
        play: (trackId: number, time: number) => {
            if (!guardHostOnly('play')) return;
            sendAction('play', { currentTrackId: trackId, currentTime: time });
        },
        pause: () => {
            if (!guardHostOnly('pause')) return;
            sendAction('pause');
        },
        seek: (time: number) => {
            if (!guardHostOnly('seek')) return;
            sendAction('seek', time);
        },
        addToQueue: (trackId: number) => {
            console.log('➕ Client: Requesting to add track to queue:', trackId);
            sendAction('queue/add', trackId);
        },
        removeFromQueue: (index: number) => {
            if (!guardHostOnly('queue/remove')) return;
            sendAction('queue/remove', index);
        },
        clearQueue: () => {
            if (!guardHostOnly('queue/clear')) return;
            sendAction('queue/clear');
        },
        leaveRoom: () => {
            console.log('👋 Client: Requesting to leave room');
            sendAction('leave');
        }
    };
};