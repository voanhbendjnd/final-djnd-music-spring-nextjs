package djnd.project.SoundCloud.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import djnd.project.SoundCloud.repositories.UserRepository;

@Configuration
public class PermissionInterceptorConfig implements WebMvcConfigurer {
    private final UserRepository userRepository;

    public PermissionInterceptorConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Bean
    PermissionInterceptor getPermissionInterceptor() {
        return new PermissionInterceptor(userRepository);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
         String[] whiteList = {
//            "/api/v1/permissions/data"
         };
         String [] securePatterns = { "/api/v1/users/**",
                 "/api/v1/roles/**",
                 "/api/v1/permissions/**"};
         registry.addInterceptor(getPermissionInterceptor()).excludePathPatterns(whiteList).addPathPatterns(securePatterns);
//        registry.addInterceptor(getPermissionInterceptor()).addPathPatterns("/admin/**");
    }
}
