package djnd.project.SoundCloud.domain.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class ResOwner {
    Long id;
    String name;
    String avatar;
    Integer countFollowers;
    Boolean isFollowed;

}
