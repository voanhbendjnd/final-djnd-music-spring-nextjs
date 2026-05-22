package djnd.project.SoundCloud.services.realtime;

import djnd.project.SoundCloud.domain.realtime.ListeningActivityEvent;
import djnd.project.SoundCloud.repositories.FollowRepository;
import djnd.project.SoundCloud.utils.error.HandleIllegalArgumentException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.security.Principal;
import java.util.concurrent.CompletableFuture;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
@Slf4j
public class ShareTrackRealtimeService {
    final SimpMessagingTemplate simpMessagingTemplate;
    final FollowRepository followRepository;
    public void postStateByFollowing(ListeningActivityEvent event, Principal principal) {
        var followingId = Long.valueOf(principal.getName());
        var followerIds = this.followRepository.fetchAllIdFollowersByFollowingId(event.getFollowingId());
        var payload = ListeningActivityEvent.builder()
                        .followingId(event.getFollowingId())
                                .followingAvatar(event.getFollowingAvatar())
                                        .followingName(event.getFollowingName())
                                                .followingTrackId(event.getFollowingTrackId())
                                                        .followingImgUrl(event.getFollowingImgUrl())
                                                                .followingTrackTitle(event.getFollowingTrackTitle())
                                                                        .followingTrackUrl(event.getFollowingTrackUrl())
                                                                                .startedAt(System.currentTimeMillis())
                                                                                        .build();
        followerIds.forEach(followerId -> {
                this.simpMessagingTemplate.convertAndSendToUser(
                        followerId.toString(),
                        RoomsConstants.WS_FOLLOWER_ACTIVITY_QUEUE,
                        payload
                );
        });
        log.info("{} posted state by following {}", event.getFollowingId(), followerIds);
    }
}
