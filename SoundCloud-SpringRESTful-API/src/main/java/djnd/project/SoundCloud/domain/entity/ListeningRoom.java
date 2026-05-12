package djnd.project.SoundCloud.domain.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "listening_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ListeningRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(unique = true)
    String code;

    @Column(nullable = false)
    String name;

    @Column(name = "is_public")
    @Builder.Default
    Boolean isPublic = true;

    String password;

    @Column(name = "max_listeners")
    @Builder.Default
    Integer maxListeners = 50;

    // @Enumerated(EnumType.STRING)
    // RoomStatus status = RoomStatus.WAITING; // Hoặc giá trị mặc định phù hợp

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User host;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "is_active")
    @Builder.Default
    Boolean isActive = true;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<RoomQueue> roomQueues = new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<RoomParticipant> roomParticipants = new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<RoomPlaybackState> roomPlaybackStates = new ArrayList<>();

    @PrePersist
    public void setTimeForCreatedAt() {
        this.createdAt = LocalDateTime.now();
    }
}