package djnd.project.SoundCloud.configs;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class PublicEndpointFilter extends OncePerRequestFilter {

    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/v1/tracks/{id}",
            "/api/v1/search",
            "api/v1/tracks/comments",
            "api/v1/tracks/audio",
            "api/v1/tracks/view/increase");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestUri = request.getRequestURI();

        // Check if this is a public endpoint
        boolean isPublicEndpoint = PUBLIC_ENDPOINTS.stream().anyMatch(requestUri::contains);

        if (isPublicEndpoint) {
            // Create a wrapper that removes Authorization header
            HttpServletRequestWrapper wrappedRequest = new HttpServletRequestWrapper(request) {
                @Override
                public String getHeader(String name) {
                    // Return null for Authorization header to remove it
                    if ("Authorization".equalsIgnoreCase(name)) {
                        return null;
                    }
                    return super.getHeader(name);
                }

                @Override
                public java.util.Enumeration<String> getHeaders(String name) {
                    if ("Authorization".equalsIgnoreCase(name)) {
                        return java.util.Collections.enumeration(java.util.Collections.emptyList());
                    }
                    return super.getHeaders(name);
                }
            };

            filterChain.doFilter(wrappedRequest, response);
        } else {
            // For protected endpoints, proceed normally
            filterChain.doFilter(request, response);
        }
    }
}
