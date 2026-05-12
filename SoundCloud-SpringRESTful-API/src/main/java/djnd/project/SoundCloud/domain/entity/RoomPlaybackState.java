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
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "room_playback_state")
public class RoomPlaybackState {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    ListeningRoom room;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "track_id")
    Track track;
    Double time;
    Boolean isPlaying;
    LocalDateTime updatedAt;

    @PrePersist
    public void setTimeCreated() {
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void setTimeUpdated() {
        this.updatedAt = LocalDateTime.now();
    }
}
