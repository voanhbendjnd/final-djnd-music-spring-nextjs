package djnd.project.SoundCloud.controllers.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import djnd.project.SoundCloud.domain.entity.Permission;
import djnd.project.SoundCloud.domain.request.permissions.PermissionDTO;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.domain.response.permissions.ResPermission;
import djnd.project.SoundCloud.services.PermissionService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionController {
    PermissionService permissionService;

    @PostMapping("")
    @ApiMessage("Create new a permission")
    public ResponseEntity<Long> create(@RequestBody PermissionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.permissionService.create(dto));
    }

    @PutMapping("")
    @ApiMessage("Update permission by ID")
    public ResponseEntity<ResPermission> update(@RequestBody PermissionDTO dto) {
        return ResponseEntity.ok(this.permissionService.update(dto));
    }

    @GetMapping("/{id}")
    @ApiMessage("Find permission by ID")
    public ResponseEntity<ResPermission> find(@PathVariable("id") long id) {
        return ResponseEntity.ok(this.permissionService.find(id));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete permission by ID")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) {
        this.permissionService.delete(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("")
    @ApiMessage("Fetch permission all with query")
    public ResponseEntity<ResultPaginationDTO> findAll(@Filter Specification<Permission> spec, Pageable pageable) {
        return ResponseEntity.ok(this.permissionService.findAll(spec, pageable));
    }

    @GetMapping("/data")
    @ApiMessage("Fetch all name and id")
    public ResponseEntity<?> findAllIdAndName() {
        return ResponseEntity.ok(this.permissionService.getIdAndName());
    }

}
