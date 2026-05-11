package djnd.project.SoundCloud.controllers.client;

import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import djnd.project.SoundCloud.configs.CustomUserDetails;
import djnd.project.SoundCloud.domain.ResLoginDTO;
import djnd.project.SoundCloud.domain.request.LoginDTO;
import djnd.project.SoundCloud.domain.request.users.UpdatePassword;
import djnd.project.SoundCloud.domain.request.users.UserDTO;
import djnd.project.SoundCloud.services.UserService;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.annotation.ApiMessage;
import djnd.project.SoundCloud.utils.constains.ActionToken;
import djnd.project.SoundCloud.utils.error.PasswordMismatchException;
import djnd.project.SoundCloud.utils.error.PermissionException;
import djnd.project.SoundCloud.utils.error.ResourceNotFoundException;
import djnd.project.SoundCloud.domain.request.SocialLoginDTO;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/v1/auth")
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor
public class AuthController {
    final UserService userService;
    final AuthenticationManagerBuilder builder;
    @Value("${djnd.jwt.refresh-token-validity-in-seconds}")
    private Long refreshTokenExpiration;

    /*
     * at: new request login for spring handle
     * auth: check password and email, incorrect throw 401
     * SecurityContextHolder --- setAuthentication save status login with
     * authenticated = true
     *
     */
    @PostMapping("/login")
    @ApiMessage("Login account")
    public ResponseEntity<ResLoginDTO> login(@Valid @RequestBody LoginDTO dto) throws BadCredentialsException {
        var at = new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword());
        var auth = this.builder.getObject().authenticate(at);
        SecurityContextHolder.getContext().setAuthentication(auth);
        var principal = auth.getPrincipal();
        var customUser = (CustomUserDetails) principal;
        var user = customUser.user();
        var res = this.userService.getUserLoginWhenAfterLogin(user);
        ResponseCookie cookie = ResponseCookie.from("refresh_token", res.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(refreshTokenExpiration)
                .build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(res);
    }

    @PostMapping("/social-login")
    @ApiMessage("Social Login account")
    public ResponseEntity<ResLoginDTO> githubLogin(@RequestBody SocialLoginDTO dto) {
        var res = this.userService.loginWithSocial(dto.getAccessToken(), dto.getType());
        ResponseCookie cookie = ResponseCookie.from("refresh_token", res.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(refreshTokenExpiration)
                .build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(res);
    }

    @PostMapping("/register")
    @ApiMessage("Sign in account with email")
    public ResponseEntity<Long> register(@RequestBody @Valid UserDTO dto) {
        if (!dto.getManagementPassword().getConfirmPassword().equals(dto.getManagementPassword().getPassword())) {
            throw new PasswordMismatchException("Password and Confirm Password not the same!");
        }
        return ResponseEntity.ok(this.userService.register(dto));

    }

    @PostMapping("/refresh")
    @ApiMessage("Create new refresh and Access Token")
    public ResponseEntity<ResLoginDTO> resetRefreshToken(
            @RequestBody ResLoginDTO dto) {
        String refreshToken = dto.getRefreshToken();
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new BadCredentialsException("Refresh Token Invalid!");
        }
        var res = this.userService.handleRefreshTokenWithCondition(refreshToken, ActionToken.REFRESH);
        var cookie = ResponseCookie.from("refresh_token", res.getRefreshToken())
                .httpOnly(true).secure(true).path("/").maxAge(refreshTokenExpiration).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(res);
    }

    @PutMapping("/logout")
    @ApiMessage("Logout Account")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refresh_token", defaultValue = "invalid") String refreshToken) {
        if (refreshToken.equals("invalid")) {
            throw new BadCredentialsException("Refresh Token Invalid");
        }
        this.userService.handleRefreshTokenWithCondition(refreshToken, ActionToken.DELETE);
        return ResponseEntity.ok(null);
    }

    @PostMapping("/logout")
    @ApiMessage("Logout Account")
    public ResponseEntity<Void> logoutWithCookie() throws PermissionException {
        var email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new PermissionException("You do not have permission!"));
        if (email.equals("")) {
            throw new BadCredentialsException("Account Invalid");
        }
        this.userService.logout(email);
        var cookie = ResponseCookie.from("refresh_token", "").httpOnly(true).secure(true).path("/").maxAge(0).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(null);
    }

    @GetMapping("/account")
    @ApiMessage("Get Account")
    public ResponseEntity<ResLoginDTO.UserGetAccount> getAccount() {
        return ResponseEntity.ok(this.userService.getAccount());
    }

    @PatchMapping("/password")
    @ApiMessage("Update password")
    public ResponseEntity<Void> updatePasswordUser(@RequestBody UpdatePassword dto) throws BadRequestException {
        if (this.userService.updatePassword(dto)) {
            var cookie = ResponseCookie.from("refresh_token", "").httpOnly(true).secure(true).path("/").maxAge(0)
                    .build();
            return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(null);
        }
        throw new BadRequestException("Bad request");

    }

    /*
     * dto: email
     */
    @PostMapping("/forgot-password/request")
    @ApiMessage("Forgot password")
    public ResponseEntity<?> forgotPassword(@RequestBody UserDTO dto) {
        this.userService.forgotPassword(dto);
        return ResponseEntity.ok("Send OTP success!");
    }

    /*
     * dto: one_time_password, email
     */
    @PostMapping("/forgot-password/verify")
    @ApiMessage("Verify OTP")
    public ResponseEntity<?> verifyOTP(@RequestBody UserDTO dto) {
        if (this.userService.verifyOTP(dto)) {
            return ResponseEntity.ok("Redirect to page update password");
        } else {
            throw new ResourceNotFoundException("User Email", dto.getEmail());

        }
    }

    /*
     * dto: email, password, confirm_password
     */
    @PatchMapping("/forgot-password/update")
    @ApiMessage("Update password")
    public ResponseEntity<?> updatePassword(@RequestBody UserDTO dto) {
        if (userService.updatePassword(dto)) {
            var cookie = ResponseCookie.from("refresh_token", "").httpOnly(true).secure(true).path("/").maxAge(0)
                    .build();
            return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body("Update password succefully");
        }
        throw new ResourceNotFoundException("User Email", dto.getEmail());
    }

}
