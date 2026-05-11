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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "history_tracks", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "track_id" })
})
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HistoryTrack {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id")
    Track track;
    Integer durationListened;
    LocalDateTime listenedAt;

    @PrePersist
    public void handleCreateTimeAfterCreate() {
        this.listenedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void handleCreateTimeAfterUpdate() {
        this.listenedAt = LocalDateTime.now();
    }
}
