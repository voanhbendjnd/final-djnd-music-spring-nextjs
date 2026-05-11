package djnd.project.SoundCloud.services;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import djnd.project.SoundCloud.domain.entity.Role;
import djnd.project.SoundCloud.domain.request.roles.RoleDTO;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.domain.response.roles.ResRole;
import djnd.project.SoundCloud.repositories.PermissionRepository;
import djnd.project.SoundCloud.repositories.RoleRepository;
import djnd.project.SoundCloud.utils.convert.convertUtils;
import djnd.project.SoundCloud.utils.error.DuplicateResourceException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;

    public Long create(RoleDTO dto) throws DuplicateResourceException {
        if (this.roleRepository.existsByName(dto.name())) {
            throw new DuplicateResourceException("Role Name", dto.name());
        }
        var permissions = dto.permissions();
        var permissionsExists = this.permissionRepository.findByIdIn(permissions);
        if (!permissionsExists.isEmpty() && permissionsExists != null) {
            var role = new Role();
            role.setPermissions(permissionsExists);
            role.setDescription(dto.description());
            role.setName(dto.name());
            this.roleRepository.save(role);
        }
        return null;
    }

    public ResRole update(RoleDTO dto) throws DuplicateResourceException {
        if (this.roleRepository.existsByNameAndIdNot(dto.name(), dto.id())) {
            throw new DuplicateResourceException("Role Name", dto.name());
        }
        var permissions = this.permissionRepository.findByIdIn(dto.permissions());
        if (permissions != null && !permissions.isEmpty()) {
            var role = this.roleRepository.findById(dto.id())
                    .orElseThrow(() -> new ResourceNotFoundException("Role ID", "" + dto.id()));
            role.setDescription(dto.description());
            role.setName(dto.name());
            role.setPermissions(permissions);
            var lastRole = this.roleRepository.save(role);
            return convertUtils.toResRole(lastRole);
        }
        return null;
    }

    public ResRole find(long id) {
        var role = this.roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role ID", "" + id));
        return convertUtils.toResRole(role);
    }

    public void delete(long id) {
        var role = this.roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "ID " + id));
        this.roleRepository.delete(role);
    }

    public Role handleGetRoleCustomer() {
        var role = this.roleRepository.findByNameIgnoreCase("USER_NORMAL");
        if (role != null) {
            return role;
        }
        throw new ResourceNotFoundException("ROLE", "USER_NORMAL");
    }

    public ResultPaginationDTO findAll(Specification<Role> spec, Pageable pageable) {
        var res = new ResultPaginationDTO();
        var mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        var page = this.roleRepository.findAll(spec, pageable);
        mt.setPages(page.getTotalPages());
        mt.setTotal(page.getTotalElements());
        res.setMeta(mt);
        res.setResult(page.getContent().stream().map(convertUtils::toResRole).toList());
        return res;
    }

}
