package djnd.project.SoundCloud.domain.request.permissions;

public record PermissionDTO(
        Long id,
        String name,
        String method,
        String module,
        String apiPath) {
}
