package djnd.project.SoundCloud.redis.services;

import java.util.Map;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CountPlayTrack {
    private static String KEY_COUNT_PLAYS = "track:views";
    StringRedisTemplate stringRedisTemplate;

    public void saveViewToRedis(Long trackId) {
        this.stringRedisTemplate.opsForHash().increment(KEY_COUNT_PLAYS, String.valueOf(trackId), 1);
    }

    public Map<Object, Object> getTrackIdAndCountView() {
        Map<Object, Object> viewsMap = this.stringRedisTemplate.opsForHash().entries(KEY_COUNT_PLAYS);
        if (viewsMap.isEmpty()) {
            return null;
        }
        return viewsMap;
    }

    public void deleteCountViewTrack() {
        this.stringRedisTemplate.delete(KEY_COUNT_PLAYS);
    }
}
