package djnd.project.SoundCloud.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "follows", uniqueConstraints = @UniqueConstraint(columnNames = { "follower_id", "following_id" }))
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Follow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id")
    User follower;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id")
    User following;
    LocalDateTime followedAt;

    @PrePersist
    public void handleCreateTimeForFollower() {
        this.followedAt = LocalDateTime.now();
    }
}
