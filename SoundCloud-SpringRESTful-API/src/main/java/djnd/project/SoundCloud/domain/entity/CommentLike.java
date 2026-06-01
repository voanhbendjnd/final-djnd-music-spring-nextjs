package djnd.project.SoundCloud.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "comment_likes", uniqueConstraints =@UniqueConstraint(columnNames = {"user_id", "comment_id"}))
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommentLike extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    Comment comment;
}
