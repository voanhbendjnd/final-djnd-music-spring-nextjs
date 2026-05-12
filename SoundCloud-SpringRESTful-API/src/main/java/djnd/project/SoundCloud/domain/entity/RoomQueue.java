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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "room_queues")
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomQueue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    ListeningRoom room;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id")
    Track track;
    Integer position;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User addedBy;
    LocalDateTime addedAt;

    @PrePersist
    public void setTimeForCreate() {
        this.addedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void setTimeForUpdate() {
        this.addedAt = LocalDateTime.now();
    }

}
