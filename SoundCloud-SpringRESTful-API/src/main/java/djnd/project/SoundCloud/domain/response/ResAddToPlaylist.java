package djnd.project.SoundCloud.domain.response;

import java.util.List;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResAddToPlaylist {
    Long id;
    Integer totalTracks;
    Boolean isAdded;
    List<Long> trackIds;
}
