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

import djnd.project.SoundCloud.domain.entity.Role;
import djnd.project.SoundCloud.domain.request.roles.RoleDTO;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.domain.response.roles.ResRole;
import djnd.project.SoundCloud.services.RoleService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/roles")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class RoleController {
    RoleService roleService;

    @PostMapping("")
    @ApiMessage("Create new a role")
    public ResponseEntity<Long> create(@RequestBody RoleDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.roleService.create(dto));
    }

    @PutMapping("")
    public ResponseEntity<ResRole> update(@RequestBody RoleDTO dto) {
        return ResponseEntity.ok(this.roleService.update(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResRole> find(@PathVariable("id") long id) {
        return ResponseEntity.ok(this.roleService.find(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) {
        this.roleService.delete(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("")
    public ResponseEntity<ResultPaginationDTO> findAll(@Filter Specification<Role> spec, Pageable pageable) {
        return ResponseEntity.ok(this.roleService.findAll(spec, pageable));
    }

}
