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

    @Builder.Default
    Long version = 0L;

    @Builder.Default
    Long updatedAt = System.currentTimeMillis();

    @Builder.Default
    List<Long> queue = new ArrayList<>();

    @Builder.Default
    Boolean locked = false;

    // Presence management
    @Builder.Default
    Set<Long> connectedUserIds = ConcurrentHashMap.newKeySet();

    public void incrementVersion() {
        this.version++;
        this.updatedAt = System.currentTimeMillis();
    }
}
