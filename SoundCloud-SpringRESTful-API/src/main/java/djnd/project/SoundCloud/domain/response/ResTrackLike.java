package djnd.project.SoundCloud.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResTrackLike {
    private Integer countLikes;
    private Boolean isLiked;
    private Long countPlays;
}
