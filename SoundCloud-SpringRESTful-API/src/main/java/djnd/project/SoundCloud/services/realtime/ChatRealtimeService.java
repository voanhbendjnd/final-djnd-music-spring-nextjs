package djnd.project.SoundCloud.services.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import djnd.project.SoundCloud.domain.realtime.RoomChatMessage;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.hibernate.annotations.CurrentTimestamp;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.time.Duration;

import static djnd.project.SoundCloud.services.realtime.RoomsConstants.REDIS_CHAT_ROOM_KEY;

@Service
@RequiredArgsConstructor
public class ChatRealtimeService {
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate simpMessagingTemplate;
    public void saveContent(RoomChatMessage roomChatMessage) {
        try{
            var key_chat_room = REDIS_CHAT_ROOM_KEY + ":" + roomChatMessage.getRoomId();
            String value = this.objectMapper.writeValueAsString(roomChatMessage);
            this.stringRedisTemplate.opsForList().rightPush(key_chat_room,value);
            // save maximum 30 contents
            this.stringRedisTemplate.opsForList().trim(key_chat_room, -30, -1);
            this.stringRedisTemplate.expire(key_chat_room, Duration.ofMinutes(30));
        }
        catch(Exception e){
            throw new RuntimeException(e);
        }

    }


    public void handleChat(RoomChatMessage roomChatMessage, Principal principal) {
        var userId = Long.valueOf(principal.getName());
        var res = RoomChatMessage.builder()
                .roomId(roomChatMessage.getRoomId())
                .content(roomChatMessage.getContent())
                .sendAt(System.currentTimeMillis())
                .senderName(roomChatMessage.getSenderName())
                .senderId(userId)
                .build();
        this.saveContent(res);
        this.simpMessagingTemplate.convertAndSend("/topic/room/" + roomChatMessage.getRoomId() + "/chat", res);
    }
}