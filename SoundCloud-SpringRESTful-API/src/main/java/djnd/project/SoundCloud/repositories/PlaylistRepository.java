package djnd.project.SoundCloud.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import djnd.project.SoundCloud.domain.entity.Playlist;
import djnd.project.SoundCloud.domain.it.PlaylistFindAll;
import djnd.project.SoundCloud.domain.it.PlaylistTrackInterface;
import io.lettuce.core.dynamic.annotation.Param;

@Repository
public interface PlaylistRepository extends JpaRepository<Playlist, Long>, JpaSpecificationExecutor<Playlist> {
    // @EntityGraph(attributePaths = { "user", "tracks", "tracks.user" })
    // Optional<Playlist> findById(Long id);

    @EntityGraph(attributePaths = { "user", "playlistTracks", "playlistTracks.track", "playlistTracks.track.user" })
    @Query("SELECT p FROM Playlist p WHERE p.id = :id")
    Optional<Playlist> findWithDetailsById(Long id);

    /**
     * Modify for spring know this method write data instead of read data
     * clearAuto delete cache in JPA, because data response track old iof track
     * update
     * 
     * @param trackId
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "update Playlist p set p.totalTracks = p.totalTracks + :qtyTrack where p.id = :playlistId")
    void incremementTrackInPlaylist(@Param("playlistId") Long playlistId, @Param("qtyTrack") Integer qtyTrack);

    /**
     * Modify for spring know this method write data instead of read data
     * clearAuto delete cache in JPA, because data response track old iof track
     * update
     * 
     * @param trackId
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "update Playlist p set p.totalTracks = p.totalTracks - :qtyTrack where p.id = :playlistId")
    void decremementTrackInPlaylist(@Param("playlistId") Long playlistId, @Param("qtyTrack") Integer qtyTrack);

    @Query(value = "select p.totalTracks from Playlist p where p.id = :playlistId")
    Integer getTotalTrackById(@Param("playlistId") Long playlistId);

    @Query(value = "select p.isPublic as isPublic, p.id as id, p.title as title, pt.track.id as trackId, p.imgUrl as imgUrl from Playlist p left join p.playlistTracks pt where p.user.id = :userId order by p.id desc")
    List<PlaylistTrackInterface> getAllPlaylistExistsByUserId(@Param("userId") Long userId);

    @Query(value = "select p.is_public as isPublic, p.id as id, p.title as title, p.img_url as imgUrl, p.total_tracks as totalTracks,u.id as userId, u.name as createdBy from playlists p inner join users u on p.user_id = u.id where p.user_id = :userId and lower(p.title) like lower(concat('%', :title, '%')) order by p.id desc", countQuery = "select count(*) from playlists p where p.user_id = :userId and lower(p.title) like lower(concat('%', :title, '%'))", nativeQuery = true)
    Page<PlaylistFindAll> findAllPlaylistNative(@Param("userId") Long userId, @Param("title") String title,
            Pageable pageable);
}
