package djnd.project.SoundCloud.configs;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Smart Authentication Entry Point để handle 401 responses
 *
 * Xử lý trường hợp:
 * - Request đến protected API với invalid token → trả về 401 với redirect
 * info
 *
 * LƯU Ý: Public APIs (books, categories) đã được whitelist trong
 * SecurityConfig
 * nên sẽ không bao giờ đến đây
 * kích hoạt khi jwt hết hạn hoặc không có
 */
@Component
public class SmartAuthenticationEntryPoint implements
        AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {

        // Tất cả request đến đây đều là protected APIs (vì public APIs đã được
        // whitelist)
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // Protected API với invalid token - yêu cầu login
        String errorMessage = """
                {
                "error": "Unauthorized",
                "message": "(session expired) Please login to access this resource",
                "code": "UNAUTHORIZED",
                "publicApi": false,
                "redirect": true,
                "redirectUrl": "/login"
                }
                """;
        response.getWriter().write(errorMessage);
    }
}