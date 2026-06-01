package djnd.project.SoundCloud.domain.projection;

public interface LikeProjection {
    Long getId();
    Boolean getIsLiked();
    Integer getLikesCount();
}
