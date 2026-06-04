package djnd.project.SoundCloud.configs;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import lombok.Setter;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import djnd.project.SoundCloud.services.SessionManager;

/**
 * Custom JWT Authentication Converter để validate session in process
 * authentication
 * Đây là core component của Single Session feature:
 * - Validate sessionId in JWT token với database
 * - Reject authentication nếu session invalid
 * - Convert JWT claims to Spring Security authorities
 * - jwt already decode from security config after to security authorities
 */
@Component
public class CustomJwtAuthenticationConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private final SessionManager sessionManager;
    /**
     * -- SETTER --
     *  Set prefix cho authorities (ví dụ: "ROLE_")
     */
    @Setter
    private String authorityPrefix = ""; // Prefix cho authorities (default empty)
    /**
     * -- SETTER --
     *  Set tên claim in JWT include permissions list
     */
    @Setter
    private String authoritiesClaimName = "permission"; // Tên claim include permissions

    public CustomJwtAuthenticationConverter(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * Convert JWT token to Spring Security authorities
     * QUAN TRỌNG: Đây là nơi validate session cho Single Session feature
     * - Lấy email và sessionId từ JWT
     * - check session có hợp lệ với SessionManager
     * - Nếu session invalid → throw exception → 401 response
     * - Nếu session valid → convert authorities và next
     * @request "sub": "user@example.com",
     *         "sessionId": "abc123-def456",
     *         "permission": [
     *         "ROLE_USER_CREATE",
     *         "ROLE_BOOK_VIEW"
     *          ]
     * @return  Collection<GrantedAuthority> authorities = [
     *          SimpleGrantedAuthority("ROLE_USER_CREATE"),
     *          SimpleGrantedAuthority("ROLE_BOOK_VIEW")]
     */
    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        // Lấy thông tin từ JWT token
        String email = jwt.getSubject(); // Email của user
        String sessionId = jwt.getClaimAsString("sessionId"); // Session ID in token

        // Validate session cho Single Session feature
        if (email != null && sessionId != null) {
            boolean isValidSession = sessionManager.isValidSession(email, sessionId);

            if (!isValidSession) {
                // Session invalid → User đã login ở other
                // Throw exception → Spring Security sẽ trả về 401
                // throw new RuntimeException("Session expired or invalid");
                throw new BadCredentialsException("Session expired or invalid. Please re-authenticate.");
            }
        }

        // Nếu session hợp lệ, convert JWT claims to authorities
        Collection<String> authorities = jwt.getClaimAsStringList(authoritiesClaimName);
        if (authorities == null || authorities.isEmpty()) {
            return List.of(); // no có permissions
        }

        // Convert string permissions to Spring Security GrantedAuthority
        return authorities.stream()
                .map(authority -> new SimpleGrantedAuthority(authorityPrefix + authority))
                .collect(Collectors.toList());
    }
}
