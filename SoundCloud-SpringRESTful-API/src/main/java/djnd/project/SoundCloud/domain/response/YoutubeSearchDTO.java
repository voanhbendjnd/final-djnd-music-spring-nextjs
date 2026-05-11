package djnd.project.SoundCloud.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class YoutubeSearchDTO {

    private String videoId;
    private String title;
    private String thumbnail;
    private String channel;
    private Integer duration;
}
