package djnd.project.SoundCloud.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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

    @Modifying
    @Transactional
    @Query(value = "update User u set u.name = :name, u.avatar = :avatar where u.id = :userId")
    void updateNameAndAvatarUser(@Param("name") String name, @Param("avatar") String avatar,
            @Param("userId") Long userId);

    @Modifying
    @Query(value = "update User u set u.countFollowers = GREATEST(u.countFollowers + :numberFollow, 0) where u.id = :userId")
    void increaseCountMyFollowers(@Param("userId") Long userId, @Param("numberFollow") Integer numberFollow);

    @Modifying
    @Query(value = "update User u set u.countFollowers =GREATEST(u.countFollowers - :numberFollow, 0) where u.id = :userId")
    void decreaseCountMyFollowers(@Param("userId") Long userId, @Param("numberFollow") Integer numberFollow);

    @Query(value = "select u.countFollowers from User u where u.id = :userId")
    Integer getCountFollowers(@Param("userId") Long userId);



}
