package djnd.project.SoundCloud.controllers;

import djnd.project.SoundCloud.domain.realtime.RoomEvent;
import djnd.project.SoundCloud.domain.realtime.RoomRealtimeState;
import djnd.project.SoundCloud.services.realtime.RoomStateManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class RoomWebSocketController {

    private final RoomStateManager roomStateManager;

    @MessageMapping("/room/{roomId}/snapshot")
    public void requestSnapshot(@DestinationVariable Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        log.info("📸 Snapshot requested for room: {}", roomId);
        RoomRealtimeState state = roomStateManager.getRoomState(roomId);

        if (state != null) {
            updateCurrentTimeBeforeBroadcast(state);
            roomStateManager.broadcast(RoomEvent.builder()
                    .type(RoomEvent.Type.FULL_SNAPSHOT)
                    .roomId(roomId)
                    .payload(state)
                    .sentAt(System.currentTimeMillis())
                    .build());
        } else {
            log.warn("⚠️ Room state not found for room: {}", roomId);
        }
    }

    @MessageMapping("/room/{roomId}/play")
    public void handlePlay(@DestinationVariable Long roomId, @Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();

        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null) {
            log.warn("⚠️ Room {} not found", roomId);
            return;
        }

        if (!state.getHostUserId().equals(userId)) {
            log.warn("🚫 Unauthorized: User {} is NOT the host ({}) of room {}", userId, state.getHostUserId(), roomId);
            return;
        }

        Integer trackId = (Integer) payload.get("currentTrackId");
        Double time = ((Number) payload.get("currentTime")).doubleValue();

        state.setCurrentTrackId(trackId != null ? trackId.longValue() : null);
        state.setCurrentTime(time);
        state.setIsPlaying(true);
        state.incrementVersion();
        state.setUpdatedAt(System.currentTimeMillis());

        log.info("▶️ Room {} playing track {} at {}s", roomId, trackId, time);
        roomStateManager.updateState(state, sessionId);
    }

    @MessageMapping("/room/{roomId}/pause")
    public void handlePause(@DestinationVariable Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();

        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null) return;
        
        if (!state.getHostUserId().equals(userId)) {
            log.warn("🚫 Unauthorized Pause: User {} is NOT the host ({}) of room {}", userId, state.getHostUserId(), roomId);
            return;
        }

        updateCurrentTimeBeforeBroadcast(state);
        state.setIsPlaying(false);
        state.incrementVersion();
        state.setUpdatedAt(System.currentTimeMillis());

        log.info("⏸️ Room {} paused at {}s", roomId, state.getCurrentTime());
        roomStateManager.updateState(state, sessionId);
    }

    @MessageMapping("/room/{roomId}/seek")
    public void handleSeek(@DestinationVariable Long roomId, @Payload Double time,
            SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();

        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null || !state.getHostUserId().equals(userId)) {
            return;
        }

        state.setCurrentTime(time);
        state.incrementVersion();
        state.setUpdatedAt(System.currentTimeMillis());

        log.info("⏩ Room {} seeked to {}s", roomId, time);
        roomStateManager.updateState(state, sessionId);
    }

    @MessageMapping("/room/{roomId}/queue/add")
    public void handleQueueAdd(@DestinationVariable Long roomId, @Payload Long trackId,
            SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");

        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null) {
            log.warn("⚠️ Room {} not found for queue add", roomId);
            return;
        }

        updateCurrentTimeBeforeBroadcast(state);

        log.info("➕ User {} adding track {} to room {} queue", userId, trackId, roomId);

        // If nothing is playing, this track becomes the active track
        if (state.getCurrentTrackId() == null) {
            log.info("🎵 Auto-starting playback with track {} as room was idle", trackId);
            state.setCurrentTrackId(trackId);
            state.setCurrentTime(0.0);
            state.setIsPlaying(true);
            state.setUpdatedAt(System.currentTimeMillis());
        } else {
            state.getQueue().add(trackId);
        }

        state.incrementVersion();
        roomStateManager.updateState(state, sessionId);
    }

    @MessageMapping("/room/{roomId}/queue/remove")
    public void handleQueueRemove(@DestinationVariable Long roomId, @Payload Integer index,
            SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();
        RoomRealtimeState state = roomStateManager.getRoomState(roomId);

        if (state == null || !state.getHostUserId().equals(userId)) {
            log.warn("🚫 User {} cannot remove from queue in room {}", userId, roomId);
            return;
        }

        if (index >= 0 && index < state.getQueue().size()) {
            updateCurrentTimeBeforeBroadcast(state);
            Long removedTrack = state.getQueue().remove(index.intValue());
            log.info("➖ Removed track {} from queue at index {}", removedTrack, index);
            state.incrementVersion();
            roomStateManager.updateState(state, sessionId);
        }
    }

    @MessageMapping("/room/{roomId}/queue/clear")
    public void handleQueueClear(@DestinationVariable Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();
        RoomRealtimeState state = roomStateManager.getRoomState(roomId);

        if (state == null || !state.getHostUserId().equals(userId)) {
            return;
        }

        updateCurrentTimeBeforeBroadcast(state);
        state.getQueue().clear();
        log.info("🧹 Cleared queue for room {}", roomId);
        state.incrementVersion();
        roomStateManager.updateState(state, sessionId);
    }

    @MessageMapping("/room/{roomId}/leave")
    public void handleLeave(@DestinationVariable Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        log.info("👋 User {} explicitly leaving room {}", userId, roomId);
        roomStateManager.removeUser(roomId, userId);
    }

    private void updateCurrentTimeBeforeBroadcast(RoomRealtimeState state) {
        if (state.getIsPlaying() && state.getUpdatedAt() != null) {
            long now = System.currentTimeMillis();
            double elapsed = (now - state.getUpdatedAt()) / 1000.0;
            state.setCurrentTime(state.getCurrentTime() + elapsed);
            state.setUpdatedAt(now);
        }
    }
}