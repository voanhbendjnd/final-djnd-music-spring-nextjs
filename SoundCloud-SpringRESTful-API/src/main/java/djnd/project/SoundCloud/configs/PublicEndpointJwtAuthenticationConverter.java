// package djnd.project.SoundCloud.configs;

// import org.springframework.security.core.GrantedAuthority;
// import org.springframework.security.oauth2.jwt.Jwt;

// import java.util.Collection;
// import java.util.Collections;
// import java.util.List;

// /**
// * Custom JWT authorities converter that skips validation for public endpoints
// */
// public class PublicEndpointJwtAuthenticationConverter {

// private static final List<String> PUBLIC_ENDPOINTS = List.of(
// "/api/v1/tracks",
// "/api/v1/search",
// "api/v1/tracks/comments",
// "api/v1/tracks/audio",
// "api/v1/tracks/view/increase");

// /**
// * Convert JWT to authorities - for public endpoints, return empty authorities
// */
// public Collection<GrantedAuthority> convert(Jwt jwt) {
// // For public endpoints, we can skip the JWT validation entirely
// // by returning empty authorities - the permitAll() will handle access
// return Collections.emptyList();
// }

// /**
// * Check if the request URL is for a public endpoint
// */
// public static boolean isPublicEndpoint(String requestUri) {
// return PUBLIC_ENDPOINTS.stream().anyMatch(requestUri::contains);
// }
// }
