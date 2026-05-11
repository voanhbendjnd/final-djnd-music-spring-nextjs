package djnd.project.SoundCloud.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import djnd.project.SoundCloud.domain.entity.Track;
import djnd.project.SoundCloud.domain.it.ResHistoryInter;
import djnd.project.SoundCloud.domain.it.SearchInterface;
import djnd.project.SoundCloud.domain.it.TrackUploader;

@Repository
public interface TrackRepository extends JpaRepository<Track, Long>, JpaSpecificationExecutor<Track> {
    boolean existsByTitleAndIdNot(String title, Long id);

    @EntityGraph(attributePaths = { "user" })
    List<Track> findByIdIn(List<Long> trackIds);

    boolean existsByTitle(String tile);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "update Track t set t.countLike = t.countLike + 1 where t.id = :trackId")
    void increamentCountLikes(@Param("trackId") Long trackId);

    /**
     * Modify for spring know this method write data instead of read data
     * clearAuto delete cache in JPA, because data response track old iof track
     * update
     * 
     * @param trackId
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "update Track t set t.countLike = t.countLike - 1 where t.id = :trackId")
    void decreamentCountLikes(@Param("trackId") Long trackId);

    @Query(value = "select t.countLike from Track t where t.id = :trackId")
    Integer getCountLike(@Param("trackId") Long id);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "update Track t set t.countPlay = t.countPlay + 1 where t.id = :trackId")
    void increamentCountPlay(@Param("trackId") Long trackId);

    @Query(value = "select t.countPlay from Track t where t.id = :trackId")
    Long getCountPlayTrack(@Param("trackId") Long id);

    @Query(value = "select u.id as id, u.name as name, u.avatar as avatar from Track t join t.user u where t.id = :trackId")
    TrackUploader getUploader(@Param("trackId") Long id);

    boolean existsByTrackUrlAndId(String trackUrl, Long trackId);

    @Query(value = "select t.trackUrl from Track t where t.id = :trackId")
    String getUrlTrackById(@Param("trackId") Long trackId);

    @Query(value = "select t.id as id, t.title as title, t.imgUrl as imgUrl, u.name as name, t.trackUrl as trackUrl from Track t join t.user u where lower(t.title) like lower(concat('%', :key, '%')) or lower(u.name) like lower(concat('%', :key, '%'))")
    List<SearchInterface> searchByKey(@Param("key") String key, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = { "user" })
    Page<Track> findAll(Specification<Track> spec, Pageable pageable);

    @Query(value = "select t.id as id, t.title as title, t.imgUrl as imgUrl, t.trackUrl as trackUrl, t.countPlay as countPlays, t.countLike as countLikes, u.name as uploader from Track t join t.user u where t.id = :trackId")
    ResHistoryInter getTrackForHistoryById(@Param("trackId") Long trackId);

    @Query(value = "select t.id as id, t.title as title, t.imgUrl as imgUrl, t.trackUrl as trackUrl, t.countPlay as countPlays, t.countLike as countLikes, u.name as uploader from Track t join t.user u join t.historyTracks h where t.id in :trackIds order by h.listenedAt desc")
    List<ResHistoryInter> getTracksForHistoryIdIn(@Param("trackIds") List<Long> trackIds, Pageable pageable);
    @Query(value = "select t from Track t where t.category.name = :category and t.id not in :excludeIds")
    Page<Track> findByByCategoryAndIdNotIn(@Param("category") String category, @Param("excludeIds") List<Long> excludeIds, Pageable pageable);

    @Query(value = "select t from Track t where t.id not in :excludeIds")
    Page<Track> findAllByIdNotIn(@Param("excludeIds") List<Long> excludeIds, Pageable pageable);
}
