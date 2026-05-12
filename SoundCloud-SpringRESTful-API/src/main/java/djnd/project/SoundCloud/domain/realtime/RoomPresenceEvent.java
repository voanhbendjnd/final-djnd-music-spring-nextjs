package djnd.project.SoundCloud.domain.realtime;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class RoomPresenceEvent extends ApplicationEvent {
    private final Long roomId;
    private final Long userId;
    private final Type type;

    public enum Type {
        JOIN, LEAVE
    }

    public RoomPresenceEvent(Object source, Long roomId, Long userId, Type type) {
        super(source);
        this.roomId = roomId;
        this.userId = userId;
        this.type = type;
    }
}
