package djnd.project.SoundCloud.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import djnd.project.SoundCloud.domain.realtime.ListeningActivityEvent;
import djnd.project.SoundCloud.services.realtime.RoomsConstants;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
@Slf4j
public class NotificationAsyncService {
    final SimpMessagingTemplate simpMessagingTemplate;
    @Async("wsNotificationExecutor") // run other thread (separate)
    public void sendNotificationToFollowersAsync(List<Long > followerIds, ListeningActivityEvent payload)throws JsonProcessingException {
        followerIds.forEach(followerId -> {
            try{
                this.simpMessagingTemplate.convertAndSendToUser(
                        followerId.toString(),
                        RoomsConstants.WS_FOLLOWER_ACTIVITY_QUEUE,
                        payload
                );
            }
            catch (Exception e){
                log.error("Error send WS for user: {}", followerId, e);
            }

        });
    }
}
