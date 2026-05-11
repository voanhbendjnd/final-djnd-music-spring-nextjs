package djnd.project.SoundCloud.domain.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrackQuery {
    private Long trackId;
    private String categoryName;
}
