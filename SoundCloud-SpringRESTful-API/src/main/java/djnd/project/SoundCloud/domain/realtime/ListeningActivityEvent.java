package djnd.project.SoundCloud.domain.realtime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@NoArgsConstructor
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
public class ListeningActivityEvent {
    // information following
    Long followingId;
    String followingName;
    String followingAvatar;
    // information track following listening
    Long followingTrackId;
    String followingTrackTitle;
    String followingTrackUrl;
    String followingImgUrl;
    Long startedAt;
    String activityId;

}
