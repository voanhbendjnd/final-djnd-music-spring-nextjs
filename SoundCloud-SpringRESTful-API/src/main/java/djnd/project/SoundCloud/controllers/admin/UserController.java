package djnd.project.SoundCloud.controllers.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import djnd.project.SoundCloud.domain.entity.User;
import djnd.project.SoundCloud.domain.request.users.UserDTO;
import djnd.project.SoundCloud.domain.request.users.UserUpdateDTO;
import djnd.project.SoundCloud.domain.response.users.ResUser;
import djnd.project.SoundCloud.services.UserService;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("")
    public ResponseEntity<Long> create(@RequestBody @Valid UserDTO dto) throws MethodArgumentNotValidException {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.create(dto));
    }

    @PatchMapping("")
    public ResponseEntity<ResUser> updatePartial(@RequestBody @Valid UserUpdateDTO dto)
            throws MethodArgumentNotValidException, HttpMessageNotReadableException {
        return ResponseEntity.ok(this.userService.updatePartial(dto));
    }

    @PutMapping("")
    public ResponseEntity<ResUser> update(@RequestBody @Valid UserUpdateDTO dto)
            throws MethodArgumentNotValidException, HttpMessageNotReadableException {
        return ResponseEntity.ok(this.userService.update(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResUser> findById(@PathVariable("id") long id) {
        return ResponseEntity.ok(this.userService.findById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable("id") long id) {
        this.userService.deleteById(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/export")
    public ResponseEntity<Resource> exportExcel() {
        String filename = "users.xlsx";
        InputStreamResource file = new InputStreamResource(this.userService.exportUsers());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    @PostMapping("/import")
    public ResponseEntity<?> importExcel(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(this.userService.importUsers(file));
    }
    @GetMapping
    public ResponseEntity<?>fetchAll(@Filter Specification<User> spec, Pageable pageable){
        return ResponseEntity.ok(this.userService.fetchAll(spec, pageable));
    }
}
