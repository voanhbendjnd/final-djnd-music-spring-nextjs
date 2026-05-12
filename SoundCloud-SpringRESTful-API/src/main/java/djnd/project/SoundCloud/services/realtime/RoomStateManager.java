package djnd.project.SoundCloud.services.realtime;

import djnd.project.SoundCloud.domain.realtime.RoomEvent;
import djnd.project.SoundCloud.domain.realtime.RoomRealtimeState;
import djnd.project.SoundCloud.domain.realtime.RoomPresenceEvent;
import djnd.project.SoundCloud.repositories.RoomRepository;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomStateManager {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomRepository roomRepository;
    // Local cache of room states active on THIS instance
    private final Map<Long, RoomRealtimeState> localRoomStates = new ConcurrentHashMap<>();

    // Topic for Redis Pub/Sub
    private static final String REDIS_ROOM_TOPIC = "room_events";

    @EventListener
    public void handlePresenceEvent(RoomPresenceEvent event) {
        if (event.getType() == RoomPresenceEvent.Type.JOIN) {
            addUser(event.getRoomId(), event.getUserId());
        } else {
            removeUser(event.getRoomId(), event.getUserId());
        }
    }

    /**
     * Get room state
     */
    public RoomRealtimeState getRoomState(Long roomId) {
        return localRoomStates.get(roomId);
    }

    /**
     * Get or initialize room state with a specific host
     */
    public RoomRealtimeState getOrCreateState(Long roomId, Long initialHostId) {
        return localRoomStates.computeIfAbsent(roomId, id -> RoomRealtimeState.builder()
                .roomId(id)
                .hostUserId(initialHostId)
                .isPlaying(false)
                .currentTime(0.0)
                .updatedAt(System.currentTimeMillis())
                .build());
    }

    /**
     * Update room state and broadcast
     */
    public void updateState(RoomRealtimeState newState, String sessionId) {
        localRoomStates.put(newState.getRoomId(), newState);

        RoomEvent event = RoomEvent.builder()
                .type(RoomEvent.Type.STATE_UPDATE)
                .roomId(newState.getRoomId())
                .payload(newState)
                .sentAt(System.currentTimeMillis())
                .senderSessionId(sessionId)
                .build();

        broadcast(event);
    }

    /**
     * Handle user joining a room
     */
    public void addUser(Long roomId, Long userId) {
        RoomRealtimeState state = localRoomStates.get(roomId);
        if (state != null) {
            state.getConnectedUserIds().add(userId);

            RoomEvent event = RoomEvent.builder()
                    .type(RoomEvent.Type.USER_JOIN)
                    .roomId(roomId)
                    .payload(userId)
                    .sentAt(System.currentTimeMillis())
                    .build();
            broadcast(event);
        }
    }

    /**
     * Handle user leaving and potential host transfer
     */
    public void removeUser(Long roomId, Long userId) {
        if (!this.roomRepository.existsById(roomId)) {
            throw new ResourceNotFoundException("Room ID", roomId);
        }
        RoomRealtimeState state = localRoomStates.get(roomId);
        if (state != null) {
            state.getConnectedUserIds().remove(userId);

            // If host leaves, delete the room and notify everyone
            if (userId.equals(state.getHostUserId())) {

                // 1. Mark room as inactive in Database
                // roomRepository.findById(roomId).ifPresent(room -> {
                // room.setIsActive(false);
                // roomRepository.save(room);
                // });

                this.roomRepository.deleteById(roomId);
                // 2. Remove from memory
                localRoomStates.remove(roomId);

                // 3. Notify everyone
                RoomEvent deleteEvent = RoomEvent.builder()
                        .type(RoomEvent.Type.ROOM_DELETED)
                        .roomId(roomId)
                        .payload("Host has left the room")
                        .sentAt(System.currentTimeMillis())
                        .build();
                broadcast(deleteEvent);
                return; // Room is gone
            }

            RoomEvent leaveEvent = RoomEvent.builder()
                    .type(RoomEvent.Type.USER_LEAVE)
                    .roomId(roomId)
                    .payload(userId)
                    .sentAt(System.currentTimeMillis())
                    .build();
            broadcast(leaveEvent);
        }
    }

    /**
     * Broadcast event via Redis (for other instances) and WebSocket (for local
     * clients)
     */
    public void broadcast(RoomEvent event) {
        // 1. Publish to Redis for cross-instance sync
        redisTemplate.convertAndSend(REDIS_ROOM_TOPIC, event);

        // 2. Push to local WebSocket subscribers
        messagingTemplate.convertAndSend("/topic/room/" + event.getRoomId(), event);
    }

    /**
     * Handle events received from Redis (published by other instances)
     */
    public void handleRedisEvent(RoomEvent event) {
        log.debug("Received Redis event: {} for room {}", event.getType(), event.getRoomId());

        if (event.getType() == RoomEvent.Type.STATE_UPDATE) {
            RoomRealtimeState remoteState = (RoomRealtimeState) event.getPayload();
            RoomRealtimeState localState = localRoomStates.get(event.getRoomId());

            if (localState == null || remoteState.getVersion() > localState.getVersion()) {
                localRoomStates.put(event.getRoomId(), remoteState);
                // Also notify local WS clients that were NOT the sender
                messagingTemplate.convertAndSend("/topic/room/" + event.getRoomId(), event);
            }
        } else {
            // Forward other events to local WS clients
            messagingTemplate.convertAndSend("/topic/room/" + event.getRoomId(), event);
        }
    }

    /**
     * Cleanup inactive rooms to prevent memory leaks
     */
    @Scheduled(fixedRate = 600000) // Every 10 minutes
    public void cleanupInactiveRooms() {
        long now = System.currentTimeMillis();
        localRoomStates.entrySet().removeIf(entry -> {
            RoomRealtimeState state = entry.getValue();
            // Remove if no users and inactive for > 1 hour
            return state.getConnectedUserIds().isEmpty() && (now - state.getUpdatedAt() > 3600000);
        });
    }
}
