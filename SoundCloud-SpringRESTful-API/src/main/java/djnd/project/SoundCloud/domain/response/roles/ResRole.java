package djnd.project.SoundCloud.domain.response.roles;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResRole {
    Long id;
    String name;
    String description;
    List<Permission> permissions;
    String createdBy, updatedBy;
    LocalDateTime createdAt, updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class Permission {
        Long id;
        String name;
    }
}
