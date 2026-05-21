package djnd.project.SoundCloud.domain.response;

import djnd.project.SoundCloud.domain.response.users.ResUser;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResTrack {
    List<TrackResponse> tracks;
    List<ResOwner> uploaders;

}
