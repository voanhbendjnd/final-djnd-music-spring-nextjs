package djnd.project.SoundCloud.repositories;

import java.util.List;

import djnd.project.SoundCloud.domain.it.FollowingInterface;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import djnd.project.SoundCloud.domain.entity.Follow;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
    Boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(value = "delete from Follow f where f.follower.id = :followerId and f.following.id = :followingId")
    int deleteFollower(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    @Query(value = "select f.following.id from Follow f where f.follower.id = :userId and f.following.id in :followerIds")
    List<Long> getFollowerIdsByUserId(@Param("userId") Long userId, @Param("followerIds") List<Long> followerIds);
    @Query(value = """
        select 
                u.id as id, u.name as name, u.avatar as avatar, u.countFollowers as countFollowers 
        from 
                Follow f
        join 
                f.following u
        where 
                f.follower.id = :followerId
        """)
    Page<FollowingInterface> fetchAllFollowingsByFollowerId(@Param("followerId") Long followerId, Pageable pageable);

    @Query(value = "select u.id as id, u.name as name, u.avatar as avatar, u.countFollowers as countFollowers from Follow f join f.follower u where f.following.id = :followingId")
    Page<FollowingInterface> fetchAllFollowerByFollowingId(Pageable pageable, Long followingId);


}
