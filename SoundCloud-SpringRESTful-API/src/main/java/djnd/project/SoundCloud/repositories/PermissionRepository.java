package djnd.project.SoundCloud.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import djnd.project.SoundCloud.domain.entity.Permission;
import djnd.project.SoundCloud.domain.it.PermissionIdName;

public interface PermissionRepository extends JpaRepository<Permission, Long>, JpaSpecificationExecutor<Permission> {
    List<Permission> findByIdIn(List<Long> ids);

    boolean existsByName(String name);

    @Query(value = "select p.id as id, p.name as name from Permission p")
    List<PermissionIdName> getAllIdAndName();
}
