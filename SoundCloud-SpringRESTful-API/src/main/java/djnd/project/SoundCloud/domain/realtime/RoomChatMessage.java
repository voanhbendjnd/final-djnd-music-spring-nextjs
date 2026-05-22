package djnd.project.SoundCloud.domain.realtime;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomChatMessage {
    Long roomId;
    Long senderId;
    Long sendAt;
    String senderName;
    String content;
    String senderAvatar;


}
