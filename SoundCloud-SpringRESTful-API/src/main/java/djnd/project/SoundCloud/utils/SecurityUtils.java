package djnd.project.SoundCloud.utils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.util.Base64;

import djnd.project.SoundCloud.domain.ResLoginDTO;
import djnd.project.SoundCloud.domain.entity.Permission;
import djnd.project.SoundCloud.domain.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SecurityUtils {
    final JwtEncoder jwtEncoder;
    public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS512;

    public SecurityUtils(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    @Value("${djnd.jwt.base64-secret}")
    String jwtKey;
    @Value("${djnd.jwt.access-token-validity-in-seconds}")
    Long accessTokenExpiration;
    @Value("${djnd.jwt.refresh-token-validity-in-seconds}")
    Long refreshTokenExpiration;

    private SecretKey getSecretKey() {
        byte[] keyBytes = Base64.from(jwtKey).decode();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String createAccessToken(String email, ResLoginDTO dto, String sessionId, Role role) {
        var userToken = new ResLoginDTO.UserInsideToken();
        userToken.setId(dto.getUser().getId());
        userToken.setEmail(dto.getUser().getEmail());
        userToken.setName(dto.getUser().getName());
        Instant now = Instant.now();
        Instant validity = now.plus(this.accessTokenExpiration, ChronoUnit.SECONDS);
        List<String> listAuthority = new ArrayList<>();
        if (role != null) {
            listAuthority = role.getPermissions()
                    .stream()
                    .map(Permission::getName)
                    .collect(Collectors.toList());
        }
        JwtClaimsSet claim = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(email)
                .claim("user", userToken)
                .claim("permission", listAuthority)
                .claim("sessionId", sessionId)
                .build();
        var jwtHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwtHeader, claim)).getTokenValue();

    }

    public static Optional<String> getCurrentUserLogin() {
        var securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()));
    }

    public static Optional<String> getCurrentUserJWT() {
        var securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(securityContext.getAuthentication())
                .filter(a -> a.getCredentials() instanceof String)
                .map(a -> (String) a.getCredentials());
    }

    public static Optional<Long> getCurrentUserId() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(Authentication::getPrincipal)
                .filter(principal -> principal instanceof Jwt)
                .map(principal -> (Jwt) principal)
                .map(jwt -> jwt.getClaim("user"))
                .filter(userClaim -> userClaim instanceof Map)
                .map(userClaim -> ((Map<?, ?>) userClaim).get("id"))
                .flatMap(id -> {
                    if (id instanceof Number n)
                        return Optional.of(n.longValue());
                    if (id instanceof String s) {
                        try {
                            return Optional.of(Long.parseLong(s));
                        } catch (NumberFormatException e) {
                            return Optional.empty();
                        }
                    }
                    return Optional.empty();
                });
    }

    public static Long getCurrentUserIdOrNull() {
        var userId = getCurrentUserId();
        if (userId.isPresent()) {
            return userId.get();
        }
        return null;
    }

    private static String extractPrincipal(Authentication authentication) {
        if (authentication == null) {
            return null;
        } else if (authentication.getPrincipal() instanceof UserDetails springSecurityUser) {
            return springSecurityUser.getUsername();
        } else if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject(); // user name
        } else if (authentication.getPrincipal() instanceof String s) {
            return s;
        }
        return null;
    }

    public Claims parseRefreshTokenIgnoreExpired(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSecretKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException ex) {
            return ex.getClaims();
        }
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSecretKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String createRefreshToken(String email, ResLoginDTO dto) {
        var userToken = new ResLoginDTO.UserInsideToken();
        userToken.setEmail(dto.getUser().getEmail());
        userToken.setId(dto.getUser().getId());
        userToken.setName(dto.getUser().getName());
        var now = Instant.now();
        var validity = now.plus(refreshTokenExpiration, ChronoUnit.SECONDS);
        var claims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(email)
                .claim("user", userToken)
                .build();
        var jwtHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return this.jwtEncoder.encode(JwtEncoderParameters.from(jwtHeader, claims)).getTokenValue();
    }

    public static Optional<String> getCurrentSessionId() {
        var securityContext = SecurityContextHolder.getContext();
        if (securityContext.getAuthentication() != null
                && securityContext.getAuthentication().getPrincipal() instanceof Jwt jwt) {
            return Optional.ofNullable(jwt.getClaimAsString("sessionId"));
        }
        return Optional.empty();
    }
}
