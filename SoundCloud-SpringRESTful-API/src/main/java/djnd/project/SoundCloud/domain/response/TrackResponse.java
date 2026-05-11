package djnd.project.SoundCloud.domain.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TrackResponse {
    Long id;
    String title;
    String description;
    String category;
    String imgUrl;
    String trackUrl;
    String peaks;
    Integer countLike;
    Long countPlay;
    Uploader uploader;
    @JsonProperty("waveform_url")
    String waveformUrl;
    Boolean isLiked;
    LocalDateTime createdAt, updatedAt;

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class Uploader {
        Long id;
        // String email;
        String name;
        // String role;
        String avatar;
    }
}
