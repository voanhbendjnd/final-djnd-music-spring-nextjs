package djnd.project.SoundCloud.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import djnd.project.SoundCloud.domain.entity.ListeningRoom;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<ListeningRoom, Long>, JpaSpecificationExecutor<ListeningRoom> {
    @EntityGraph(attributePaths = { "host" })
    @Query(value = "select r from ListeningRoom r where r.host.id = :hostId and r.isActive = true order by r.id desc")
    List<ListeningRoom> findByHostIdAndIsActiveTrue(@Param("hostId") Long hostUserId);

    @EntityGraph(attributePaths = { "host" })
    List<ListeningRoom> findByIsActiveTrueAndIsPublicTrue();

    @EntityGraph(attributePaths = { "host" })
    Optional<ListeningRoom> findByIdAndIsActiveTrue(Long id);

    @EntityGraph(attributePaths = { "host" })
    @Query(value = "select r from ListeningRoom r where r.id = :id")
    Optional<ListeningRoom> findWithIdDetail(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = { "host" })
    Page<ListeningRoom> findAll(Specification<ListeningRoom> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = { "host" })
    @Query(value = "select r from ListeningRoom r order by r.id desc")
    List<ListeningRoom> findAll();
}