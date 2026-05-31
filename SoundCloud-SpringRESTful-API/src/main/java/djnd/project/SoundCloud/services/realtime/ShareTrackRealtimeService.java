package djnd.project.SoundCloud.services.realtime;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import djnd.project.SoundCloud.domain.entity.TrackLike;
import djnd.project.SoundCloud.domain.realtime.ListeningActivityEvent;
import djnd.project.SoundCloud.repositories.FollowRepository;
import djnd.project.SoundCloud.repositories.TrackLikeRepository;
import djnd.project.SoundCloud.services.NotificationAsyncService;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.HandleIllegalArgumentException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.security.Principal;
import java.time.Duration;
import java.util.*;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
@Slf4j
public class ShareTrackRealtimeService {
    final SimpMessagingTemplate simpMessagingTemplate;
    final FollowRepository followRepository;
    final ObjectMapper objectMapper;
    final StringRedisTemplate stringRedisTemplate;
    final TrackLikeRepository trackLikeRepository;
    final NotificationAsyncService notificationAsyncService;
    public void postStateByFollowing(ListeningActivityEvent event, Principal principal)throws JsonProcessingException {
        var followingId = Long.valueOf(principal.getName());
        var followerIds = this.followRepository.fetchAllIdFollowersByFollowingId(followingId);
        var payload = this.getPayloadListeningEvent(event);
        this.notificationAsyncService.sendNotificationToFollowersAsync(followerIds, payload);
        this.saveKeyFollowingActivity(payload, followingId);

        log.info("{} posted state by following {}", event.getFollowingId(), followerIds);
    }


    public void saveKeyFollowingActivity(ListeningActivityEvent event, Long userId) throws JsonProcessingException {
        var key = RoomsConstants.REDIS_FOLLOWING_ACTIVITY_KEY + ":" + userId;
        event.setIsFollowed(true);
        event.setIsLiked(this.trackLikeRepository.existsByUserIdAndTrackId(event.getFollowingTrackId(), userId));
        var value = this.objectMapper.writeValueAsString(event);

        this.stringRedisTemplate.opsForValue().set(key, value, Duration.ofMinutes(10));
    }

    public List<ListeningActivityEvent> getAllFollowingActivity(){
        var followerId = SecurityUtils.getCurrentUserIdOrNull();
        if(followerId == null){
            throw new HandleIllegalArgumentException("No current user found");
        }
        var followingIds = this.followRepository.fetchAllIdFollowingsByFollowerId(followerId);
        if(followingIds.isEmpty()){
            return new ArrayList<>();
        }
        var keys = followingIds.stream().map(x -> RoomsConstants.REDIS_FOLLOWING_ACTIVITY_KEY + ":" + x).toList();
        var values = this.stringRedisTemplate.opsForValue().multiGet(keys);
        if(values == null || values.isEmpty()){
            return new  ArrayList<>();
        }
        return values.stream().filter(Objects::nonNull).map(value ->{
            try{
                return this.objectMapper.readValue(value, ListeningActivityEvent.class);
            }
            catch(Exception e){
                return null;
            }
        }).filter(Objects::nonNull)
                .sorted((a, b) -> Long.compare(b.getStartedAt(), a.getStartedAt())).toList();


    }


    public void postTrackForFollowers(Long userId, ListeningActivityEvent event) {
        var followerIds = this.followRepository.fetchAllIdFollowersByFollowingId(userId);
        var payload = this.getPayloadListeningEvent(event);
        this.simpMessagingTemplate.convertAndSendToUser(userId.toString(), RoomsConstants.WS_FOLLOWER_HOME_QUEUE, payload);
        followerIds.forEach(followerId -> {
            this.simpMessagingTemplate.convertAndSendToUser(
                    followerId.toString(),
                    RoomsConstants.WS_FOLLOWER_HOME_QUEUE,
                    payload
            );
        });

    }

    private ListeningActivityEvent getPayloadListeningEvent(ListeningActivityEvent event) {
        return ListeningActivityEvent.builder()
                .activityId(UUID.randomUUID().toString())
                .followingId(event.getFollowingId())
                .followingAvatar(event.getFollowingAvatar())
                .followingName(event.getFollowingName())
                .followingTrackId(event.getFollowingTrackId())
                .followingImgUrl(event.getFollowingImgUrl())
                .followingTrackTitle(event.getFollowingTrackTitle())
                .followingTrackUrl(event.getFollowingTrackUrl())
                .startedAt(System.currentTimeMillis())
                .build();
    }
}
