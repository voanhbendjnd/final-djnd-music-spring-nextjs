package djnd.project.SoundCloud.controllers;

import djnd.project.SoundCloud.domain.realtime.RoomChatMessage;
import djnd.project.SoundCloud.services.realtime.ChatRealtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class RoomChatWebSocketController {
    private final ChatRealtimeService chatRealtimeService;
    @MessageMapping("/chat.send")
    public void sendContent(@Payload RoomChatMessage message, Principal principal) {
        this.chatRealtimeService.handleChat(message, principal);
    }
}
