package djnd.project.SoundCloud.services;

import djnd.project.SoundCloud.domain.response.YoutubeSearchDTO;
import djnd.project.SoundCloud.domain.response.YoutubeSearchResponseDTO;

import org.apache.commons.text.StringEscapeUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.ResponseEntity;
import org.springframework.cache.annotation.Cacheable;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.time.Duration;

@Service
public class YouTubeService {

    @Value("${youtube.api.key}")
    private String apiKey;

    private final ObjectMapper objectMapper;

    public YouTubeService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    private boolean shouldAppendMusic(String keyword) {
        String k = keyword.toLowerCase();

        return !(k.contains("ost")
                || k.contains("opening")
                || k.contains("ending")
                || k.contains("full")
                || k.contains("lyric")
                || k.contains("season"));
    }

    @Cacheable(value = "youtubeSearch", key = "#keyword + '-' + (#pageToken != null ? #pageToken : 'first')")
    public YoutubeSearchResponseDTO searchVideos(String keyword, String pageToken) {
        if (keyword == null)
            return new YoutubeSearchResponseDTO(new ArrayList<>(), new YoutubeSearchResponseDTO.Meta(null, 0));

        keyword = keyword.trim().toLowerCase();
        if (keyword.length() > 100 || keyword.isEmpty()) {
            return new YoutubeSearchResponseDTO(new ArrayList<>(), new YoutubeSearchResponseDTO.Meta(null, 0));
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            var searchQuery = keyword;
            if (shouldAppendMusic(keyword)) {
                searchQuery += " music";
            }
            String encodedKeyword = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8.toString());
            String url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodedKeyword
                    + "&type=video&maxResults=10&key=" + apiKey;

            if (pageToken != null && !pageToken.isEmpty()) {
                url += "&pageToken=" + pageToken;
            }

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.path("items");

            String nextPageToken = root.path("nextPageToken").asText(null);
            int totalResults = root.path("pageInfo").path("totalResults").asInt(0);

            List<YoutubeSearchDTO> videos = new ArrayList<>();
            List<String> videoIds = new ArrayList<>();

            if (items.isArray()) {
                for (JsonNode item : items) {
                    String videoId = item.path("id").path("videoId").asText("");
                    if (videoId.isEmpty())
                        continue; // Skip channels, playlists, etc.

                    String title = item.path("snippet").path("title").asText();
                    title = StringEscapeUtils.unescapeHtml4(title);
                    title = title
                            .replace("&#39;", "'")
                            .replace("&amp;", "&")
                            .replace("&quot;", "\"")
                            .replace("&lt;", "<")
                            .replace("&gt;", ">")
                            .replace("&apos;", "'")
                            .replace("&#34;", "\"");
                    // title.replace("&#39;", "'");
                    String thumbnail = item.path("snippet").path("thumbnails").path("default").path("url").asText();
                    String channel = item.path("snippet").path("channelTitle").asText();

                    videos.add(new YoutubeSearchDTO(videoId, title, thumbnail, channel, 0));
                    videoIds.add(videoId);
                }
            }

            // Fetch Durations
            if (!videoIds.isEmpty()) {
                String idsString = String.join(",", videoIds);
                String videoUrl = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" + idsString
                        + "&key=" + apiKey;
                ResponseEntity<String> videoResponse = restTemplate.getForEntity(videoUrl, String.class);
                JsonNode videoRoot = objectMapper.readTree(videoResponse.getBody());
                JsonNode videoItems = videoRoot.path("items");

                if (videoItems.isArray()) {
                    for (int i = 0; i < videoItems.size(); i++) {
                        JsonNode vItem = videoItems.get(i);
                        String vId = vItem.path("id").asText();
                        String durationIso = vItem.path("contentDetails").path("duration").asText();

                        int durationSeconds = 0;
                        try {
                            durationSeconds = (int) Duration.parse(durationIso).getSeconds();
                        } catch (Exception ignored) {
                        }

                        for (YoutubeSearchDTO v : videos) {
                            if (v.getVideoId().equals(vId)) {
                                v.setDuration(durationSeconds);
                                break;
                            }
                        }
                    }
                }
            }

            return new YoutubeSearchResponseDTO(videos, new YoutubeSearchResponseDTO.Meta(nextPageToken, totalResults));

        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 403 || e.getStatusCode().value() == 429) {
                System.err.println("YouTube API Quota Exceeded or Forbidden: " + e.getMessage());
                return new YoutubeSearchResponseDTO(new ArrayList<>(), new YoutubeSearchResponseDTO.Meta(null, 0));
            }
            e.printStackTrace();
            return new YoutubeSearchResponseDTO(new ArrayList<>(), new YoutubeSearchResponseDTO.Meta(null, 0));
        } catch (Exception e) {
            System.err.println("Unexpected Error in YouTubeService: " + e.getMessage());
            return new YoutubeSearchResponseDTO(new ArrayList<>(), new YoutubeSearchResponseDTO.Meta(null, 0));
        }
    }
}
