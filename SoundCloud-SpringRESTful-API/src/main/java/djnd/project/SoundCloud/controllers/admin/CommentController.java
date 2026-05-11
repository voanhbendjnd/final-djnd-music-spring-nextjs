package djnd.project.SoundCloud.controllers.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import djnd.project.SoundCloud.domain.entity.Comment;
import djnd.project.SoundCloud.domain.request.CommentDTO;
import djnd.project.SoundCloud.services.CommentService;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import djnd.project.SoundCloud.utils.error.PermissionException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/comments")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CommentController {
    CommentService commentService;

    @PostMapping
    @ApiMessage("Create new comment for track")
    public ResponseEntity<?> create(@RequestBody CommentDTO dto) throws PermissionException {
        this.commentService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body("Create new comment success!");
    }

    @GetMapping("/{id:[0-9]+}")
    @ApiMessage("Get comment by ID")
    public ResponseEntity<?> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(this.commentService.fetchById(id));
    }

    @GetMapping
    @ApiMessage("Get all comments")
    public ResponseEntity<?> fetchAll(@Filter Specification<Comment> spec, Pageable pageable) {
        return ResponseEntity.ok(this.commentService.fetchAllWithPaginationDTO(spec, pageable, null));
    }

    @DeleteMapping("/{id:[0-9]}")
    @ApiMessage("Delete comment by ID")
    public ResponseEntity<?> deleteById(@PathVariable("id") Long id) {
        this.commentService.deleteById(id);
        return ResponseEntity.ok("Delete comment success!");
    }
}
