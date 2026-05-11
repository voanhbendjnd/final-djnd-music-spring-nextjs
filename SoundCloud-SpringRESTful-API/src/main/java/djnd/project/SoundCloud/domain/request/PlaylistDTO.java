package djnd.project.SoundCloud.domain.request;

import java.util.List;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
public class PlaylistDTO {
    Long id;
    String title;
    String description;
    Boolean isPublic;
    List<Long> trackIds;
    String currentImg;
}
