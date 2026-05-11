package djnd.project.SoundCloud.domain.it;

public interface PlaylistFindAll {
    Long getId();

    String getTitle();

    String getImgUrl();

    String getTotalTracks();

    String getCreatedBy();

    Boolean getIsPublic();

    Long getUserId();
}
