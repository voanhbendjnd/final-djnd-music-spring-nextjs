package djnd.project.SoundCloud.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import djnd.project.SoundCloud.domain.entity.PlaylistTrack;

@Repository
public interface PlaylistTrackRepository extends JpaRepository<PlaylistTrack, Long> {
    PlaylistTrack findByPlaylistIdAndTrackId(Long playlistId, Long trackId);

    /**
     * flushAuto delete done call db tức thời
     * 
     * @param userId
     * @param trackId
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM PlaylistTrack pt WHERE pt.playlist.id = :playlistId AND pt.track.id = :trackId")
    void deleteByPlaylistIdAndTrackId(@Param("playlistId") Long playListId, @Param("trackId") Long trackId);

    boolean existsByPlaylistIdAndTrackId(Long playlistId, Long trackId);

}
