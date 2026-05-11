package djnd.project.SoundCloud.domain.response.users;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResUser {
    Long id;
    String email;
    String name;
    Boolean status;
    String createdBy, updatedBy;
    LocalDateTime createdAt, updatedAt;
    Role role;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Role {
        private Long id;
        private String name;
    }
}
