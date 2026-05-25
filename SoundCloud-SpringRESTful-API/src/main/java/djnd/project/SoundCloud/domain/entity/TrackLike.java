package djnd.project.SoundCloud.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Entity
@Table(name = "track_likes",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "track_id"})
        })
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TrackLike extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id")
    Track track;
}
