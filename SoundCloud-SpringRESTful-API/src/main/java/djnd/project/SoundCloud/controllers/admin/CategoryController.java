package djnd.project.SoundCloud.controllers.admin;

import jakarta.validation.Valid;
import com.turkraft.springfilter.boot.Filter;
import djnd.project.SoundCloud.domain.entity.Category;
import djnd.project.SoundCloud.domain.request.CategoryDTO;
import djnd.project.SoundCloud.services.CategoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    CategoryService categoryService;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CategoryDTO dto) {
        this.categoryService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body("Create new category success!");
    }

    @PatchMapping
    public ResponseEntity<?> update(@Valid @RequestBody CategoryDTO dto) {
        this.categoryService.update(dto);
        return ResponseEntity.ok("Update category success");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        this.categoryService.delete(id);
        return ResponseEntity.ok("Delete category success");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> fetchById(@PathVariable Long id) {
        return ResponseEntity.ok(this.categoryService.fetchById(id));
    }

    @GetMapping
    public ResponseEntity<?> fetchAll(@Filter Specification<Category> spec, Pageable pageable) {
        return ResponseEntity.ok(this.categoryService.fetchAllWithPagination(spec, pageable));
    }

    @GetMapping("/data")
    public ResponseEntity<?> fetchAllIdAndName() {
        return ResponseEntity.ok(this.categoryService.getAllIdAndName());
    }
}
