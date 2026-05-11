package djnd.project.SoundCloud.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.domain.entity.TrackLike;

@Repository
public interface TrackLikeRepository extends JpaRepository<TrackLike, Long> {
    boolean existsByUserIdAndTrackId(Long userId, Long trackId);

    // void deleteByUserIdAndTrackId(Long userId, Long trackId);

    @Query(value = "select tl.track.id from TrackLike tl where tl.user.id = :userId and tl.track.id in :trackIds")
    List<Long> getIdTracksByUserId(@Param("userId") Long id, @Param("trackIds") List<Long> trackIds);

    TrackLike findByUserIdAndTrackId(Long userId, Long trackId);

    /**
     * flushAuto delete done call db tức thời
     * 
     * @param userId
     * @param trackId
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM TrackLike tl WHERE tl.user.id = :userId AND tl.track.id = :trackId")
    void deleteByUserIdAndTrackId(@Param("userId") Long userId, @Param("trackId") Long trackId);

    @Query(value = "select tl.track from TrackLike tl join tl.track t where tl.user.id = :userId", countQuery = "select count(DISTINCT tl.track) from TrackLike tl where tl.user.id = :userId")
    Page<Track> getMyLikeTrack(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT t.* FROM tracks t WHERE EXISTS (SELECT 1 FROM track_likes tl WHERE tl.track_id = t.id AND tl.user_id = :userId) ORDER BY t.created_at DESC", countQuery = "SELECT COUNT(*) FROM tracks t WHERE EXISTS (SELECT 1 FROM track_likes tl WHERE tl.track_id = t.id AND tl.user_id = :userId)", nativeQuery = true)
    Page<Track> getMyLikeTrackNative(Long userId, Pageable pageable);

    @Query("SELECT tl.track.id FROM TrackLike tl WHERE tl.user.id = :userId AND tl.track.id IN :trackIds")
    List<Long> findLikedTrackIds(@Param("userId") Long userId, @Param("trackIds") List<Long> trackIds);
}
