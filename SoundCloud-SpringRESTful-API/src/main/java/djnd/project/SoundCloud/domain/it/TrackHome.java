package djnd.project.SoundCloud.domain.it;

import java.time.LocalDateTime;

public interface TrackHome {
    // information following
    Long getFollowingId();
    String getFollowingName();
    String getFollowingAvatar();
    // information track following listening
    Long getFollowingTrackId();
    String getFollowingTrackTitle();
    String getFollowingTrackUrl();
    String getFollowingImgUrl();
    LocalDateTime getPostedAt();
}
