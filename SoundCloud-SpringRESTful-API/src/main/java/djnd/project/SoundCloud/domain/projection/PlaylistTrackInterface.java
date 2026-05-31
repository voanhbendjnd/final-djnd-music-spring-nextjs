package djnd.project.SoundCloud.domain.projection;

public interface PlaylistTrackInterface {
    Long getId();

    String getTitle();

    Long getTrackId();

    String getImgUrl();

    Boolean getIsPublic();
}
