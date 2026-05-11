package djnd.project.SoundCloud.domain.response.permissions;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResPermission {
    Long id;
    String name;
    String method;
    String module;
    String apiPath;
    String createdBy, updatedBy;
    LocalDateTime createdAt, updatedAt;
}
