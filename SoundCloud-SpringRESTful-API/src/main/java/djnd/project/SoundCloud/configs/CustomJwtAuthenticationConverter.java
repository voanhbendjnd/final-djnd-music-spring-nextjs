package djnd.project.SoundCloud.configs;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import djnd.project.SoundCloud.services.SessionManager;

/**
 * Custom JWT Authentication Converter để validate session trong quá trình
 * authentication
 * 
 * Đây là core component của Single Session feature:
 * - Validate sessionId trong JWT token với database
 * - Reject authentication nếu session không hợp lệ
 * - Convert JWT claims thành Spring Security authorities
 */
@Component
public class CustomJwtAuthenticationConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private final SessionManager sessionManager;
    private String authorityPrefix = ""; // Prefix cho authorities (mặc định rỗng)
    private String authoritiesClaimName = "permission"; // Tên claim chứa permissions

    public CustomJwtAuthenticationConverter(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * Set prefix cho authorities (ví dụ: "ROLE_")
     */
    public void setAuthorityPrefix(String authorityPrefix) {
        this.authorityPrefix = authorityPrefix;
    }

    /**
     * Set tên claim trong JWT chứa danh sách permissions
     */
    public void setAuthoritiesClaimName(String authoritiesClaimName) {
        this.authoritiesClaimName = authoritiesClaimName;
    }

    /**
     * Convert JWT token thành Spring Security authorities
     * 
     * QUAN TRỌNG: Đây là nơi validate session cho Single Session feature
     * - Lấy email và sessionId từ JWT
     * - Kiểm tra session có hợp lệ với SessionManager
     * - Nếu session invalid → throw exception → 401 response
     * - Nếu session valid → convert authorities và tiếp tục
     */
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        // BƯỚC 1: Lấy thông tin từ JWT token
        String email = jwt.getSubject(); // Email của user
        String sessionId = jwt.getClaimAsString("sessionId"); // Session ID trong token

        // BƯỚC 2: Validate session cho Single Session feature
        if (email != null && sessionId != null) {
            boolean isValidSession = sessionManager.isValidSession(email, sessionId);

            if (!isValidSession) {
                // Session không hợp lệ → User đã login ở nơi khác
                // Throw exception → Spring Security sẽ trả về 401
                // throw new RuntimeException("Session expired or invalid");
                throw new BadCredentialsException("Session expired or invalid. Please re-authenticate.");
            }
        }

        // BƯỚC 3: Nếu session hợp lệ, convert JWT claims thành authorities
        Collection<String> authorities = jwt.getClaimAsStringList(authoritiesClaimName);
        if (authorities == null || authorities.isEmpty()) {
            return List.of(); // Không có permissions
        }

        // Convert string permissions thành Spring Security GrantedAuthority
        return authorities.stream()
                .map(authority -> new SimpleGrantedAuthority(authorityPrefix + authority))
                .collect(Collectors.toList());
        // input {
        // "sub": "user@example.com",
        // "sessionId": "abc123-def456",
        // "permission": [
        // "ROLE_USER_CREATE",
        // "ROLE_BOOK_VIEW"
        // ]
        // output
        // }
        // Collection<GrantedAuthority> authorities = [
        // SimpleGrantedAuthority("ROLE_USER_CREATE"),
        // SimpleGrantedAuthority("ROLE_BOOK_VIEW")
        // ]
    }
}
