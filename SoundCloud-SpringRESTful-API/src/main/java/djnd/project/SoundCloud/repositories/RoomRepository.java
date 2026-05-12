package djnd.project.SoundCloud.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import djnd.project.SoundCloud.domain.entity.ListeningRoom;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<ListeningRoom, Long>, JpaSpecificationExecutor<ListeningRoom> {

    List<ListeningRoom> findByHostIdAndIsActiveTrue(Long hostUserId);

    List<ListeningRoom> findByIsActiveTrueAndIsPublicTrue();

    Optional<ListeningRoom> findByIdAndIsActiveTrue(Long id);
}