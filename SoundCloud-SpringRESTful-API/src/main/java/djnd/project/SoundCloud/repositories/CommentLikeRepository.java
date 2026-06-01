package djnd.project.SoundCloud.repositories;

import djnd.project.SoundCloud.domain.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.HashSet;
import java.util.List;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    @Query(value = "select exists(select 1 from CommentLike cl where cl.user.id = : userId and cl.comment.id = :commentId)")
    Boolean existsByCommentIdAndUserId(@Param("commentId") Long commentId, @Param("userId") Long userId);
    @Modifying
    @Query(value = "delete from CommentLike cl where cl.comment.id = :commentId and cl.user.id = :userId")
    int deleteByCommentIdAndUserId(@Param("commentId") Long commentId, @Param("userId") Long userId);


    @Query(value = "select cl.comment.id from CommentLike cl where cl.user.id = :userId and cl.comment.id in :commentIds")
    HashSet<Long> getIsLikedComments(@Param("userId") Long userId, @Param("commentIds") List<Long> commentIds);
}
