package djnd.project.SoundCloud.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class YoutubeSearchResponseDTO {
    private List<YoutubeSearchDTO> result;
    private Meta meta;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Meta {
        private String nextPageToken;
        private int totalResults;
    }
}
