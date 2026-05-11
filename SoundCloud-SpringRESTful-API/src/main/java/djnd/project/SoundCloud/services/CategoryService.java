package djnd.project.SoundCloud.services;

import djnd.project.SoundCloud.domain.response.CategoryResponse;
import org.springframework.stereotype.Service;

import djnd.project.SoundCloud.domain.entity.Category;
import djnd.project.SoundCloud.domain.it.CategoryIdName;
import djnd.project.SoundCloud.domain.request.CategoryDTO;
import djnd.project.SoundCloud.repositories.CategoryRepository;
import djnd.project.SoundCloud.utils.error.DuplicateResourceException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class CategoryService {
    CategoryRepository categoryRepository;

    public void create(CategoryDTO dto) {
        if (this.categoryRepository.existsByName(dto.getName())) {
            throw new DuplicateResourceException("Category Name", dto.getName());
        }
        var category = new Category();
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        this.categoryRepository.save(category);
    }

    public void update(CategoryDTO dto) {
        var category = this.categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category ID", "#" + dto.getId()));
        if (this.categoryRepository.existsByNameAndIdNot(dto.getName(), dto.getId())) {
            throw new DuplicateResourceException("Category Name", dto.getName());
        }
        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        this.categoryRepository.save(category);
    }

    public void delete(Long id) {
        var category = this.categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category ID", "#" + id));
        this.categoryRepository.delete(category);
    }

    public Category fetchById(Long id) {
        return this.categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category ID", "#" + id));
    }

    public ResultPaginationDTO fetchAllWithPagination(Specification<Category> spec, Pageable pageable) {
        var page = this.categoryRepository.findAll(spec, pageable);
        var res = new ResultPaginationDTO();
        var meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        res.setMeta(meta);
        res.setResult(page.getContent().stream().map(this::toResponse).toList());
        return res;
    }

    private CategoryResponse toResponse(Category category) {
        var res = new CategoryResponse();
        res.setId(category.getId());
        res.setName(category.getName());
        res.setDescription(category.getDescription());
        return res;
    }

    public List<CategoryIdName> getAllIdAndName() {
        return this.categoryRepository.getAllIdAndName();
    }
}
