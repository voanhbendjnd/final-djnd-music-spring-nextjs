package djnd.project.SoundCloud.configs;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import djnd.project.SoundCloud.domain.entity.Permission;
import djnd.project.SoundCloud.domain.entity.Role;
import djnd.project.SoundCloud.domain.entity.User;
import djnd.project.SoundCloud.repositories.PermissionRepository;
import djnd.project.SoundCloud.repositories.RoleRepository;
import djnd.project.SoundCloud.repositories.UserRepository;
import djnd.project.SoundCloud.utils.constains.LoginType;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DatabaseInitializer implements CommandLineRunner {
    final UserRepository userRepoRepository;
    final PermissionRepository permissionRepository;
    final RoleRepository roleRepository;
    final PasswordEncoder passwordEncoder;
    @Value("${djnd.soundcloud.role.customer.name}")
    String customerValue;
    @Value("${djnd.soundcloud.role.admin.name}")
    String adminValue;

    public DatabaseInitializer(UserRepository userRepository, PermissionRepository permissionRepository,
            RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepoRepository = userRepository;
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> START INIT DATABASE <<<");
        Long permissionCnt = this.permissionRepository.count();
        Long userCnt = this.userRepoRepository.count();
        Long roleCnt = this.roleRepository.count();
        if (permissionCnt == 0) {
            List<Permission> permissionList = new ArrayList<>();
            permissionList.add(new Permission("CREATE_PERMISSION", "/api/v1/permissions", "POST", "PERMISSIONS"));
            permissionList.add(new Permission("UPDATE_PERMISSION", "/api/v1/permissions", "PUT", "PERMISSIONS"));
            permissionList
                    .add(new Permission("DELETE_PERMISSION", "/api/v1/permissions/{id}", "DELETE", "PERMISSIONS"));
            permissionList.add(new Permission("GET_PERMISSION", "/api/v1/permissions{id}", "GET", "PERMISSIONS"));
            permissionList.add(new Permission("GET_ALL_PERMISSION", "/api/v1/permissions", "GET", "PERMISSIONS"));

            permissionList.add(new Permission("CREATE_ROLE", "/api/v1/roles", "POST", "ROLES"));
            permissionList.add(new Permission("UPDATE_ROLE", "/api/v1/roles", "PUT", "ROLES"));
            permissionList.add(new Permission("DELETE_ROLE", "/api/v1/roles/{id}", "DELETE", "ROLES"));
            permissionList.add(new Permission("GET_ROLE", "/api/v1/roles/{id}", "GET", "ROLES"));
            permissionList.add(new Permission("GET_ALL_ROLE", "/api/v1/roles", "GET", "ROLES"));

            permissionList.add(new Permission("CREATE_USER", "/api/v1/users", "POST", "USERS"));
            permissionList.add(new Permission("UPDATE_USER", "/api/v1/users", "PUT", "USERS"));
            permissionList.add(new Permission("DELETE_USER", "/api/v1/users/{id}", "DELETE", "USERS"));
            permissionList.add(new Permission("GET_USER", "/api/v1/users/{id}", "GET", "USERS"));
            permissionList.add(new Permission("GET_ALL_USER", "/api/v1/users", "GET", "USERS"));
            this.permissionRepository.saveAll(permissionList);
        }
        if (roleCnt == 0) {
            var permissions = this.permissionRepository.findAll();
            var roleAdmin = new Role();
            var roles = new ArrayList<Role>();
            roleAdmin.setName(adminValue);
            roleAdmin.setDescription("SUPER ADMIN HAS FULL PERMISSIONS");
            roleAdmin.setPermissions(permissions);
            var roleUser = new Role();
            roleUser.setName(customerValue);
            roleUser.setDescription("SUPER ADMIN HAS FULL PERMISSIONS");
            roleUser.setPermissions(permissions);
            roles.add(roleUser);
            roles.add(roleAdmin);
            this.roleRepository.saveAll(roles);
        }
        if (userCnt == 0) {
            User admin = new User();
            admin.setName("ADMIN");
            admin.setEmail("admin@gmail.com");
            admin.setRole(this.roleRepository.findByName(adminValue));
            admin.setPassword(this.passwordEncoder.encode("123123"));
            admin.setType(LoginType.SYSTEM.toString());
            this.userRepoRepository.save(admin);
        }
        if (permissionCnt != 0 && roleCnt != 0 && userCnt != 0) {
            System.out.println(">>> SKIP PROCESSING INITIALIER <<<");
        } else {
            System.out.println(">>> INIT DATABASE SUCCESSFULL");
        }
    }
}
