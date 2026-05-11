package djnd.project.SoundCloud.utils.convert;

import djnd.project.SoundCloud.domain.entity.Permission;
import djnd.project.SoundCloud.domain.entity.Role;
import djnd.project.SoundCloud.domain.entity.User;
import djnd.project.SoundCloud.domain.request.permissions.PermissionDTO;
import djnd.project.SoundCloud.domain.request.roles.RoleDTO;
import djnd.project.SoundCloud.domain.request.users.UserDTO;
import djnd.project.SoundCloud.domain.response.permissions.ResPermission;
import djnd.project.SoundCloud.domain.response.roles.ResRole;
import djnd.project.SoundCloud.domain.response.users.ResUser;

public class convertUtils {
    public static ResUser toResUser(User user) {
        var res = new ResUser();
        res.setId(user.getId());
        res.setCreatedAt(user.getCreatedAt());
        res.setCreatedBy(user.getCreatedBy());
        res.setEmail(user.getEmail());
        res.setName(user.getName());
        res.setUpdatedAt(user.getUpdatedAt());
        res.setCreatedBy(user.getCreatedBy());
        res.setStatus(user.getStatus() != null ? user.getStatus() : true);
        if (user.getRole() != null) {
            res.setRole(new ResUser.Role(user.getRole().getId(), user.getRole().getName()));

        }
        return res;
    }

    public static User toUser(UserDTO dto) {
        var user = new User();
        user.setId(dto.getId());
        user.setEmail(dto.getEmail());
        user.setName(dto.getName());
        user.setPassword(dto.getManagementPassword().getPassword());
        return user;
    }

    public static Role toRole(RoleDTO dto) {
        var role = new Role();
        role.setDescription(dto.description());
        role.setName(dto.name());
        return role;
    }

    public static ResRole toResRole(Role role) {
        var res = new ResRole();
        res.setDescription(role.getDescription());
        res.setId(role.getId());
        res.setName(role.getName());
        res.setCreatedAt(role.getCreatedAt());
        res.setCreatedBy(role.getCreatedBy());
        res.setUpdatedAt(role.getUpdatedAt());
        res.setUpdatedBy(role.getUpdatedBy());
        res.setPermissions(
                role.getPermissions().stream().map(x -> {
                    var permission = new ResRole.Permission();
                    permission.setId(x.getId());
                    permission.setName(x.getName());
                    return permission;
                }).toList());
        return res;
    }

    public static Permission toPermission(PermissionDTO dto) {
        var permission = new Permission();
        permission.setApiPath(dto.apiPath());
        permission.setMethod(dto.method());
        permission.setName(dto.name());
        permission.setModule(dto.module());
        return permission;
    }

    public static ResPermission toResPermission(Permission permission) {
        var res = new ResPermission();
        res.setCreatedAt(permission.getCreatedAt());
        res.setCreatedBy(permission.getCreatedBy());
        res.setId(permission.getId());
        res.setMethod(permission.getMethod());
        res.setModule(permission.getModule());
        res.setName(permission.getName());
        res.setApiPath(permission.getApiPath());
        res.setUpdatedAt(permission.getUpdatedAt());
        res.setUpdatedBy(permission.getUpdatedBy());
        return res;
    }

}
