package djnd.project.SoundCloud.domain.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResultPaginationHome extends ResultPaginationDTO{
    Long trackId;
    String nextCursor;
    Boolean hasMore;
}
