package djnd.project.SoundCloud.services;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import djnd.project.SoundCloud.utils.constains.ActionToken;
import djnd.project.SoundCloud.utils.constains.LoginType;
import djnd.project.SoundCloud.utils.error.PermissionException;
import jakarta.annotation.Nonnull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import djnd.project.SoundCloud.domain.ResLoginDTO;
import djnd.project.SoundCloud.domain.entity.User;
import djnd.project.SoundCloud.domain.request.users.UpdatePassword;
import djnd.project.SoundCloud.domain.request.users.UserDTO;
import djnd.project.SoundCloud.domain.request.users.UserUpdateDTO;
import djnd.project.SoundCloud.domain.response.ResultPaginationDTO;
import djnd.project.SoundCloud.domain.response.users.ResUser;
import djnd.project.SoundCloud.repositories.RoleRepository;
import djnd.project.SoundCloud.repositories.UserRepository;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.convert.convertUtils;
import djnd.project.SoundCloud.utils.error.DuplicateResourceException;
import djnd.project.SoundCloud.utils.error.PasswordMismatchException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import djnd.project.SoundCloud.utils.excel.ExcelUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class UserService {
    final UserRepository userRepository;
    final PasswordEncoder passwordEncoder;
    final SecurityUtils securityUtils;
    final SessionManager sessionManager;
    final RoleRepository roleRepository;
    final MailService mailService;
    final FileService fileService;
    final RoleService roleService;
    @Value("${djnd.soundcloud.location.folder.avatar}")
    private String userFolder;
    @Value("${djnd.jwt.access-token-validity-in-seconds}")
    private Long expiresIn;

    // private final UserMapper userMapper;

    public User getUserLoggedOrThrow() throws PermissionException {
        var emailOptional = SecurityUtils.getCurrentUserLogin();
        if (emailOptional.isPresent()) {
            var email = emailOptional.get();
            return this.userRepository.findWithDetailByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User Email", email));
        }
        throw new PermissionException("You do not have permission!");
    }

    public Long create(UserDTO dto) {
        if (this.userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Email", dto.getEmail());
        }
        var role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role", dto.getRoleId() + ""));
        var user = new User();
        user.setRole(role);
        user.setEmail(dto.getEmail());
        user.setName(dto.getName());

        user.setAccept(false);
        user.setPassword(dto.getManagementPassword().getPassword());
        user.setType(LoginType.SYSTEM.toString());
        var lastUser = this.userRepository.save(user);
        return lastUser.getId();
    }

    public ResUser updatePartial(UserUpdateDTO dto) {
        var user = this.userRepository.findById(dto.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", dto.getId() + ""));

        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            if (this.userRepository.existsByEmailAndIdNot(dto.getEmail(), dto.getId())) {
                throw new DuplicateResourceException("Email User", dto.getEmail());
            }
            user.setEmail(dto.getEmail());
        }
        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            user.setName(dto.getName());
        }
        if (dto.getRoleId() != null) {
            var role = this.roleRepository.findById(dto.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role", dto.getRoleId() + ""));
            user.setRole(role);
        }
        user.setStatus(dto.getStatus());
        var lastUser = this.userRepository.save(user);
        return convertUtils.toResUser(lastUser);

    }

    public ResUser update(UserUpdateDTO dto) {
        var user = this.userRepository.findById(dto.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ID", dto.getId() + ""));
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        var lastUser = this.userRepository.save(user);
        return convertUtils.toResUser(lastUser);
    }

    public ResUser findById(long id) {
        var user = this.userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("ID", id + ""));
        return convertUtils.toResUser(user);
    }

    public void deleteById(long id) {
        var user = this.userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("ID", id + ""));
        this.userRepository.delete(user);
    }

    public ResultPaginationDTO fetchAll(Specification<User> spec, Pageable pageable) {
        var page = this.userRepository.findAll(spec, pageable);
        var res = new ResultPaginationDTO();
        var mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(page.getTotalPages());
        mt.setTotal(page.getTotalElements());
        res.setMeta(mt);
        res.setResult(page.getContent().stream().map(convertUtils::toResUser).collect(Collectors.toList()));
        return res;
    }

    public void updateRefreshTokenByEmail(String email, String refreshToken) {
        var user = this.userRepository.findByEmail(email);
        if (user != null) {
            user.setRefreshToken(refreshToken);
            user.setPreviousRefreshToken(null);
            user.setLastRefreshTime(null);
            this.userRepository.save(user);
        }
    }

    public long register(UserDTO dto) {
        if (this.userRepository.existsByEmail(dto.getEmail().toLowerCase())) {
            throw new DuplicateResourceException("Email User", dto.getEmail());
        }
        var user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setAccept(false);
        user.setPassword(this.passwordEncoder.encode(dto.getManagementPassword().getConfirmPassword()));
        user.setRole(this.roleRepository.findByName("USER_NORMAL"));
        user.setType("SYSTEM");
        var lastUser = this.userRepository.save(user);
        return lastUser.getId();
    }

    public User socialLogin(djnd.project.SoundCloud.domain.request.SocialLoginDTO dto) {
        var user = this.userRepository.findByEmail(dto.getEmail());
        if (user == null) {
            user = new User();
            user.setEmail(dto.getEmail());
            user.setName(dto.getName());
            user.setType(dto.getType());
            user.setAvatar(dto.getAvatar());
            user.setRole(this.roleRepository.findByName("USER_NORMAL"));
            user = this.userRepository.save(user);
        }
        return user;
    }

    /*
     * condition: delete (delete refresh token), refresh (update res login dto)
     */
    public ResLoginDTO handleRefreshTokenWithCondition(String refreshToken, ActionToken action) {
        var res = new ResLoginDTO();
        var claims = this.securityUtils.parseRefreshTokenIgnoreExpired(refreshToken);
        var expiration = claims.getExpiration();

        if (expiration.before(new Date())) {
            throw new BadCredentialsException("Refresh token expired");
        }

        var email = claims.getSubject();
        if (email == null) {
            throw new BadCredentialsException("Email get from refresh token null!");
        }

        var userOptional = this.userRepository.findWithDetailByEmail(email);
        if (userOptional.isEmpty()) {
            throw new BadCredentialsException("User not found!");
        }

        var user = userOptional.get();
        // boolean isCurrentToken = refreshToken.equals(user.getRefreshToken());
        // boolean isPreviousToken =
        // refreshToken.equals(user.getPreviousRefreshToken());
        // boolean isWithinGracePeriod = isPreviousToken &&
        // user.getLastRefreshTime() != null &&
        // Math.abs(System.currentTimeMillis() - user.getLastRefreshTime().getTime()) <
        // 30000;
        // if (isCurrentToken || isWithinGracePeriod) {
        if (action == ActionToken.DELETE) {
            this.sessionManager.invalidateSession(email);
            updateRefreshTokenByEmail(email, null);
            return new ResLoginDTO();
        }

        if (action == ActionToken.REFRESH) {
            var userLogin = new ResLoginDTO.UserLogin();
            userLogin.setEmail(email);
            userLogin.setId(user.getId());
            userLogin.setName(user.getName());
            userLogin.setRole(user.getRole().getName());
            userLogin.setType(user.getType() != null ? user.getType() : LoginType.SYSTEM.toString());
            userLogin.setAvatar(user.getAvatar());
            userLogin.setUsername(user.getUsername());
            res.setUser(userLogin);

            var sessionID = this.sessionManager.createNewSession(user);
            var accessToken = this.securityUtils.createAccessToken(email, res, sessionID, user.getRole());
            res.setAccessToken(accessToken);
            res.setExpiresIn(expiresIn);

            var newRefreshToken = this.securityUtils.createRefreshToken(email, res);

            // if (isCurrentToken) {
            // user.setPreviousRefreshToken(refreshToken);
            // user.setLastRefreshTime(new Date());
            // }
            user.setRefreshToken(newRefreshToken);
            this.userRepository.save(user);

            res.setRefreshToken(newRefreshToken);
            return res;
        } else {
            throw new BadCredentialsException("Action Invalid!");
        }

    }

    // throw new BadCredentialsException("Refresh Token Invalid or already
    // rotated!");
    // }

    @CacheEvict(value = "userAccount", key = "'USER_ACCOUNT_' + #email")
    public void logout(String email) {
        var user = this.userRepository.findByEmail(email);
        if (user != null) {
            user.setRefreshToken(null);
            user.setSessionId(null);
            this.userRepository.save(user);
        }
    }

    @Cacheable(value = "userAccount", key = "'USER_ACCOUNT_' + #email")
    public ResLoginDTO.UserGetAccount getAccount() {
        var email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new BadCredentialsException("You do not have access!"));
        var user = this.userRepository.findByEmail(email);
        if (user != null) {
            return getUserGetAccount(user);
        }
        throw new ResourceNotFoundException("Account", email);
    }

    @Nonnull
    private static ResLoginDTO.UserGetAccount getUserGetAccount(User user) {
        var res = new ResLoginDTO.UserGetAccount();
        var userLogin = new ResLoginDTO.UserLogin();
        userLogin.setEmail(user.getEmail());
        userLogin.setName(user.getName());
        userLogin.setId(user.getId());
        userLogin.setRole(user.getRole().getName());
        userLogin.setType(user.getType() != null ? user.getType() : "SYSTEM");
        userLogin.setAvatar(user.getAvatar());
        userLogin.setUsername(user.getUsername());
        res.setUser(userLogin);
        return res;
    }

    public boolean updatePassword(UpdatePassword dto) {
        var email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new BadCredentialsException("You do not have permission!"));
        var user = this.userRepository.findByEmail(email);
        if (user != null) {
            if (this.passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
                if (dto.getManagementPassword().getPassword()
                        .equals(dto.getManagementPassword().getConfirmPassword())) {
                    user.setPassword(this.passwordEncoder.encode(dto.getManagementPassword().getConfirmPassword()));
                    this.userRepository.save(user);
                    // this.mailService.sendOTPToEmail(user, "Mật khẩu của bạn vừa được thay đổi",
                    // false);

                    this.mailService.setUpAndSendFormUpdatePassword(convertUtils.toResUser(user));
                    return true;
                }
            } else {
                throw new PasswordMismatchException("Current Password Incorrect!");
            }
        }
        return false;
    }

    public void forgotPassword(UserDTO dto) {
        var user = this.userRepository.findByEmail(dto.getEmail());
        if (user != null) {
            this.mailService.sendOTPToEmail(user, " Là Mã Khôi Phục Mật Khẩu Sound Clound Account Của Bạn", true);
        } else {
            throw new ResourceNotFoundException("User Email", dto.getEmail());
        }
    }

    public boolean verifyOTP(UserDTO dto) {
        var user = this.userRepository.findByEmail(dto.getEmail());
        if (user != null) {
            if (!user.isOTPRequired()) {
                throw new BadCredentialsException("OTP expires!");
            }
            if (this.passwordEncoder.matches(dto.getOneTimePassword(), user.getOneTimePassword())) {
                user.setAccept(true);
                this.userRepository.save(user);
                return true;
            } else {
                throw new PasswordMismatchException("OTP wrong!");
            }
        } else {
            return false;
        }
    }

    public boolean updatePassword(UserDTO dto) {
        var user = this.userRepository.findByEmail(dto.getEmail());
        if (user != null) {
            if (user.isAccept()) {
                if (dto.getManagementPassword().getConfirmPassword()
                        .equals(dto.getManagementPassword().getPassword())) {
                    user.setPassword(this.passwordEncoder.encode(dto.getManagementPassword().getConfirmPassword()));
                    user.setRefreshToken(null);
                    this.sessionManager.invalidateSession(user.getEmail());
                    user.setAccept(false);
                    this.userRepository.save(user);
                    return true;
                } else {
                    throw new PasswordMismatchException("Password and Confirm Password is not the same!");
                }
            } else {
                throw new BadCredentialsException("You cannot update password!");
            }

        } else {
            return false;
        }
    }

    /*
     * file: avatar file
     */
    public boolean updateAvatarUser(MultipartFile file) throws URISyntaxException, IOException {
        var email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new BadCredentialsException("You cannot upload avatar!"));

        var user = this.userRepository.findByEmail(email);
        if (user != null) {
            if (file != null && !file.isEmpty()) {
                var allowFile = Arrays.asList("jpg", "jpeg", "png");
                if (allowFile.stream().anyMatch(x -> file.getOriginalFilename().toLowerCase().endsWith(x))) {

                    user.setAvatar(this.fileService.getFinalFileName(file, userFolder));
                    this.userRepository.save(user);
                    return true;
                }
                return false;
            }

        }
        return false;
    }

    /*
     * response "login": "username", "id" 123, "avatar_url: "http", "email": null
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getInforUser(String accessToken, String link) {
        RestTemplate restTemplate = new RestTemplate();
        var headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/json");
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(link,
                HttpMethod.GET,
                entity,
                Map.class);
        return response.getBody();
    }

    /*
     * response: email, primary (true | false), verified (true | false)
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getGithubEmails(String accessTokenGithub) {
        var resTemplate = new RestTemplate();
        var headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessTokenGithub);
        headers.set("Accept", "application/json");
        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<List> response = resTemplate.exchange("https://api.github.com/user/emails",
                HttpMethod.GET,
                entity,
                List.class);
        return response.getBody();
    }

    public ResLoginDTO loginWithSocial(String accessToken, String type) {
        String userName = null, avatar = null, email = null, name = null;
        if (type.equalsIgnoreCase("GITHUB")) {
            Map<String, Object> userInfo = this.getInforUser(accessToken, "https://api.github.com/user");
            userName = (String) userInfo.get("login");
            avatar = (String) userInfo.get("avatar_url");
            email = (String) userInfo.get("email");
            name = (String) userInfo.get("name");
            if (email == null) {
                List<Map<String, Object>> emails = this.getGithubEmails(accessToken);
                email = emails.stream().filter(e -> (Boolean) e.get("primary") && (Boolean) e.get("verified"))
                        .map(e -> (String) e.get("email")).findFirst().orElse(null);
            }
            if (email == null) {
                throw new BadCredentialsException("Email nil!");
            }
        } else if (type.equalsIgnoreCase("GOOGLE")) {
            Map<String, Object> userInfo = this.getInforUser(accessToken,
                    "https://www.googleapis.com/oauth2/v3/userinfo");
            email = (String) userInfo.get("email");
            avatar = (String) userInfo.get("picture");
            name = (String) userInfo.get("name");
            Boolean isEmailVerified = (Boolean) userInfo.get("email_verified");
            if (isEmailVerified != null && !isEmailVerified) {
                throw new BadCredentialsException("Google email not verified!");
            }
        } else {
            return null;
        }
        if (email == null) {
            throw new BadCredentialsException("Email nil");
        }
        return this.loginIfAccountExists(email, avatar,
                name != null ? name : userName != null ? userName : "no anme", type);

    }

    public ResLoginDTO loginIfAccountExists(String email, String avatar, String name, String type) {
        Optional<User> optionalUser = Optional.ofNullable(this.userRepository.findByEmailIgnoreCase(email));
        if (optionalUser.isPresent()) {
            return this.getUserLoginWhenAfterLogin(optionalUser.get());
        } else {
            var user = new User();
            user.setRole(this.roleService.handleGetRoleCustomer());
            user.setAvatar(avatar);
            user.setEmail(email);
            user.setName(name != null ? name : "No Name");
            user.setType(type);
            var saveUser = this.userRepository.save(user);
            return this.getUserLoginWhenAfterLogin(this.userRepository.findWithDetailById(saveUser.getId()).get());

        }
    }

    public ResLoginDTO getUserLoginWhenAfterLogin(User user) {
        var res = new ResLoginDTO();
        var userLogin = new ResLoginDTO.UserLogin();
        var email = user.getEmail();
        userLogin.setEmail(email);
        userLogin.setId(user.getId());
        userLogin.setName(user.getName());
        userLogin.setRole(user.getRole().getName());
        userLogin.setType(user.getType() != null ? user.getType() : "SYSTEM");
        userLogin.setAvatar(user.getAvatar());
        userLogin.setUsername(user.getUsername());
        res.setUser(userLogin);
        var sessionID = this.sessionManager.createNewSession(user);
        var accessToken = this.securityUtils.createAccessToken(email, res, sessionID, user.getRole());
        res.setAccessToken(accessToken);
        var newRefreshToken = this.securityUtils.createRefreshToken(email, res);
        updateRefreshTokenByEmail(email, newRefreshToken);
        res.setExpiresIn(expiresIn);
        res.setRefreshToken(newRefreshToken);
        return res;
    }

    public ByteArrayInputStream exportUsers() {
        List<User> users = this.userRepository.findAll();
        return ExcelUtils.usersToExcel(users);
    }

    public Map<String, Object> importUsers(MultipartFile file) {
        try {
            List<User> users = ExcelUtils.excelToUsers(file.getInputStream());
            // Basic validation and saving
            for (User user : users) {
                if (user.getEmail() != null && !this.userRepository.existsByEmail(user.getEmail())) {
                    user.setPassword(this.passwordEncoder.encode("123456")); // Default password
                    user.setRole(this.roleRepository.findByName("USER_NORMAL"));
                    user.setType("SYSTEM");
                    this.userRepository.save(user);
                }
            }
            return Map.of("message", "Import successfull", "count", users.size());
        } catch (IOException e) {
            throw new RuntimeException("fail to store excel data: " + e.getMessage());
        }
    }
}
