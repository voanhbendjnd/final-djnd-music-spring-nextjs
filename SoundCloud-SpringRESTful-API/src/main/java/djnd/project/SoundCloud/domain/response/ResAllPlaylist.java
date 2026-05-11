package djnd.project.SoundCloud.domain.response;

import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
public class ResAllPlaylist {
    Long id;
    String title;
    Integer totalTracks;
    List<Long> trackIds;
    String imgUrl;
    boolean isPublic;
}
