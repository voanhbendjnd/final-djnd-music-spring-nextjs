package djnd.project.SoundCloud.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import djnd.project.SoundCloud.domain.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    boolean existsByEmail(String Email);

    User findByEmail(String email);

    User findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = { "role", "role.permissions" })
    User findByEmailAndRefreshToken(String email, String refreshToken);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    @EntityGraph(attributePaths = { "role", "role.permissions" })
    @Query(value = "select u from User u where lower(u.email) = lower(:email)")
    Optional<User> findWithDetailByEmail(@Param("email") String email);

    @EntityGraph(attributePaths = { "role", "role.permissions" })
    @Query(value = "select u from User u where u.id = :id")
    Optional<User> findWithDetailById(@Param("id") Long id);
}
