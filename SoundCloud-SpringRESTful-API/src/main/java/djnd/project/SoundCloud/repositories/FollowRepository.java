package djnd.project.SoundCloud.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import djnd.project.SoundCloud.domain.entity.Follow;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
    Boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from Follow f where f.follower.id = :followerId and f.following.id = :followingId")
    int deleteFollower(@Param("followerId") Long followerId, @Param("followingId") Long followingId);
}
