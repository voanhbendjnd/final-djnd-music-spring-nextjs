package djnd.project.SoundCloud.domain.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResPlaylist {
    String updatedBy, createdBy;
    LocalDateTime updatedAt, createdAt;
    String title;
    String imgUrl;
    String description;
    Boolean isPublic;
    User user;
    Long id;
    Integer totalTracks;
    List<ResPlaylistTrack> playlistTracks;

    @Getter
    @Setter
    public static class ResPlaylistTrack {
        Long id;
        String title;
        Long countPlays;
        Integer countLikes;
        String trackUrl;
        String imgUrl;
        Uploader uploader;

        @Getter
        @Setter
        public static class Uploader {
            Long id;
            String avatar;
            String role;
            String name;

        }
    }

    @Getter
    @Setter
    public static class User {
        Long id;
        String avatar;
        String role;
        String name;
    }
}
