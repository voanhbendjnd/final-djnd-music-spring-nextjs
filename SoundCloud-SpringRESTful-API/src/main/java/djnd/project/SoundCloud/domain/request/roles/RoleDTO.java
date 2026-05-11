package djnd.project.SoundCloud.domain.request.roles;

import java.util.List;

public record RoleDTO(Long id, String name, String description, List<Long> permissions) {
}