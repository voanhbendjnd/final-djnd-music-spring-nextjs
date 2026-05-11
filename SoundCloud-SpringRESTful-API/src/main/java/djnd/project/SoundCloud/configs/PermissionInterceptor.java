package djnd.project.SoundCloud.configs;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import djnd.project.SoundCloud.repositories.UserRepository;
import djnd.project.SoundCloud.utils.SecurityUtils;
import djnd.project.SoundCloud.utils.error.PermissionException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Transactional
@Component
public class PermissionInterceptor implements HandlerInterceptor {
    private final UserRepository userRepository;

    public PermissionInterceptor(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String apiPath = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String httpMethod = request.getMethod();
        var email = SecurityUtils.getCurrentUserLogin()
                .orElseThrow(() -> new BadCredentialsException("You do not have permission!"));
        var user = this.userRepository.findByEmail(email);
        if (user != null) {
            var role = user.getRole();
            if (role != null) {
                var permissions = role.getPermissions();
                var isAllow = permissions.stream()
                        .anyMatch(p -> p.getApiPath().equals(apiPath) && p.getMethod().equals(httpMethod));
                if (!isAllow) {
                    throw new PermissionException("You do not have permission to access this endpoint!");
                }
            } else {
                throw new PermissionException("You do not have permission to access this endpoint!");
            }
        }
        return true;
    }
}
