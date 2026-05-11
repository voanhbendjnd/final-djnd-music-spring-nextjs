package djnd.project.SoundCloud.services;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import djnd.project.SoundCloud.domain.entity.Permission;
import djnd.project.SoundCloud.domain.it.PermissionIdName;
import djnd.project.SoundCloud.domain.request.permissions.PermissionDTO;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.domain.response.permissions.ResPermission;
import djnd.project.SoundCloud.repositories.PermissionRepository;
import djnd.project.SoundCloud.utils.convert.convertUtils;
import djnd.project.SoundCloud.utils.error.DuplicateResourceException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class PermissionService {
    PermissionRepository permissionRepository;

    public Long create(PermissionDTO dto) throws DuplicateResourceException {
        var name = dto.name();
        if (this.permissionRepository.existsByName(name)) {
            throw new DuplicateResourceException("Permission Name", name);
        }
        var permission = convertUtils.toPermission(dto);
        var lastPermission = this.permissionRepository.save(permission);
        return lastPermission.getId();
    }

    public ResPermission update(PermissionDTO dto) throws DuplicateResourceException {
        var name = dto.name();
        if (this.permissionRepository.existsByName(name)) {
            throw new DuplicateResourceException("Permission Name", name);
        }
        var permission = this.permissionRepository.findById(dto.id())
                .orElseThrow(() -> new ResourceNotFoundException("Permission ID", dto.id() + ""));
        permission.setApiPath(dto.apiPath());
        permission.setMethod(dto.method());
        permission.setModule(dto.module());
        permission.setName(dto.name());
        return convertUtils.toResPermission(this.permissionRepository.save(permission));
    }

    public ResPermission find(long id) {
        var permission = this.permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission ID", id + ""));
        return convertUtils.toResPermission(permission);
    }

    public void delete(long id) {
        var permission = this.permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission ID", id + ""));
        this.permissionRepository.delete(permission);

    }

    public ResultPaginationDTO findAll(Specification<Permission> spec, Pageable pageable) {
        var page = this.permissionRepository.findAll(spec, pageable);
        var res = new ResultPaginationDTO();
        var mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(page.getTotalPages());
        mt.setTotal(page.getTotalElements());
        res.setMeta(mt);
        res.setResult(page.getContent().stream().map(convertUtils::toResPermission).toList());
        return res;
    }

    public List<PermissionIdName> getIdAndName() {
        return this.permissionRepository.getAllIdAndName();
    }

}
