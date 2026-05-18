package djnd.project.SoundCloud.domain.response;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResFollower {
    Long uploaderId;
    Integer countFollowers;
    Boolean isFollowed;

}
