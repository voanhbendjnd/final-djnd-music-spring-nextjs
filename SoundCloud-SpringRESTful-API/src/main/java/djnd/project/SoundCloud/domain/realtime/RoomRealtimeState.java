package djnd.project.SoundCloud.domain.realtime;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RoomRealtimeState — in-memory snapshot được giữ trong RoomStateManager.
 *
 * Thêm mới:
 * - {@code code} : mã phòng 6 ký tự (copy từ ListeningRoom khi khởi tạo state,
 * dùng để client hiển thị và search). Read-only sau khi set.
 * - {@code locked}: đã có, giữ nguyên.
 *
 * Không đổi gì ở phần presence / queue / version để không break các
 * WebSocket handler hiện tại.
 */
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomRealtimeState {

    Long roomId;
    Long currentTrackId;
    Double currentTime;
    Boolean isPlaying;
    Long hostUserId;

    /** Mã phòng 6 ký tự — copy từ ListeningRoom.code khi getOrCreateState() */
    String code;

    @Builder.Default
    Long version = 0L;

    @Builder.Default
    Long updatedAt = System.currentTimeMillis();

    @Builder.Default
    List<Long> queue = new ArrayList<>();

    /**
     * Khi locked = true, chỉ host mới có thể thay đổi state.
     * Listeners nhận broadcast bình thường nhưng không gửi được action.
     */
    @Builder.Default
    Boolean locked = false;

    // ─── Presence ──────────────────────────────────────────────────────────

    /** Thread-safe set — dùng ConcurrentHashMap.newKeySet() */
    @Builder.Default
    Set<Long> connectedUserIds = ConcurrentHashMap.newKeySet();

    // ─── Helpers ───────────────────────────────────────────────────────────

    public void incrementVersion() {
        this.version++;
        this.updatedAt = System.currentTimeMillis();
    }

    /** Convenience: kiểm tra userId có phải host không */
    public boolean isHost(Long userId) {
        return userId != null && userId.equals(this.hostUserId);
    }

    /** Convenience: kiểm tra queue còn track không */
    public boolean hasNextInQueue() {
        return queue != null && !queue.isEmpty();
    }

    /** Lấy track kế tiếp trong queue mà không remove */
    public Long peekNextTrack() {
        return hasNextInQueue() ? queue.get(0) : null;
    }
}