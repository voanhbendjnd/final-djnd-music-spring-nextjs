package djnd.project.SoundCloud.domain.request;

import java.util.List;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddTrackToPlaylistDTO {
    List<Long> trackIds;
    Long playlistId;
    Boolean isAdded;
}
