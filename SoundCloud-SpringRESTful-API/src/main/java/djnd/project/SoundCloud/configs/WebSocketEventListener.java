package djnd.project.SoundCloud.configs;

import djnd.project.SoundCloud.domain.realtime.RoomPresenceEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final ApplicationEventPublisher eventPublisher;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        // We also need to know which room they were in. 
        // We can store roomId in session attributes during SUBSCRIBE.
        Long roomId = (Long) headerAccessor.getSessionAttributes().get("roomId");
        
        if (userId != null && roomId != null) {
            log.info("User {} disconnected from room {}", userId, roomId);
            eventPublisher.publishEvent(new RoomPresenceEvent(this, roomId, userId, RoomPresenceEvent.Type.LEAVE));
        }
    }
}
