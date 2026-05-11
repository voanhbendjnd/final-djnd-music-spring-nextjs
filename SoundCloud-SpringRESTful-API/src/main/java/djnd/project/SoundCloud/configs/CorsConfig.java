package djnd.project.SoundCloud.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList(
                                "http://localhost:3000",
                                "http://localhost:3001", "http://localhost:4173", "http://localhost:5173",
                                "https://tame-snakes-cheer.loca.lt", "http://192.168.1.15:3000",
                                "http://192.168.1.128:3000"));
                configuration.setAllowedMethods(Arrays.asList(
                                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")); // Allowed methods
                configuration.setAllowedHeaders(Arrays.asList(
                                "Authorization", "Content-Type", "Accept", "x-no-retry", "delay"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);
                // How long the response from a pre-flight request can be cached by clients
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration); // Apply this configuration to all paths
                return source;
        }
}