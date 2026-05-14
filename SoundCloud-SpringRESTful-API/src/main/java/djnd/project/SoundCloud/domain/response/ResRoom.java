package djnd.project.SoundCloud.domain.response;

import java.time.LocalDateTime;

import djnd.project.SoundCloud.domain.realtime.RoomRealtimeState;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResRoom {
    Long id;
    String name;
    Long hostUserId;
    String hostUserName;
    Boolean isPublic;
    LocalDateTime createdAt;
    String code;
    Integer listenerCount;
    RoomRealtimeState realtimeState;
}
