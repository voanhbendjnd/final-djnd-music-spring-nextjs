package djnd.project.SoundCloud.controllers;

import djnd.project.SoundCloud.domain.realtime.ListeningActivityEvent;
import djnd.project.SoundCloud.services.realtime.ShareTrackRealtimeService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class StateFollowingShareController {
    final ShareTrackRealtimeService shareTrackRealtimeService;;
    @MessageMapping("/follow.state")
    public void followState(@Payload ListeningActivityEvent event, Principal principal) {
        this.shareTrackRealtimeService.postStateByFollowing(event, principal);
    }
}
