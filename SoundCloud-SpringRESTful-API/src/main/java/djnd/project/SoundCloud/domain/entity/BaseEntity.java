package djnd.project.SoundCloud.domain.entity;

import java.time.LocalDateTime;

import djnd.project.SoundCloud.utils.SecurityUtils;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;

@MappedSuperclass
@Getter
@Setter
public class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    String createdBy, updatedBy;
    LocalDateTime createdAt, updatedAt;

    @PrePersist
    public void handleBeforeCreateAt() {
        var email = SecurityUtils.getCurrentUserLogin().orElse("No email");
        this.createdBy = email;
        this.updatedBy = email;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void handleBeforeUpdateBy() {
        var email = SecurityUtils.getCurrentUserLogin().orElse("No email");

        this.updatedBy = email;
        this.updatedAt = LocalDateTime.now();
    }
}
