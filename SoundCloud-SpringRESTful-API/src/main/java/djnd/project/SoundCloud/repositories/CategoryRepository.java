package djnd.project.SoundCloud.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import djnd.project.SoundCloud.domain.entity.Category;
import djnd.project.SoundCloud.domain.it.CategoryIdName;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>, JpaSpecificationExecutor<Category> {
    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    @Query(value = "select c.id as id, c.name as name from Category c")
    List<CategoryIdName> getAllIdAndName();
}
