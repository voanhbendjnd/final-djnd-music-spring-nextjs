package djnd.project.SoundCloud.controllers;

import djnd.project.SoundCloud.domain.realtime.RoomChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class RoomChatWebSocketController {
    @MessageMapping("/chat.send")
    public void sendContent(@Payload RoomChatMessage message, Principal principal) {

    }
}
