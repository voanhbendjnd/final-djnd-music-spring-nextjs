package djnd.project.SoundCloud.domain.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResComment {
    Long id;
    LocalDateTime createdAt, updatedAt;
    String createdBy, updatedBy;
    @JsonProperty("track_title")
    String trackTitle;
    @JsonProperty("user_email")
    String userEmail;
    @JsonProperty("likes_count")
    Integer likesCount;
    String content;
    Integer moment;
    UserComment user;
    TrackComment track;

    @Getter
    @Setter
    public static class UserComment {
        Long id;
        String avatar;
        String role;
        String name;
        String email;
        String type;
    }

    @Setter
    @Getter
    public static class TrackComment {
        Long id;
        String imgUrl;
        String title;
    }
}
