package djnd.project.SoundCloud.domain.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CommentDTO(Long id, String content,
                @JsonProperty("track_id") Long trackId, Integer moment) {

}
