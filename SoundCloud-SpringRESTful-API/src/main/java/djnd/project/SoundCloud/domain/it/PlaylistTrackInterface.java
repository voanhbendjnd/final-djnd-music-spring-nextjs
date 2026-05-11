package djnd.project.SoundCloud.domain.it;

public interface PlaylistTrackInterface {
    Long getId();

    String getTitle();

    Long getTrackId();

    String getImgUrl();

    Boolean getIsPublic();
}
