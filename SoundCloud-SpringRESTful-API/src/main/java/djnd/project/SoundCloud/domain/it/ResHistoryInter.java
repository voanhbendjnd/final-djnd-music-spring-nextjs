package djnd.project.SoundCloud.domain.it;

public interface ResHistoryInter {
    Long getId();

    String getTitle();

    String getImgUrl();

    String getTrackUrl();

    Integer getCountLike();

    Long getCountPlay();

    String getUploader();

    String getPeaks();

    Long getUploaderId();

}
