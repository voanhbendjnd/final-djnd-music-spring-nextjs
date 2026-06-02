package djnd.project.SoundCloud.domain.request.roles;

import djnd.project.SoundCloud.domain.request.permissions.PermissionIdDTO;

import java.util.List;

public record RoleDTO(Long id, String name, String description, List<PermissionIdDTO> permissions) {
}
