package djnd.project.SoundCloud.domain.entity;

import java.time.LocalDateTime;

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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User host;
    @Column(name = "created_at")
    LocalDateTime createdAt;
    @Column(name = "is_active")
    Boolean isActive;

    @PrePersist
    public void setTimeForCreatedAt() {
        this.createdAt = LocalDateTime.now();
    }
}