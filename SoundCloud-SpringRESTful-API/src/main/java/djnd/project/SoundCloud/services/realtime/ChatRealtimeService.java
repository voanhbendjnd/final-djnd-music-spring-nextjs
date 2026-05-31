package djnd.project.SoundCloud.services.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import djnd.project.SoundCloud.domain.realtime.RoomChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

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
            // convert object to json
            String value = this.objectMapper.writeValueAsString(roomChatMessage);
            this.stringRedisTemplate.opsForList().rightPush(key_chat_room,value); // add last
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
                .senderAvatar(roomChatMessage.getSenderAvatar())
                .build();
        this.saveContent(res);
        this.simpMessagingTemplate.convertAndSend("/topic/room/" + roomChatMessage.getRoomId() + "/chat", res);
    }

    public List<RoomChatMessage> getHistoryChatForUserJoin(Long roomId){
        var key_chat_room = REDIS_CHAT_ROOM_KEY + ":" + roomId;
        // 0 start point, -1 end point
        var values = this.stringRedisTemplate.opsForList().range(key_chat_room, 0, -1);
        if(values == null || values.isEmpty()){
            return new ArrayList<>();
        }
        return values.stream().map(value -> {
            try{
                return this.objectMapper.readValue(value, RoomChatMessage.class);
            }catch(Exception e){
                throw new RuntimeException(e);
            }
        }).toList();
    }

    public void deleteConversation(Long roomId){
        this.stringRedisTemplate.delete(REDIS_CHAT_ROOM_KEY + ":" + roomId);
    }
}