package djnd.project.SoundCloud.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.domain.it.ResHistoryInter;
import djnd.project.SoundCloud.domain.request.HistoryDTO;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.repositories.HistoryTrackRepository;
import djnd.project.SoundCloud.repositories.TrackLikeRepository;
import djnd.project.SoundCloud.repositories.TrackRepository;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class HistoryService {
    TrackRepository trackRepository;
    HistoryTrackRepository historyTrackRepository;
    JdbcTemplate jdbcTemplate;
    TrackService trackService;
    TrackLikeRepository trackLikeRepository;

    /*
     * cause modifying must method add transaction
     */
    @Transactional
    public ResHistoryInter saveHistoryTrackUserListened(HistoryDTO dto) {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if (userId == null) {
            return null;
        }
        if (dto.trackId() == null || dto.durationListened() == null) {
            throw new IllegalArgumentException("Invalid history data");
        }
        int duration = Math.max(dto.durationListened(), 0);
        this.historyTrackRepository.upsertHistory(userId, dto.trackId(), duration);
        return this.trackRepository.getTrackForHistoryById(dto.trackId());
    }

    @Transactional
    public void upsertBatchHistory(List<HistoryDTO> list) {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if (userId == null) {
            throw new ResourceNotFoundException("User ID", userId);
        }
        if (list == null || list.isEmpty())
            return;

        StringBuilder sql = new StringBuilder("""
                    INSERT INTO history_tracks (user_id, track_id, duration_listened, listened_at)
                    VALUES
                """);

        List<Object> params = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).trackId() == null)
                continue;
            sql.append("(?, ?, ?, ?)");
            if (i < list.size() - 1)
                sql.append(",");
            var now = LocalDateTime.now();

            params.add(userId);
            params.add(list.get(i).trackId());
            Integer duration = list.get(i).durationListened();
            params.add(Math.max(duration != null ? duration : 0, 0));
            params.add(now);
        }

        sql.append("""
                    ON DUPLICATE KEY UPDATE
                    duration_listened = GREATEST(duration_listened, VALUES(duration_listened)),
                    listened_at = ?
                """);
        params.add(LocalDateTime.now());
        jdbcTemplate.update(sql.toString(), params.toArray());
    }

    public List<ResHistoryInter> getHistoryTrackListened() {
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        Pageable pageable = PageRequest.of(0, 5);
        return this.historyTrackRepository.getMyTrackListened(userId, pageable);
    }

    public ResultPaginationDTO getAllForMainPageHistory(Specification<Track> spec, Pageable pageable) {
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        var userId = SecurityUtils.getCurrentUserIdOrNull();
        if (userId == null) {
            throw new BadCredentialsException("You must be login for feature!");
        }
        var myHistories = this.historyTrackRepository.getTrackHistoryWithNative(userId, pageable);
        int requestedPage = pageable.getPageNumber() + 1;
        int totalPages = myHistories.getTotalPages();
        if (requestedPage > totalPages && totalPages > 0) {
            meta.setPage(requestedPage);
            meta.setPageSize(pageable.getPageSize());
            meta.setPages(totalPages);
            meta.setTotal(myHistories.getTotalElements());
            res.setMeta(meta);
            res.setResult(Collections.emptyList());
            return res;
        }
        meta.setPage(requestedPage);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(totalPages);
        meta.setTotal(myHistories.getTotalElements());
        res.setMeta(meta);
        var finalData = myHistories.getContent().stream().map(this.trackService::convertToResponse).toList();
        var trackIds = finalData.stream().map(x -> x.getId()).toList();
        var idsTrackLikes = this.trackLikeRepository.getIdTracksByUserId(userId, trackIds);
        finalData.forEach(x -> x.setIsLiked(idsTrackLikes.contains(x.getId())));
        res.setResult(finalData);
        return res;
    }

}
