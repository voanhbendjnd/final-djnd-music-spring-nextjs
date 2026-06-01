package djnd.project.SoundCloud.domain.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResLike {
    private Boolean isLiked;
    private Integer countLikes;
}
