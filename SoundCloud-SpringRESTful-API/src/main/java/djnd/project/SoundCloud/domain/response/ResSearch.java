package djnd.project.SoundCloud.domain.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResSearch {
    Long id;
    String name;
    String title;
    String imgUrl;
    String trackUrl;
}
