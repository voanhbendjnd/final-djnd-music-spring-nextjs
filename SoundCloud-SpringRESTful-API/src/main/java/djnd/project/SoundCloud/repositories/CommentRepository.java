package djnd.project.SoundCloud.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import djnd.project.SoundCloud.domain.entity.Comment;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long>, JpaSpecificationExecutor<Comment> {
    @Override
    @EntityGraph(attributePaths = { "track", "user" })
    Page<Comment> findAll(Specification<Comment> spec, Pageable pageable);
    @Modifying(clearAutomatically = true)
    @Query(value = "update Comment c set c.likesCount =GREATEST( c.likesCount + 1, 0) where c.id = :commentId")
    void incrementCountLikeComment(@Param("commentId") Long commentId);
    @Modifying(clearAutomatically = true)
    @Query(value = "update Comment c set c.likesCount = GREATEST( c.likesCount - 1, 0) where c.id = :commentId")
    void decrementCountLikeComment(@Param("commentId") Long commentId);
    @Query(value = "select c.likesCount from Comment c where c.id = :commentId")
    Integer countByCommentId(@Param("commentId")Long commentId);
}
