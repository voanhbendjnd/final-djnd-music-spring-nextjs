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

    /**
     * /room/{roomId}/snapshot
     *
     * Bug cũ:
     * 1. Đọc currentTrackId/currentTime từ payload client gửi lên (client chỉ gửi
     * {})
     * → NullPointerException tại ((Number)
     * payload.get("currentTime")).doubleValue()
     * 2. Overwrite state bằng data rỗng từ client → host bị reset về track null
     * 3. Luôn setIsPlaying(true) dù host đang pause
     *
     * Fix:
     * - Chỉ thêm userId vào connectedUserIds nếu chưa có
     * - updateCurrentTime để tính đúng elapsed trước khi gửi snapshot
     * - Gửi FULL_SNAPSHOT về state HIỆN TẠI của room cho người join
     * - Broadcast USER_JOIN với set connectedUserIds đã update
     * - KHÔNG đụng vào currentTrackId / currentTime / isPlaying
     */
    @MessageMapping("/room/{roomId}/snapshot")
    public void requestSnapshot(
            @DestinationVariable("roomId") Long roomId,
            SimpMessageHeaderAccessor headerAccessor,
            @Payload(required = false) Map<String, Object> payload) { // ← required=false tránh lỗi nếu body rỗng

        String sessionId = headerAccessor.getSessionId();
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");

        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null) {
            log.warn("[snapshot] Room state not found for room: {}", roomId);
            return;
        }

        // [DEBUG-snap1] log để verify fix
        log.info("[DEBUG-snap1] snapshot request — room={} userId={} currentTrack={} isPlaying={}",
                roomId, userId, state.getCurrentTrackId(), state.getIsPlaying());

        boolean isNewUser = userId != null && !state.getConnectedUserIds().contains(userId);

        if (isNewUser) {
            state.getConnectedUserIds().add(userId);
            // KHÔNG increment version ở đây — chưa có state change thực sự
        }

        // Cập nhật currentTime theo thời gian thực trước khi gửi snapshot
        // để người join nhận đúng vị trí playback hiện tại
        updateCurrentTimeBeforeBroadcast(state);

        // Gửi FULL_SNAPSHOT riêng cho session này (personal queue)
        // Payload là state hiện tại — KHÔNG modified bởi client
        roomStateManager.sendToSession(sessionId, RoomEvent.builder()
                .type(RoomEvent.Type.FULL_SNAPSHOT)
                .roomId(roomId)
                .payload(state)
                .sentAt(System.currentTimeMillis())
                .build());

        log.info("[DEBUG-snap1] FULL_SNAPSHOT sent to session={} — track={} time={}s playing={}",
                sessionId, state.getCurrentTrackId(), state.getCurrentTime(), state.getIsPlaying());

        // Broadcast USER_JOIN để các client khác cập nhật listener count
        if (isNewUser) {
            state.incrementVersion();
            roomStateManager.broadcast(RoomEvent.builder()
                    .type(RoomEvent.Type.USER_JOIN)
                    .roomId(roomId)
                    .payload(state.getConnectedUserIds()) // chỉ gửi Set<Long> — nhẹ hơn full state
                    .sentAt(System.currentTimeMillis())
                    .build());

            log.info("[DEBUG-snap1] USER_JOIN broadcast — room={} totalUsers={}",
                    roomId, state.getConnectedUserIds().size());
        }
    }

    @MessageMapping("/room/{roomId}/play")
    public void handlePlay(@DestinationVariable("roomId") Long roomId, @Payload Map<String, Object> payload,
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
        Double time = payload.get("currentTime") != null
                ? ((Number) payload.get("currentTime")).doubleValue()
                : 0.0;

        state.setCurrentTrackId(trackId != null ? trackId.longValue() : null);
        state.setCurrentTime(time);
        state.setIsPlaying(true);
        state.incrementVersion();
        state.setUpdatedAt(System.currentTimeMillis());

        log.info("▶️ Room {} playing track {} at {}s", roomId, trackId, time);
        roomStateManager.updateState(state, sessionId);
    }

    @MessageMapping("/room/{roomId}/pause")
    public void handlePause(@DestinationVariable("roomId") Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();

        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null)
            return;

        if (!state.getHostUserId().equals(userId)) {
            log.warn("🚫 Unauthorized Pause: User {} is NOT the host ({}) of room {}", userId, state.getHostUserId(),
                    roomId);
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
    public void handleSeek(@DestinationVariable("roomId") Long roomId, @Payload Double time,
            SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();

        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null || !state.getHostUserId().equals(userId))
            return;

        state.setCurrentTime(time);
        state.incrementVersion();
        state.setUpdatedAt(System.currentTimeMillis());

        log.info("Room {} seeked to {}s", roomId, time);
        roomStateManager.updateState(state, sessionId);
    }

    @MessageMapping("/room/{roomId}/queue/add")
    public void handleQueueAdd(@DestinationVariable("roomId") Long roomId, @Payload Long trackId,
            SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");

        RoomRealtimeState state = roomStateManager.getRoomState(roomId);
        if (state == null) {
            log.warn("Room {} not found for queue add", roomId);
            return;
        }

        updateCurrentTimeBeforeBroadcast(state);
        log.info("User {} adding track {} to room {} queue", userId, trackId, roomId);

        if (state.getCurrentTrackId() == null) {
            log.info("Auto-starting playback with track {} as room was idle", trackId);
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
    public void handleQueueRemove(@DestinationVariable("roomId") Long roomId, @Payload Integer index,
            SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();
        RoomRealtimeState state = roomStateManager.getRoomState(roomId);

        if (state == null || !state.getHostUserId().equals(userId)) {
            log.warn("User {} cannot remove from queue in room {}", userId, roomId);
            return;
        }

        if (index >= 0 && index < state.getQueue().size()) {
            updateCurrentTimeBeforeBroadcast(state);
            Long removedTrack = state.getQueue().remove(index.intValue());
            log.info("Removed track {} from queue at index {}", removedTrack, index);
            state.incrementVersion();
            roomStateManager.updateState(state, sessionId);
        }
    }

    @MessageMapping("/room/{roomId}/queue/clear")
    public void handleQueueClear(@DestinationVariable("roomId") Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String sessionId = headerAccessor.getSessionId();
        RoomRealtimeState state = roomStateManager.getRoomState(roomId);

        if (state == null || !state.getHostUserId().equals(userId))
            return;

        updateCurrentTimeBeforeBroadcast(state);
        state.getQueue().clear();
        log.info("Cleared queue for room {}", roomId);
        state.incrementVersion();
        roomStateManager.updateState(state, sessionId);
    }

    @MessageMapping("/room/{roomId}/leave")
    public void handleLeave(@DestinationVariable("roomId") Long roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        roomStateManager.removeUser(roomId, userId, true);
    }

    /**
     * Cộng dồn elapsed time vào currentTime trước khi broadcast.
     * Đảm bảo người join nhận đúng vị trí playback thực tế,
     * không phải vị trí tại thời điểm host play/seek lần cuối.
     */
    private void updateCurrentTimeBeforeBroadcast(RoomRealtimeState state) {
        if (Boolean.TRUE.equals(state.getIsPlaying()) && state.getUpdatedAt() != null) {
            long now = System.currentTimeMillis();
            double elapsed = (now - state.getUpdatedAt()) / 1000.0;
            state.setCurrentTime(state.getCurrentTime() + elapsed);
            state.setUpdatedAt(now);
        }
    }
}