package djnd.project.SoundCloud.domain.realtime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomEvent {
    public enum Type {
        STATE_UPDATE, USER_JOIN, USER_LEAVE, HOST_TRANSFER, CHAT_MESSAGE, FULL_SNAPSHOT, ROOM_DELETED
    }

    Type type;
    Long roomId;
    Object payload; // Can be RoomRealtimeState or specific event data
    Long sentAt;
    String senderSessionId;
}
